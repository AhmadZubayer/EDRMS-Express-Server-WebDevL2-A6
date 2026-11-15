import { z } from "zod";
import {
	DisasterType,
	PostStatus,
	RescueStatus,
	UrgencyLevel,
	UserRole,
	UserStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";
import { adminTableNames } from "./admin.tables";

const paginationFields = {
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	searchTerm: z.string().trim().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
};

const booleanString = z.enum(["true", "false"]);

const phoneSchema = z
	.string()
	.trim()
	.regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number");

const idParamsSchema = z.object({
	id: z.uuid("A valid ID is required"),
});

const tableParamsSchema = z.object({
	tableName: z.enum(adminTableNames, "Unknown table name"),
});

const tableQuerySchema = z.object({
	page: paginationFields.page,
	limit: paginationFields.limit,
});

const accountQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "name", "email", "role"]).optional(),
	role: z.enum(UserRole).optional(),
	status: z.enum(UserStatus).optional(),
	includeDeleted: booleanString.optional(),
});

const adminListQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "name", "email"]).optional(),
	role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
	status: z.enum(UserStatus).optional(),
});

const volunteerQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "verificationStatus"]).optional(),
	status: z.enum(VolunteerVerificationStatus).optional(),
});

const reliefOrgQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "organizationName"]).optional(),
	verified: booleanString.optional(),
});

const disasterQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "impactTime", "disasterName"]).optional(),
	verified: booleanString.optional(),
	type: z.enum(DisasterType).optional(),
});

const rescueRequestQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "urgencyLevel", "status"]).optional(),
	status: z.enum(RescueStatus).optional(),
	urgencyLevel: z.enum(UrgencyLevel).optional(),
});

const communityPostQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "title", "status"]).optional(),
	status: z.enum(PostStatus).optional(),
	includeDeleted: booleanString.optional(),
});

const createAccountSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Name must contain at least 3 characters")
		.max(100),
	email: z.email("Invalid email address").trim().toLowerCase(),
	password: z
		.string()
		.min(8, "Password Must Minimum 8 Characters Long.")
		.regex(/[a-z]/, "Password must contain atleast 1 Lowercase Letter")
		.regex(/[A-Z]/, "Password must contain atleast 1 Uppercase Letter")
		.regex(/[0-9]/, "Password must contain atleast 1 Number")
		.regex(/[^A-Za-z0-9]/, "Password must contain atleast 1 Special Character")
		.optional(),
	phone: phoneSchema.optional(),
	role: z.enum(UserRole).optional(),
});

const createAdminSchema = z.object({
	name: z
		.string()
		.trim()
		.min(3, "Name must contain at least 3 characters")
		.max(100),
	email: z.email("Invalid email address").trim().toLowerCase(),
	phone: phoneSchema.optional(),
});

const updateAccountRoleSchema = z.object({
	role: z.enum(UserRole, "Unsupported role"),
});

const updateAdminStatusSchema = z.object({
	status: z.enum(
		["ACTIVE", "BLOCKED"],
		"Status must be either ACTIVE or BLOCKED",
	),
});

const verifyVolunteerSchema = z.object({
	status: z.enum(
		["VERIFIED", "REJECTED", "PENDING"],
		"Status must be VERIFIED, REJECTED or PENDING",
	),
});

const verifyReliefOrgSchema = z.object({
	verified: z.boolean("verified must be true or false"),
});

const verifyDisasterSchema = z.object({
	verified: z.boolean("verified must be true or false"),
});

const createDisasterSchema = z.object({
	disasterName: z
		.string()
		.trim()
		.min(3, "Disaster name must contain at least 3 characters")
		.max(150),
	type: z.enum(DisasterType, "Unsupported disaster type"),
	impactedLocation: z
		.string()
		.trim()
		.min(2, "Impacted location is required")
		.max(255),
	impactTime: z.coerce.date("Invalid impact time").optional(),
	isVerified: z.boolean().optional(),
});

const createRescueRequestSchema = z.object({
	userId: z.uuid("A valid user ID is required").optional(),
	contactPhone: phoneSchema,
	address: z.string().trim().min(3).max(255).optional(),
	latitude: z.number().min(-90).max(90).optional(),
	longitude: z.number().min(-180).max(180).optional(),
	peopleCount: z.number().int().min(1).max(10000).optional(),
	urgencyLevel: z.enum(UrgencyLevel).optional(),
	description: z
		.string()
		.trim()
		.min(5, "Description must contain at least 5 characters")
		.max(2000),
	medicalNotes: z.string().trim().max(2000).optional(),
});

const moderatePostSchema = z.object({
	status: z.enum(PostStatus, "Unsupported post status"),
});

export const adminValidation = {
	idParamsSchema,
	tableParamsSchema,
	tableQuerySchema,
	accountQuerySchema,
	adminListQuerySchema,
	volunteerQuerySchema,
	reliefOrgQuerySchema,
	disasterQuerySchema,
	rescueRequestQuerySchema,
	communityPostQuerySchema,
	createAccountSchema,
	createAdminSchema,
	updateAccountRoleSchema,
	updateAdminStatusSchema,
	verifyVolunteerSchema,
	verifyReliefOrgSchema,
	verifyDisasterSchema,
	createDisasterSchema,
	createRescueRequestSchema,
	moderatePostSchema,
};
