import { z } from "zod";

// multipart forms send empty fields as "", which should count as "not provided"
const emptyToUndefined = (value: unknown) =>
	typeof value === "string" && value.trim() === "" ? undefined : value;

const signUpReliefOrgSchema = z.object({
	organizationName: z
		.string("Organization name is required")
		.trim()
		.min(3, "Organization name must contain at least 3 characters")
		.max(150),
	registrationNumber: z
		.string("Registration number is required")
		.trim()
		.min(3, "Registration number must contain at least 3 characters")
		.max(100),
	address: z
		.string("Address is required")
		.trim()
		.min(5, "Address must contain at least 5 characters")
		.max(255),
	contactEmail: z.preprocess(
		emptyToUndefined,
		z.email("Invalid contact email").trim().toLowerCase().optional(),
	),
	contactPhone: z.preprocess(
		emptyToUndefined,
		z
			.string()
			.trim()
			.regex(/^\+?[0-9]{7,15}$/, "Invalid contact phone number")
			.optional(),
	),
	website: z.preprocess(
		emptyToUndefined,
		z.url("Invalid website URL").trim().optional(),
	),
	description: z.preprocess(
		emptyToUndefined,
		z.string().trim().max(2000).optional(),
	),
	organizationType: z.preprocess(
		emptyToUndefined,
		z.string().trim().max(100).optional(),
	),
});

const reliefOrgParamsSchema = z.object({
	id: z.uuid("A valid relief organization ID is required"),
});

const getReliefOrgsQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z.enum(["createdAt", "organizationName"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	adminVerified: z.enum(["true", "false"]).optional(),
	organizationType: z.string().trim().optional(),
});

export const reliefOrgValidation = {
	signUpReliefOrgSchema,
	reliefOrgParamsSchema,
	getReliefOrgsQuerySchema,
};
