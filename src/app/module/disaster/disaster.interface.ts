import type { DisasterType } from "../../../generated/prisma/enums";

export interface ICreateDisaster {
	disasterName: string;
	impactedLocation: string;
	impactTime: Date;
	type: DisasterType;
}

export interface IUpdateDisaster {
	disasterName?: string;
	impactedLocation?: string;
	impactTime?: Date;
	type?: DisasterType;
}

export interface IDisasterQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "impactTime" | "disasterName";
	sortOrder?: "asc" | "desc";
	type?: DisasterType;
	isVerified?: "true" | "false";
}
