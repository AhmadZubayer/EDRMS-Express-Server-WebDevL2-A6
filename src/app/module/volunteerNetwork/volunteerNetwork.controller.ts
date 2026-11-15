import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IApplicationsQuery,
	IGroupJoinsQuery,
	IMyJoinsQuery,
	IOrganizationRequestQuery,
} from "./volunteerNetwork.interface";
import { volunteerNetworkService } from "./volunteerNetwork.service";

const getRequestUser = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user;
};

const getOrganizationApplications = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IApplicationsQuery;

		const { data, meta } =
			await volunteerNetworkService.getOrganizationApplicationsFromDB(
				user.id,
				query,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Organization applications retrieved successfully",
			data,
			meta,
		});
	},
);

const reviewOrganizationApplication = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const application =
			await volunteerNetworkService.reviewOrganizationApplicationIntoDB(
				user.id,
				id,
				req.body,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Organization application reviewed successfully",
			data: application,
		});
	},
);

const createOrganizationRequest = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);

		const request =
			await volunteerNetworkService.createOrganizationRequestIntoDB(
				user.id,
				req.body,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Organization request created successfully",
			data: request,
		});
	},
);

const getMyCreatedOrganizationRequests = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IOrganizationRequestQuery;

		const { data, meta } =
			await volunteerNetworkService.getMyCreatedOrganizationRequestsFromDB(
				user.id,
				query,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "My created organization requests retrieved successfully",
			data,
			meta,
		});
	},
);

const updateOrganizationRequest = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const request =
			await volunteerNetworkService.updateOrganizationRequestIntoDB(
				user.id,
				id,
				req.body,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Organization request updated successfully",
			data: request,
		});
	},
);

const deleteOrganizationRequest = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const request =
			await volunteerNetworkService.deleteOrganizationRequestFromDB(
				user.id,
				id,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Organization request deleted successfully",
			data: request,
		});
	},
);

const getOpenOrganizationRequests = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IOrganizationRequestQuery;

		const { data, meta } =
			await volunteerNetworkService.getOpenOrganizationRequestsFromDB(
				user.id,
				query,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Open organization requests retrieved successfully",
			data,
			meta,
		});
	},
);

const joinOrganizationRequest = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const join = await volunteerNetworkService.joinOrganizationRequestIntoDB(
			user.id,
			id,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Volunteer group application submitted successfully",
			data: join,
		});
	},
);

const getMyOrganizationJoins = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IMyJoinsQuery;

		const { data, meta } =
			await volunteerNetworkService.getMyOrganizationJoinsFromDB(
				user.id,
				query,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "User organization requests retrieved successfully",
			data,
			meta,
		});
	},
);

const joinRescueGroup = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const join = await volunteerNetworkService.joinRescueGroupIntoDB(
			user.id,
			id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Joined rescue group successfully",
			data: join,
		});
	},
);

const joinMissingPersonGroup = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const join = await volunteerNetworkService.joinMissingPersonGroupIntoDB(
			user.id,
			id,
			req.body,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.CREATED,
			message: "Joined missing person group successfully",
			data: join,
		});
	},
);

const getMyGroupJoins = catchAsync(
	async (req: Request, res: Response, next: NextFunction) => {
		const user = getRequestUser(req);
		const query = res.locals.validatedQuery as IGroupJoinsQuery;

		const { data, meta } = await volunteerNetworkService.getMyGroupJoinsFromDB(
			user.id,
			query,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "User group join requests retrieved successfully",
			data,
			meta,
		});
	},
);

export const volunteerNetworkController = {
	getOrganizationApplications,
	reviewOrganizationApplication,
	createOrganizationRequest,
	getMyCreatedOrganizationRequests,
	updateOrganizationRequest,
	deleteOrganizationRequest,
	getOpenOrganizationRequests,
	joinOrganizationRequest,
	getMyOrganizationJoins,
	joinRescueGroup,
	joinMissingPersonGroup,
	getMyGroupJoins,
};
