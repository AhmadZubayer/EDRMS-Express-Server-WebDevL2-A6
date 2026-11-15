import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IMissingPersonQuery } from "./missingPerson.interface";
import { missingPersonService } from "./missingPerson.service";

const getUser = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user;
};

const createMissingPerson = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);

	const missingPerson = await missingPersonService.createMissingPersonIntoDB(
		user.id,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Missing person report created successfully",
		data: missingPerson,
	});
});

const getAllMissingPersons = catchAsync(
	async (_req: Request, res: Response) => {
		const query = res.locals.validatedQuery as IMissingPersonQuery;

		const { data, meta } =
			await missingPersonService.getAllMissingPersonsFromDB(query);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Missing person reports retrieved successfully",
			data,
			meta,
		});
	},
);

const getMyMissingPersons = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const query = res.locals.validatedQuery as IMissingPersonQuery;

	const { data, meta } = await missingPersonService.getMyMissingPersonsFromDB(
		user.id,
		query,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Your missing person reports retrieved successfully",
		data,
		meta,
	});
});

const getMissingPersonById = catchAsync(
	async (_req: Request, res: Response) => {
		const { id } = res.locals.validatedParams as { id: string };

		const missingPerson =
			await missingPersonService.getMissingPersonByIdFromDB(id);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Missing person report retrieved successfully",
			data: missingPerson,
		});
	},
);

const updateMissingPerson = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const { id } = res.locals.validatedParams as { id: string };

	const missingPerson = await missingPersonService.updateMissingPersonIntoDB(
		id,
		user,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Missing person report updated successfully",
		data: missingPerson,
	});
});

const updateMissingPersonStatus = catchAsync(
	async (req: Request, res: Response) => {
		const user = getUser(req);
		const { id } = res.locals.validatedParams as { id: string };

		const missingPerson =
			await missingPersonService.updateMissingPersonStatusIntoDB(
				id,
				user,
				req.body,
			);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Missing person status updated successfully",
			data: missingPerson,
		});
	},
);

const deleteMissingPerson = catchAsync(async (req: Request, res: Response) => {
	const user = getUser(req);
	const { id } = res.locals.validatedParams as { id: string };

	await missingPersonService.deleteMissingPersonFromDB(id, user);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Missing person report moved to trash successfully",
		data: null,
	});
});

export const missingPersonController = {
	createMissingPerson,
	getAllMissingPersons,
	getMyMissingPersons,
	getMissingPersonById,
	updateMissingPerson,
	updateMissingPersonStatus,
	deleteMissingPerson,
};
