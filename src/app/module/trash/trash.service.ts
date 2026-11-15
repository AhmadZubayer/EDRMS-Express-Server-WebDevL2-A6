import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { TrashItemType, UserRole } from "../../../generated/prisma/enums";
import type { TrashItemWhereInput } from "../../../generated/prisma/models";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { deleteFromCloudinary } from "../../utils/uploadToCloudinary";
import type { ITrashActor, ITrashQuery } from "./trash.interface";

const TRASH_RETENTION_DAYS = 30;

export interface IAddToTrash {
	userId: string;
	itemType: TrashItemType;
	itemId: string;
	itemTitle: string;
	payload?: Prisma.InputJsonValue;
}

const isAdmin = (role: string) =>
	role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

// Shared helper: other modules call this when they soft-delete an item
const addToTrashIntoDB = async (
	input: IAddToTrash,
	client?: Prisma.TransactionClient,
) => {
	const db = client ?? prisma;

	const expiresAt = new Date(
		Date.now() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000,
	);

	const trashItem = await db.trashItem.create({
		data: {
			userId: input.userId,
			itemType: input.itemType,
			itemId: input.itemId,
			itemTitle: input.itemTitle,
			payload: input.payload,
			expiresAt,
		},
	});

	return trashItem;
};

const getAllTrashItemsFromDB = async (
	actor: ITrashActor,
	query: ITrashQuery,
) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "deletedAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: TrashItemWhereInput[] = [
		{ expiresAt: { gt: new Date() } },
	];

	// admins may see everyone's trash, everyone else only their own
	if (!(isAdmin(actor.role) && query.all === "true")) {
		andConditions.push({ userId: actor.id });
	}

	if (query.searchTerm) {
		andConditions.push({
			itemTitle: { contains: query.searchTerm, mode: "insensitive" },
		});
	}

	if (query.itemType) {
		andConditions.push({ itemType: query.itemType });
	}

	const trashItems = await prisma.trashItem.findMany({
		where: {
			AND: andConditions,
		},
		omit: { payload: true },
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.trashItem.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: trashItems,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const findOwnedTrashItem = async (id: string, actor: ITrashActor) => {
	const trashItem = await prisma.trashItem.findUnique({
		where: {
			id,
		},
	});

	if (!trashItem) {
		throw new AppError(httpStatus.NOT_FOUND, "Trash item not found or expired");
	}

	if (trashItem.userId !== actor.id && !isAdmin(actor.role)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have permission to modify this trash item",
		);
	}

	return trashItem;
};

const restoreTrashItemIntoDB = async (id: string, actor: ITrashActor) => {
	const trashItem = await findOwnedTrashItem(id, actor);

	await prisma.$transaction(async (tx) => {
		const restoreData = { isDeleted: false, deletedAt: null };
		let restoredCount = 0;

		if (trashItem.itemType === TrashItemType.MISSING_PERSON) {
			const result = await tx.missingPerson.updateMany({
				where: { id: trashItem.itemId },
				data: restoreData,
			});
			restoredCount = result.count;
		} else if (trashItem.itemType === TrashItemType.RESCUE_REQUEST) {
			const result = await tx.rescueRequest.updateMany({
				where: { id: trashItem.itemId },
				data: restoreData,
			});
			restoredCount = result.count;
		} else if (trashItem.itemType === TrashItemType.COMMUNITY_POST) {
			const result = await tx.communityPost.updateMany({
				where: { id: trashItem.itemId },
				data: { ...restoreData, status: "POSTED" },
			});
			restoredCount = result.count;
		}

		if (restoredCount === 0) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"The original item no longer exists and cannot be restored",
			);
		}

		await tx.trashItem.delete({
			where: {
				id: trashItem.id,
			},
		});
	});

	return {
		id: trashItem.itemId,
		itemType: trashItem.itemType,
		message: `Item "${trashItem.itemTitle}" has been restored successfully`,
	};
};

const deleteTrashItemPermanentlyFromDB = async (
	id: string,
	actor: ITrashActor,
) => {
	const trashItem = await findOwnedTrashItem(id, actor);

	// public ids of files that should be removed from Cloudinary afterwards
	const publicIds: string[] = [];

	await prisma.$transaction(async (tx) => {
		if (trashItem.itemType === TrashItemType.MISSING_PERSON) {
			const original = await tx.missingPerson.findUnique({
				where: { id: trashItem.itemId },
				select: { photoPublicId: true },
			});

			if (original?.photoPublicId) {
				publicIds.push(original.photoPublicId);
			}

			await tx.missingPerson.deleteMany({ where: { id: trashItem.itemId } });
		} else if (trashItem.itemType === TrashItemType.RESCUE_REQUEST) {
			const original = await tx.rescueRequest.findUnique({
				where: { id: trashItem.itemId },
				select: { photoPublicId: true },
			});

			if (original?.photoPublicId) {
				publicIds.push(original.photoPublicId);
			}

			await tx.rescueRequest.deleteMany({ where: { id: trashItem.itemId } });
		} else if (trashItem.itemType === TrashItemType.COMMUNITY_POST) {
			await tx.communityPost.deleteMany({ where: { id: trashItem.itemId } });
		}

		await tx.trashItem.delete({
			where: {
				id: trashItem.id,
			},
		});
	});

	// Cloudinary is a network call, so it runs after the transaction committed
	for (const publicId of publicIds) {
		try {
			await deleteFromCloudinary(publicId);
		} catch (error) {
			logger.error(
				{ err: error, publicId },
				"Failed to delete file from Cloudinary",
			);
		}
	}

	return {
		id: trashItem.id,
		message: `Item "${trashItem.itemTitle}" permanently deleted`,
	};
};

// Used by the cron job: removes expired trash items and their original rows
const cleanupExpiredTrashFromDB = async () => {
	const expiredItems = await prisma.trashItem.findMany({
		where: {
			expiresAt: { lt: new Date() },
		},
	});

	let removed = 0;

	for (const item of expiredItems) {
		try {
			await deleteTrashItemPermanentlyFromDB(item.id, {
				id: item.userId,
				role: UserRole.USER,
			});
			removed++;
		} catch (error) {
			logger.error(
				{ err: error, trashItemId: item.id },
				"Failed to purge expired trash item",
			);
		}
	}

	return { removed };
};

export const trashService = {
	addToTrashIntoDB,
	getAllTrashItemsFromDB,
	restoreTrashItemIntoDB,
	deleteTrashItemPermanentlyFromDB,
	cleanupExpiredTrashFromDB,
};
