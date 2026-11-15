import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IApplicationQuery,
	ICampaignQuery,
	IMyDonationsQuery,
} from "./donation.interface";
import { donationService } from "./donation.service";

const getId = (res: Response) =>
	(res.locals.validatedParams as { id: string }).id;

const createCampaign = catchAsync(async (req: Request, res: Response) => {
	const campaign = await donationService.createCampaignIntoDB(
		req.user!.id,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Donation campaign created successfully",
		data: campaign,
	});
});

const updateCampaign = catchAsync(async (req: Request, res: Response) => {
	const campaign = await donationService.updateCampaignIntoDB(
		getId(res),
		req.user!,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Donation campaign updated successfully",
		data: campaign,
	});
});

const deleteCampaign = catchAsync(async (req: Request, res: Response) => {
	const result = await donationService.deleteCampaignFromDB(
		getId(res),
		req.user!,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Donation campaign deleted successfully",
		data: result,
	});
});

const getAllCampaigns = catchAsync(async (_req: Request, res: Response) => {
	const { data, meta } = await donationService.getAllCampaignsFromDB(
		res.locals.validatedQuery as ICampaignQuery,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Donation campaigns retrieved successfully",
		data,
		meta,
	});
});

const getCampaignById = catchAsync(async (_req: Request, res: Response) => {
	const campaign = await donationService.getCampaignByIdFromDB(getId(res));

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Donation campaign retrieved successfully",
		data: campaign,
	});
});

const getCampaignApplications = catchAsync(
	async (req: Request, res: Response) => {
		const { data, meta } = await donationService.getCampaignApplicationsFromDB(
			getId(res),
			req.user!,
			res.locals.validatedQuery as IApplicationQuery,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Campaign aid applications retrieved successfully",
			data,
			meta,
		});
	},
);

const getCampaignTransactions = catchAsync(
	async (req: Request, res: Response) => {
		const transactions = await donationService.getCampaignTransactionsFromDB(
			getId(res),
			req.user!,
		);

		sendResponse(res, {
			success: true,
			statusCode: httpStatus.OK,
			message: "Campaign transactions retrieved successfully",
			data: transactions,
		});
	},
);

const donateToCampaign = catchAsync(async (req: Request, res: Response) => {
	const result = await donationService.initiateDonationIntoDB(
		getId(res),
		req.body,
		req.user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Donation checkout session created successfully",
		data: result,
	});
});

const applyForAid = catchAsync(async (req: Request, res: Response) => {
	const application = await donationService.applyForAidIntoDB(
		getId(res),
		req.user!.id,
		req.body,
		req.file,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Aid application submitted successfully",
		data: application,
	});
});

const getMyApplications = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await donationService.getMyApplicationsFromDB(
		req.user!.id,
		res.locals.validatedQuery as IApplicationQuery,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Your aid applications retrieved successfully",
		data,
		meta,
	});
});

const getMyDonations = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await donationService.getMyDonationsFromDB(
		req.user!.id,
		res.locals.validatedQuery as IMyDonationsQuery,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Your donations retrieved successfully",
		data,
		meta,
	});
});

const getAllApplications = catchAsync(async (req: Request, res: Response) => {
	const { data, meta } = await donationService.getAllApplicationsFromDB(
		req.user!,
		res.locals.validatedQuery as IApplicationQuery,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Aid applications retrieved successfully",
		data,
		meta,
	});
});

const reviewApplication = catchAsync(async (req: Request, res: Response) => {
	const application = await donationService.reviewApplicationIntoDB(
		getId(res),
		req.user!,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Aid application reviewed successfully",
		data: application,
	});
});

export const donationController = {
	createCampaign,
	updateCampaign,
	deleteCampaign,
	getAllCampaigns,
	getCampaignById,
	getCampaignApplications,
	getCampaignTransactions,
	donateToCampaign,
	applyForAid,
	getMyApplications,
	getMyDonations,
	getAllApplications,
	reviewApplication,
};
