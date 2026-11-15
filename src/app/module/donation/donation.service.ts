import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
	ApplicationStatus,
	CampaignStatus,
	DonationStatus,
	PaymentProvider,
	UserRole,
} from "../../../generated/prisma/enums";
import type {
	DonationApplicationWhereInput,
	DonationCampaignWhereInput,
	DonationWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import { paymentService } from "../payment/payment.service";
import type {
	IApplicationQuery,
	IApplyForAid,
	ICampaignQuery,
	ICreateCampaign,
	IDonate,
	IMyDonationsQuery,
	IReviewApplication,
	IUpdateCampaign,
} from "./donation.interface";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_PROOF_SIZE = 10 * 1024 * 1024;

const applicationSelect = {
	id: true,
	campaignId: true,
	reason: true,
	payoutDetails: true,
	proofDocumentUrl: true,
	status: true,
	approvedAmount: true,
	reviewedAt: true,
	createdAt: true,
	updatedAt: true,
	campaign: {
		select: {
			id: true,
			title: true,
		},
	},
	applicant: {
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
		},
	},
	reviewedBy: {
		select: {
			id: true,
			name: true,
		},
	},
} satisfies Prisma.DonationApplicationSelect;

const buildMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

const isAdminRole = (role: UserRole) =>
	role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const uploadCampaignPhoto = async (file: Express.Multer.File) => {
	if (!file.mimetype.startsWith("image/")) {
		throw new AppError(httpStatus.BAD_REQUEST, "Photo must be an image file");
	}

	if (file.size > MAX_PHOTO_SIZE) {
		throw new AppError(httpStatus.BAD_REQUEST, "Photo cannot exceed 5 MB");
	}

	return uploadToCloudinary(file.buffer, {
		resource_type: "image",
		folder: "edrms/campaigns",
	});
};

const uploadProofDocument = async (file: Express.Multer.File) => {
	const isAllowed =
		file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";

	if (!isAllowed) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Proof document must be an image or a PDF",
		);
	}

	if (file.size > MAX_PROOF_SIZE) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Proof document cannot exceed 10 MB",
		);
	}

	return uploadToCloudinary(file.buffer, {
		resource_type: "auto",
		folder: "edrms/donation-proofs",
	});
};

// Admins can manage every campaign, a relief organisation only its own.
const getManageableCampaign = async (campaignId: string, user: RequestUser) => {
	const campaign = await prisma.donationCampaign.findFirst({
		where: {
			id: campaignId,
			isDeleted: false,
		},
	});

	if (!campaign) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation campaign not found");
	}

	if (!isAdminRole(user.role) && campaign.createdByUserId !== user.id) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only manage your own campaigns",
		);
	}

	return campaign;
};

const createCampaignIntoDB = async (
	userId: string,
	payload: ICreateCampaign,
	file?: Express.Multer.File,
) => {
	const uploaded = file ? await uploadCampaignPhoto(file) : undefined;

	try {
		return await prisma.donationCampaign.create({
			data: {
				...payload,
				createdByUserId: userId,
				photoUrl: uploaded?.secure_url,
				photoPublicId: uploaded?.public_id,
			},
		});
	} catch (error) {
		if (uploaded) {
			await deleteFromCloudinary(uploaded.public_id);
		}

		throw error;
	}
};

const updateCampaignIntoDB = async (
	campaignId: string,
	user: RequestUser,
	payload: IUpdateCampaign,
	file?: Express.Multer.File,
) => {
	const campaign = await getManageableCampaign(campaignId, user);

	const startDate = payload.startDate ?? campaign.startDate;
	const endDate = payload.endDate ?? campaign.endDate;

	if (endDate <= startDate) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"End date must be after the start date",
		);
	}

	const uploaded = file ? await uploadCampaignPhoto(file) : undefined;

	let updatedCampaign: Awaited<
		ReturnType<typeof prisma.donationCampaign.update>
	>;

	try {
		updatedCampaign = await prisma.donationCampaign.update({
			where: {
				id: campaign.id,
			},
			data: {
				...payload,
				...(uploaded && {
					photoUrl: uploaded.secure_url,
					photoPublicId: uploaded.public_id,
				}),
			},
		});
	} catch (error) {
		if (uploaded) {
			await deleteFromCloudinary(uploaded.public_id);
		}

		throw error;
	}

	// the old photo is removed last, so a failed update never loses it
	if (uploaded && campaign.photoPublicId) {
		await deleteFromCloudinary(campaign.photoPublicId);
	}

	return updatedCampaign;
};

const deleteCampaignFromDB = async (campaignId: string, user: RequestUser) => {
	const campaign = await getManageableCampaign(campaignId, user);

	await prisma.donationCampaign.update({
		where: {
			id: campaign.id,
		},
		data: {
			isDeleted: true,
			deletedAt: new Date(),
		},
	});

	return null;
};

const getAllCampaignsFromDB = async (query: ICampaignQuery) => {
	const limit = query.limit ?? 10;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: DonationCampaignWhereInput[] = [{ isDeleted: false }];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	const where: DonationCampaignWhereInput = { AND: andConditions };

	const [campaigns, total] = await Promise.all([
		prisma.donationCampaign.findMany({
			where,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
			include: {
				createdBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		}),
		prisma.donationCampaign.count({ where }),
	]);

	return {
		data: campaigns,
		meta: buildMeta(page, limit, total),
	};
};

const getCampaignByIdFromDB = async (campaignId: string) => {
	const campaign = await prisma.donationCampaign.findFirst({
		where: {
			id: campaignId,
			isDeleted: false,
		},
		include: {
			createdBy: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!campaign) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation campaign not found");
	}

	const [donorsCount, paidOut] = await Promise.all([
		prisma.donation.count({
			where: {
				campaignId,
				status: DonationStatus.PAID,
			},
		}),
		prisma.donationPayout.aggregate({
			where: {
				campaignId,
			},
			_sum: {
				amount: true,
			},
		}),
	]);

	const totalPaidOut = paidOut._sum.amount ?? new Prisma.Decimal(0);

	return {
		...campaign,
		donorsCount,
		totalPaidOut,
		availableBalance: campaign.raisedAmount.minus(totalPaidOut),
	};
};

const buildApplicationWhere = (
	query: IApplicationQuery,
	base: DonationApplicationWhereInput,
): DonationApplicationWhereInput => {
	const andConditions: DonationApplicationWhereInput[] = [base];

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.campaignId) {
		andConditions.push({ campaignId: query.campaignId });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ reason: { contains: query.searchTerm, mode: "insensitive" } },
				{
					applicant: {
						name: { contains: query.searchTerm, mode: "insensitive" },
					},
				},
				{
					campaign: {
						title: { contains: query.searchTerm, mode: "insensitive" },
					},
				},
			],
		});
	}

	return { AND: andConditions };
};

const findApplications = async (
	query: IApplicationQuery,
	base: DonationApplicationWhereInput,
) => {
	const limit = query.limit ?? 10;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";
	const where = buildApplicationWhere(query, base);

	const [applications, total] = await Promise.all([
		prisma.donationApplication.findMany({
			where,
			select: applicationSelect,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
		}),
		prisma.donationApplication.count({ where }),
	]);

	return {
		data: applications,
		meta: buildMeta(page, limit, total),
	};
};

const getCampaignApplicationsFromDB = async (
	campaignId: string,
	user: RequestUser,
	query: IApplicationQuery,
) => {
	const campaign = await getManageableCampaign(campaignId, user);

	return findApplications(query, { campaignId: campaign.id });
};

const getAllApplicationsFromDB = async (
	user: RequestUser,
	query: IApplicationQuery,
) => {
	const base: DonationApplicationWhereInput = isAdminRole(user.role)
		? {}
		: { campaign: { createdByUserId: user.id } };

	return findApplications(query, base);
};

const getMyApplicationsFromDB = async (
	userId: string,
	query: IApplicationQuery,
) => {
	return findApplications(query, { applicantId: userId });
};

const getCampaignTransactionsFromDB = async (
	campaignId: string,
	user: RequestUser,
) => {
	const campaign = await getManageableCampaign(campaignId, user);

	const [donations, payouts] = await Promise.all([
		prisma.donation.findMany({
			where: {
				campaignId: campaign.id,
			},
			select: {
				id: true,
				amount: true,
				status: true,
				isAnonymous: true,
				donorName: true,
				donorEmail: true,
				userId: true,
				createdAt: true,
				payments: {
					select: {
						transactionId: true,
						provider: true,
						status: true,
						paidAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
					take: 1,
				},
			},
		}),
		prisma.donationPayout.findMany({
			where: {
				campaignId: campaign.id,
			},
			select: {
				id: true,
				amount: true,
				createdAt: true,
				application: {
					select: {
						id: true,
						payoutDetails: true,
						applicant: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
			},
		}),
	]);

	const donationRows = donations.map((donation) => ({
		id: donation.id,
		type: "DONATE" as const,
		amount: donation.amount,
		status: donation.status,
		isAnonymous: donation.isAnonymous,
		userId: donation.isAnonymous ? null : donation.userId,
		userName: donation.isAnonymous
			? "Anonymous Donor"
			: (donation.donorName ?? "Valued Donor"),
		userEmail: donation.isAnonymous ? null : donation.donorEmail,
		payment: donation.payments[0] ?? null,
		createdAt: donation.createdAt,
	}));

	const payoutRows = payouts.map((payout) => ({
		id: payout.id,
		type: "RECEIVE" as const,
		amount: payout.amount,
		status: "PAID_OUT" as const,
		isAnonymous: false,
		userId: payout.application.applicant.id,
		userName: payout.application.applicant.name,
		userEmail: payout.application.applicant.email,
		payment: null,
		applicationId: payout.application.id,
		payoutDetails: payout.application.payoutDetails,
		createdAt: payout.createdAt,
	}));

	return [...donationRows, ...payoutRows].sort(
		(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	);
};

const initiateDonationIntoDB = async (
	campaignId: string,
	payload: IDonate,
	user?: RequestUser,
) => {
	const campaign = await prisma.donationCampaign.findFirst({
		where: {
			id: campaignId,
			isDeleted: false,
		},
		select: {
			id: true,
			status: true,
		},
	});

	if (!campaign) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation campaign not found");
	}

	if (campaign.status !== CampaignStatus.ACTIVE) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This campaign is no longer accepting donations",
		);
	}

	const isAnonymous = payload.isAnonymous ?? false;

	const donation = await prisma.donation.create({
		data: {
			campaignId: campaign.id,
			userId: user?.id,
			amount: payload.amount,
			isAnonymous,
			donorName: isAnonymous
				? "Anonymous Donor"
				: (payload.donorName ?? user?.name ?? "Valued Donor"),
			donorEmail: isAnonymous
				? null
				: (payload.donorEmail ?? user?.email ?? null),
		},
	});

	try {
		const checkout = await paymentService.createPaymentIntoDB(undefined, {
			donationId: donation.id,
			provider: payload.provider ?? PaymentProvider.STRIPE,
		});

		return {
			donationId: donation.id,
			paymentId: checkout.paymentId,
			checkoutUrl: checkout.checkoutUrl,
		};
	} catch (error) {
		// the gateway call failed: close the donation so no payable record is left behind
		await prisma.donation.updateMany({
			where: {
				id: donation.id,
				status: DonationStatus.INITIATED,
			},
			data: {
				status: DonationStatus.CANCELLED,
			},
		});

		throw error;
	}
};

const getMyDonationsFromDB = async (
	userId: string,
	query: IMyDonationsQuery,
) => {
	const limit = query.limit ?? 10;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const where: DonationWhereInput = {
		userId,
		...(query.status && { status: query.status }),
		...(query.searchTerm && {
			OR: [
				{
					campaign: {
						title: { contains: query.searchTerm, mode: "insensitive" },
					},
				},
				{
					payments: {
						some: {
							transactionId: {
								contains: query.searchTerm,
								mode: "insensitive",
							},
						},
					},
				},
			],
		}),
	};

	const [donations, total] = await Promise.all([
		prisma.donation.findMany({
			where,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
			select: {
				id: true,
				amount: true,
				status: true,
				isAnonymous: true,
				createdAt: true,
				campaign: {
					select: {
						id: true,
						title: true,
					},
				},
				payments: {
					select: {
						id: true,
						transactionId: true,
						provider: true,
						status: true,
						paidAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			},
		}),
		prisma.donation.count({ where }),
	]);

	return {
		data: donations,
		meta: buildMeta(page, limit, total),
	};
};

const applyForAidIntoDB = async (
	campaignId: string,
	userId: string,
	payload: IApplyForAid,
	file?: Express.Multer.File,
) => {
	const campaign = await prisma.donationCampaign.findFirst({
		where: {
			id: campaignId,
			isDeleted: false,
		},
		select: {
			id: true,
			status: true,
		},
	});

	if (!campaign) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation campaign not found");
	}

	if (campaign.status === CampaignStatus.CLOSED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This campaign is closed and no longer accepts applications",
		);
	}

	const uploaded = file ? await uploadProofDocument(file) : undefined;

	try {
		return await prisma.donationApplication.create({
			data: {
				campaignId: campaign.id,
				applicantId: userId,
				reason: payload.reason,
				payoutDetails: payload.payoutDetails,
				proofDocumentUrl: uploaded?.secure_url,
				proofPublicId: uploaded?.public_id,
			},
			select: applicationSelect,
		});
	} catch (error) {
		if (uploaded) {
			await deleteFromCloudinary(uploaded.public_id);
		}

		throw error;
	}
};

const reviewApplicationIntoDB = async (
	applicationId: string,
	reviewer: RequestUser,
	payload: IReviewApplication,
) => {
	const application = await prisma.donationApplication.findUnique({
		where: {
			id: applicationId,
		},
		select: {
			id: true,
			status: true,
			campaignId: true,
			campaign: {
				select: {
					createdByUserId: true,
				},
			},
		},
	});

	if (!application) {
		throw new AppError(httpStatus.NOT_FOUND, "Donation application not found");
	}

	if (
		!isAdminRole(reviewer.role) &&
		application.campaign.createdByUserId !== reviewer.id
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only review applications of your own campaigns",
		);
	}

	if (application.status !== ApplicationStatus.PENDING) {
		throw new AppError(
			httpStatus.CONFLICT,
			"This application has already been reviewed",
		);
	}

	const isApproved = payload.status === ApplicationStatus.APPROVED;

	if (isApproved && !payload.approvedAmount) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Approved amount is required when approving an application",
		);
	}

	try {
		return await prisma.$transaction(
			async (transaction) => {
				const reviewed = await transaction.donationApplication.updateMany({
					where: {
						id: application.id,
						status: ApplicationStatus.PENDING,
					},
					data: {
						status: payload.status,
						approvedAmount: isApproved ? payload.approvedAmount : null,
						reviewedByUserId: reviewer.id,
						reviewedAt: new Date(),
					},
				});

				if (reviewed.count === 0) {
					throw new AppError(
						httpStatus.CONFLICT,
						"This application has already been reviewed",
					);
				}

				if (isApproved && payload.approvedAmount) {
					const approvedAmount = new Prisma.Decimal(payload.approvedAmount);

					const campaign = await transaction.donationCampaign.findUniqueOrThrow(
						{
							where: {
								id: application.campaignId,
							},
							select: {
								raisedAmount: true,
							},
						},
					);

					const paidOut = await transaction.donationPayout.aggregate({
						where: {
							campaignId: application.campaignId,
						},
						_sum: {
							amount: true,
						},
					});

					const availableBalance = campaign.raisedAmount.minus(
						paidOut._sum.amount ?? 0,
					);

					if (approvedAmount.gt(availableBalance)) {
						throw new AppError(
							httpStatus.CONFLICT,
							`Approved amount exceeds the campaign's available balance of ${availableBalance.toFixed(2)}`,
						);
					}

					await transaction.donationPayout.create({
						data: {
							campaignId: application.campaignId,
							applicationId: application.id,
							amount: approvedAmount,
						},
					});
				}

				return transaction.donationApplication.findUniqueOrThrow({
					where: {
						id: application.id,
					},
					select: applicationSelect,
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
				"Review request conflicted. Please try again",
			);
		}

		throw error;
	}
};

export const donationService = {
	createCampaignIntoDB,
	updateCampaignIntoDB,
	deleteCampaignFromDB,
	getAllCampaignsFromDB,
	getCampaignByIdFromDB,
	getCampaignApplicationsFromDB,
	getCampaignTransactionsFromDB,
	initiateDonationIntoDB,
	getMyDonationsFromDB,
	applyForAidIntoDB,
	getMyApplicationsFromDB,
	getAllApplicationsFromDB,
	reviewApplicationIntoDB,
};
