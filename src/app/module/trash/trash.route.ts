import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { trashController } from "./trash.controller";
import { trashValidation } from "./trash.validation";

export const trashRoutes = Router();

trashRoutes.get(
	"/",
	auth(),
	validateQuery(trashValidation.getTrashQuerySchema),
	trashController.getAllTrashItems,
);

trashRoutes.post(
	"/:id/restore",
	auth(),
	validateParams(trashValidation.trashParamsSchema),
	trashController.restoreTrashItem,
);

trashRoutes.delete(
	"/:id",
	auth(),
	validateParams(trashValidation.trashParamsSchema),
	trashController.deleteTrashItemPermanently,
);
