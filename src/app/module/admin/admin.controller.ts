import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { AdminTableName } from "./admin.tables";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IAdminActor } from "./admin.interface";
import { adminService } from "./admin.service";

const getActor = (req: Request): IAdminActor => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return { id: req.user.id, role: req.user.role };
};

const getId = (res: Response) =>
	(res.locals.validatedParams as { id: string }).id;

// ---------------------------------------------------------------- accounts

const getAllAccounts = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllAccountsFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Accounts retrieved successfully",
			data,
			meta,
		});
	},
);

const createAccount = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const result = await adminService.createAccountIntoDB(
			req.body,
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Account created successfully",
			data: result,
		});
	},
);

const updateAccountRole = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const account = await adminService.updateAccountRoleIntoDB(
			getId(res),
			req.body,
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Account role updated successfully",
			data: account,
		});
	},
);

const softDeleteAccount = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const data = await adminService.softDeleteAccountIntoDB(
			getId(res),
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Account deleted successfully",
			data,
		});
	},
);

const restoreAccount = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const account = await adminService.restoreAccountIntoDB(
			getId(res),
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Account restored successfully",
			data: account,
		});
	},
);

// ------------------------------------------------------ super admin: admins

const createAdmin = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const result = await adminService.createAdminIntoDB(req.body);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: result.emailSent
				? "Admin created and login credentials emailed"
				: "Admin created, but the credentials email could not be sent",
			data: result,
		});
	},
);

const getAllAdmins = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllAdminsFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Admins retrieved successfully",
			data,
			meta,
		});
	},
);

const updateAdminStatus = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const admin = await adminService.updateAdminStatusIntoDB(
			getId(res),
			req.body,
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Admin status updated successfully",
			data: admin,
		});
	},
);

const deleteAdmin = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const data = await adminService.deleteAdminFromDB(
			getId(res),
			getActor(req),
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Admin deleted successfully",
			data,
		});
	},
);

// -------------------------------------------------------------- volunteers

const getAllVolunteers = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllVolunteersFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Volunteers retrieved successfully",
			data,
			meta,
		});
	},
);

const verifyVolunteer = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const volunteer = await adminService.verifyVolunteerIntoDB(
			getId(res),
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Volunteer verification updated successfully",
			data: volunteer,
		});
	},
);

// ------------------------------------------------------------- relief orgs

const getAllReliefOrgs = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllReliefOrgsFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Relief organizations retrieved successfully",
			data,
			meta,
		});
	},
);

const verifyReliefOrg = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const org = await adminService.verifyReliefOrgIntoDB(getId(res), req.body);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Relief organization verification updated successfully",
			data: org,
		});
	},
);

// --------------------------------------------------------------- disasters

const getAllDisasters = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllDisastersFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Disasters retrieved successfully",
			data,
			meta,
		});
	},
);

const createDisaster = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const disaster = await adminService.createDisasterIntoDB(req.body);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Disaster created successfully",
			data: disaster,
		});
	},
);

const verifyDisaster = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const disaster = await adminService.verifyDisasterIntoDB(
			getId(res),
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Disaster verification updated successfully",
			data: disaster,
		});
	},
);

// ---------------------------------------------------------- rescue requests

const getAllRescueRequests = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllRescueRequestsFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue requests retrieved successfully",
			data,
			meta,
		});
	},
);

const createRescueRequest = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const request = await adminService.createRescueRequestIntoDB(
			req.body,
			getActor(req).id,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Rescue request created successfully",
			data: request,
		});
	},
);

// --------------------------------------------------------- community posts

const getAllCommunityPosts = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { data, meta } = await adminService.getAllCommunityPostsFromDB(
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Community posts retrieved successfully",
			data,
			meta,
		});
	},
);

const moderateCommunityPost = catchAsync(
	async (req: Request, res: Response, _next: NextFunction) => {
		const post = await adminService.moderateCommunityPostIntoDB(
			getId(res),
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Community post status updated successfully",
			data: post,
		});
	},
);

const softDeleteCommunityPost = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const data = await adminService.softDeleteCommunityPostIntoDB(getId(res));

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Community post deleted successfully",
			data,
		});
	},
);

const restoreCommunityPost = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const post = await adminService.restoreCommunityPostIntoDB(getId(res));

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Community post restored successfully",
			data: post,
		});
	},
);

// ------------------------------------------------- reports and raw tables

const generateReport = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const report = await adminService.generateReportFromDB();

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Report generated successfully",
			data: report,
		});
	},
);

const getAllTables = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const tables = await adminService.getAllTablesFromDB();

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Tables retrieved successfully",
			data: tables,
		});
	},
);

const getTableData = catchAsync(
	async (_req: Request, res: Response, _next: NextFunction) => {
		const { tableName } = res.locals.validatedParams as {
			tableName: AdminTableName;
		};

		const { data, meta } = await adminService.getTableDataFromDB(
			tableName,
			res.locals.validatedQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Table records retrieved successfully",
			data,
			meta,
		});
	},
);

export const adminController = {
	getAllAccounts,
	createAccount,
	updateAccountRole,
	softDeleteAccount,
	restoreAccount,
	createAdmin,
	getAllAdmins,
	updateAdminStatus,
	deleteAdmin,
	getAllVolunteers,
	verifyVolunteer,
	getAllReliefOrgs,
	verifyReliefOrg,
	getAllDisasters,
	createDisaster,
	verifyDisaster,
	getAllRescueRequests,
	createRescueRequest,
	getAllCommunityPosts,
	moderateCommunityPost,
	softDeleteCommunityPost,
	restoreCommunityPost,
	generateReport,
	getAllTables,
	getTableData,
};
