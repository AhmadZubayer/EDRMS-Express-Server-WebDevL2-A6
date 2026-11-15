import { z } from "zod";
import { DisasterType } from "../../../generated/prisma/enums";

const createDisasterSchema = z.object({
	disasterName: z
		.string("Disaster name is required")
		.trim()
		.min(3, "Disaster name must contain at least 3 characters")
		.max(150),
	impactedLocation: z
		.string("Impacted location is required")
		.trim()
		.min(2, "Impacted location must contain at least 2 characters")
		.max(255),
	impactTime: z.coerce.date("Invalid impact time"),
	type: z.enum(DisasterType, "Invalid disaster type"),
});

const updateDisasterSchema = z
	.object({
		disasterName: z.string().trim().min(3).max(150).optional(),
		impactedLocation: z.string().trim().min(2).max(255).optional(),
		impactTime: z.coerce.date("Invalid impact time").optional(),
		type: z.enum(DisasterType, "Invalid disaster type").optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	});

const disasterParamsSchema = z.object({
	id: z.uuid("A valid disaster ID is required"),
});

const getDisastersQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z.enum(["createdAt", "impactTime", "disasterName"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	type: z.enum(DisasterType).optional(),
	isVerified: z.enum(["true", "false"]).optional(),
});

export const disasterValidation = {
	createDisasterSchema,
	updateDisasterSchema,
	disasterParamsSchema,
	getDisastersQuerySchema,
};
