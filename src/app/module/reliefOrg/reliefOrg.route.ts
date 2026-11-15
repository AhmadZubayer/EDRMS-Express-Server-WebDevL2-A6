import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { reliefOrgController } from "./reliefOrg.controller";
import { reliefOrgValidation } from "./reliefOrg.validation";

export const reliefOrgRoutes = Router();

reliefOrgRoutes.post(
	"/sign-up",
	auth(),
	upload.array("verificationDocs", 10),
	validateRequest(reliefOrgValidation.signUpReliefOrgSchema),
	reliefOrgController.signUpAsReliefOrg,
);

// must stay before "/:id" so "profile" is not read as an id
reliefOrgRoutes.get("/profile/me", auth(), reliefOrgController.getMyProfile);

reliefOrgRoutes.get(
	"/",
	validateQuery(reliefOrgValidation.getReliefOrgsQuerySchema),
	reliefOrgController.getAllReliefOrgs,
);

reliefOrgRoutes.get(
	"/:id",
	validateParams(reliefOrgValidation.reliefOrgParamsSchema),
	reliefOrgController.getReliefOrgById,
);

reliefOrgRoutes.get(
	"/:id/documents",
	auth(UserRole.ADMIN),
	validateParams(reliefOrgValidation.reliefOrgParamsSchema),
	reliefOrgController.getReliefOrgDocuments,
);

reliefOrgRoutes.patch(
	"/:id/verify",
	auth(UserRole.ADMIN),
	validateParams(reliefOrgValidation.reliefOrgParamsSchema),
	reliefOrgController.verifyReliefOrg,
);
