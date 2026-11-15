import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { ITrashQuery } from "./trash.interface";
import { trashService } from "./trash.service";

const getActor = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return { id: req.user.id, role: req.user.role };
};

const getAllTrashItems = catchAsync(async (req: Request, res: Response) => {
	const actor = getActor(req);
	const query = res.locals.validatedQuery as ITrashQuery;

	const { data, meta } = await trashService.getAllTrashItemsFromDB(
		actor,
		query,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Trash items retrieved successfully",
		data,
		meta,
	});
});

const restoreTrashItem = catchAsync(async (req: Request, res: Response) => {
	const actor = getActor(req);
	const { id } = res.locals.validatedParams as { id: string };

	const result = await trashService.restoreTrashItemIntoDB(id, actor);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Item restored successfully",
		data: result,
	});
});

const deleteTrashItemPermanently = catchAsync(
	async (req: Request, res: Response) => {
		const actor = getActor(req);
		const { id } = res.locals.validatedParams as { id: string };

		const result = await trashService.deleteTrashItemPermanentlyFromDB(
			id,
			actor,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Item permanently deleted",
			data: result,
		});
	},
);

export const trashController = {
	getAllTrashItems,
	restoreTrashItem,
	deleteTrashItemPermanently,
};
