import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
	CampaignStatus,
	DonationStatus,
	PaymentProvider,
	PaymentStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type {
	ICheckoutResult,
	IClosePayment,
	ICompletePayment,
	ICreatePayment,
} from "./payment.interface";
import { getPaymentProvider } from "./providers/paymentProvider.factory";

// `userId` is optional: the donation module creates the donation itself and
// passes no owner, while POST /api/payments/create passes the logged-in user.
const getPayableDonationFromDB = async (
	userId: string | undefined,
	payload: ICreatePayment,
) => {
	const donation = await prisma.donation.findFirst({
		where: {
			id: payload.donationId,
			...(userId ? { userId } : {}),
		},
		select: {
			id: true,
			status: true,
			amount: true,
			donorEmail: true,
			user: {
				select: {
					email: true,
				},
			},
			campaign: {
				select: {
					title: true,
					status: true,
					isDeleted: true,
				},
			},
			payments: {
				where: {
					status: PaymentStatus.COMPLETED,
				},
				select: {
					id: true,
				},
			},
		},
	});

	if (!donation) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation not found");
	}

	if (donation.payments.length > 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This donation has already been paid",
		);
	}

	if (donation.status !== DonationStatus.INITIATED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Only initiated donations can be paid",
		);
	}

	if (
		donation.campaign.isDeleted ||
		donation.campaign.status !== CampaignStatus.ACTIVE
	) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This campaign is no longer accepting donations",
		);
	}

	if (donation.amount.lte(0)) {
		throw new AppError(httpStatus.CONFLICT, "Donation amount is invalid");
	}

	return donation;
};

const createPaymentIntoDB = async (
	userId: string | undefined,
	payload: ICreatePayment,
) => {
	const donation = await getPayableDonationFromDB(userId, payload);
	const selectedProvider = payload.provider ?? PaymentProvider.STRIPE;
	const provider = getPaymentProvider(selectedProvider);

	let payment: Awaited<ReturnType<typeof prisma.payment.create>>;

	try {
		payment = await prisma.$transaction(
			async (transaction) => {
				const initiatedDonation = await transaction.donation.findFirst({
					where: {
						id: donation.id,
						status: DonationStatus.INITIATED,
					},
					select: {
						id: true,
					},
				});

				if (!initiatedDonation) {
					throw new AppError(
						httpStatus.CONFLICT,
						"Donation is no longer payable",
					);
				}

				const pendingPayment = await transaction.payment.findFirst({
					where: {
						donationId: donation.id,
						status: PaymentStatus.PENDING,
					},
					select: {
						id: true,
					},
				});

				if (pendingPayment) {
					throw new AppError(
						httpStatus.CONFLICT,
						"A payment is already in progress for this donation",
					);
				}

				return transaction.payment.create({
					data: {
						donationId: donation.id,
						amount: donation.amount,
						provider: selectedProvider,
						status: PaymentStatus.PENDING,
					},
				});
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
			},
		);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2034"
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Payment request conflicted. Please try again",
			);
		}

		throw error;
	}

	let checkout: ICheckoutResult;

	try {
		checkout = await provider.createCheckoutSession({
			donationId: donation.id,
			paymentId: payment.id,
			amount: donation.amount.toString(),
			currency: "bdt",
			itemTitle: `Donation: ${donation.campaign.title}`,
			customerEmail: donation.donorEmail ?? donation.user?.email ?? undefined,
		});
	} catch (error) {
		await prisma.payment.update({
			where: {
				id: payment.id,
			},
			data: {
				status: PaymentStatus.FAILED,
			},
		});

		throw error;
	}

	await prisma.payment.update({
		where: {
			id: payment.id,
		},
		data: {
			providerTransactionId: checkout.providerTransactionId,
		},
	});

	return {
		paymentId: payment.id,
		checkoutUrl: checkout.checkoutUrl,
	};
};

const completePaymentIntoDB = async (payload: ICompletePayment) => {
	if (payload.currency.toLowerCase() !== "bdt") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Payment currency does not match",
		);
	}

	return prisma.$transaction(async (transaction) => {
		const payment = await transaction.payment.findUnique({
			where: {
				id: payload.paymentId,
			},
			select: {
				id: true,
				donationId: true,
				provider: true,
				providerTransactionId: true,
				amount: true,
				status: true,
				donation: {
					select: {
						status: true,
						campaignId: true,
					},
				},
			},
		});

		if (
			!payment ||
			payment.donationId !== payload.donationId ||
			payment.provider !== payload.provider
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Payment details do not match",
			);
		}

		if (!payment.amount.equals(payload.amount)) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Payment amount does not match",
			);
		}

		if (
			payment.providerTransactionId &&
			payment.providerTransactionId !== payload.providerTransactionId
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Payment session does not match",
			);
		}

		// confirming twice changes nothing
		if (
			payment.status === PaymentStatus.COMPLETED &&
			payment.donation.status === DonationStatus.PAID
		) {
			return transaction.payment.findUniqueOrThrow({
				where: {
					id: payment.id,
				},
			});
		}

		if (
			payment.status !== PaymentStatus.PENDING ||
			payment.donation.status !== DonationStatus.INITIATED
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"This donation cannot be marked as paid",
			);
		}

		const updatedPayment = await transaction.payment.updateMany({
			where: {
				id: payment.id,
				status: PaymentStatus.PENDING,
				OR: [
					{ providerTransactionId: null },
					{ providerTransactionId: payload.providerTransactionId },
				],
			},
			data: {
				status: PaymentStatus.COMPLETED,
				providerTransactionId: payload.providerTransactionId,
				paidAt: new Date(),
			},
		});

		if (updatedPayment.count === 0) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Payment status changed. Please try again",
			);
		}

		const updatedDonation = await transaction.donation.updateMany({
			where: {
				id: payment.donationId,
				status: DonationStatus.INITIATED,
			},
			data: {
				status: DonationStatus.PAID,
			},
		});

		if (updatedDonation.count === 0) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Donation status changed. Please try again",
			);
		}

		// money received: add it to the campaign total in the same transaction
		await transaction.donationCampaign.update({
			where: {
				id: payment.donation.campaignId,
			},
			data: {
				raisedAmount: {
					increment: payment.amount,
				},
			},
		});

		return transaction.payment.findUniqueOrThrow({
			where: {
				id: payment.id,
			},
		});
	});
};

const closePendingPaymentIntoDB = async (payload: IClosePayment) => {
	if (
		payload.status !== PaymentStatus.FAILED &&
		payload.status !== PaymentStatus.CANCELLED
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Invalid payment status");
	}

	const payment = await prisma.payment.findUnique({
		where: {
			id: payload.paymentId,
		},
		select: {
			id: true,
			donationId: true,
			provider: true,
			providerTransactionId: true,
			status: true,
		},
	});

	if (
		!payment ||
		payment.donationId !== payload.donationId ||
		payment.provider !== payload.provider ||
		(payment.providerTransactionId &&
			payment.providerTransactionId !== payload.providerTransactionId)
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment details do not match");
	}

	if (payment.status !== PaymentStatus.PENDING) {
		return payment;
	}

	const updatedPayment = await prisma.payment.updateMany({
		where: {
			id: payment.id,
			status: PaymentStatus.PENDING,
			OR: [
				{ providerTransactionId: null },
				{ providerTransactionId: payload.providerTransactionId },
			],
		},
		data: {
			status: payload.status,
			providerTransactionId: payload.providerTransactionId,
		},
	});

	if (updatedPayment.count === 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Payment status changed. Please try again",
		);
	}

	return prisma.payment.findUniqueOrThrow({
		where: {
			id: payment.id,
		},
	});
};

// Refunds the money of a cancelled donation. If the payment had already been
// counted (COMPLETED), the campaign total is decreased in the same transaction.
const refundCancelledDonationPaymentIntoDB = async (
	payload: ICompletePayment,
) => {
	if (payload.currency.toLowerCase() !== "bdt") {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Payment currency does not match",
		);
	}

	const payment = await prisma.payment.findUnique({
		where: {
			id: payload.paymentId,
		},
		select: {
			id: true,
			donationId: true,
			provider: true,
			providerTransactionId: true,
			amount: true,
			status: true,
			paidAt: true,
			donation: {
				select: {
					status: true,
					campaignId: true,
				},
			},
		},
	});

	if (
		!payment ||
		payment.donationId !== payload.donationId ||
		payment.provider !== payload.provider ||
		(payment.providerTransactionId &&
			payment.providerTransactionId !== payload.providerTransactionId)
	) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment details do not match");
	}

	if (!payment.amount.equals(payload.amount)) {
		throw new AppError(httpStatus.BAD_REQUEST, "Payment amount does not match");
	}

	if (payment.donation.status !== DonationStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This donation has not been cancelled",
		);
	}

	if (
		payment.status === PaymentStatus.REFUND_PENDING ||
		payment.status === PaymentStatus.REFUNDED
	) {
		return prisma.payment.findUniqueOrThrow({
			where: {
				id: payment.id,
			},
		});
	}

	const provider = getPaymentProvider(payment.provider);

	const refund = await provider.refundPayment({
		paymentId: payment.id,
		providerTransactionId: payload.providerTransactionId,
	});

	const refundStatus =
		refund.status === "succeeded"
			? PaymentStatus.REFUNDED
			: refund.status === "failed" || refund.status === "canceled"
				? PaymentStatus.REFUND_FAILED
				: PaymentStatus.REFUND_PENDING;

	const wasCounted = payment.status === PaymentStatus.COMPLETED;

	const updatedPayment = await prisma.$transaction(async (transaction) => {
		const result = await transaction.payment.updateMany({
			where: {
				id: payment.id,
				donation: {
					status: DonationStatus.CANCELLED,
				},
				status: {
					in: [
						PaymentStatus.PENDING,
						PaymentStatus.COMPLETED,
						PaymentStatus.FAILED,
						PaymentStatus.CANCELLED,
					],
				},
				providerRefundId: null,
				OR: [
					{ providerTransactionId: null },
					{ providerTransactionId: payload.providerTransactionId },
				],
			},
			data: {
				status: refundStatus,
				providerTransactionId: payload.providerTransactionId,
				providerRefundId: refund.providerRefundId,
				paidAt: payment.paidAt ?? new Date(),
			},
		});

		// the refund reverses money that was counted in the campaign total
		if (
			result.count > 0 &&
			wasCounted &&
			refundStatus !== PaymentStatus.REFUND_FAILED
		) {
			await transaction.donationCampaign.update({
				where: {
					id: payment.donation.campaignId,
				},
				data: {
					raisedAmount: {
						decrement: payment.amount,
					},
				},
			});
		}

		return result;
	});

	if (updatedPayment.count === 0) {
		const currentPayment = await prisma.payment.findUniqueOrThrow({
			where: {
				id: payment.id,
			},
		});

		if (
			currentPayment.status === PaymentStatus.REFUND_PENDING ||
			currentPayment.status === PaymentStatus.REFUND_FAILED ||
			currentPayment.status === PaymentStatus.REFUNDED
		) {
			return currentPayment;
		}

		throw new AppError(
			httpStatus.CONFLICT,
			"Payment status changed. Please try again",
		);
	}

	return prisma.payment.findUniqueOrThrow({
		where: {
			id: payment.id,
		},
	});
};

const updateRefundStatusIntoDB = async (
	provider: PaymentProvider,
	providerRefundId: string,
	status: string | null,
): Promise<void> => {
	const refundStatus =
		status === "succeeded"
			? PaymentStatus.REFUNDED
			: status === "failed" || status === "canceled"
				? PaymentStatus.REFUND_FAILED
				: null;

	if (!refundStatus) {
		return;
	}

	const updatedPayment = await prisma.payment.updateMany({
		where: {
			provider,
			providerRefundId,
			status: {
				in: [
					PaymentStatus.REFUND_PENDING,
					PaymentStatus.REFUND_FAILED,
					PaymentStatus.REFUNDED,
				],
			},
		},
		data: {
			status: refundStatus,
		},
	});

	if (updatedPayment.count === 0) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Payment for this refund was not found",
		);
	}
};

const getMyPaymentsFromDB = async (userId: string) => {
	return prisma.payment.findMany({
		where: {
			donation: {
				userId,
			},
		},
		select: {
			id: true,
			transactionId: true,
			donationId: true,
			amount: true,
			provider: true,
			status: true,
			paidAt: true,
			createdAt: true,
			donation: {
				select: {
					status: true,
					campaign: {
						select: {
							title: true,
						},
					},
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});
};

const getPaymentByIdFromDB = async (id: string, userId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			id,
			donation: {
				userId,
			},
		},
		select: {
			id: true,
			transactionId: true,
			donationId: true,
			amount: true,
			method: true,
			provider: true,
			status: true,
			paidAt: true,
			createdAt: true,
			updatedAt: true,
			donation: {
				select: {
					status: true,
					isAnonymous: true,
					campaign: {
						select: {
							id: true,
							title: true,
						},
					},
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	return payment;
};

const refundCancelledPaidDonationIntoDB = async (donationId: string) => {
	const payment = await prisma.payment.findFirst({
		where: {
			donationId,
			status: {
				in: [
					PaymentStatus.COMPLETED,
					PaymentStatus.REFUND_PENDING,
					PaymentStatus.REFUNDED,
				],
			},
		},
		select: {
			id: true,
			provider: true,
			providerTransactionId: true,
			amount: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	if (!payment || !payment.providerTransactionId) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Paid donation payment was not found",
		);
	}

	return refundCancelledDonationPaymentIntoDB({
		paymentId: payment.id,
		donationId,
		provider: payment.provider,
		providerTransactionId: payment.providerTransactionId,
		amount: payment.amount.toString(),
		currency: "bdt",
	});
};

const getReceiptByRefFromDB = async (ref: string) => {
	const payment = await prisma.payment.findUnique({
		where: { providerTransactionId: ref },
		select: {
			transactionId: true,
			providerTransactionId: true,
			amount: true,
			provider: true,
			status: true,
			paidAt: true,
			createdAt: true,
			donation: {
				select: {
					isAnonymous: true,
					donorName: true,
					donorEmail: true,
					user: { select: { name: true, email: true } },
					campaign: {
						select: {
							title: true,
							createdBy: {
								select: {
									name: true,
									reliefOrg: { select: { organizationName: true } },
								},
							},
						},
					},
				},
			},
		},
	});

	if (!payment) {
		throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
	}

	const { donation } = payment;
	const anonymous = donation.isAnonymous;

	return {
		status: payment.status,
		transaction_id: payment.transactionId,
		provider_transaction_id: payment.providerTransactionId,
		amount: Number(payment.amount),
		payment_gateway: payment.provider,
		paid_at: payment.paidAt ?? payment.createdAt,
		is_anonymous: anonymous,
		donor_name: anonymous
			? null
			: donation.donorName || donation.user?.name || null,
		donor_contact: anonymous
			? null
			: donation.donorEmail || donation.user?.email || null,
		campaign_title: donation.campaign.title,
		relief_org:
			donation.campaign.createdBy?.reliefOrg?.organizationName ||
			donation.campaign.createdBy?.name ||
			null,
	};
};

export const paymentService = {
	getReceiptByRefFromDB,
	getPayableDonationFromDB,
	createPaymentIntoDB,
	completePaymentIntoDB,
	closePendingPaymentIntoDB,
	refundCancelledDonationPaymentIntoDB,
	updateRefundStatusIntoDB,
	getMyPaymentsFromDB,
	getPaymentByIdFromDB,
	refundCancelledPaidDonationIntoDB,
};
