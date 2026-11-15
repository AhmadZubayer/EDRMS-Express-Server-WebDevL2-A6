import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import {
	RescueStatus,
	TrashItemType,
	UserRole,
} from "../../../generated/prisma/enums";
import type { RescueRequestWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import { trashService } from "../trash/trash.service";
import type {
	ICreateRescueRequest,
	IRescueRequestQuery,
	IUpdateRescueRequest,
	IUpdateRescueRequestStatus,
} from "./rescueRequest.interface";

const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];
const PHOTO_FOLDER = "edrms/rescue-requests";

type TActor = {
	id: string;
	role: UserRole;
};

// never expose the Cloudinary public id; show only who is involved
const responseOptions = {
	omit: {
		photoPublicId: true,
	},
	include: {
		user: {
			select: {
				id: true,
				name: true,
				imageUrl: true,
			},
		},
		assignedRescuer: {
			select: {
				id: true,
				name: true,
				imageUrl: true,
			},
		},
	},
} satisfies Prisma.RescueRequestDefaultArgs;

// latitude and longitude are Decimal columns; the API returns plain numbers
const toRescueResponse = <
	T extends { latitude: Prisma.Decimal; longitude: Prisma.Decimal },
>(
	rescueRequest: T,
) => {
	return {
		...rescueRequest,
		latitude: Number(rescueRequest.latitude),
		longitude: Number(rescueRequest.longitude),
	};
};

const assertImageFile = (file: Express.Multer.File) => {
	if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only JPEG, PNG or WebP images are allowed",
		);
	}
};

const checkPermission = (ownerId: string, actor: TActor) => {
	const isAdmin =
		actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;

	if (ownerId !== actor.id && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have permission to modify this rescue request",
		);
	}
};

const findActiveRequestOrThrow = async (id: string) => {
	const rescueRequest = await prisma.rescueRequest.findFirst({
		where: {
			id,
			isDeleted: false,
		},
	});

	if (!rescueRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Rescue request not found");
	}

	return rescueRequest;
};

const createRescueRequestIntoDB = async (
	userId: string,
	payload: ICreateRescueRequest,
	file?: Express.Multer.File,
) => {
	let photoUrl = payload.photoUrl ?? null;
	let photoPublicId: string | null = null;

	if (file) {
		assertImageFile(file);

		const uploadResult = await uploadToCloudinary(file.buffer, {
			resource_type: "image",
			folder: PHOTO_FOLDER,
		});

		photoUrl = uploadResult.secure_url;
		photoPublicId = uploadResult.public_id;
	}

	try {
		const rescueRequest = await prisma.rescueRequest.create({
			data: {
				latitude: payload.latitude,
				longitude: payload.longitude,
				description: payload.description,
				contactPhone: payload.contactPhone,
				address: payload.address,
				peopleCount: payload.peopleCount,
				urgencyLevel: payload.urgencyLevel,
				medicalNotes: payload.medicalNotes,
				photoUrl,
				photoPublicId,
				userId,
			},
			...responseOptions,
		});

		return toRescueResponse(rescueRequest);
	} catch (error) {
		if (photoPublicId) {
			await deleteFromCloudinary(photoPublicId).catch(() => undefined);
		}

		throw error;
	}
};

const listRescueRequests = async (
	query: IRescueRequestQuery,
	userId?: string,
) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: RescueRequestWhereInput[] = [{ isDeleted: false }];

	if (userId) {
		andConditions.push({ userId });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ address: { contains: query.searchTerm, mode: "insensitive" } },
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
				{ contactPhone: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.urgencyLevel) {
		andConditions.push({ urgencyLevel: query.urgencyLevel });
	}

	if (query.assignedRescuerId) {
		andConditions.push({ assignedRescuerId: query.assignedRescuerId });
	}

	const where: RescueRequestWhereInput = {
		AND: andConditions,
	};

	const [rescueRequests, total] = await Promise.all([
		prisma.rescueRequest.findMany({
			where,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
			...responseOptions,
		}),
		prisma.rescueRequest.count({ where }),
	]);

	return {
		data: rescueRequests.map(toRescueResponse),
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAllRescueRequestsFromDB = async (query: IRescueRequestQuery) => {
	return listRescueRequests(query);
};

const getMyRescueRequestsFromDB = async (
	userId: string,
	query: IRescueRequestQuery,
) => {
	return listRescueRequests(query, userId);
};

const getRescueRequestByIdFromDB = async (id: string) => {
	const rescueRequest = await prisma.rescueRequest.findFirst({
		where: {
			id,
			isDeleted: false,
		},
		...responseOptions,
	});

	if (!rescueRequest) {
		throw new AppError(httpStatus.NOT_FOUND, "Rescue request not found");
	}

	return toRescueResponse(rescueRequest);
};

const updateRescueRequestIntoDB = async (
	id: string,
	actor: TActor,
	payload: IUpdateRescueRequest,
	file?: Express.Multer.File,
) => {
	const existingRequest = await findActiveRequestOrThrow(id);
	checkPermission(existingRequest.userId, actor);

	const data: Prisma.RescueRequestUpdateInput = {
		...payload,
	};

	let newPublicId: string | null = null;

	if (file) {
		assertImageFile(file);

		const uploadResult = await uploadToCloudinary(file.buffer, {
			resource_type: "image",
			folder: PHOTO_FOLDER,
		});

		newPublicId = uploadResult.public_id;
		data.photoUrl = uploadResult.secure_url;
		data.photoPublicId = uploadResult.public_id;
	}

	try {
		const updatedRequest = await prisma.rescueRequest.update({
			where: {
				id,
			},
			data,
			...responseOptions,
		});

		// the old photo is removed last, so a failed update never loses it
		if (newPublicId && existingRequest.photoPublicId) {
			await deleteFromCloudinary(existingRequest.photoPublicId).catch(
				() => undefined,
			);
		}

		return toRescueResponse(updatedRequest);
	} catch (error) {
		if (newPublicId) {
			await deleteFromCloudinary(newPublicId).catch(() => undefined);
		}

		throw error;
	}
};

const updateRescueRequestStatusIntoDB = async (
	id: string,
	actor: TActor,
	payload: IUpdateRescueRequestStatus,
) => {
	const existingRequest = await findActiveRequestOrThrow(id);
	checkPermission(existingRequest.userId, actor);

	if (payload.assignedRescuerId) {
		const rescuer = await prisma.user.findFirst({
			where: {
				id: payload.assignedRescuerId,
				isDeleted: false,
			},
			select: {
				id: true,
			},
		});

		if (!rescuer) {
			throw new AppError(httpStatus.NOT_FOUND, "Assigned rescuer not found");
		}
	}

	const updatedRequest = await prisma.rescueRequest.update({
		where: {
			id,
		},
		data: {
			status: payload.status,
			...(payload.assignedRescuerId !== undefined && {
				assignedRescuerId: payload.assignedRescuerId,
			}),
		},
		...responseOptions,
	});

	return toRescueResponse(updatedRequest);
};

const cancelMyRescueRequestIntoDB = async (id: string, userId: string) => {
	const existingRequest = await findActiveRequestOrThrow(id);

	if (existingRequest.userId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only cancel your own rescue requests",
		);
	}

	if (existingRequest.status === RescueStatus.RESCUED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Cannot cancel a rescue request that is already completed",
		);
	}

	if (existingRequest.status === RescueStatus.CANCELLED) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Rescue request is already cancelled",
		);
	}

	// guard against a status change between the read above and this write
	const cancelled = await prisma.rescueRequest.updateMany({
		where: {
			id,
			status: existingRequest.status,
		},
		data: {
			status: RescueStatus.CANCELLED,
		},
	});

	if (cancelled.count === 0) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Rescue request status changed. Please try again",
		);
	}

	const rescueRequest = await prisma.rescueRequest.findUniqueOrThrow({
		where: {
			id,
		},
		...responseOptions,
	});

	return toRescueResponse(rescueRequest);
};

const deleteRescueRequestFromDB = async (id: string, actor: TActor) => {
	await prisma.$transaction(async (transaction) => {
		const rescueRequest = await transaction.rescueRequest.findFirst({
			where: {
				id,
				isDeleted: false,
			},
			omit: {
				photoPublicId: true,
			},
		});

		if (!rescueRequest) {
			throw new AppError(httpStatus.NOT_FOUND, "Rescue request not found");
		}

		checkPermission(rescueRequest.userId, actor);

		const deleted = await transaction.rescueRequest.updateMany({
			where: {
				id,
				isDeleted: false,
			},
			data: {
				isDeleted: true,
				deletedAt: new Date(),
			},
		});

		if (deleted.count === 0) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Rescue request was already deleted",
			);
		}

		await trashService.addToTrashIntoDB(
			{
				userId: actor.id,
				itemType: TrashItemType.RESCUE_REQUEST,
				itemId: rescueRequest.id,
				itemTitle: rescueRequest.address
					? `Rescue needed in ${rescueRequest.address}`
					: `Rescue request (${rescueRequest.urgencyLevel})`,
				payload: JSON.parse(
					JSON.stringify(toRescueResponse(rescueRequest)),
				) as Prisma.InputJsonValue,
			},
			transaction,
		);
	});

	return null;
};

export const rescueRequestService = {
	createRescueRequestIntoDB,
	getAllRescueRequestsFromDB,
	getMyRescueRequestsFromDB,
	getRescueRequestByIdFromDB,
	updateRescueRequestIntoDB,
	updateRescueRequestStatusIntoDB,
	cancelMyRescueRequestIntoDB,
	deleteRescueRequestFromDB,
};
