import type {
	DisasterType,
	PostStatus,
	RescueStatus,
	UrgencyLevel,
	UserRole,
	UserStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";

export interface IAdminActor {
	id: string;
	role: UserRole;
}

export interface IPaginationQuery {
	page?: number;
	limit?: number;
	searchTerm?: string;
	sortOrder?: "asc" | "desc";
}

export interface IAccountQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "name" | "email" | "role";
	role?: UserRole;
	status?: UserStatus;
	includeDeleted?: "true" | "false";
}

export interface IAdminListQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "name" | "email";
	role?: "ADMIN" | "SUPER_ADMIN";
	status?: UserStatus;
}

export interface IVolunteerQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "verificationStatus";
	status?: VolunteerVerificationStatus;
}

export interface IReliefOrgQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "organizationName";
	verified?: "true" | "false";
}

export interface IDisasterQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "impactTime" | "disasterName";
	verified?: "true" | "false";
	type?: DisasterType;
}

export interface IRescueRequestQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "urgencyLevel" | "status";
	status?: RescueStatus;
	urgencyLevel?: UrgencyLevel;
}

export interface ICommunityPostQuery extends IPaginationQuery {
	sortBy?: "createdAt" | "title" | "status";
	status?: PostStatus;
	includeDeleted?: "true" | "false";
}

export interface ITableQuery {
	page?: number;
	limit?: number;
}

export interface ICreateAccount {
	name: string;
	email: string;
	password?: string;
	phone?: string;
	role?: UserRole;
}

export interface ICreateAdmin {
	name: string;
	email: string;
	phone?: string;
}

export interface IUpdateAccountRole {
	role: UserRole;
}

export interface IUpdateAdminStatus {
	status: "ACTIVE" | "BLOCKED";
}

export interface IVerifyVolunteer {
	status: "VERIFIED" | "REJECTED" | "PENDING";
}

export interface IVerifyReliefOrg {
	verified: boolean;
}

export interface IVerifyDisaster {
	verified: boolean;
}

export interface ICreateDisaster {
	disasterName: string;
	type: DisasterType;
	impactedLocation: string;
	impactTime?: Date;
	isVerified?: boolean;
}

export interface ICreateRescueRequest {
	userId?: string;
	contactPhone: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	peopleCount?: number;
	urgencyLevel?: UrgencyLevel;
	description: string;
	medicalNotes?: string;
}

export interface IModeratePost {
	status: PostStatus;
}
