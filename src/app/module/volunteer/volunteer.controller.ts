import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IFieldReportQuery,
	INearbyRequestsQuery,
	IRegisterVolunteer,
	ITaskQuery,
} from "./volunteer.interface";
import { volunteerService } from "./volunteer.service";
import { volunteerValidation } from "./volunteer.validation";

const getRequestUser = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user;
};

const registerVolunteer = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		// multipart body: validated here because it runs after the file upload
		const result = volunteerValidation.registerVolunteerSchema.safeParse(
			req.body ?? {},
		);

		if (!result.success) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Validation failed",
				result.error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
			);
		}

		const volunteer = await volunteerService.registerVolunteerIntoDB(
			user,
			result.data as IRegisterVolunteer,
			req.file,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Volunteer registered successfully",
			data: volunteer,
		});
	},
);

const getMyProfile = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const volunteer = await volunteerService.getMyVolunteerProfileFromDB(
			user.id,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Volunteer profile retrieved successfully",
			data: volunteer,
		});
	},
);

const updateMyProfile = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const volunteer = await volunteerService.updateMyVolunteerProfileIntoDB(
			user.id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Volunteer profile updated successfully",
			data: volunteer,
		});
	},
);

const applyForVerification = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const volunteer = await volunteerService.applyForVerificationIntoDB(
			user.id,
			req.file,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Verification application submitted successfully",
			data: volunteer,
		});
	},
);

const reviewVerification = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const { id } = res.locals.validatedParams as { id: string };

		const volunteer = await volunteerService.reviewVerificationIntoDB(
			id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Volunteer verification status reviewed successfully",
			data: volunteer,
		});
	},
);

const updateDutyLocation = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const volunteer = await volunteerService.updateDutyLocationIntoDB(
			user.id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Duty location updated successfully",
			data: volunteer,
		});
	},
);

const getNearbyRescueRequests = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as INearbyRequestsQuery;

		const { data, meta } = await volunteerService.getNearbyRescueRequestsFromDB(
			user.id,
			query,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Nearby rescue requests retrieved successfully",
			data,
			meta,
		});
	},
);

const acceptRescueTask = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { requestId } = res.locals.validatedParams as { requestId: string };

		const task = await volunteerService.acceptRescueTaskIntoDB(
			user.id,
			requestId,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue task accepted successfully",
			data: task,
		});
	},
);

const rejectRescueTask = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { requestId } = res.locals.validatedParams as { requestId: string };

		const task = await volunteerService.rejectRescueTaskIntoDB(
			user.id,
			requestId,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue task rejected",
			data: task,
		});
	},
);

const getMyRescueTasks = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as ITaskQuery;

		const { data, meta } = await volunteerService.getMyRescueTasksFromDB(
			user.id,
			query,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Assigned tasks retrieved successfully",
			data,
			meta,
		});
	},
);

const updateTaskProgress = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { taskId } = res.locals.validatedParams as { taskId: string };

		const task = await volunteerService.updateTaskProgressIntoDB(
			user.id,
			taskId,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Task progress updated successfully",
			data: task,
		});
	},
);

const completeRescueTask = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { taskId } = res.locals.validatedParams as { taskId: string };

		const task = await volunteerService.completeRescueTaskIntoDB(
			user.id,
			taskId,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Task completed successfully",
			data: task,
		});
	},
);

const createRouteReport = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const report = await volunteerService.createRouteReportIntoDB(
			user.id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Route report created successfully",
			data: report,
		});
	},
);

const createResourceShortage = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const report = await volunteerService.createResourceShortageIntoDB(
			user.id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Resource shortage report created successfully",
			data: report,
		});
	},
);

const getMyFieldReports = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IFieldReportQuery;

		const { data, meta } = await volunteerService.getMyFieldReportsFromDB(
			user.id,
			query,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Field reports retrieved successfully",
			data,
			meta,
		});
	},
);

const getAllFieldReports = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const query = res.locals.validatedQuery as IFieldReportQuery;

		const { data, meta } =
			await volunteerService.getAllFieldReportsFromDB(query);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Field reports retrieved successfully",
			data,
			meta,
		});
	},
);

export const volunteerController = {
	registerVolunteer,
	getMyProfile,
	updateMyProfile,
	applyForVerification,
	reviewVerification,
	updateDutyLocation,
	getNearbyRescueRequests,
	acceptRescueTask,
	rejectRescueTask,
	getMyRescueTasks,
	updateTaskProgress,
	completeRescueTask,
	createRouteReport,
	createResourceShortage,
	getMyFieldReports,
	getAllFieldReports,
};
