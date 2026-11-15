import type { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../../config";
import { AppError } from "../../../../utils/AppError";
import { catchAsync } from "../../../../utils/catchAsync";
import { stripeWebhook } from "./stripe.webhook";

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
	const signature = req.headers["stripe-signature"];

	if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Invalid Stripe webhook request",
		);
	}

	await stripeWebhook.handleWebhook(req.body, signature);

	res.status(httpStatus.OK).json({
		received: true,
	});
});

const frontendBase = () => (config.frontend_url || "").split(",")[0].trim();

const showSuccessReturn = (req: Request, res: Response) => {
	const sessionId =
		typeof req.query.session_id === "string" ? req.query.session_id : "";
	res.redirect(
		`${frontendBase()}/donations/payment/success?provider=stripe&session_id=${encodeURIComponent(sessionId)}`,
	);
};

const showCancelReturn = (_req: Request, res: Response) => {
	res.redirect(`${frontendBase()}/donations/payment/cancel?provider=stripe`);
};

export const stripeController = {
	handleStripeWebhook,
	showSuccessReturn,
	showCancelReturn,
};
