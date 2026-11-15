import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { disasterController } from "./disaster.controller";
import { disasterValidation } from "./disaster.validation";

export const disasterRoutes = Router();

disasterRoutes.post(
	"/",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateRequest(disasterValidation.createDisasterSchema),
	disasterController.createDisaster,
);

disasterRoutes.get(
	"/",
	validateQuery(disasterValidation.getDisastersQuerySchema),
	disasterController.getAllDisasters,
);

disasterRoutes.get(
	"/:id",
	validateParams(disasterValidation.disasterParamsSchema),
	disasterController.getDisasterById,
);

disasterRoutes.patch(
	"/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(disasterValidation.disasterParamsSchema),
	validateRequest(disasterValidation.updateDisasterSchema),
	disasterController.updateDisaster,
);

disasterRoutes.patch(
	"/:id/mark-safe",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(disasterValidation.disasterParamsSchema),
	disasterController.markDisasterAsSafe,
);

disasterRoutes.delete(
	"/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(disasterValidation.disasterParamsSchema),
	disasterController.deleteDisaster,
);
