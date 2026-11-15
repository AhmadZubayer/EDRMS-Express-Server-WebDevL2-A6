import { z } from "zod";
import {
	FieldReportType,
	ReportSeverity,
	VolunteerSkill,
	VolunteerTaskStatus,
} from "../../../generated/prisma/enums";

// multipart fields arrive as strings, so booleans and arrays need a pre-step
const booleanLike = z.preprocess((value) => {
	if (value === "true") return true;
	if (value === "false") return false;
	return value;
}, z.boolean("Value must be true or false"));

const skillsLike = z.preprocess(
	(value) => {
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed.startsWith("[")) {
				try {
					return JSON.parse(trimmed);
				} catch {
					return value;
				}
			}
			return trimmed
				.split(",")
				.map((skill) => skill.trim())
				.filter(Boolean);
		}
		return value;
	},
	z
		.array(z.enum(VolunteerSkill, "Invalid volunteer skill"))
		.transform((skills) => [...new Set(skills)]),
);

const latitudeSchema = z.coerce
	.number("Latitude must be a number")
	.min(-90, "Latitude must be between -90 and 90")
	.max(90, "Latitude must be between -90 and 90");

const longitudeSchema = z.coerce
	.number("Longitude must be a number")
	.min(-180, "Longitude must be between -180 and 180")
	.max(180, "Longitude must be between -180 and 180");

const paginationFields = {
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	searchTerm: z.string().trim().optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
};

const idParamsSchema = z.object({
	id: z.uuid("A valid ID is required"),
});

const requestIdParamsSchema = z.object({
	requestId: z.uuid("A valid rescue request ID is required"),
});

const taskIdParamsSchema = z.object({
	taskId: z.uuid("A valid task ID is required"),
});

const registerVolunteerSchema = z.object({
	skills: skillsLike.default([]),
	whyJoin: z
		.string("Reason for joining is required")
		.trim()
		.min(10, "Reason for joining must contain at least 10 characters")
		.max(1000),
	available: booleanLike.optional(),
});

const updateVolunteerProfileSchema = z
	.object({
		skills: skillsLike
			.refine(
				(skills) => skills.length >= 1,
				"At least one rescue skill is required",
			)
			.optional(),
		available: booleanLike.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "Provide at least one field to update",
	});

const reviewVerificationSchema = z.object({
	status: z.enum(
		["VERIFIED", "REJECTED"],
		"Status must be either VERIFIED or REJECTED",
	),
});

const updateLocationSchema = z.object({
	latitude: latitudeSchema,
	longitude: longitudeSchema,
	onDuty: booleanLike.optional(),
});

const nearbyRequestsQuerySchema = z.object({
	radius: z.coerce
		.number("Radius must be a number")
		.min(1, "Search radius must be between 1 and 200 kilometers")
		.max(200, "Search radius must be between 1 and 200 kilometers")
		.optional(),
	page: paginationFields.page,
	limit: paginationFields.limit,
});

const updateTaskProgressSchema = z.object({
	status: z.enum(
		["ACCEPTED", "IN_PROGRESS", "COMPLETED"],
		"Status must be ACCEPTED, IN_PROGRESS or COMPLETED",
	),
	progressNote: z.string().trim().max(1000).optional(),
});

const myTasksQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "updatedAt", "completedAt"]).optional(),
	status: z.enum(VolunteerTaskStatus).optional(),
});

const createRouteReportSchema = z.object({
	reportType: z.enum(
		["BLOCKED_ROUTE", "DANGEROUS_ROUTE"],
		"Report type must be BLOCKED_ROUTE or DANGEROUS_ROUTE",
	),
	description: z
		.string("Description is required")
		.trim()
		.min(5, "Description must contain at least 5 characters")
		.max(2000),
	latitude: latitudeSchema,
	longitude: longitudeSchema,
	address: z.string().trim().max(255).optional(),
	severity: z.enum(ReportSeverity).optional(),
});

const createResourceShortageSchema = z.object({
	resourceName: z
		.string("Resource name is required")
		.trim()
		.min(2, "Resource name must contain at least 2 characters")
		.max(150),
	quantityNeeded: z
		.number("Quantity must be a number")
		.int()
		.min(1, "Quantity needed must be at least 1"),
	description: z
		.string("Description is required")
		.trim()
		.min(5, "Description must contain at least 5 characters")
		.max(2000),
	latitude: latitudeSchema,
	longitude: longitudeSchema,
	address: z.string().trim().max(255).optional(),
	severity: z.enum(ReportSeverity).optional(),
});

const fieldReportsQuerySchema = z.object({
	...paginationFields,
	sortBy: z.enum(["createdAt", "severity"]).optional(),
	reportType: z.enum(FieldReportType).optional(),
	severity: z.enum(ReportSeverity).optional(),
});

export const volunteerValidation = {
	idParamsSchema,
	requestIdParamsSchema,
	taskIdParamsSchema,
	registerVolunteerSchema,
	updateVolunteerProfileSchema,
	reviewVerificationSchema,
	updateLocationSchema,
	nearbyRequestsQuerySchema,
	updateTaskProgressSchema,
	myTasksQuerySchema,
	createRouteReportSchema,
	createResourceShortageSchema,
	fieldReportsQuerySchema,
};
