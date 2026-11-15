import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { disasterService } from "./disaster.service";

const createDisaster = catchAsync(async (req: Request, res: Response) => {
	const disaster = await disasterService.createDisasterIntoDB(req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Disaster alert created successfully",
		data: disaster,
	});
});

const getAllDisasters = catchAsync(async (req: Request, res: Response) => {
	const query = res.locals.validatedQuery;

	const { data, meta } = await disasterService.getAllDisastersFromDB(query);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Disaster alerts retrieved successfully",
		data,
		meta,
	});
});

const getDisasterById = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const disaster = await disasterService.getDisasterByIdFromDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Disaster details retrieved successfully",
		data: disaster,
	});
});

const updateDisaster = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const disaster = await disasterService.updateDisasterIntoDB(id, req.body);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Disaster alert updated successfully",
		data: disaster,
	});
});

const markDisasterAsSafe = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const disaster = await disasterService.markDisasterAsSafeIntoDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Disaster alert marked as safe successfully",
		data: disaster,
	});
});

const deleteDisaster = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	await disasterService.deleteDisasterFromDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Disaster alert deleted successfully",
		data: null,
	});
});

export const disasterController = {
	createDisaster,
	getAllDisasters,
	getDisasterById,
	updateDisaster,
	markDisasterAsSafe,
	deleteDisaster,
};
