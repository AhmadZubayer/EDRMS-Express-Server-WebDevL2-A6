import { z } from "zod";
import {
	GroupJoinStatus,
	GroupTargetType,
	OrganizationRequestStatus,
	VolunteerSkill,
} from "../../../generated/prisma/enums";

const paginationFields = {
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	searchTerm: z.string().trim().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
};

const idParamsSchema = z.object({
	id: z.uuid("A valid ID is required"),
});

const skillsSchema = z
	.array(z.enum(VolunteerSkill, "Invalid volunteer skill"))
	.transform((skills) => [...new Set(skills)]);

const organizationRequestShape = {
	title: z
		.string("Title is required")
		.trim()
		.min(3, "Title must contain at least 3 characters")
		.max(150),
	description: z
		.string("Description is required")
		.trim()
		.min(10, "Description must contain at least 10 characters")
		.max(2000),
	requiredSkills: skillsSchema,
	location: z
		.string("Location is required")
		.trim()
		.min(2, "Location must contain at least 2 characters")
		.max(255),
	neededVolunteers: z
		.number("Needed volunteers must be a number")
		.int()
		.min(1, "At least 1 volunteer is required")
		.max(10000),
	disasterName: z.string().trim().min(1).max(150).optional(),
	status: z.enum(OrganizationRequestStatus).optional(),
};

const createOrganizationRequestSchema = z.object({
	...organizationRequestShape,
	requiredSkills: skillsSchema.default([]),
});

const updateOrganizationRequestSchema = z
	.object(organizationRequestShape)
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "Provide at least one field to update",
	});

const reviewApplicationSchema = z.object({
	status: z.enum(
		["APPROVED", "REJECTED"],
		"Status must be either APPROVED or REJECTED",
	),
});

const joinGroupSchema = z.object({
	whyJoin: z
		.string("Reason for joining is required")
		.trim()
		.min(5, "Reason for joining must contain at least 5 characters")
		.max(1000),
});

const applicationsQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["joinedAt", "updatedAt"]).optional(),
	status: z.enum(GroupJoinStatus).optional(),
	organizationRequestId: z
		.uuid("A valid organization request ID is required")
		.optional(),
});

const myCreatedRequestsQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "title", "neededVolunteers"]).optional(),
	status: z.enum(OrganizationRequestStatus).optional(),
});

const openRequestsQuerySchema = z.object({
	...paginationFields,
	sortBy: z
		.enum(["createdAt", "title", "neededVolunteers", "skillMatch"])
		.optional(),
});

const myJoinsQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["joinedAt", "updatedAt"]).optional(),
	status: z.enum(GroupJoinStatus).optional(),
});

const myGroupJoinsQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "updatedAt"]).optional(),
	status: z.enum(GroupJoinStatus).optional(),
	targetType: z.enum(GroupTargetType).optional(),
});

export const volunteerNetworkValidation = {
	idParamsSchema,
	createOrganizationRequestSchema,
	updateOrganizationRequestSchema,
	reviewApplicationSchema,
	joinGroupSchema,
	applicationsQuerySchema,
	myCreatedRequestsQuerySchema,
	openRequestsQuerySchema,
	myJoinsQuerySchema,
	myGroupJoinsQuerySchema,
};
