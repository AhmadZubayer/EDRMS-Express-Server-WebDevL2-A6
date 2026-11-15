import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { volunteerController } from "./volunteer.controller";
import { volunteerValidation } from "./volunteer.validation";

export const volunteerRoutes = Router();

// static paths first, so they are never captured by "/:id/..." routes
volunteerRoutes.post(
	"/register",
	auth(),
	upload.single("file"),
	volunteerController.registerVolunteer,
);

volunteerRoutes.get("/me", auth(), volunteerController.getMyProfile);

volunteerRoutes.patch(
	"/me",
	auth(),
	validateRequest(volunteerValidation.updateVolunteerProfileSchema),
	volunteerController.updateMyProfile,
);

volunteerRoutes.post(
	"/verification/apply",
	auth(),
	upload.single("file"),
	volunteerController.applyForVerification,
);

volunteerRoutes.patch(
	"/duty/location",
	auth(),
	validateRequest(volunteerValidation.updateLocationSchema),
	volunteerController.updateDutyLocation,
);

volunteerRoutes.get(
	"/rescue-requests/nearby",
	auth(),
	validateQuery(volunteerValidation.nearbyRequestsQuerySchema),
	volunteerController.getNearbyRescueRequests,
);

volunteerRoutes.get(
	"/rescue-tasks/my",
	auth(),
	validateQuery(volunteerValidation.myTasksQuerySchema),
	volunteerController.getMyRescueTasks,
);

volunteerRoutes.post(
	"/rescue-tasks/:requestId/accept",
	auth(),
	validateParams(volunteerValidation.requestIdParamsSchema),
	volunteerController.acceptRescueTask,
);

volunteerRoutes.post(
	"/rescue-tasks/:requestId/reject",
	auth(),
	validateParams(volunteerValidation.requestIdParamsSchema),
	volunteerController.rejectRescueTask,
);

volunteerRoutes.patch(
	"/rescue-tasks/:taskId/progress",
	auth(),
	validateParams(volunteerValidation.taskIdParamsSchema),
	validateRequest(volunteerValidation.updateTaskProgressSchema),
	volunteerController.updateTaskProgress,
);

volunteerRoutes.patch(
	"/rescue-tasks/:taskId/complete",
	auth(),
	validateParams(volunteerValidation.taskIdParamsSchema),
	volunteerController.completeRescueTask,
);

volunteerRoutes.post(
	"/field-reports/routes",
	auth(),
	validateRequest(volunteerValidation.createRouteReportSchema),
	volunteerController.createRouteReport,
);

volunteerRoutes.post(
	"/field-reports/shortages",
	auth(),
	validateRequest(volunteerValidation.createResourceShortageSchema),
	volunteerController.createResourceShortage,
);

volunteerRoutes.get(
	"/field-reports/my",
	auth(),
	validateQuery(volunteerValidation.fieldReportsQuerySchema),
	volunteerController.getMyFieldReports,
);

volunteerRoutes.get(
	"/field-reports",
	auth(UserRole.RELIEF_ORG, UserRole.ADMIN),
	validateQuery(volunteerValidation.fieldReportsQuerySchema),
	volunteerController.getAllFieldReports,
);

// parameterised admin route last
volunteerRoutes.patch(
	"/:id/verification",
	auth(UserRole.ADMIN),
	validateParams(volunteerValidation.idParamsSchema),
	validateRequest(volunteerValidation.reviewVerificationSchema),
	volunteerController.reviewVerification,
);
