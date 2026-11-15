import { z } from "zod";
import { MissingPersonStatus } from "../../../generated/prisma/enums";

// Fields arrive as strings in multipart forms, so numbers and dates are coerced.
const createMissingPersonSchema = z.object({
	fullName: z
		.string()
		.trim()
		.min(2, "Full name must contain at least 2 characters")
		.max(120),
	age: z.coerce
		.number("Age must be a number")
		.int("Age must be a whole number")
		.min(0, "Age cannot be negative")
		.max(130, "Age is not valid"),
	gender: z.string().trim().min(1, "Gender is required").max(30),
	lastSeenLocation: z
		.string()
		.trim()
		.min(2, "Last seen location is required")
		.max(255),
	lastSeenDate: z.coerce.date("Invalid last seen date"),
	description: z
		.string()
		.trim()
		.min(5, "Description must contain at least 5 characters")
		.max(2000),
	contactPhone: z
		.string()
		.trim()
		.min(6, "Invalid contact phone")
		.max(20, "Invalid contact phone")
		.optional(),
	photoUrl: z.url("Invalid photo URL").trim().optional(),
});

const updateMissingPersonSchema = createMissingPersonSchema.partial();

const updateMissingPersonStatusSchema = z.object({
	status: z.enum(
		MissingPersonStatus,
		"Status must be one of MISSING, FOUND, RESOLVED or CLOSED",
	),
});

const missingPersonParamsSchema = z.object({
	id: z.uuid("A valid missing person report ID is required"),
});

const getMissingPersonsQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z.enum(["createdAt", "lastSeenDate", "fullName", "age"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	status: z.enum(MissingPersonStatus).optional(),
	gender: z.string().trim().optional(),
});

export const missingPersonValidation = {
	createMissingPersonSchema,
	updateMissingPersonSchema,
	updateMissingPersonStatusSchema,
	missingPersonParamsSchema,
	getMissingPersonsQuerySchema,
};
