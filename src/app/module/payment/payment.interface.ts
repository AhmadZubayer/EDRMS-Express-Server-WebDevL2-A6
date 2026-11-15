import type {
	PaymentProvider,
	PaymentStatus,
} from "../../../generated/prisma/enums";

export interface ICreatePayment {
	donationId: string;
	provider?: PaymentProvider;
}

// Strategy pattern: the data every gateway adapter receives
export interface ICreateCheckoutPayload {
	donationId: string;
	paymentId: string;
	amount: string;
	currency: string;
	itemTitle: string;
	customerEmail?: string;
}

export interface ICheckoutResult {
	providerTransactionId: string;
	checkoutUrl: string;
}

export interface ICompletePayment {
	paymentId: string;
	donationId: string;
	provider: PaymentProvider;
	providerTransactionId: string;
	amount: string;
	currency: string;
}

export interface IClosePayment {
	paymentId: string;
	donationId: string;
	provider: PaymentProvider;
	providerTransactionId: string;
	status: PaymentStatus;
}

export interface IRefundPayment {
	paymentId: string;
	providerTransactionId: string;
}

export interface IRefundResult {
	providerRefundId: string;
	status: string | null;
}

export interface IPaymentProvider {
	createCheckoutSession(
		payload: ICreateCheckoutPayload,
	): Promise<ICheckoutResult>;
	refundPayment(payload: IRefundPayment): Promise<IRefundResult>;
}
