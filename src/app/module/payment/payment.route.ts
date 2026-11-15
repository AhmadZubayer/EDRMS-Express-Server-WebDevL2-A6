import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateRequest } from "../../middleware/validateRequest";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

export const paymentRoutes = Router();

paymentRoutes.post(
	"/create",
	auth(),
	validateRequest(paymentValidation.createPaymentSchema),
	paymentController.createPayment,
);

paymentRoutes.get("/receipt", paymentController.getReceipt);

paymentRoutes.get("/", auth(), paymentController.getMyPayments);

paymentRoutes.get(
	"/:id",
	auth(),
	validateParams(paymentValidation.getPaymentParamsSchema),
	paymentController.getPaymentById,
);
