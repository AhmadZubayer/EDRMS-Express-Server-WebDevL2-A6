import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
	FieldReportType,
	ReportSeverity,
	RescueStatus,
	UserRole,
	VolunteerTaskStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";
import type {
	FieldReportWhereInput,
	VolunteerTaskWhereInput,
} from "../../../generated/prisma/models";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import type {
	ICreateResourceShortage,
	ICreateRouteReport,
	IFieldReportQuery,
	INearbyRequestsQuery,
	IPaginationQuery,
	IRegisterVolunteer,
	ITaskQuery,
	IUpdateTaskProgress,
	IUpdateVolunteerLocation,
	IUpdateVolunteerProfile,
	IReviewVerification,
} from "./volunteer.interface";

const NID_ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"application/pdf",
];
const NID_MAX_SIZE = 5 * 1024 * 1024;

const getPagination = (query: IPaginationQuery) => {
	const page = query.page ?? 1;
	const limit = query.limit ?? 10;

	return { page, limit, skip: (page - 1) * limit };
};

const buildMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

const toRadians = (value: number) => value * (Math.PI / 180);

// Haversine formula: great-circle distance in kilometres
const calculateDistanceKm = (
	latitudeOne: number,
	longitudeOne: number,
	latitudeTwo: number,
	longitudeTwo: number,
) => {
	const earthRadiusKm = 6371;
	const latDistance = toRadians(latitudeTwo - latitudeOne);
	const lngDistance = toRadians(longitudeTwo - longitudeOne);
	const value =
		Math.sin(latDistance / 2) ** 2 +
		Math.cos(toRadians(latitudeOne)) *
			Math.cos(toRadians(latitudeTwo)) *
			Math.sin(lngDistance / 2) ** 2;
	const distance =
		earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));

	return Number(distance.toFixed(2));
};

const uploadNidCard = async (file: Express.Multer.File) => {
	if (!NID_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"NID card must be a JPEG, PNG or PDF file",
		);
	}

	if (file.size > NID_MAX_SIZE) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"NID card file must be 5 MB or smaller",
		);
	}

	const result = await uploadToCloudinary(file.buffer, {
		resource_type: "auto",
		folder: "edrms/volunteers/nid",
	});

	return { url: result.secure_url, publicId: result.public_id };
};

const removeUploadedFile = async (publicId: string) => {
	try {
		await deleteFromCloudinary(publicId);
	} catch (error) {
		logger.error(
			{ err: error, publicId },
			"Failed to delete file from Cloudinary",
		);
	}
};

const getVolunteerByUserIdFromDB = async (userId: string) => {
	const volunteer = await prisma.volunteer.findUnique({
		where: {
			userId,
		},
		include: {
			user: {
				omit: {
					password: true,
				},
			},
		},
	});

	if (!volunteer) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Volunteer profile not found. Register as a volunteer first",
		);
	}

	return volunteer;
};

const getVerifiedVolunteerFromDB = async (userId: string) => {
	const volunteer = await getVolunteerByUserIdFromDB(userId);

	if (volunteer.verificationStatus !== VolunteerVerificationStatus.VERIFIED) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Volunteer verification is required for this action",
		);
	}

	return volunteer;
};

const registerVolunteerIntoDB = async (
	user: RequestUser,
	payload: IRegisterVolunteer,
	file?: Express.Multer.File,
) => {
	const blockedRoles: UserRole[] = [
		UserRole.ADMIN,
		UserRole.SUPER_ADMIN,
		UserRole.RELIEF_ORG,
	];

	if (blockedRoles.includes(user.role)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Admin and relief organization accounts cannot register as volunteers",
		);
	}

	const isVolunteerExist = await prisma.volunteer.findUnique({
		where: {
			userId: user.id,
		},
		select: {
			id: true,
		},
	});

	if (isVolunteerExist) {
		throw new AppError(httpStatus.CONFLICT, "Volunteer profile already exists");
	}

	const nidCard = file ? await uploadNidCard(file) : undefined;

	try {
		const volunteer = await prisma.$transaction(async (transaction) => {
			await transaction.user.update({
				where: {
					id: user.id,
				},
				data: {
					role: UserRole.VOLUNTEER,
				},
			});

			return transaction.volunteer.create({
				data: {
					userId: user.id,
					skills: payload.skills,
					whyJoin: payload.whyJoin,
					available: payload.available ?? false,
					verificationStatus: VolunteerVerificationStatus.NOT_APPLIED,
					onDuty: false,
					nidCardUrl: nidCard?.url,
					nidCardPublicId: nidCard?.publicId,
				},
				include: {
					user: {
						omit: {
							password: true,
						},
					},
				},
			});
		});

		logger.info(
			{ volunteerId: volunteer.id, userId: user.id },
			"Volunteer registered",
		);

		return volunteer;
	} catch (error) {
		if (nidCard) {
			await removeUploadedFile(nidCard.publicId);
		}

		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Volunteer profile already exists",
			);
		}

		throw error;
	}
};

const getMyVolunteerProfileFromDB = async (userId: string) => {
	return getVolunteerByUserIdFromDB(userId);
};

const updateMyVolunteerProfileIntoDB = async (
	userId: string,
	payload: IUpdateVolunteerProfile,
) => {
	const volunteer = await getVolunteerByUserIdFromDB(userId);

	const updatedVolunteer = await prisma.volunteer.update({
		where: {
			id: volunteer.id,
		},
		data: {
			skills: payload.skills,
			available: payload.available,
			// going unavailable takes the volunteer off duty
			onDuty: payload.available === false ? false : undefined,
		},
		include: {
			user: {
				omit: {
					password: true,
				},
			},
		},
	});

	return updatedVolunteer;
};

const applyForVerificationIntoDB = async (
	userId: string,
	file?: Express.Multer.File,
) => {
	const volunteer = await getVolunteerByUserIdFromDB(userId);

	if (volunteer.skills.length === 0) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Add at least one rescue skill before applying for verification",
		);
	}

	if (volunteer.verificationStatus === VolunteerVerificationStatus.VERIFIED) {
		throw new AppError(httpStatus.CONFLICT, "Volunteer is already verified");
	}

	const nidCard = file ? await uploadNidCard(file) : undefined;

	if (!nidCard && !volunteer.nidCardUrl) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"NID card document (JPEG, PNG, or PDF) is required for verification",
		);
	}

	const result = await prisma.volunteer.updateMany({
		where: {
			id: volunteer.id,
			verificationStatus: {
				not: VolunteerVerificationStatus.VERIFIED,
			},
		},
		data: {
			verificationStatus: VolunteerVerificationStatus.PENDING,
			nidCardUrl: nidCard?.url,
			nidCardPublicId: nidCard?.publicId,
		},
	});

	if (result.count === 0) {
		if (nidCard) {
			await removeUploadedFile(nidCard.publicId);
		}

		throw new AppError(httpStatus.CONFLICT, "Volunteer is already verified");
	}

	// the replaced NID card is removed last, so a failed upload never loses the old one
	if (nidCard && volunteer.nidCardPublicId) {
		await removeUploadedFile(volunteer.nidCardPublicId);
	}

	return getVolunteerByUserIdFromDB(userId);
};

const reviewVerificationIntoDB = async (
	volunteerId: string,
	payload: IReviewVerification,
) => {
	const isApproved = payload.status === VolunteerVerificationStatus.VERIFIED;

	return prisma.$transaction(async (transaction) => {
		const volunteer = await transaction.volunteer.findUnique({
			where: {
				id: volunteerId,
			},
		});

		if (!volunteer) {
			throw new AppError(httpStatus.NOT_FOUND, "Volunteer not found");
		}

		if (
			volunteer.verificationStatus === VolunteerVerificationStatus.NOT_APPLIED
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Volunteer has not applied for verification yet",
			);
		}

		const result = await transaction.volunteer.updateMany({
			where: {
				id: volunteer.id,
				verificationStatus: volunteer.verificationStatus,
			},
			data: {
				verificationStatus: payload.status,
				available: isApproved ? volunteer.available : false,
				onDuty: false,
			},
		});

		if (result.count === 0) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Volunteer verification status changed. Please try again",
			);
		}

		await transaction.user.updateMany({
			where: {
				id: volunteer.userId,
				role: {
					in: [UserRole.USER, UserRole.VOLUNTEER],
				},
			},
			data: {
				role: isApproved ? UserRole.VOLUNTEER : UserRole.USER,
			},
		});

		return transaction.volunteer.findUniqueOrThrow({
			where: {
				id: volunteer.id,
			},
			include: {
				user: {
					omit: {
						password: true,
					},
				},
			},
		});
	});
};

const updateDutyLocationIntoDB = async (
	userId: string,
	payload: IUpdateVolunteerLocation,
) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	if (payload.onDuty === true && !volunteer.available) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Set volunteer availability before going on duty",
		);
	}

	const updatedVolunteer = await prisma.volunteer.update({
		where: {
			id: volunteer.id,
		},
		data: {
			currentLatitude: payload.latitude,
			currentLongitude: payload.longitude,
			lastLocationUpdate: new Date(),
			onDuty: payload.onDuty,
		},
		include: {
			user: {
				omit: {
					password: true,
				},
			},
		},
	});

	return updatedVolunteer;
};

const getNearbyRescueRequestsFromDB = async (
	userId: string,
	query: INearbyRequestsQuery,
) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	if (!volunteer.available) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Set your availability before viewing matching requests",
		);
	}

	if (!volunteer.onDuty) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Go on duty before viewing nearby rescue requests",
		);
	}

	if (
		volunteer.currentLatitude === null ||
		volunteer.currentLongitude === null
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Share your current location before viewing nearby requests",
		);
	}

	const radiusKm = query.radius ?? 25;
	const latitude = Number(volunteer.currentLatitude);
	const longitude = Number(volunteer.currentLongitude);

	// bounding box keeps the Haversine work to a small set of rows
	const latitudeDelta = radiusKm / 111;
	const longitudeDelta =
		radiusKm / (111 * Math.max(Math.cos(toRadians(latitude)), 0.01));

	const rejectedTasks = await prisma.volunteerTask.findMany({
		where: {
			volunteerId: volunteer.id,
			status: VolunteerTaskStatus.REJECTED,
		},
		select: {
			rescueRequestId: true,
		},
	});

	const requests = await prisma.rescueRequest.findMany({
		where: {
			isDeleted: false,
			status: RescueStatus.PENDING,
			assignedRescuerId: null,
			id: {
				notIn: rejectedTasks.map((task) => task.rescueRequestId),
			},
			latitude: {
				gte: latitude - latitudeDelta,
				lte: latitude + latitudeDelta,
			},
			longitude: {
				gte: longitude - longitudeDelta,
				lte: longitude + longitudeDelta,
			},
		},
		include: {
			user: {
				select: {
					id: true,
					name: true,
					phone: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const nearby = requests
		.map((request) => ({
			...request,
			latitude: Number(request.latitude),
			longitude: Number(request.longitude),
			distanceKm: calculateDistanceKm(
				latitude,
				longitude,
				Number(request.latitude),
				Number(request.longitude),
			),
		}))
		.filter((request) => request.distanceKm <= radiusKm)
		.sort((first, second) => first.distanceKm - second.distanceKm);

	const { page, limit, skip } = getPagination(query);

	return {
		data: nearby.slice(skip, skip + limit),
		meta: buildMeta(page, limit, nearby.length),
	};
};

const acceptRescueTaskIntoDB = async (userId: string, requestId: string) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	if (!volunteer.available) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Set your availability before accepting a task",
		);
	}

	const task = await prisma.$transaction(async (transaction) => {
		const request = await transaction.rescueRequest.findFirst({
			where: {
				id: requestId,
				isDeleted: false,
			},
		});

		if (!request) {
			throw new AppError(httpStatus.NOT_FOUND, "Rescue request not found");
		}

		if (
			request.status === RescueStatus.RESCUED ||
			request.status === RescueStatus.CANCELLED
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Completed or cancelled rescue request cannot be accepted",
			);
		}

		if (request.assignedRescuerId === volunteer.userId) {
			const existingTask = await transaction.volunteerTask.findUnique({
				where: {
					volunteerId_rescueRequestId: {
						volunteerId: volunteer.id,
						rescueRequestId: request.id,
					},
				},
			});

			if (
				existingTask &&
				existingTask.status !== VolunteerTaskStatus.REJECTED
			) {
				throw new AppError(
					httpStatus.CONFLICT,
					"You have already accepted this rescue task",
				);
			}
		} else {
			// only one volunteer can win the assignment
			const assigned = await transaction.rescueRequest.updateMany({
				where: {
					id: request.id,
					isDeleted: false,
					assignedRescuerId: null,
					status: {
						in: [
							RescueStatus.PENDING,
							RescueStatus.ACKNOWLEDGED,
							RescueStatus.DISPATCHED,
						],
					},
				},
				data: {
					assignedRescuerId: volunteer.userId,
					status: RescueStatus.ACKNOWLEDGED,
				},
			});

			if (assigned.count === 0) {
				throw new AppError(
					httpStatus.CONFLICT,
					"Rescue task has already been assigned to another volunteer",
				);
			}
		}

		return transaction.volunteerTask.upsert({
			where: {
				volunteerId_rescueRequestId: {
					volunteerId: volunteer.id,
					rescueRequestId: request.id,
				},
			},
			create: {
				volunteerId: volunteer.id,
				rescueRequestId: request.id,
				status: VolunteerTaskStatus.ACCEPTED,
			},
			update: {
				status: VolunteerTaskStatus.ACCEPTED,
				completedAt: null,
			},
			include: {
				rescueRequest: true,
			},
		});
	});

	logger.info(
		{ volunteerId: volunteer.id, rescueRequestId: requestId },
		"Volunteer assigned to rescue request",
	);

	return task;
};

const rejectRescueTaskIntoDB = async (userId: string, requestId: string) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	const request = await prisma.rescueRequest.findFirst({
		where: {
			id: requestId,
			isDeleted: false,
		},
		select: {
			id: true,
			assignedRescuerId: true,
		},
	});

	if (!request) {
		throw new AppError(httpStatus.NOT_FOUND, "Rescue request not found");
	}

	if (request.assignedRescuerId === volunteer.userId) {
		throw new AppError(
			httpStatus.CONFLICT,
			"An accepted task cannot be rejected. Update its progress instead",
		);
	}

	const task = await prisma.volunteerTask.upsert({
		where: {
			volunteerId_rescueRequestId: {
				volunteerId: volunteer.id,
				rescueRequestId: request.id,
			},
		},
		create: {
			volunteerId: volunteer.id,
			rescueRequestId: request.id,
			status: VolunteerTaskStatus.REJECTED,
		},
		update: {
			status: VolunteerTaskStatus.REJECTED,
		},
	});

	return task;
};

const getMyRescueTasksFromDB = async (userId: string, query: ITaskQuery) => {
	const volunteer = await getVolunteerByUserIdFromDB(userId);

	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "updatedAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: VolunteerTaskWhereInput[] = [
		{
			volunteerId: volunteer.id,
		},
		{
			status: query.status ?? {
				not: VolunteerTaskStatus.REJECTED,
			},
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			rescueRequest: {
				OR: [
					{ description: { contains: query.searchTerm, mode: "insensitive" } },
					{ address: { contains: query.searchTerm, mode: "insensitive" } },
					{
						user: { name: { contains: query.searchTerm, mode: "insensitive" } },
					},
				],
			},
		});
	}

	const tasks = await prisma.volunteerTask.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			rescueRequest: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							phone: true,
						},
					},
				},
			},
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.volunteerTask.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: tasks,
		meta: buildMeta(page, limit, total),
	};
};

const taskStatusRank: Record<VolunteerTaskStatus, number> = {
	[VolunteerTaskStatus.REJECTED]: 0,
	[VolunteerTaskStatus.ACCEPTED]: 1,
	[VolunteerTaskStatus.IN_PROGRESS]: 2,
	[VolunteerTaskStatus.COMPLETED]: 3,
};

const rescueStatusForTask: Record<IUpdateTaskProgress["status"], RescueStatus> =
	{
		[VolunteerTaskStatus.ACCEPTED]: RescueStatus.ACKNOWLEDGED,
		[VolunteerTaskStatus.IN_PROGRESS]: RescueStatus.IN_PROGRESS,
		[VolunteerTaskStatus.COMPLETED]: RescueStatus.RESCUED,
	};

const updateTaskProgressIntoDB = async (
	userId: string,
	taskId: string,
	payload: IUpdateTaskProgress,
) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	return prisma.$transaction(async (transaction) => {
		const task = await transaction.volunteerTask.findUnique({
			where: {
				id: taskId,
			},
		});

		if (!task) {
			throw new AppError(httpStatus.NOT_FOUND, "Volunteer task not found");
		}

		if (task.volunteerId !== volunteer.id) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You can only update your assigned tasks",
			);
		}

		if (
			task.status === VolunteerTaskStatus.REJECTED ||
			task.status === VolunteerTaskStatus.COMPLETED
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A rejected or completed task cannot be updated",
			);
		}

		if (taskStatusRank[payload.status] < taskStatusRank[task.status]) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Task progress cannot move backwards",
			);
		}

		const isCompleted = payload.status === VolunteerTaskStatus.COMPLETED;

		// the expected current status is in the where, so a parallel update loses
		const result = await transaction.volunteerTask.updateMany({
			where: {
				id: task.id,
				status: task.status,
			},
			data: {
				status: payload.status,
				progressNote: payload.progressNote,
				completedAt: isCompleted ? new Date() : undefined,
			},
		});

		if (result.count === 0) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Task was updated by another request. Please try again",
			);
		}

		await transaction.rescueRequest.updateMany({
			where: {
				id: task.rescueRequestId,
				assignedRescuerId: volunteer.userId,
			},
			data: {
				status: rescueStatusForTask[payload.status],
			},
		});

		return transaction.volunteerTask.findUniqueOrThrow({
			where: {
				id: task.id,
			},
			include: {
				rescueRequest: true,
			},
		});
	});
};

const completeRescueTaskIntoDB = async (userId: string, taskId: string) => {
	return updateTaskProgressIntoDB(userId, taskId, {
		status: VolunteerTaskStatus.COMPLETED,
		progressNote: "Rescue task completed",
	});
};

const createRouteReportIntoDB = async (
	userId: string,
	payload: ICreateRouteReport,
) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	const report = await prisma.fieldReport.create({
		data: {
			volunteerId: volunteer.id,
			reportType: payload.reportType,
			description: payload.description,
			latitude: payload.latitude,
			longitude: payload.longitude,
			address: payload.address,
			severity: payload.severity ?? ReportSeverity.HIGH,
		},
	});

	return report;
};

const createResourceShortageIntoDB = async (
	userId: string,
	payload: ICreateResourceShortage,
) => {
	const volunteer = await getVerifiedVolunteerFromDB(userId);

	const report = await prisma.fieldReport.create({
		data: {
			volunteerId: volunteer.id,
			reportType: FieldReportType.RESOURCE_SHORTAGE,
			description: payload.description,
			latitude: payload.latitude,
			longitude: payload.longitude,
			address: payload.address,
			severity: payload.severity ?? ReportSeverity.HIGH,
			resourceName: payload.resourceName,
			quantityNeeded: payload.quantityNeeded,
		},
	});

	return report;
};

const buildFieldReportWhere = (query: IFieldReportQuery) => {
	const andConditions: FieldReportWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
				{ address: { contains: query.searchTerm, mode: "insensitive" } },
				{ resourceName: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.reportType) {
		andConditions.push({ reportType: query.reportType });
	}

	if (query.severity) {
		andConditions.push({ severity: query.severity });
	}

	return andConditions;
};

const getMyFieldReportsFromDB = async (
	userId: string,
	query: IFieldReportQuery,
) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions = buildFieldReportWhere(query);
	andConditions.push({
		volunteer: {
			userId,
		},
	});

	const reports = await prisma.fieldReport.findMany({
		where: {
			AND: andConditions,
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.fieldReport.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: reports,
		meta: buildMeta(page, limit, total),
	};
};

const getAllFieldReportsFromDB = async (query: IFieldReportQuery) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions = buildFieldReportWhere(query);

	const reports = await prisma.fieldReport.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			volunteer: {
				select: {
					id: true,
					user: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.fieldReport.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: reports,
		meta: buildMeta(page, limit, total),
	};
};

export const volunteerService = {
	getVolunteerByUserIdFromDB,
	getVerifiedVolunteerFromDB,
	registerVolunteerIntoDB,
	getMyVolunteerProfileFromDB,
	updateMyVolunteerProfileIntoDB,
	applyForVerificationIntoDB,
	reviewVerificationIntoDB,
	updateDutyLocationIntoDB,
	getNearbyRescueRequestsFromDB,
	acceptRescueTaskIntoDB,
	rejectRescueTaskIntoDB,
	getMyRescueTasksFromDB,
	updateTaskProgressIntoDB,
	completeRescueTaskIntoDB,
	createRouteReportIntoDB,
	createResourceShortageIntoDB,
	getMyFieldReportsFromDB,
	getAllFieldReportsFromDB,
};
