import httpStatus from "http-status";
import { DisasterType, UserStatus } from "../../../generated/prisma/enums";
import type { DisasterWhereInput } from "../../../generated/prisma/models";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/sendEmail";
import type {
	ICreateDisaster,
	IDisasterQuery,
	IUpdateDisaster,
} from "./disaster.interface";

const EMAIL_BATCH_SIZE = 10;

// Notifies every active, verified user. Failures are logged and never block the request.
const sendDisasterAlertEmails = async (disaster: {
	disasterName: string;
	impactedLocation: string;
	impactTime: Date;
	type: string;
}) => {
	const users = await prisma.user.findMany({
		where: {
			isDeleted: false,
			status: UserStatus.ACTIVE,
			emailVerified: true,
		},
		select: {
			email: true,
			name: true,
		},
	});

	for (let i = 0; i < users.length; i += EMAIL_BATCH_SIZE) {
		const batch = users.slice(i, i + EMAIL_BATCH_SIZE);

		const results = await Promise.allSettled(
			batch.map((user) =>
				sendEmail({
					to: user.email,
					subject: `Disaster Alert: ${disaster.disasterName}`,
					templateName: "disaster-alert",
					templateData: {
						name: user.name,
						disasterName: disaster.disasterName,
						impactedLocation: disaster.impactedLocation,
						impactTime: disaster.impactTime.toUTCString(),
						type: disaster.type.replace(/_/g, " "),
					},
				}),
			),
		);

		results.forEach((result, index) => {
			if (result.status === "rejected") {
				logger.error(
					{ err: result.reason, email: batch[index].email },
					"Failed to send disaster alert email",
				);
			}
		});
	}
};

const createDisasterIntoDB = async (payload: ICreateDisaster) => {
	const disaster = await prisma.disaster.create({
		data: payload,
	});

	await sendDisasterAlertEmails(disaster).catch((error) => {
		logger.error({ err: error }, "Disaster alert notification failed");
	});

	return disaster;
};

const getAllDisastersFromDB = async (query: IDisasterQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: DisasterWhereInput[] = [{ isDeleted: false }];

	if (query.searchTerm) {
		const normalizedTerm = query.searchTerm.toLowerCase().replace(/\s+/g, "_");
		const matchedTypes = Object.values(DisasterType).filter((type) =>
			type.toLowerCase().includes(normalizedTerm),
		);

		andConditions.push({
			OR: [
				{ disasterName: { contains: query.searchTerm, mode: "insensitive" } },
				{
					impactedLocation: { contains: query.searchTerm, mode: "insensitive" },
				},
				...(matchedTypes.length ? [{ type: { in: matchedTypes } }] : []),
			],
		});
	}

	if (query.type) {
		andConditions.push({ type: query.type });
	}

	if (query.isVerified !== undefined) {
		andConditions.push({ isVerified: query.isVerified === "true" });
	}

	const disasters = await prisma.disaster.findMany({
		where: {
			AND: andConditions,
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.disaster.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: disasters,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getDisasterByIdFromDB = async (id: string) => {
	const disaster = await prisma.disaster.findFirst({
		where: {
			id,
			isDeleted: false,
		},
		include: {
			shelters: {
				where: {
					isDeleted: false,
				},
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!disaster) {
		throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
	}

	return disaster;
};

const updateDisasterIntoDB = async (id: string, payload: IUpdateDisaster) => {
	const isDisasterExist = await prisma.disaster.findFirst({
		where: {
			id,
			isDeleted: false,
		},
		select: {
			id: true,
		},
	});

	if (!isDisasterExist) {
		throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
	}

	const disaster = await prisma.disaster.update({
		where: {
			id,
		},
		data: payload,
	});

	return disaster;
};

const markDisasterAsSafeIntoDB = async (id: string) => {
	const isDisasterExist = await prisma.disaster.findFirst({
		where: {
			id,
			isDeleted: false,
		},
		select: {
			id: true,
		},
	});

	if (!isDisasterExist) {
		throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
	}

	const disaster = await prisma.disaster.update({
		where: {
			id,
		},
		data: {
			isVerified: true,
		},
	});

	return disaster;
};

const deleteDisasterFromDB = async (id: string) => {
	const deletedAt = new Date();

	return prisma.$transaction(async (transaction) => {
		const isDisasterExist = await transaction.disaster.findFirst({
			where: {
				id,
				isDeleted: false,
			},
			select: {
				id: true,
			},
		});

		if (!isDisasterExist) {
			throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
		}

		// shelters belong to the disaster, so they are hidden with it
		await transaction.shelter.updateMany({
			where: {
				disasterId: id,
				isDeleted: false,
			},
			data: {
				isDeleted: true,
				deletedAt,
			},
		});

		return transaction.disaster.update({
			where: {
				id,
			},
			data: {
				isDeleted: true,
				deletedAt,
			},
		});
	});
};

export const disasterService = {
	createDisasterIntoDB,
	getAllDisastersFromDB,
	getDisasterByIdFromDB,
	updateDisasterIntoDB,
	markDisasterAsSafeIntoDB,
	deleteDisasterFromDB,
};
