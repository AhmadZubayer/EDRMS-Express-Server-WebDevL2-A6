import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import {
	GroupJoinStatus,
	GroupTargetType,
	OrganizationRequestStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";
import type {
	OrganizationVolunteerRequestWhereInput,
	VolunteerGroupJoinWhereInput,
	VolunteerOrganizationJoinWhereInput,
} from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { volunteerService } from "../volunteer/volunteer.service";
import type {
	IApplicationsQuery,
	ICreateOrganizationRequest,
	IGroupJoinsQuery,
	IJoinGroup,
	IMyJoinsQuery,
	IOrganizationRequestQuery,
	IPaginationQuery,
	IReviewApplication,
	IUpdateOrganizationRequest,
} from "./volunteerNetwork.interface";

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

const approvedJoinsCount = {
	_count: {
		select: {
			joins: {
				where: {
					status: GroupJoinStatus.APPROVED,
				},
			},
		},
	},
} as const;

const organizationUserSelect = {
	select: {
		id: true,
		name: true,
	},
} as const;

const toRequestWithJoinedCount = <T extends { _count: { joins: number } }>({
	_count,
	...request
}: T) => ({
	...request,
	joinedVolunteers: _count.joins,
});

const isPrismaError = (error: unknown, code: string) => {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
	);
};

const getOwnedOrganizationRequest = async (
	organizationUserId: string,
	id: string,
) => {
	const request = await prisma.organizationVolunteerRequest.findFirst({
		where: {
			id,
			isDeleted: false,
		},
	});

	if (!request) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Organization volunteer request not found",
		);
	}

	if (request.organizationUserId !== organizationUserId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only manage your own volunteer requests",
		);
	}

	return request;
};

const getOrganizationApplicationsFromDB = async (
	organizationUserId: string,
	query: IApplicationsQuery,
) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "joinedAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: VolunteerOrganizationJoinWhereInput[] = [
		{
			organizationRequest: {
				organizationUserId,
				isDeleted: false,
			},
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					volunteer: {
						user: { name: { contains: query.searchTerm, mode: "insensitive" } },
					},
				},
				{
					organizationRequest: {
						title: { contains: query.searchTerm, mode: "insensitive" },
					},
				},
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.organizationRequestId) {
		andConditions.push({ organizationRequestId: query.organizationRequestId });
	}

	const applications = await prisma.volunteerOrganizationJoin.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			organizationRequest: {
				select: {
					id: true,
					title: true,
					status: true,
					neededVolunteers: true,
				},
			},
			volunteer: {
				select: {
					id: true,
					userId: true,
					skills: true,
					whyJoin: true,
					available: true,
					verificationStatus: true,
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

	const total = await prisma.volunteerOrganizationJoin.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: applications,
		meta: buildMeta(page, limit, total),
	};
};

const reviewOrganizationApplicationIntoDB = async (
	organizationUserId: string,
	applicationId: string,
	payload: IReviewApplication,
) => {
	try {
		return await prisma.$transaction(
			async (transaction) => {
				const application =
					await transaction.volunteerOrganizationJoin.findUnique({
						where: {
							id: applicationId,
						},
						include: {
							organizationRequest: true,
						},
					});

				if (!application || application.organizationRequest.isDeleted) {
					throw new AppError(httpStatus.NOT_FOUND, "Application not found");
				}

				const group = application.organizationRequest;

				if (group.organizationUserId !== organizationUserId) {
					throw new AppError(
						httpStatus.FORBIDDEN,
						"You can only review applications to your own groups",
					);
				}

				if (application.status !== GroupJoinStatus.PENDING) {
					throw new AppError(
						httpStatus.CONFLICT,
						"This application has already been reviewed",
					);
				}

				if (payload.status === GroupJoinStatus.APPROVED) {
					const volunteer = await transaction.volunteer.findUnique({
						where: {
							id: application.volunteerId,
						},
						select: {
							verificationStatus: true,
						},
					});

					if (
						volunteer?.verificationStatus !==
						VolunteerVerificationStatus.VERIFIED
					) {
						throw new AppError(
							httpStatus.BAD_REQUEST,
							"Only verified volunteers can be added to a group",
						);
					}

					const approvedCount =
						await transaction.volunteerOrganizationJoin.count({
							where: {
								organizationRequestId: group.id,
								status: GroupJoinStatus.APPROVED,
							},
						});

					if (
						group.status !== OrganizationRequestStatus.OPEN ||
						approvedCount >= group.neededVolunteers
					) {
						throw new AppError(
							httpStatus.CONFLICT,
							"This group is closed or already at capacity",
						);
					}

					// the last seat closes the group
					if (approvedCount + 1 >= group.neededVolunteers) {
						await transaction.organizationVolunteerRequest.updateMany({
							where: {
								id: group.id,
								status: OrganizationRequestStatus.OPEN,
							},
							data: {
								status: OrganizationRequestStatus.CLOSED,
							},
						});
					}
				}

				const result = await transaction.volunteerOrganizationJoin.updateMany({
					where: {
						id: application.id,
						status: GroupJoinStatus.PENDING,
					},
					data: {
						status: payload.status,
					},
				});

				if (result.count === 0) {
					throw new AppError(
						httpStatus.CONFLICT,
						"This application has already been reviewed",
					);
				}

				return transaction.volunteerOrganizationJoin.findUniqueOrThrow({
					where: {
						id: application.id,
					},
					include: {
						organizationRequest: {
							select: {
								id: true,
								title: true,
								status: true,
							},
						},
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
				});
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
			},
		);
	} catch (error) {
		if (isPrismaError(error, "P2034")) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Another review is in progress. Please try again",
			);
		}

		throw error;
	}
};

const createOrganizationRequestIntoDB = async (
	organizationUserId: string,
	payload: ICreateOrganizationRequest,
) => {
	const request = await prisma.organizationVolunteerRequest.create({
		data: {
			organizationUserId,
			title: payload.title,
			description: payload.description,
			requiredSkills: payload.requiredSkills,
			location: payload.location,
			neededVolunteers: payload.neededVolunteers,
			disasterName: payload.disasterName,
			status: payload.status ?? OrganizationRequestStatus.OPEN,
		},
	});

	return request;
};

const getMyCreatedOrganizationRequestsFromDB = async (
	organizationUserId: string,
	query: IOrganizationRequestQuery,
) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: OrganizationVolunteerRequestWhereInput[] = [
		{
			organizationUserId,
			isDeleted: false,
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
				{ location: { contains: query.searchTerm, mode: "insensitive" } },
				{ disasterName: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	const requests = await prisma.organizationVolunteerRequest.findMany({
		where: {
			AND: andConditions,
		},
		include: approvedJoinsCount,
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.organizationVolunteerRequest.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: requests.map(toRequestWithJoinedCount),
		meta: buildMeta(page, limit, total),
	};
};

const updateOrganizationRequestIntoDB = async (
	organizationUserId: string,
	id: string,
	payload: IUpdateOrganizationRequest,
) => {
	await getOwnedOrganizationRequest(organizationUserId, id);

	return prisma.$transaction(async (transaction) => {
		const request = await transaction.organizationVolunteerRequest.findFirst({
			where: {
				id,
				isDeleted: false,
			},
		});

		if (!request) {
			throw new AppError(
				httpStatus.NOT_FOUND,
				"Organization volunteer request not found",
			);
		}

		const approvedCount = await transaction.volunteerOrganizationJoin.count({
			where: {
				organizationRequestId: id,
				status: GroupJoinStatus.APPROVED,
			},
		});

		const neededVolunteers =
			payload.neededVolunteers ?? request.neededVolunteers;
		const status = payload.status ?? request.status;

		if (neededVolunteers < approvedCount) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Needed volunteers cannot be lower than the volunteers already approved",
			);
		}

		if (
			status === OrganizationRequestStatus.OPEN &&
			approvedCount >= neededVolunteers
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Increase the needed volunteers before reopening a full group",
			);
		}

		return transaction.organizationVolunteerRequest.update({
			where: {
				id,
			},
			data: {
				title: payload.title,
				description: payload.description,
				requiredSkills: payload.requiredSkills,
				location: payload.location,
				neededVolunteers: payload.neededVolunteers,
				disasterName: payload.disasterName,
				status: payload.status,
			},
		});
	});
};

const deleteOrganizationRequestFromDB = async (
	organizationUserId: string,
	id: string,
) => {
	await getOwnedOrganizationRequest(organizationUserId, id);

	const request = await prisma.organizationVolunteerRequest.update({
		where: {
			id,
		},
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			status: OrganizationRequestStatus.CLOSED,
		},
	});

	return request;
};

const getOpenOrganizationRequestsFromDB = async (
	userId: string,
	query: IOrganizationRequestQuery,
) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: OrganizationVolunteerRequestWhereInput[] = [
		{
			isDeleted: false,
			status: OrganizationRequestStatus.OPEN,
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
				{ location: { contains: query.searchTerm, mode: "insensitive" } },
				{ disasterName: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	const volunteer = await prisma.volunteer.findUnique({
		where: {
			userId,
		},
		select: {
			skills: true,
		},
	});

	const volunteerSkills = new Set<string>(volunteer?.skills ?? []);
	const viewerJoins = {
		joins: {
			where: { volunteer: { userId } },
			select: { status: true },
			take: 1,
		},
	} as const;

	const withSkillMatch = <
		T extends {
			requiredSkills: string[];
			_count: { joins: number };
			joins: { status: GroupJoinStatus }[];
		},
	>(
		request: T,
	) => ({
		...toRequestWithJoinedCount(request),
		applicationStatus: request.joins[0]?.status ?? null,
		matchedSkills: request.requiredSkills.filter((skill) =>
			volunteerSkills.has(skill),
		).length,
	});

	const total = await prisma.organizationVolunteerRequest.count({
		where: {
			AND: andConditions,
		},
	});

	// skill match is computed per volunteer, so it is sorted in memory over the open requests
	if (query.sortBy === "skillMatch") {
		const requests = await prisma.organizationVolunteerRequest.findMany({
			where: {
				AND: andConditions,
			},
			include: {
				...approvedJoinsCount,
				...viewerJoins,
				organizationUser: organizationUserSelect,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		const sorted = requests
			.map(withSkillMatch)
			.sort((first, second) =>
				sortOrder === "asc"
					? first.matchedSkills - second.matchedSkills
					: second.matchedSkills - first.matchedSkills,
			);

		return {
			data: sorted.slice(skip, skip + limit),
			meta: buildMeta(page, limit, total),
		};
	}

	const requests = await prisma.organizationVolunteerRequest.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			...approvedJoinsCount,
			...viewerJoins,
			organizationUser: organizationUserSelect,
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	return {
		data: requests.map(withSkillMatch),
		meta: buildMeta(page, limit, total),
	};
};

const joinOrganizationRequestIntoDB = async (
	userId: string,
	requestId: string,
) => {
	const volunteer = await volunteerService.getVerifiedVolunteerFromDB(userId);

	try {
		return await prisma.$transaction(async (transaction) => {
			const request = await transaction.organizationVolunteerRequest.findFirst({
				where: {
					id: requestId,
					isDeleted: false,
					status: OrganizationRequestStatus.OPEN,
				},
			});

			if (!request) {
				throw new AppError(
					httpStatus.NOT_FOUND,
					"Open organization volunteer request not found",
				);
			}

			const existingJoin =
				await transaction.volunteerOrganizationJoin.findUnique({
					where: {
						volunteerId_organizationRequestId: {
							volunteerId: volunteer.id,
							organizationRequestId: request.id,
						},
					},
					select: {
						id: true,
					},
				});

			if (existingJoin) {
				throw new AppError(
					httpStatus.CONFLICT,
					"You have already applied to this volunteer group",
				);
			}

			const approvedCount = await transaction.volunteerOrganizationJoin.count({
				where: {
					organizationRequestId: request.id,
					status: GroupJoinStatus.APPROVED,
				},
			});

			if (approvedCount >= request.neededVolunteers) {
				throw new AppError(
					httpStatus.CONFLICT,
					"This organization request already has enough volunteers",
				);
			}

			return transaction.volunteerOrganizationJoin.create({
				data: {
					volunteerId: volunteer.id,
					organizationRequestId: request.id,
					status: GroupJoinStatus.PENDING,
				},
				include: {
					organizationRequest: {
						select: {
							id: true,
							title: true,
							location: true,
							status: true,
						},
					},
				},
			});
		});
	} catch (error) {
		if (isPrismaError(error, "P2002")) {
			throw new AppError(
				httpStatus.CONFLICT,
				"You have already applied to this volunteer group",
			);
		}

		throw error;
	}
};

const getMyOrganizationJoinsFromDB = async (
	userId: string,
	query: IMyJoinsQuery,
) => {
	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "joinedAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: VolunteerOrganizationJoinWhereInput[] = [
		{
			volunteer: {
				userId,
			},
		},
	];

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.searchTerm) {
		andConditions.push({
			organizationRequest: {
				OR: [
					{ title: { contains: query.searchTerm, mode: "insensitive" } },
					{ location: { contains: query.searchTerm, mode: "insensitive" } },
					{ disasterName: { contains: query.searchTerm, mode: "insensitive" } },
				],
			},
		});
	}

	const joins = await prisma.volunteerOrganizationJoin.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			organizationRequest: {
				select: {
					id: true,
					organizationUserId: true,
					title: true,
					description: true,
					requiredSkills: true,
					location: true,
					neededVolunteers: true,
					disasterName: true,
					status: true,
					isDeleted: true,
					organizationUser: organizationUserSelect,
				},
			},
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.volunteerOrganizationJoin.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: joins,
		meta: buildMeta(page, limit, total),
	};
};

const joinGroupIntoDB = async (
	userId: string,
	targetType: GroupTargetType,
	targetId: string,
	payload: IJoinGroup,
) => {
	const volunteer = await volunteerService.getVerifiedVolunteerFromDB(userId);

	try {
		return await prisma.$transaction(
			async (transaction) => {
				// the target is polymorphic, so its existence is checked by hand
				const target =
					targetType === GroupTargetType.RESCUE_REQUEST
						? await transaction.rescueRequest.findFirst({
								where: {
									id: targetId,
									isDeleted: false,
								},
								select: {
									id: true,
								},
							})
						: await transaction.missingPerson.findFirst({
								where: {
									id: targetId,
									isDeleted: false,
								},
								select: {
									id: true,
								},
							});

				if (!target) {
					throw new AppError(
						httpStatus.NOT_FOUND,
						targetType === GroupTargetType.RESCUE_REQUEST
							? "Rescue request not found"
							: "Missing person report not found",
					);
				}

				const existingJoin = await transaction.volunteerGroupJoin.findFirst({
					where: {
						volunteerId: volunteer.id,
						targetType,
						targetId,
					},
					select: {
						id: true,
					},
				});

				if (existingJoin) {
					throw new AppError(
						httpStatus.CONFLICT,
						"You have already submitted a join request for this group",
					);
				}

				return transaction.volunteerGroupJoin.create({
					data: {
						volunteerId: volunteer.id,
						targetType,
						targetId,
						whyJoin: payload.whyJoin,
					},
				});
			},
			{
				isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
			},
		);
	} catch (error) {
		if (isPrismaError(error, "P2034")) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Join request conflicted. Please try again",
			);
		}

		throw error;
	}
};

const joinRescueGroupIntoDB = async (
	userId: string,
	rescueRequestId: string,
	payload: IJoinGroup,
) => {
	return joinGroupIntoDB(
		userId,
		GroupTargetType.RESCUE_REQUEST,
		rescueRequestId,
		payload,
	);
};

const joinMissingPersonGroupIntoDB = async (
	userId: string,
	missingPersonId: string,
	payload: IJoinGroup,
) => {
	return joinGroupIntoDB(
		userId,
		GroupTargetType.MISSING_PERSON,
		missingPersonId,
		payload,
	);
};

const getMyGroupJoinsFromDB = async (
	userId: string,
	query: IGroupJoinsQuery,
) => {
	const volunteer = await volunteerService.getVolunteerByUserIdFromDB(userId);

	const { page, limit, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: VolunteerGroupJoinWhereInput[] = [
		{
			volunteerId: volunteer.id,
		},
	];

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.targetType) {
		andConditions.push({ targetType: query.targetType });
	}

	if (query.searchTerm) {
		andConditions.push({
			whyJoin: { contains: query.searchTerm, mode: "insensitive" },
		});
	}

	const joins = await prisma.volunteerGroupJoin.findMany({
		where: {
			AND: andConditions,
		},
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.volunteerGroupJoin.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: joins,
		meta: buildMeta(page, limit, total),
	};
};

export const volunteerNetworkService = {
	getOrganizationApplicationsFromDB,
	reviewOrganizationApplicationIntoDB,
	createOrganizationRequestIntoDB,
	getMyCreatedOrganizationRequestsFromDB,
	updateOrganizationRequestIntoDB,
	deleteOrganizationRequestFromDB,
	getOpenOrganizationRequestsFromDB,
	joinOrganizationRequestIntoDB,
	getMyOrganizationJoinsFromDB,
	joinRescueGroupIntoDB,
	joinMissingPersonGroupIntoDB,
	getMyGroupJoinsFromDB,
};
