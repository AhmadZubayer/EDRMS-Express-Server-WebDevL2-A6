import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { shelterService } from "./shelter.service";

const createShelter = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	const shelter = await shelterService.createShelterIntoDB(req.user, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Shelter created successfully",
		data: shelter,
	});
});

const getAllShelters = catchAsync(async (req: Request, res: Response) => {
	const query = res.locals.validatedQuery;

	const { data, meta } = await shelterService.getAllSheltersFromDB(query);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Shelters retrieved successfully",
		data,
		meta,
	});
});

const getShelterById = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const shelter = await shelterService.getShelterByIdFromDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Shelter details retrieved successfully",
		data: shelter,
	});
});

const updateShelter = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	const { id } = res.locals.validatedParams as { id: string };

	const shelter = await shelterService.updateShelterIntoDB(
		id,
		req.user,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Shelter updated successfully",
		data: shelter,
	});
});

const deleteShelter = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	const { id } = res.locals.validatedParams as { id: string };

	await shelterService.deleteShelterFromDB(id, req.user);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Shelter deleted successfully",
		data: null,
	});
});

export const shelterController = {
	createShelter,
	getAllShelters,
	getShelterById,
	updateShelter,
	deleteShelter,
};
