import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { adminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

export const adminRoutes = Router();

// ------------------------------------------- super admin only: admin accounts

adminRoutes.post(
	"/admins",
	auth(UserRole.SUPER_ADMIN),
	validateRequest(adminValidation.createAdminSchema),
	adminController.createAdmin,
);

adminRoutes.get(
	"/admins",
	auth(UserRole.SUPER_ADMIN),
	validateQuery(adminValidation.adminListQuerySchema),
	adminController.getAllAdmins,
);

adminRoutes.patch(
	"/admins/:id/status",
	auth(UserRole.SUPER_ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.updateAdminStatusSchema),
	adminController.updateAdminStatus,
);

adminRoutes.delete(
	"/admins/:id",
	auth(UserRole.SUPER_ADMIN),
	validateParams(adminValidation.idParamsSchema),
	adminController.deleteAdmin,
);

// ---------------------------------------------------------------- accounts

adminRoutes.get(
	"/accounts",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.accountQuerySchema),
	adminController.getAllAccounts,
);

adminRoutes.post(
	"/accounts",
	auth(UserRole.ADMIN),
	validateRequest(adminValidation.createAccountSchema),
	adminController.createAccount,
);

adminRoutes.patch(
	"/accounts/:id/role",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.updateAccountRoleSchema),
	adminController.updateAccountRole,
);

adminRoutes.patch(
	"/accounts/:id/restore",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	adminController.restoreAccount,
);

adminRoutes.delete(
	"/accounts/:id",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	adminController.softDeleteAccount,
);

// -------------------------------------------------------------- volunteers

adminRoutes.get(
	"/volunteers",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.volunteerQuerySchema),
	adminController.getAllVolunteers,
);

adminRoutes.patch(
	"/volunteers/:id/verify",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.verifyVolunteerSchema),
	adminController.verifyVolunteer,
);

// ------------------------------------------------------------- relief orgs

adminRoutes.get(
	"/relief-orgs",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.reliefOrgQuerySchema),
	adminController.getAllReliefOrgs,
);

adminRoutes.patch(
	"/relief-orgs/:id/verify",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.verifyReliefOrgSchema),
	adminController.verifyReliefOrg,
);

// --------------------------------------------------------------- disasters

adminRoutes.get(
	"/disasters",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.disasterQuerySchema),
	adminController.getAllDisasters,
);

adminRoutes.post(
	"/disasters",
	auth(UserRole.ADMIN),
	validateRequest(adminValidation.createDisasterSchema),
	adminController.createDisaster,
);

adminRoutes.patch(
	"/disasters/:id/verify",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.verifyDisasterSchema),
	adminController.verifyDisaster,
);

// ---------------------------------------------------------- rescue requests

adminRoutes.get(
	"/rescue-requests",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.rescueRequestQuerySchema),
	adminController.getAllRescueRequests,
);

adminRoutes.post(
	"/rescue-requests",
	auth(UserRole.ADMIN),
	validateRequest(adminValidation.createRescueRequestSchema),
	adminController.createRescueRequest,
);

// --------------------------------------------------------- community posts

adminRoutes.get(
	"/community-posts",
	auth(UserRole.ADMIN),
	validateQuery(adminValidation.communityPostQuerySchema),
	adminController.getAllCommunityPosts,
);

adminRoutes.patch(
	"/community-posts/:id/status",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	validateRequest(adminValidation.moderatePostSchema),
	adminController.moderateCommunityPost,
);

adminRoutes.patch(
	"/community-posts/:id/restore",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	adminController.restoreCommunityPost,
);

adminRoutes.delete(
	"/community-posts/:id",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.idParamsSchema),
	adminController.softDeleteCommunityPost,
);

// ------------------------------------------------- reports and raw tables

adminRoutes.get(
	"/reports",
	auth(UserRole.ADMIN),
	adminController.generateReport,
);

adminRoutes.get("/tables", auth(UserRole.ADMIN), adminController.getAllTables);

adminRoutes.get(
	"/tables/:tableName",
	auth(UserRole.ADMIN),
	validateParams(adminValidation.tableParamsSchema),
	validateQuery(adminValidation.tableQuerySchema),
	adminController.getTableData,
);
