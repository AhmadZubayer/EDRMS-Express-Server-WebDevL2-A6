import type { TrashItemType } from "../../../generated/prisma/enums";

export interface ITrashQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: "deletedAt" | "expiresAt" | "itemTitle";
	sortOrder?: "asc" | "desc";
	itemType?: TrashItemType;
	all?: "true" | "false";
}

export interface ITrashActor {
	id: string;
	role: string;
}
