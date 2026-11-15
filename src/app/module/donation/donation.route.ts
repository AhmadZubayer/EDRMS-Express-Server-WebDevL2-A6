import { type RequestHandler, Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { donationController } from "./donation.controller";
import { donationValidation } from "./donation.validation";

export const donationRoutes = Router();

// Donating is open to guests. When a token is sent it must be valid, and the
// donation is then linked to that user.
const optionalAuth: RequestHandler = (req, res, next) => {
	const hasToken = Boolean(
		req.cookies?.accessToken || req.headers.authorization,
	);

	if (!hasToken) {
		return next();
	}

	return auth()(req, res, next);
};

// campaigns
donationRoutes.post(
	"/campaigns",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	upload.single("photo"),
	validateRequest(donationValidation.createCampaignSchema),
	donationController.createCampaign,
);

donationRoutes.get(
	"/campaigns",
	validateQuery(donationValidation.getCampaignsQuerySchema),
	donationController.getAllCampaigns,
);

donationRoutes.get(
	"/campaigns/:id",
	validateParams(donationValidation.idParamsSchema),
	donationController.getCampaignById,
);

donationRoutes.patch(
	"/campaigns/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	upload.single("photo"),
	validateParams(donationValidation.idParamsSchema),
	validateRequest(donationValidation.updateCampaignSchema),
	donationController.updateCampaign,
);

donationRoutes.delete(
	"/campaigns/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(donationValidation.idParamsSchema),
	donationController.deleteCampaign,
);

donationRoutes.get(
	"/campaigns/:id/applications",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(donationValidation.idParamsSchema),
	validateQuery(donationValidation.getApplicationsQuerySchema),
	donationController.getCampaignApplications,
);

donationRoutes.get(
	"/campaigns/:id/transactions",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(donationValidation.idParamsSchema),
	donationController.getCampaignTransactions,
);

donationRoutes.post(
	"/campaigns/:id/donate",
	optionalAuth,
	validateParams(donationValidation.idParamsSchema),
	validateRequest(donationValidation.donateSchema),
	donationController.donateToCampaign,
);

donationRoutes.post(
	"/campaigns/:id/apply",
	auth(),
	upload.single("proofDocument"),
	validateParams(donationValidation.idParamsSchema),
	validateRequest(donationValidation.applyForAidSchema),
	donationController.applyForAid,
);

// my records
donationRoutes.get(
	"/my-applications",
	auth(),
	validateQuery(donationValidation.getApplicationsQuerySchema),
	donationController.getMyApplications,
);

donationRoutes.get(
	"/my-donations",
	auth(),
	validateQuery(donationValidation.getMyDonationsQuerySchema),
	donationController.getMyDonations,
);

// applications (admin / relief organisation)
donationRoutes.get(
	"/applications",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateQuery(donationValidation.getApplicationsQuerySchema),
	donationController.getAllApplications,
);

donationRoutes.patch(
	"/applications/:id/review",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(donationValidation.idParamsSchema),
	validateRequest(donationValidation.reviewApplicationSchema),
	donationController.reviewApplication,
);
