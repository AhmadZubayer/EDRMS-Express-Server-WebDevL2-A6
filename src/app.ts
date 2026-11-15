import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import config from "./app/config";
import { logger } from "./app/lib/logger";
import { swaggerDocument } from "./app/lib/swagger";
import { ensureRedis } from "./app/middleware/ensureRedis";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { userRoutes } from "./app/module/user/user.route";
import { adminRoutes } from "./app/module/admin/admin.route";
import { disasterRoutes } from "./app/module/disaster/disaster.route";
import { shelterRoutes } from "./app/module/shelter/shelter.route";
import { reliefOrgRoutes } from "./app/module/reliefOrg/reliefOrg.route";
import { missingPersonRoutes } from "./app/module/missingPerson/missingPerson.route";
import { rescueRequestRoutes } from "./app/module/rescueRequest/rescueRequest.route";
import { communityPostRoutes } from "./app/module/communityPost/communityPost.route";
import { donationRoutes } from "./app/module/donation/donation.route";
import { volunteerNetworkRoutes } from "./app/module/volunteerNetwork/volunteerNetwork.route";
import { volunteerRoutes } from "./app/module/volunteer/volunteer.route";
import { trashRoutes } from "./app/module/trash/trash.route";
import { authRoutes } from "./app/module/auth/auth.route";
import { paymentRoutes } from "./app/module/payment/payment.route";
import { bkashRoutes } from "./app/module/payment/providers/bkash/bkash.route";
import {
	stripeReturnRoutes,
	stripeWebhookRoutes,
} from "./app/module/payment/providers/stripe/stripe.route";

const app: Application = express();

app.use(
	cors({
		origin: (config.frontend_url || "").split(",").map((o) => o.trim()),
		credentials: true,
	}),
);

// Stripe needs the raw body, so this route is mounted before express.json()
app.use("/api/payments/webhook", stripeWebhookRoutes);

// Middleware to parse JSON bodies
app.use(express.json());
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Basic route
app.get("/", (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: `Welcome to ${config.app_name}. Navigate to /docs for API documentation`,
	});
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(ensureRedis);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/relief-orgs", reliefOrgRoutes);
app.use("/api/missing-persons", missingPersonRoutes);
app.use("/api/rescue-requests", rescueRequestRoutes);
app.use("/api/community-posts", communityPostRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/volunteers", volunteerNetworkRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/payments/return", stripeReturnRoutes);
app.use("/api/payments/bkash", bkashRoutes);
app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
