import { z } from "zod";
import { PaymentProvider } from "../../../generated/prisma/enums";

const createPaymentSchema = z.object({
	donationId: z.uuid("A valid donation ID is required"),
	provider: z.enum(PaymentProvider).optional(),
});

const getPaymentParamsSchema = z.object({
	id: z.uuid("A valid payment ID is required"),
});

export const paymentValidation = {
	createPaymentSchema,
	getPaymentParamsSchema,
};
