import type {
	ApplicationStatus,
	CampaignStatus,
	DonationStatus,
	PaymentProvider,
} from "../../../generated/prisma/enums";

interface IPagination {
	page?: number;
	limit?: number;
	sortOrder?: "asc" | "desc";
}

export interface ICreateCampaign {
	title: string;
	description: string;
	targetAmount: number;
	startDate: Date;
	endDate: Date;
	status?: CampaignStatus;
}

export type IUpdateCampaign = Partial<ICreateCampaign>;

export interface ICampaignQuery extends IPagination {
	searchTerm?: string;
	status?: CampaignStatus;
	sortBy?:
		| "createdAt"
		| "title"
		| "targetAmount"
		| "raisedAmount"
		| "startDate"
		| "endDate";
}

export interface IDonate {
	amount: number;
	provider?: PaymentProvider;
	isAnonymous?: boolean;
	donorName?: string;
	donorEmail?: string;
}

export interface IApplyForAid {
	reason: string;
	payoutDetails: string;
}

export interface IReviewApplication {
	status: "APPROVED" | "REJECTED";
	approvedAmount?: number;
}

export interface IApplicationQuery extends IPagination {
	searchTerm?: string;
	status?: ApplicationStatus;
	campaignId?: string;
	sortBy?: "createdAt" | "approvedAmount" | "reviewedAt";
}

export interface IMyDonationsQuery extends IPagination {
	searchTerm?: string;
	status?: DonationStatus;
	sortBy?: "createdAt" | "amount";
}
