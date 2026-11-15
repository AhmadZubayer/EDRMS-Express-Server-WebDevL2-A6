import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { reliefOrgService } from "./reliefOrg.service";

const signUpAsReliefOrg = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	const files = (req.files as Express.Multer.File[] | undefined) ?? [];

	const reliefOrg = await reliefOrgService.signUpAsReliefOrgIntoDB(
		req.user,
		req.body,
		files,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Relief organization sign up request submitted successfully",
		data: reliefOrg,
	});
});

const verifyReliefOrg = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const reliefOrg = await reliefOrgService.verifyReliefOrgIntoDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message:
			"Relief organization verified successfully and account role updated",
		data: reliefOrg,
	});
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	const reliefOrg = await reliefOrgService.getMyReliefOrgProfileFromDB(
		req.user.id,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Relief organization profile retrieved successfully",
		data: reliefOrg,
	});
});

const getAllReliefOrgs = catchAsync(async (req: Request, res: Response) => {
	const query = res.locals.validatedQuery;

	const { data, meta } = await reliefOrgService.getAllReliefOrgsFromDB(query);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Relief organizations retrieved successfully",
		data,
		meta,
	});
});

const getReliefOrgById = catchAsync(async (req: Request, res: Response) => {
	const { id } = res.locals.validatedParams as { id: string };

	const reliefOrg = await reliefOrgService.getReliefOrgByIdFromDB(id);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Relief organization details retrieved successfully",
		data: reliefOrg,
	});
});

const getReliefOrgDocuments = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = res.locals.validatedParams as { id: string };

		const reliefOrg = await reliefOrgService.getReliefOrgDocumentsFromDB(id);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Verification documents retrieved successfully",
			data: reliefOrg,
		});
	},
);

export const reliefOrgController = {
	signUpAsReliefOrg,
	verifyReliefOrg,
	getMyProfile,
	getAllReliefOrgs,
	getReliefOrgById,
	getReliefOrgDocuments,
};
