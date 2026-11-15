import { z } from "zod";
import { TrashItemType } from "../../../generated/prisma/enums";

const getTrashQuerySchema = z.object({
	searchTerm: z.string().trim().optional(),
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
	sortBy: z.enum(["deletedAt", "expiresAt", "itemTitle"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	itemType: z.enum(TrashItemType).optional(),
	all: z.enum(["true", "false"]).optional(),
});

const trashParamsSchema = z.object({
	id: z.uuid("A valid trash item ID is required"),
});

export const trashValidation = {
	getTrashQuerySchema,
	trashParamsSchema,
};
