import { Router } from "express";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { rescueRequestController } from "./rescueRequest.controller";
import { rescueRequestValidation } from "./rescueRequest.validation";

export const rescueRequestRoutes = Router();

rescueRequestRoutes.post(
	"/",
	auth(),
	upload.single("file"),
	validateRequest(rescueRequestValidation.createRescueRequestSchema),
	rescueRequestController.createRescueRequest,
);

rescueRequestRoutes.get(
	"/my",
	auth(),
	validateQuery(rescueRequestValidation.getRescueRequestsQuerySchema),
	rescueRequestController.getMyRescueRequests,
);

rescueRequestRoutes.get(
	"/",
	validateQuery(rescueRequestValidation.getRescueRequestsQuerySchema),
	rescueRequestController.getAllRescueRequests,
);

rescueRequestRoutes.get(
	"/:id",
	validateParams(rescueRequestValidation.rescueRequestParamsSchema),
	rescueRequestController.getRescueRequestById,
);

rescueRequestRoutes.patch(
	"/:id/status",
	auth(),
	validateParams(rescueRequestValidation.rescueRequestParamsSchema),
	validateRequest(rescueRequestValidation.updateRescueRequestStatusSchema),
	rescueRequestController.updateRescueRequestStatus,
);

rescueRequestRoutes.patch(
	"/:id/cancel",
	auth(),
	validateParams(rescueRequestValidation.rescueRequestParamsSchema),
	rescueRequestController.cancelMyRescueRequest,
);

rescueRequestRoutes.patch(
	"/:id",
	auth(),
	upload.single("file"),
	validateParams(rescueRequestValidation.rescueRequestParamsSchema),
	validateRequest(rescueRequestValidation.updateRescueRequestSchema),
	rescueRequestController.updateRescueRequest,
);

rescueRequestRoutes.delete(
	"/:id",
	auth(),
	validateParams(rescueRequestValidation.rescueRequestParamsSchema),
	rescueRequestController.deleteRescueRequest,
);
