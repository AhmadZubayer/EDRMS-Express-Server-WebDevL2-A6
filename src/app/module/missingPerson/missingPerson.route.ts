import { Router } from "express";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { missingPersonController } from "./missingPerson.controller";
import { missingPersonValidation } from "./missingPerson.validation";

export const missingPersonRoutes = Router();

missingPersonRoutes.post(
	"/",
	auth(),
	upload.single("file"),
	validateRequest(missingPersonValidation.createMissingPersonSchema),
	missingPersonController.createMissingPerson,
);

missingPersonRoutes.get(
	"/my",
	auth(),
	validateQuery(missingPersonValidation.getMissingPersonsQuerySchema),
	missingPersonController.getMyMissingPersons,
);

missingPersonRoutes.get(
	"/",
	validateQuery(missingPersonValidation.getMissingPersonsQuerySchema),
	missingPersonController.getAllMissingPersons,
);

missingPersonRoutes.get(
	"/:id",
	validateParams(missingPersonValidation.missingPersonParamsSchema),
	missingPersonController.getMissingPersonById,
);

missingPersonRoutes.patch(
	"/:id/status",
	auth(),
	validateParams(missingPersonValidation.missingPersonParamsSchema),
	validateRequest(missingPersonValidation.updateMissingPersonStatusSchema),
	missingPersonController.updateMissingPersonStatus,
);

missingPersonRoutes.patch(
	"/:id",
	auth(),
	upload.single("file"),
	validateParams(missingPersonValidation.missingPersonParamsSchema),
	validateRequest(missingPersonValidation.updateMissingPersonSchema),
	missingPersonController.updateMissingPerson,
);

missingPersonRoutes.delete(
	"/:id",
	auth(),
	validateParams(missingPersonValidation.missingPersonParamsSchema),
	missingPersonController.deleteMissingPerson,
);
