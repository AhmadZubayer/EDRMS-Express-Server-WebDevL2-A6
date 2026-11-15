import type {
	FieldReportType,
	ReportSeverity,
	VolunteerSkill,
	VolunteerTaskStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";

export interface IPaginationQuery {
	page?: number;
	limit?: number;
	searchTerm?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface IRegisterVolunteer {
	skills: VolunteerSkill[];
	whyJoin: string;
	available?: boolean;
}

export interface IUpdateVolunteerProfile {
	skills?: VolunteerSkill[];
	available?: boolean;
}

export interface IReviewVerification {
	status: Extract<VolunteerVerificationStatus, "VERIFIED" | "REJECTED">;
}

export interface IUpdateVolunteerLocation {
	latitude: number;
	longitude: number;
	onDuty?: boolean;
}

export interface INearbyRequestsQuery extends IPaginationQuery {
	radius?: number;
}

export interface IUpdateTaskProgress {
	status: Extract<
		VolunteerTaskStatus,
		"ACCEPTED" | "IN_PROGRESS" | "COMPLETED"
	>;
	progressNote?: string;
}

export interface ITaskQuery extends IPaginationQuery {
	status?: VolunteerTaskStatus;
}

export interface ICreateRouteReport {
	reportType: Extract<FieldReportType, "BLOCKED_ROUTE" | "DANGEROUS_ROUTE">;
	description: string;
	latitude: number;
	longitude: number;
	address?: string;
	severity?: ReportSeverity;
}

export interface ICreateResourceShortage {
	resourceName: string;
	quantityNeeded: number;
	description: string;
	latitude: number;
	longitude: number;
	address?: string;
	severity?: ReportSeverity;
}

export interface IFieldReportQuery extends IPaginationQuery {
	reportType?: FieldReportType;
	severity?: ReportSeverity;
}
