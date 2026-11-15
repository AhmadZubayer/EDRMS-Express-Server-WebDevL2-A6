import httpStatus from "http-status";
import { PaymentProvider } from "../../../../generated/prisma/enums";
import { AppError } from "../../../utils/AppError";
import type { IPaymentProvider } from "../payment.interface";
import { bkashPaymentProvider } from "./bkash/bkash.provider";
import { stripePaymentProvider } from "./stripe/stripe.provider";

export const getPaymentProvider = (
	provider: PaymentProvider,
): IPaymentProvider => {
	switch (provider) {
		case PaymentProvider.STRIPE:
			return stripePaymentProvider;

		case PaymentProvider.BKASH:
			return bkashPaymentProvider;

		default:
			throw new AppError(
				httpStatus.NOT_IMPLEMENTED,
				"Payment provider is not supported",
			);
	}
};
