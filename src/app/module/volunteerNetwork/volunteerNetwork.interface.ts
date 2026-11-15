import type {
	GroupJoinStatus,
	GroupTargetType,
	OrganizationRequestStatus,
	VolunteerSkill,
} from "../../../generated/prisma/enums";

export interface IPaginationQuery {
	page?: number;
	limit?: number;
	searchTerm?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
}

export interface ICreateOrganizationRequest {
	title: string;
	description: string;
	requiredSkills: VolunteerSkill[];
	location: string;
	neededVolunteers: number;
	disasterName?: string;
	status?: OrganizationRequestStatus;
}

export type IUpdateOrganizationRequest = Partial<ICreateOrganizationRequest>;

export interface IReviewApplication {
	status: Extract<GroupJoinStatus, "APPROVED" | "REJECTED">;
}

export interface IJoinGroup {
	whyJoin: string;
}

export interface IApplicationsQuery extends IPaginationQuery {
	status?: GroupJoinStatus;
	organizationRequestId?: string;
}

export interface IOrganizationRequestQuery extends IPaginationQuery {
	status?: OrganizationRequestStatus;
}

export interface IMyJoinsQuery extends IPaginationQuery {
	status?: GroupJoinStatus;
}

export interface IGroupJoinsQuery extends IPaginationQuery {
	status?: GroupJoinStatus;
	targetType?: GroupTargetType;
}
