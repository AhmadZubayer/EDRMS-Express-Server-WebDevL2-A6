import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";

const getUserId = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user.id;
};

const getProfile = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.getProfileFromDB(getUserId(req));

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User profile retrieved successfully",
		data: user,
	});
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.updateProfileIntoDB(
		getUserId(req),
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User profile updated successfully",
		data: user,
	});
});

const completeProfile = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.completeProfileIntoDB(
		getUserId(req),
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "User profile completed successfully",
		data: user,
	});
});

const toggleIsSafe = catchAsync(async (req: Request, res: Response) => {
	const user = await userService.toggleIsSafeIntoDB(getUserId(req));

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Safety status updated successfully",
		data: user,
	});
});

export const userController = {
	getProfile,
	updateProfile,
	completeProfile,
	toggleIsSafe,
};
