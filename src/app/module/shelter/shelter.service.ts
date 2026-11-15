import httpStatus from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import type { ShelterWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	ICreateShelter,
	IShelterQuery,
	IUpdateShelter,
} from "./shelter.interface";

const isAdminUser = (user: RequestUser) =>
	user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

// verification documents are private; only the relevant public fields are exposed
const shelterInclude = {
	reliefOrg: {
		select: {
			id: true,
			organizationName: true,
			contactEmail: true,
			contactPhone: true,
			adminVerified: true,
		},
	},
	disaster: {
		select: {
			id: true,
			disasterName: true,
			impactedLocation: true,
			type: true,
			impactTime: true,
		},
	},
};

const createShelterIntoDB = async (
	user: RequestUser,
	payload: ICreateShelter,
) => {
	const { reliefOrgId, ...shelterData } = payload;
	const currentPeopleCount = shelterData.currentPeopleCount ?? 0;

	if (currentPeopleCount > shelterData.shelterCapacity) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Current people count cannot exceed shelter capacity",
		);
	}

	const disaster = await prisma.disaster.findFirst({
		where: {
			id: shelterData.disasterId,
			isDeleted: false,
		},
		select: {
			id: true,
		},
	});

	if (!disaster) {
		throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
	}

	const isAdmin = isAdminUser(user);

	// admins may act on behalf of an organization, everyone else uses their own
	const reliefOrg = await prisma.reliefOrg.findFirst({
		where: isAdmin && reliefOrgId ? { id: reliefOrgId } : { userId: user.id },
		select: {
			id: true,
			adminVerified: true,
		},
	});

	if (!reliefOrg) {
		if (isAdmin) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Admins must provide a valid reliefOrgId to create a shelter",
			);
		}

		throw new AppError(
			httpStatus.FORBIDDEN,
			"You must have a registered relief organization account to create shelters",
		);
	}

	if (!reliefOrg.adminVerified && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Your relief organization account is pending admin verification",
		);
	}

	const shelter = await prisma.shelter.create({
		data: {
			...shelterData,
			currentPeopleCount,
			reliefOrgId: reliefOrg.id,
		},
		include: shelterInclude,
	});

	return shelter;
};

const getAllSheltersFromDB = async (query: IShelterQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ShelterWhereInput[] = [
		{ isDeleted: false },
		{ disaster: { isDeleted: false } },
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ shelterName: { contains: query.searchTerm, mode: "insensitive" } },
				{
					shelterLocation: { contains: query.searchTerm, mode: "insensitive" },
				},
			],
		});
	}

	if (query.disasterId) {
		andConditions.push({ disasterId: query.disasterId });
	}

	if (query.reliefOrgId) {
		andConditions.push({ reliefOrgId: query.reliefOrgId });
	}

	const shelters = await prisma.shelter.findMany({
		where: {
			AND: andConditions,
		},
		include: shelterInclude,
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.shelter.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: shelters,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getShelterByIdFromDB = async (id: string) => {
	const shelter = await prisma.shelter.findFirst({
		where: {
			id,
			isDeleted: false,
			disaster: {
				isDeleted: false,
			},
		},
		include: shelterInclude,
	});

	if (!shelter) {
		throw new AppError(httpStatus.NOT_FOUND, "Shelter not found");
	}

	return shelter;
};

const updateShelterIntoDB = async (
	id: string,
	user: RequestUser,
	payload: IUpdateShelter,
) => {
	return prisma.$transaction(async (transaction) => {
		const shelter = await transaction.shelter.findFirst({
			where: {
				id,
				isDeleted: false,
			},
		});

		if (!shelter) {
			throw new AppError(httpStatus.NOT_FOUND, "Shelter not found");
		}

		if (!isAdminUser(user)) {
			const reliefOrg = await transaction.reliefOrg.findUnique({
				where: {
					userId: user.id,
				},
				select: {
					id: true,
				},
			});

			if (!reliefOrg || reliefOrg.id !== shelter.reliefOrgId) {
				throw new AppError(
					httpStatus.FORBIDDEN,
					"You are only allowed to modify shelters managed by your own relief organization",
				);
			}
		}

		if (payload.disasterId) {
			const disaster = await transaction.disaster.findFirst({
				where: {
					id: payload.disasterId,
					isDeleted: false,
				},
				select: {
					id: true,
				},
			});

			if (!disaster) {
				throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
			}
		}

		const nextCapacity = payload.shelterCapacity ?? shelter.shelterCapacity;
		const nextCount = payload.currentPeopleCount ?? shelter.currentPeopleCount;

		if (nextCount > nextCapacity) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Current people count cannot exceed shelter capacity",
			);
		}

		return transaction.shelter.update({
			where: {
				id,
			},
			data: payload,
			include: shelterInclude,
		});
	});
};

const deleteShelterFromDB = async (id: string, user: RequestUser) => {
	return prisma.$transaction(async (transaction) => {
		const shelter = await transaction.shelter.findFirst({
			where: {
				id,
				isDeleted: false,
			},
			select: {
				id: true,
				reliefOrgId: true,
			},
		});

		if (!shelter) {
			throw new AppError(httpStatus.NOT_FOUND, "Shelter not found");
		}

		if (!isAdminUser(user)) {
			const reliefOrg = await transaction.reliefOrg.findUnique({
				where: {
					userId: user.id,
				},
				select: {
					id: true,
				},
			});

			if (!reliefOrg || reliefOrg.id !== shelter.reliefOrgId) {
				throw new AppError(
					httpStatus.FORBIDDEN,
					"You are only allowed to delete shelters managed by your own relief organization",
				);
			}
		}

		return transaction.shelter.update({
			where: {
				id,
			},
			data: {
				isDeleted: true,
				deletedAt: new Date(),
			},
			select: {
				id: true,
				shelterName: true,
			},
		});
	});
};

export const shelterService = {
	createShelterIntoDB,
	getAllSheltersFromDB,
	getShelterByIdFromDB,
	updateShelterIntoDB,
	deleteShelterFromDB,
};
