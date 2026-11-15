import httpStatus from "http-status";
import config from "../../../../config";
import { stripe } from "../../../../lib/stripe";
import { AppError } from "../../../../utils/AppError";
import type Stripe from "stripe";
import {
	PaymentProvider,
	PaymentStatus,
} from "../../../../../generated/prisma/enums";
import { Prisma } from "../../../../../generated/prisma/client";
import { paymentService } from "../../payment.service";

const verifyWebhookEvent = (
	payload: Buffer,
	signature: string,
): Stripe.Event => {
	if (!config.stripe_webhook_secret) {
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			"Stripe webhook secret is not configured",
		);
	}

	try {
		return stripe.webhooks.constructEvent(
			payload,
			signature,
			config.stripe_webhook_secret,
		);
	} catch {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Invalid Stripe webhook signature",
		);
	}
};

const handleWebhook = async (payload: Buffer, signature: string) => {
	const event = verifyWebhookEvent(payload, signature);

	if (event.type === "refund.updated" || event.type === "refund.failed") {
		const refundEvent = event.data.object as Stripe.Refund;
		const refund = await stripe.refunds.retrieve(refundEvent.id);

		await paymentService.updateRefundStatusIntoDB(
			PaymentProvider.STRIPE,
			refund.id,
			refund.status,
		);

		return;
	}

	const isSuccessEvent =
		event.type === "checkout.session.completed" ||
		event.type === "checkout.session.async_payment_succeeded";

	const isClosedEvent =
		event.type === "checkout.session.async_payment_failed" ||
		event.type === "checkout.session.expired";

	if (!isSuccessEvent && !isClosedEvent) {
		return;
	}

	const session = event.data.object as Stripe.Checkout.Session;
	const paymentId = session.metadata?.paymentId;
	const donationId = session.metadata?.donationId;

	if (!paymentId || !donationId || session.client_reference_id !== donationId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Stripe Checkout details are incomplete",
		);
	}

	if (isClosedEvent) {
		if (session.payment_status === "paid") {
			return;
		}

		await paymentService.closePendingPaymentIntoDB({
			paymentId,
			donationId,
			provider: PaymentProvider.STRIPE,
			providerTransactionId: session.id,
			status:
				event.type === "checkout.session.expired"
					? PaymentStatus.CANCELLED
					: PaymentStatus.FAILED,
		});

		return;
	}

	if (session.payment_status !== "paid") {
		return;
	}

	if (session.amount_total === null || !session.currency) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Stripe Checkout details are incomplete",
		);
	}

	const paidPayment = {
		paymentId,
		donationId,
		provider: PaymentProvider.STRIPE,
		providerTransactionId: session.id,
		amount: new Prisma.Decimal(session.amount_total).div(100).toFixed(2),
		currency: session.currency,
	};

	try {
		await paymentService.completePaymentIntoDB(paidPayment);
	} catch (error) {
		if (
			!(error instanceof AppError) ||
			error.statusCode !== httpStatus.CONFLICT
		) {
			throw error;
		}

		await paymentService.refundCancelledDonationPaymentIntoDB(paidPayment);
	}
};

export const stripeWebhook = {
	verifyWebhookEvent,
	handleWebhook,
};
