import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRescueRequestQuery } from "./rescueRequest.interface";
import { rescueRequestService } from "./rescueRequest.service";

const getUser = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user;
};

const createRescueRequest = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);

	const rescueRequest = await rescueRequestService.createRescueRequestIntoDB(
		user.id,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Rescue request created successfully",
		data: rescueRequest,
	});
});

const getAllRescueRequests = catchAsync(
	async (_req: Request, res: Response) => {
		const query = res.locals.validatedQuery as IRescueRequestQuery;

		const { data, meta } =
			await rescueRequestService.getAllRescueRequestsFromDB(query);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue requests retrieved successfully",
			data,
			meta,
		});
	},
);

const getMyRescueRequests = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const query = res.locals.validatedQuery as IRescueRequestQuery;

	const { data, meta } = await rescueRequestService.getMyRescueRequestsFromDB(
		user.id,
		query,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Your rescue requests retrieved successfully",
		data,
		meta,
	});
});

const getRescueRequestById = catchAsync(
	async (_req: Request, res: Response) => {
		const { id } = res.locals.validatedParams as { id: string };

		const rescueRequest =
			await rescueRequestService.getRescueRequestByIdFromDB(id);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue request retrieved successfully",
			data: rescueRequest,
		});
	},
);

const updateRescueRequest = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const { id } = res.locals.validatedParams as { id: string };

	const rescueRequest = await rescueRequestService.updateRescueRequestIntoDB(
		id,
		user,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Rescue request updated successfully",
		data: rescueRequest,
	});
});

const updateRescueRequestStatus = catchAsync(
	async (req: Request, res: Response) => {
		const user = getUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const rescueRequest =
			await rescueRequestService.updateRescueRequestStatusIntoDB(
				id,
				user,
				req.body,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue request status updated successfully",
			data: rescueRequest,
		});
	},
);

const cancelMyRescueRequest = catchAsync(
	async (req: Request, res: Response) => {
		const user = getUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const rescueRequest =
			await rescueRequestService.cancelMyRescueRequestIntoDB(id, user.id);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Rescue request cancelled successfully",
			data: rescueRequest,
		});
	},
);

const deleteRescueRequest = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const { id } = res.locals.validatedParams as { id: string };

	await rescueRequestService.deleteRescueRequestFromDB(id, user);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Rescue request moved to trash successfully",
		data: null,
	});
});

export const rescueRequestController = {
	createRescueRequest,
	getAllRescueRequests,
	getMyRescueRequests,
	getRescueRequestById,
	updateRescueRequest,
	updateRescueRequestStatus,
	cancelMyRescueRequest,
	deleteRescueRequest,
};
