import { z } from "zod";
import {
	ApplicationStatus,
	CampaignStatus,
	DonationStatus,
	PaymentProvider,
} from "../../../generated/prisma/enums";

const paginationShape = {
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
};

const amountSchema = z.coerce
	.number("Amount must be a number")
	.min(1, "Amount must be at least 1")
	.max(10_000_000, "Amount is too large")
	.transform((value) => Math.round(value * 100) / 100);

const idParamsSchema = z.object({
	id: z.uuid("A valid ID is required"),
});

const campaignShape = {
	title: z
		.string()
		.trim()
		.min(3, "Title must contain at least 3 characters")
		.max(150, "Title cannot exceed 150 characters"),
	description: z
		.string()
		.trim()
		.min(10, "Description must contain at least 10 characters"),
	targetAmount: amountSchema,
	startDate: z.coerce.date("A valid start date is required"),
	endDate: z.coerce.date("A valid end date is required"),
	status: z.enum(CampaignStatus).optional(),
};

const createCampaignSchema = z
	.object(campaignShape)
	.refine((value) => value.endDate > value.startDate, {
		message: "End date must be after the start date",
		path: ["endDate"],
	});

const updateCampaignSchema = z.object(campaignShape).partial();

const getCampaignsQuerySchema = z.object({
	...paginationShape,
	searchTerm: z.string().trim().optional(),
	status: z.enum(CampaignStatus).optional(),
	sortBy: z
		.enum([
			"createdAt",
			"title",
			"targetAmount",
			"raisedAmount",
			"startDate",
			"endDate",
		])
		.optional(),
});

const donateSchema = z.object({
	amount: amountSchema,
	provider: z.enum(PaymentProvider).optional(),
	isAnonymous: z.boolean().optional(),
	donorName: z.string().trim().min(2).max(100).optional(),
	donorEmail: z.email("Invalid email address").trim().toLowerCase().optional(),
});

const applyForAidSchema = z.object({
	reason: z
		.string()
		.trim()
		.min(10, "Reason must contain at least 10 characters")
		.max(2000, "Reason cannot exceed 2000 characters"),
	payoutDetails: z
		.string()
		.trim()
		.min(5, "Payout details must contain at least 5 characters")
		.max(500, "Payout details cannot exceed 500 characters"),
});

const reviewApplicationSchema = z
	.object({
		status: z.enum([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]),
		approvedAmount: amountSchema.optional(),
	})
	.refine(
		(value) =>
			value.status !== ApplicationStatus.APPROVED ||
			value.approvedAmount !== undefined,
		{
			message: "Approved amount is required when approving an application",
			path: ["approvedAmount"],
		},
	);

const getApplicationsQuerySchema = z.object({
	...paginationShape,
	searchTerm: z.string().trim().optional(),
	status: z.enum(ApplicationStatus).optional(),
	campaignId: z.uuid().optional(),
	sortBy: z.enum(["createdAt", "approvedAmount", "reviewedAt"]).optional(),
});

const getMyDonationsQuerySchema = z.object({
	...paginationShape,
	searchTerm: z.string().trim().optional(),
	status: z.enum(DonationStatus).optional(),
	sortBy: z.enum(["createdAt", "amount"]).optional(),
});

export const donationValidation = {
	idParamsSchema,
	createCampaignSchema,
	updateCampaignSchema,
	getCampaignsQuerySchema,
	donateSchema,
	applyForAidSchema,
	reviewApplicationSchema,
	getApplicationsQuerySchema,
	getMyDonationsQuerySchema,
};
