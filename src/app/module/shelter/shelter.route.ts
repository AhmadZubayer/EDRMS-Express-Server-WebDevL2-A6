import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { shelterController } from "./shelter.controller";
import { shelterValidation } from "./shelter.validation";

export const shelterRoutes = Router();

shelterRoutes.post(
	"/",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateRequest(shelterValidation.createShelterSchema),
	shelterController.createShelter,
);

shelterRoutes.get(
	"/",
	validateQuery(shelterValidation.getSheltersQuerySchema),
	shelterController.getAllShelters,
);

shelterRoutes.get(
	"/:id",
	validateParams(shelterValidation.shelterParamsSchema),
	shelterController.getShelterById,
);

shelterRoutes.patch(
	"/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(shelterValidation.shelterParamsSchema),
	validateRequest(shelterValidation.updateShelterSchema),
	shelterController.updateShelter,
);

shelterRoutes.delete(
	"/:id",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateParams(shelterValidation.shelterParamsSchema),
	shelterController.deleteShelter,
);
