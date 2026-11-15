import { z } from "zod";

const capacityMessage = "Current people count cannot exceed shelter capacity";

const createShelterSchema = z
	.object({
		shelterName: z
			.string("Shelter name is required")
			.trim()
			.min(2, "Shelter name must contain at least 2 characters")
			.max(150),
		shelterLocation: z
			.string("Shelter location is required")
			.trim()
			.min(2, "Shelter location must contain at least 2 characters")
			.max(255),
		shelterCapacity: z
			.number("Shelter capacity is required")
			.int("Shelter capacity must be a whole number")
			.min(1, "Shelter capacity must be at least 1"),
		currentPeopleCount: z
			.number()
			.int("Current people count must be a whole number")
			.min(0, "Current people count cannot be negative")
			.optional(),
		disasterId: z.uuid("A valid disaster ID is required"),
		reliefOrgId: z
			.uuid("A valid relief organization ID is required")
			.optional(),
	})
	.refine(
		(data) =>
			data.currentPeopleCount === undefined ||
			data.currentPeopleCount <= data.shelterCapacity,
		{ message: capacityMessage, path: ["currentPeopleCount"] },
	);

const updateShelterSchema = z
	.object({
		shelterName: z.string().trim().min(2).max(150).optional(),
		shelterLocation: z.string().trim().min(2).max(255).optional(),
		shelterCapacity: z
			.number()
			.int("Shelter capacity must be a whole number")
			.min(1, "Shelter capacity must be at least 1")
			.optional(),
		currentPeopleCount: z
			.number()
			.int("Current people count must be a whole number")
			.min(0, "Current people count cannot be negative")
			.optional(),
		disasterId: z.uuid("A valid disaster ID is required").optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required to update",
	})
	.refine(
		(data) =>
			data.currentPeopleCount === undefined ||
			data.shelterCapacity === undefined ||
			data.currentPeopleCount <= data.shelterCapacity,
		{ message: capacityMessage, path: ["currentPeopleCount"] },
	);

const shelterParamsSchema = z.object({
	id: z.uuid("A valid shelter ID is required"),
});

const getSheltersQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z
		.enum(["createdAt", "shelterName", "shelterCapacity", "currentPeopleCount"])
		.optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	disasterId: z.uuid("A valid disaster ID is required").optional(),
	reliefOrgId: z.uuid("A valid relief organization ID is required").optional(),
});

export const shelterValidation = {
	createShelterSchema,
	updateShelterSchema,
	shelterParamsSchema,
	getSheltersQuerySchema,
};
