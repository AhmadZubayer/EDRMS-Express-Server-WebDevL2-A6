import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { volunteerNetworkController } from "./volunteerNetwork.controller";
import { volunteerNetworkValidation } from "./volunteerNetwork.validation";

export const volunteerNetworkRoutes = Router();

// organization applications: owning relief organization only
volunteerNetworkRoutes.get(
	"/organization-applications",
	auth(UserRole.RELIEF_ORG),
	validateQuery(volunteerNetworkValidation.applicationsQuerySchema),
	volunteerNetworkController.getOrganizationApplications,
);

volunteerNetworkRoutes.patch(
	"/organization-applications/:id",
	auth(UserRole.RELIEF_ORG),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	validateRequest(volunteerNetworkValidation.reviewApplicationSchema),
	volunteerNetworkController.reviewOrganizationApplication,
);

// organization requests: static paths before "/:id" paths
volunteerNetworkRoutes.post(
	"/organization-requests",
	auth(UserRole.RELIEF_ORG),
	validateRequest(volunteerNetworkValidation.createOrganizationRequestSchema),
	volunteerNetworkController.createOrganizationRequest,
);

volunteerNetworkRoutes.get(
	"/organization-requests/my-created",
	auth(UserRole.RELIEF_ORG),
	validateQuery(volunteerNetworkValidation.myCreatedRequestsQuerySchema),
	volunteerNetworkController.getMyCreatedOrganizationRequests,
);

volunteerNetworkRoutes.get(
	"/organization-requests/my/joins",
	auth(),
	validateQuery(volunteerNetworkValidation.myJoinsQuerySchema),
	volunteerNetworkController.getMyOrganizationJoins,
);

volunteerNetworkRoutes.get(
	"/organization-requests",
	auth(),
	validateQuery(volunteerNetworkValidation.openRequestsQuerySchema),
	volunteerNetworkController.getOpenOrganizationRequests,
);

volunteerNetworkRoutes.patch(
	"/organization-requests/:id",
	auth(UserRole.RELIEF_ORG),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	validateRequest(volunteerNetworkValidation.updateOrganizationRequestSchema),
	volunteerNetworkController.updateOrganizationRequest,
);

volunteerNetworkRoutes.delete(
	"/organization-requests/:id",
	auth(UserRole.RELIEF_ORG),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	volunteerNetworkController.deleteOrganizationRequest,
);

volunteerNetworkRoutes.post(
	"/organization-requests/:id/join",
	auth(),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	volunteerNetworkController.joinOrganizationRequest,
);

// group joins: verified volunteers only (checked in the service)
volunteerNetworkRoutes.post(
	"/rescue-groups/:id/join",
	auth(),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	validateRequest(volunteerNetworkValidation.joinGroupSchema),
	volunteerNetworkController.joinRescueGroup,
);

volunteerNetworkRoutes.post(
	"/missing-person-groups/:id/join",
	auth(),
	validateParams(volunteerNetworkValidation.idParamsSchema),
	validateRequest(volunteerNetworkValidation.joinGroupSchema),
	volunteerNetworkController.joinMissingPersonGroup,
);

volunteerNetworkRoutes.get(
	"/group-joins/my",
	auth(),
	validateQuery(volunteerNetworkValidation.myGroupJoinsQuerySchema),
	volunteerNetworkController.getMyGroupJoins,
);
