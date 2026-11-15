import { z } from "zod";
import { RescueStatus, UrgencyLevel } from "../../../generated/prisma/enums";

// Fields arrive as strings in multipart forms, so numbers are coerced.
const createRescueRequestSchema = z.object({
	latitude: z.coerce
		.number("Latitude must be a number")
		.min(-90, "Latitude must be between -90 and 90")
		.max(90, "Latitude must be between -90 and 90"),
	longitude: z.coerce
		.number("Longitude must be a number")
		.min(-180, "Longitude must be between -180 and 180")
		.max(180, "Longitude must be between -180 and 180"),
	description: z
		.string()
		.trim()
		.min(5, "Description must contain at least 5 characters")
		.max(2000),
	contactPhone: z
		.string()
		.trim()
		.min(6, "Invalid contact phone")
		.max(20, "Invalid contact phone"),
	address: z.string().trim().max(255).optional(),
	peopleCount: z.coerce
		.number("People count must be a number")
		.int("People count must be a whole number")
		.min(1, "People count must be at least 1")
		.optional(),
	urgencyLevel: z
		.enum(
			UrgencyLevel,
			"Urgency level must be one of LOW, MEDIUM, HIGH or CRITICAL",
		)
		.optional(),
	medicalNotes: z.string().trim().max(2000).optional(),
	photoUrl: z.url("Invalid photo URL").trim().optional(),
});

const updateRescueRequestSchema = createRescueRequestSchema.partial();

const updateRescueRequestStatusSchema = z.object({
	status: z.enum(
		RescueStatus,
		"Status must be one of PENDING, ACKNOWLEDGED, DISPATCHED, IN_PROGRESS, RESCUED or CANCELLED",
	),
	assignedRescuerId: z.uuid("A valid rescuer ID is required").optional(),
});

const rescueRequestParamsSchema = z.object({
	id: z.uuid("A valid rescue request ID is required"),
});

const getRescueRequestsQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z
		.enum(["createdAt", "urgencyLevel", "peopleCount", "status"])
		.optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	status: z.enum(RescueStatus).optional(),
	urgencyLevel: z.enum(UrgencyLevel).optional(),
	assignedRescuerId: z.uuid().optional(),
});

export const rescueRequestValidation = {
	createRescueRequestSchema,
	updateRescueRequestSchema,
	updateRescueRequestStatusSchema,
	rescueRequestParamsSchema,
	getRescueRequestsQuerySchema,
};
