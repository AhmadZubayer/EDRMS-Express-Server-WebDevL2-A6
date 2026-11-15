import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import httpStatus from "http-status";
import {
	PostStatus,
	UserRole,
	UserStatus,
	VolunteerVerificationStatus,
} from "../../../generated/prisma/enums";
import type {
	CommunityPostWhereInput,
	DisasterWhereInput,
	ReliefOrgWhereInput,
	RescueRequestWhereInput,
	UserWhereInput,
	VolunteerWhereInput,
} from "../../../generated/prisma/models";
import config from "../../config";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/sendEmail";
import type {
	IAccountQuery,
	IAdminActor,
	IAdminListQuery,
	ICommunityPostQuery,
	ICreateAccount,
	ICreateAdmin,
	ICreateDisaster,
	ICreateRescueRequest,
	IDisasterQuery,
	IModeratePost,
	IPaginationQuery,
	IReliefOrgQuery,
	IRescueRequestQuery,
	ITableQuery,
	IUpdateAccountRole,
	IUpdateAdminStatus,
	IVerifyDisaster,
	IVerifyReliefOrg,
	IVerifyVolunteer,
	IVolunteerQuery,
} from "./admin.interface";
import { type AdminTableName, adminTables } from "./admin.tables";

// Default Dhaka coordinates, used when an admin logs a call without a map pin.
const DEFAULT_LATITUDE = 23.8103;
const DEFAULT_LONGITUDE = 90.4125;

const userPublicSelect = {
	id: true,
	name: true,
	email: true,
	phone: true,
	role: true,
	status: true,
} as const;

const isPrivilegedRole = (role: UserRole) =>
	role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const getPagination = (query: IPaginationQuery) => {
	const limit = query.limit ?? 10;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;

	return { limit, page, skip };
};

const buildMeta = (total: number, page: number, limit: number) => ({
	page,
	limit,
	total,
	totalPages: Math.max(Math.ceil(total / limit), 1),
});

const generateStrongPassword = (length = 12) => {
	const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	const lower = "abcdefghijkmnopqrstuvwxyz";
	const digits = "23456789";
	const special = "!@#$%^&*";
	const all = upper + lower + digits + special;

	const pick = (chars: string) => chars[crypto.randomInt(chars.length)];

	const characters = [pick(upper), pick(lower), pick(digits), pick(special)];
	while (characters.length < length) {
		characters.push(pick(all));
	}

	for (let i = characters.length - 1; i > 0; i--) {
		const j = crypto.randomInt(i + 1);
		[characters[i], characters[j]] = [characters[j], characters[i]];
	}

	return characters.join("");
};

const hashPassword = (password: string) =>
	bcrypt.hash(password, Number(config.bcrypt_salt_rounds) || 10);

const ensureEmailAndPhoneFree = async (email: string, phone?: string) => {
	const existing = await prisma.user.findFirst({
		where: {
			OR: [{ email }, ...(phone ? [{ phone }] : [])],
		},
		select: { email: true },
	});

	if (existing) {
		throw new AppError(
			httpStatus.CONFLICT,
			existing.email === email
				? "Email already registered"
				: "Phone number already registered",
		);
	}
};

const sendAccountCreatedEmail = async (
	user: { name: string; email: string },
	password: string,
	accountLabel: string,
) => {
	try {
		await sendEmail({
			to: user.email,
			subject: "Your account has been created",
			templateName: "admin-account-created",
			templateData: {
				name: user.name,
				email: user.email,
				password,
				accountLabel,
				loginUrl: config.frontend_url,
			},
		});
		return true;
	} catch (error) {
		logger.error(
			{ err: error, email: user.email },
			"Failed to send account created email",
		);
		return false;
	}
};

const findUserOrThrow = async (id: string, notFoundMessage: string) => {
	const user = await prisma.user.findUnique({
		where: { id },
		omit: { password: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, notFoundMessage);
	}

	return user;
};

// ---------------------------------------------------------------- accounts

const getAllAccountsFromDB = async (query: IAccountQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: UserWhereInput[] = [];

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
				{ phone: { contains: query.searchTerm } },
			],
		});
	}

	if (query.role) {
		andConditions.push({ role: query.role });
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	const where: UserWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.user.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			omit: { password: true },
		}),
		prisma.user.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const createAccountIntoDB = async (
	payload: ICreateAccount,
	actor: IAdminActor,
) => {
	const role = payload.role ?? UserRole.USER;

	if (isPrivilegedRole(role) && actor.role !== UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can create admin accounts",
		);
	}

	await ensureEmailAndPhoneFree(payload.email, payload.phone);

	const plainPassword = payload.password ?? generateStrongPassword();
	const hashedPassword = await hashPassword(plainPassword);

	const user = await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email,
			phone: payload.phone,
			password: hashedPassword,
			role,
			emailVerified: true,
			needPasswordChange: !payload.password,
		},
		omit: { password: true },
	});

	let emailSent: boolean | undefined;
	if (!payload.password) {
		emailSent = await sendAccountCreatedEmail(
			user,
			plainPassword,
			`a ${role.toLowerCase().replace("_", " ")} account`,
		);
	}

	return { user, emailSent };
};

const updateAccountRoleIntoDB = async (
	id: string,
	payload: IUpdateAccountRole,
	actor: IAdminActor,
) => {
	const target = await findUserOrThrow(id, "Account not found");

	if (target.id === actor.id) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot change your own role");
	}

	if (target.role === UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"A super admin account cannot be modified",
		);
	}

	if (target.isDeleted) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Restore the account before changing its role",
		);
	}

	if (
		(isPrivilegedRole(target.role) || isPrivilegedRole(payload.role)) &&
		actor.role !== UserRole.SUPER_ADMIN
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can assign or remove the admin role",
		);
	}

	return prisma.user.update({
		where: { id },
		data: { role: payload.role },
		omit: { password: true },
	});
};

const softDeleteAccountIntoDB = async (id: string, actor: IAdminActor) => {
	const target = await findUserOrThrow(id, "Account not found");

	if (target.id === actor.id) {
		throw new AppError(httpStatus.FORBIDDEN, "You cannot delete yourself");
	}

	if (target.role === UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"A super admin account cannot be deleted",
		);
	}

	if (target.role === UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can delete an admin account",
		);
	}

	if (target.isDeleted) {
		throw new AppError(httpStatus.CONFLICT, "Account is already deleted");
	}

	await prisma.user.update({
		where: { id },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			status: UserStatus.DELETED,
		},
	});

	return null;
};

const restoreAccountIntoDB = async (id: string, actor: IAdminActor) => {
	const target = await findUserOrThrow(id, "Account not found");

	if (target.role === UserRole.ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only a super admin can restore an admin account",
		);
	}

	if (!target.isDeleted) {
		throw new AppError(httpStatus.CONFLICT, "Account is not deleted");
	}

	return prisma.user.update({
		where: { id },
		data: { isDeleted: false, deletedAt: null, status: UserStatus.ACTIVE },
		omit: { password: true },
	});
};

// ------------------------------------------------------ super admin: admins

const createAdminIntoDB = async (payload: ICreateAdmin) => {
	await ensureEmailAndPhoneFree(payload.email, payload.phone);

	const plainPassword = generateStrongPassword();
	const hashedPassword = await hashPassword(plainPassword);

	const admin = await prisma.user.create({
		data: {
			name: payload.name,
			email: payload.email,
			phone: payload.phone,
			password: hashedPassword,
			role: UserRole.ADMIN,
			emailVerified: true,
			needPasswordChange: true,
		},
		omit: { password: true },
	});

	const emailSent = await sendAccountCreatedEmail(
		admin,
		plainPassword,
		"an administrator account",
	);

	return { admin, emailSent };
};

const getAllAdminsFromDB = async (query: IAdminListQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: UserWhereInput[] = [
		{ isDeleted: false },
		{
			role: query.role
				? query.role
				: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
		},
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ name: { contains: query.searchTerm, mode: "insensitive" } },
				{ email: { contains: query.searchTerm, mode: "insensitive" } },
				{ phone: { contains: query.searchTerm } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	const where: UserWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.user.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			omit: { password: true },
		}),
		prisma.user.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const findManageableAdminOrThrow = async (id: string, actor: IAdminActor) => {
	const target = await findUserOrThrow(id, "Admin not found");

	if (target.role === UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"A super admin account cannot be blocked, deleted or modified",
		);
	}

	if (target.role !== UserRole.ADMIN || target.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
	}

	if (target.id === actor.id) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot change your own admin account",
		);
	}

	return target;
};

const updateAdminStatusIntoDB = async (
	id: string,
	payload: IUpdateAdminStatus,
	actor: IAdminActor,
) => {
	await findManageableAdminOrThrow(id, actor);

	return prisma.user.update({
		where: { id },
		data: { status: payload.status },
		omit: { password: true },
	});
};

const deleteAdminFromDB = async (id: string, actor: IAdminActor) => {
	await findManageableAdminOrThrow(id, actor);

	await prisma.user.update({
		where: { id },
		data: {
			isDeleted: true,
			deletedAt: new Date(),
			status: UserStatus.DELETED,
		},
	});

	return null;
};

// -------------------------------------------------------------- volunteers

const getAllVolunteersFromDB = async (query: IVolunteerQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: VolunteerWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			user: {
				OR: [
					{ name: { contains: query.searchTerm, mode: "insensitive" } },
					{ email: { contains: query.searchTerm, mode: "insensitive" } },
					{ phone: { contains: query.searchTerm } },
				],
			},
		});
	}

	if (query.status) {
		andConditions.push({ verificationStatus: query.status });
	}

	const where: VolunteerWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.volunteer.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			include: { user: { select: userPublicSelect } },
		}),
		prisma.volunteer.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const verifyVolunteerIntoDB = async (id: string, payload: IVerifyVolunteer) => {
	const volunteer = await prisma.volunteer.findUnique({
		where: { id },
		include: { user: { select: { id: true, role: true } } },
	});

	if (!volunteer) {
		throw new AppError(httpStatus.NOT_FOUND, "Volunteer not found");
	}

	const isApproved = payload.status === "VERIFIED";
	const isRejected = payload.status === "REJECTED";

	return prisma.$transaction(async (tx) => {
		await tx.volunteer.update({
			where: { id },
			data: {
				verificationStatus: VolunteerVerificationStatus[payload.status],
				available: isApproved,
				...(isRejected ? { onDuty: false } : {}),
			},
		});

		if (isApproved && volunteer.user.role === UserRole.USER) {
			await tx.user.update({
				where: { id: volunteer.userId },
				data: { role: UserRole.VOLUNTEER },
			});
		} else if (isRejected && volunteer.user.role === UserRole.VOLUNTEER) {
			await tx.user.update({
				where: { id: volunteer.userId },
				data: { role: UserRole.USER },
			});
		}

		return tx.volunteer.findUniqueOrThrow({
			where: { id },
			include: { user: { select: userPublicSelect } },
		});
	});
};

// ------------------------------------------------------------- relief orgs

const getAllReliefOrgsFromDB = async (query: IReliefOrgQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: ReliefOrgWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					organizationName: { contains: query.searchTerm, mode: "insensitive" },
				},
				{
					registrationNumber: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
				{ contactEmail: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.verified !== undefined) {
		andConditions.push({ adminVerified: query.verified === "true" });
	}

	const where: ReliefOrgWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.reliefOrg.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			include: { user: { select: userPublicSelect } },
		}),
		prisma.reliefOrg.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const verifyReliefOrgIntoDB = async (id: string, payload: IVerifyReliefOrg) => {
	const org = await prisma.reliefOrg.findUnique({ where: { id } });

	if (!org) {
		throw new AppError(httpStatus.NOT_FOUND, "Relief organization not found");
	}

	return prisma.reliefOrg.update({
		where: { id },
		data: { adminVerified: payload.verified },
		include: { user: { select: userPublicSelect } },
	});
};

// --------------------------------------------------------------- disasters

const getAllDisastersFromDB = async (query: IDisasterQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: DisasterWhereInput[] = [{ isDeleted: false }];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ disasterName: { contains: query.searchTerm, mode: "insensitive" } },
				{
					impactedLocation: { contains: query.searchTerm, mode: "insensitive" },
				},
			],
		});
	}

	if (query.verified !== undefined) {
		andConditions.push({ isVerified: query.verified === "true" });
	}

	if (query.type) {
		andConditions.push({ type: query.type });
	}

	const where: DisasterWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.disaster.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.disaster.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const createDisasterIntoDB = async (payload: ICreateDisaster) => {
	return prisma.disaster.create({
		data: {
			disasterName: payload.disasterName,
			type: payload.type,
			impactedLocation: payload.impactedLocation,
			impactTime: payload.impactTime ?? new Date(),
			isVerified: payload.isVerified ?? true,
		},
	});
};

const verifyDisasterIntoDB = async (id: string, payload: IVerifyDisaster) => {
	const disaster = await prisma.disaster.findFirst({
		where: { id, isDeleted: false },
	});

	if (!disaster) {
		throw new AppError(httpStatus.NOT_FOUND, "Disaster not found");
	}

	return prisma.disaster.update({
		where: { id },
		data: { isVerified: payload.verified },
	});
};

// ---------------------------------------------------------- rescue requests

const getAllRescueRequestsFromDB = async (query: IRescueRequestQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: RescueRequestWhereInput[] = [{ isDeleted: false }];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ description: { contains: query.searchTerm, mode: "insensitive" } },
				{ address: { contains: query.searchTerm, mode: "insensitive" } },
				{ contactPhone: { contains: query.searchTerm } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	if (query.urgencyLevel) {
		andConditions.push({ urgencyLevel: query.urgencyLevel });
	}

	const where: RescueRequestWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.rescueRequest.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			include: {
				user: { select: userPublicSelect },
				assignedRescuer: { select: userPublicSelect },
			},
		}),
		prisma.rescueRequest.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const createRescueRequestIntoDB = async (
	payload: ICreateRescueRequest,
	adminId: string,
) => {
	const userId = payload.userId ?? adminId;

	const requester = await prisma.user.findFirst({
		where: { id: userId, isDeleted: false },
		select: { id: true },
	});

	if (!requester) {
		throw new AppError(httpStatus.NOT_FOUND, "Requester user not found");
	}

	return prisma.rescueRequest.create({
		data: {
			userId,
			contactPhone: payload.contactPhone,
			address: payload.address,
			latitude: payload.latitude ?? DEFAULT_LATITUDE,
			longitude: payload.longitude ?? DEFAULT_LONGITUDE,
			peopleCount: payload.peopleCount,
			urgencyLevel: payload.urgencyLevel,
			description: payload.description,
			medicalNotes: payload.medicalNotes,
		},
	});
};

// --------------------------------------------------------- community posts

const getAllCommunityPostsFromDB = async (query: ICommunityPostQuery) => {
	const { limit, page, skip } = getPagination(query);
	const sortBy = query.sortBy ?? "createdAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: CommunityPostWhereInput[] = [];

	if (query.includeDeleted !== "true") {
		andConditions.push({ isDeleted: false });
	}

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{ body: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.status) {
		andConditions.push({ status: query.status });
	}

	const where: CommunityPostWhereInput = { AND: andConditions };

	const [data, total] = await Promise.all([
		prisma.communityPost.findMany({
			where,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
			include: { author: { select: userPublicSelect } },
		}),
		prisma.communityPost.count({ where }),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

const findPostOrThrow = async (id: string) => {
	const post = await prisma.communityPost.findUnique({ where: { id } });

	if (!post) {
		throw new AppError(httpStatus.NOT_FOUND, "Community post not found");
	}

	return post;
};

const moderateCommunityPostIntoDB = async (
	id: string,
	payload: IModeratePost,
) => {
	await findPostOrThrow(id);

	return prisma.communityPost.update({
		where: { id },
		data: { status: payload.status },
	});
};

const softDeleteCommunityPostIntoDB = async (id: string) => {
	const post = await findPostOrThrow(id);

	if (post.isDeleted) {
		throw new AppError(
			httpStatus.CONFLICT,
			"Community post is already deleted",
		);
	}

	await prisma.communityPost.update({
		where: { id },
		data: {
			status: PostStatus.REMOVED,
			isDeleted: true,
			deletedAt: new Date(),
		},
	});

	return null;
};

const restoreCommunityPostIntoDB = async (id: string) => {
	const post = await findPostOrThrow(id);

	if (!post.isDeleted) {
		throw new AppError(httpStatus.CONFLICT, "Community post is not deleted");
	}

	return prisma.communityPost.update({
		where: { id },
		data: { status: PostStatus.POSTED, isDeleted: false, deletedAt: null },
	});
};

// ----------------------------------------------------------------- reports

const toCountMap = <K extends string>(
	keys: readonly K[],
	rows: { key: K; count: number }[],
) => {
	const result = Object.fromEntries(keys.map((key) => [key, 0])) as Record<
		K,
		number
	>;

	for (const row of rows) {
		result[row.key] = row.count;
	}

	return result;
};

const generateReportFromDB = async () => {
	const [
		usersByRole,
		volunteersByStatus,
		rescueByStatus,
		postsByStatus,
		totalDisasters,
		verifiedDisasters,
		donationTotal,
		openMissingPersons,
	] = await Promise.all([
		prisma.user.groupBy({
			by: ["role"],
			where: { isDeleted: false },
			_count: { _all: true },
		}),
		prisma.volunteer.groupBy({
			by: ["verificationStatus"],
			_count: { _all: true },
		}),
		prisma.rescueRequest.groupBy({
			by: ["status"],
			where: { isDeleted: false },
			_count: { _all: true },
		}),
		prisma.communityPost.groupBy({
			by: ["status"],
			where: { isDeleted: false },
			_count: { _all: true },
		}),
		prisma.disaster.count({ where: { isDeleted: false } }),
		prisma.disaster.count({ where: { isDeleted: false, isVerified: true } }),
		prisma.donation.aggregate({
			where: { status: "PAID" },
			_sum: { amount: true },
			_count: { _all: true },
		}),
		prisma.missingPerson.count({
			where: { isDeleted: false, status: "MISSING" },
		}),
	]);

	const roleCounts = toCountMap(
		Object.values(UserRole),
		usersByRole.map((row) => ({ key: row.role, count: row._count._all })),
	);

	return {
		users: {
			total: Object.values(roleCounts).reduce((sum, count) => sum + count, 0),
			byRole: roleCounts,
		},
		volunteers: {
			byVerificationStatus: toCountMap(
				Object.values(VolunteerVerificationStatus),
				volunteersByStatus.map((row) => ({
					key: row.verificationStatus,
					count: row._count._all,
				})),
			),
		},
		rescueRequests: {
			byStatus: toCountMap(
				[
					"PENDING",
					"ACKNOWLEDGED",
					"DISPATCHED",
					"IN_PROGRESS",
					"RESCUED",
					"CANCELLED",
				] as const,
				rescueByStatus.map((row) => ({
					key: row.status,
					count: row._count._all,
				})),
			),
		},
		disasters: {
			total: totalDisasters,
			verified: verifiedDisasters,
			unverified: totalDisasters - verifiedDisasters,
		},
		donations: {
			totalRaised: Number(donationTotal._sum.amount ?? 0),
			paidDonationCount: donationTotal._count._all,
		},
		missingPersons: {
			open: openMissingPersons,
		},
		communityPosts: {
			byStatus: toCountMap(
				Object.values(PostStatus),
				postsByStatus.map((row) => ({
					key: row.status,
					count: row._count._all,
				})),
			),
		},
		generatedAt: new Date(),
	};
};

// ------------------------------------------------------------------ tables

const getAllTablesFromDB = async () => {
	const entries = Object.entries(adminTables);

	return Promise.all(
		entries.map(async ([tableName, entry]) => ({
			tableName,
			name: entry.model,
			count: await entry.count(),
		})),
	);
};

const getTableDataFromDB = async (
	tableName: AdminTableName,
	query: ITableQuery,
) => {
	const entry = adminTables[tableName];

	if (!entry) {
		throw new AppError(httpStatus.NOT_FOUND, `Table ${tableName} not found`);
	}

	const { limit, page, skip } = getPagination(query);

	const [data, total] = await Promise.all([
		entry.findMany({ skip, take: limit }),
		entry.count(),
	]);

	return { data, meta: buildMeta(total, page, limit) };
};

export const adminService = {
	getAllAccountsFromDB,
	createAccountIntoDB,
	updateAccountRoleIntoDB,
	softDeleteAccountIntoDB,
	restoreAccountIntoDB,
	createAdminIntoDB,
	getAllAdminsFromDB,
	updateAdminStatusIntoDB,
	deleteAdminFromDB,
	getAllVolunteersFromDB,
	verifyVolunteerIntoDB,
	getAllReliefOrgsFromDB,
	verifyReliefOrgIntoDB,
	getAllDisastersFromDB,
	createDisasterIntoDB,
	verifyDisasterIntoDB,
	getAllRescueRequestsFromDB,
	createRescueRequestIntoDB,
	getAllCommunityPostsFromDB,
	moderateCommunityPostIntoDB,
	softDeleteCommunityPostIntoDB,
	restoreCommunityPostIntoDB,
	generateReportFromDB,
	getAllTablesFromDB,
	getTableDataFromDB,
};
