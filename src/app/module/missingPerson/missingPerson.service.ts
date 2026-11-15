import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import { TrashItemType, UserRole } from "../../../generated/prisma/enums";
import type { MissingPersonWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import { trashService } from "../trash/trash.service";
import type {
	ICreateMissingPerson,
	IMissingPersonQuery,
	IUpdateMissingPerson,
	IUpdateMissingPersonStatus,
} from "./missingPerson.interface";

const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];
const PHOTO_FOLDER = "edrms/missing-persons";

type TActor = {
	id: string;
	role: UserRole;
};

const assertImageFile = (file: Express.Multer.File) => {
	if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only JPEG, PNG or WebP images are allowed",
		);
	}
};

const checkPermission = (reporterId: string, actor: TActor) => {
	const isAdmin =
		actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;

	if (reporterId !== actor.id && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have permission to modify this missing person report",
		);
	}
};

const findActiveReportOrThrow = async (id: string) => {
	const report = await prisma.missingPerson.findFirst({
		where: {
			id,
			isDeleted: false,
		},
	});

	if (!report) {
		throw new AppError(httpStatus.NOT_FOUND, "Missing person report not found");
	}

	return report;
};

const createMissingPersonIntoDB = async (
	reporterId: string,
	payload: ICreateMissingPerson,
	file?: Express.Multer.File,
) => {
	let contactPhone = payload.contactPhone;

	if (!contactPhone) {
		const reporter = await prisma.user.findUnique({
			where: {
				id: reporterId,
			},
			select: {
				phone: true,
			},
		});

		if (!reporter?.phone) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Contact phone is required and could not be found in your profile",
			);
		}

		contactPhone = reporter.phone;
	}

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
		const missingPerson = await prisma.missingPerson.create({
			data: {
				fullName: payload.fullName,
				age: payload.age,
				gender: payload.gender,
				lastSeenLocation: payload.lastSeenLocation,
				lastSeenDate: payload.lastSeenDate,
				description: payload.description,
				contactPhone,
				photoUrl,
				photoPublicId,
				reporterId,
			},
			omit: {
				photoPublicId: true,
			},
		});

		return missingPerson;
	} catch (error) {
		if (photoPublicId) {
			await deleteFromCloudinary(photoPublicId).catch(() => undefined);
		}

		throw error;
	}
};

const buildListFilters = (query: IMissingPersonQuery, reporterId?: string) => {
	const andConditions: MissingPersonWhereInput[] = [{ isDeleted: false }];

	if (reporterId) {
		andConditions.push({ reporterId });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ fullName: { contains: query.searchTerm, mode: "insensitive" } },
				{
					lastSeenLocation: { contains: query.searchTerm, mode: "insensitive" },
				},
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.gender) {
		andConditions.push({
			gender: { equals: query.gender, mode: "insensitive" },
		});
	}

	return andConditions;
};

const listMissingPersons = async (
	query: IMissingPersonQuery,
	reporterId?: string,
) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const where: MissingPersonWhereInput = {
		AND: buildListFilters(query, reporterId),
	};

	const [missingPersons, total] = await Promise.all([
		prisma.missingPerson.findMany({
			where,
			take: limit,
			skip,
			orderBy: {
				[sortBy]: sortOrder,
			},
			omit: {
				photoPublicId: true,
			},
		}),
		prisma.missingPerson.count({ where }),
	]);

	return {
		data: missingPersons,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getAllMissingPersonsFromDB = async (query: IMissingPersonQuery) => {
	return listMissingPersons(query);
};

const getMyMissingPersonsFromDB = async (
	reporterId: string,
	query: IMissingPersonQuery,
) => {
	return listMissingPersons(query, reporterId);
};

const getMissingPersonByIdFromDB = async (id: string) => {
	const missingPerson = await prisma.missingPerson.findFirst({
		where: {
			id,
			isDeleted: false,
		},
		omit: {
			photoPublicId: true,
		},
	});

	if (!missingPerson) {
		throw new AppError(httpStatus.NOT_FOUND, "Missing person report not found");
	}

	return missingPerson;
};

const updateMissingPersonIntoDB = async (
	id: string,
	actor: TActor,
	payload: IUpdateMissingPerson,
	file?: Express.Multer.File,
) => {
	const report = await findActiveReportOrThrow(id);
	checkPermission(report.reporterId, actor);

	const data: Prisma.MissingPersonUpdateInput = {
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
		const updatedReport = await prisma.missingPerson.update({
			where: {
				id,
			},
			data,
			omit: {
				photoPublicId: true,
			},
		});

		// the old photo is removed last, so a failed update never loses it
		if (newPublicId && report.photoPublicId) {
			await deleteFromCloudinary(report.photoPublicId).catch(() => undefined);
		}

		return updatedReport;
	} catch (error) {
		if (newPublicId) {
			await deleteFromCloudinary(newPublicId).catch(() => undefined);
		}

		throw error;
	}
};

const updateMissingPersonStatusIntoDB = async (
	id: string,
	actor: TActor,
	payload: IUpdateMissingPersonStatus,
) => {
	const report = await findActiveReportOrThrow(id);
	checkPermission(report.reporterId, actor);

	const updatedReport = await prisma.missingPerson.update({
		where: {
			id,
		},
		data: {
			status: payload.status,
		},
		omit: {
			photoPublicId: true,
		},
	});

	return updatedReport;
};

const deleteMissingPersonFromDB = async (id: string, actor: TActor) => {
	await prisma.$transaction(async (transaction) => {
		const report = await transaction.missingPerson.findFirst({
			where: {
				id,
				isDeleted: false,
			},
			omit: {
				photoPublicId: true,
			},
		});

		if (!report) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"Missing person report not found",
			);
		}

		checkPermission(report.reporterId, actor);

		const deleted = await transaction.missingPerson.updateMany({
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
				"Missing person report was already deleted",
			);
		}

		await trashService.addToTrashIntoDB(
			{
				userId: actor.id,
				itemType: TrashItemType.MISSING_PERSON,
				itemId: report.id,
				itemTitle: `Missing report for ${report.fullName}`,
				payload: JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue,
			},
			transaction,
		);
	});

	return null;
};

export const missingPersonService = {
	createMissingPersonIntoDB,
	getAllMissingPersonsFromDB,
	getMyMissingPersonsFromDB,
	getMissingPersonByIdFromDB,
	updateMissingPersonIntoDB,
	updateMissingPersonStatusIntoDB,
	deleteMissingPersonFromDB,
};
