import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/client";
import { UserRole } from "../../../generated/prisma/enums";
import type { ReliefOrgWhereInput } from "../../../generated/prisma/models";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { sendEmail } from "../../utils/sendEmail";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import type { IReliefOrgQuery, ISignUpReliefOrg } from "./reliefOrg.interface";

const ALLOWED_DOC_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB per document

// verification documents are private: only the owner and admins can read them
const publicReliefOrgOmit = {
	verificationDocs: true,
} as const;

const activeSheltersInclude = {
	where: {
		isDeleted: false,
	},
	orderBy: {
		createdAt: "desc",
	},
} as const;

const signUpAsReliefOrgIntoDB = async (
	user: RequestUser,
	payload: ISignUpReliefOrg,
	files: Express.Multer.File[],
) => {
	if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Admin accounts cannot register as a relief organization",
		);
	}

	if (!files || files.length === 0) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"At least one verification document is required (PDF, PNG, JPG)",
		);
	}

	for (const file of files) {
		if (!ALLOWED_DOC_MIME_TYPES.includes(file.mimetype)) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Unsupported file type for ${file.originalname}. Allowed: PDF, JPG, PNG, WEBP`,
			);
		}

		if (file.size > MAX_DOC_SIZE) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`${file.originalname} exceeds the 10 MB size limit`,
			);
		}
	}

	const existingOrg = await prisma.reliefOrg.findFirst({
		where: {
			OR: [
				{ userId: user.id },
				{ registrationNumber: payload.registrationNumber },
			],
		},
		select: {
			userId: true,
		},
	});

	if (existingOrg) {
		throw new AppError(
			httpStatus.CONFLICT,
			existingOrg.userId === user.id
				? "A relief organization registration already exists for this user account"
				: "A relief organization with this registration number already exists",
		);
	}

	// network calls stay outside the transaction
	const uploaded: { url: string; publicId: string }[] = [];

	try {
		for (const file of files) {
			const result = await uploadToCloudinary(file.buffer, {
				resource_type: "auto",
				folder: "edrms/relief-org-docs",
			});

			uploaded.push({ url: result.secure_url, publicId: result.public_id });
		}

		return await prisma.$transaction(async (transaction) => {
			const reliefOrg = await transaction.reliefOrg.create({
				data: {
					...payload,
					userId: user.id,
					verificationDocs: uploaded.map((doc) => doc.url),
					adminVerified: false,
				},
			});

			await transaction.user.update({
				where: {
					id: user.id,
				},
				data: {
					role: UserRole.RELIEF_ORG,
				},
			});

			return reliefOrg;
		});
	} catch (error) {
		await Promise.allSettled(
			uploaded.map((doc) => deleteFromCloudinary(doc.publicId)),
		);

		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			throw new AppError(
				httpStatus.CONFLICT,
				"A relief organization with this user or registration number already exists",
			);
		}

		throw error;
	}
};

const verifyReliefOrgIntoDB = async (id: string) => {
	const result = await prisma.$transaction(async (transaction) => {
		const reliefOrg = await transaction.reliefOrg.findUnique({
			where: {
				id,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				},
			},
		});

		if (!reliefOrg) {
			throw new AppError(httpStatus.NOT_FOUND, "Relief organization not found");
		}

		if (reliefOrg.adminVerified) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Relief organization is already verified",
			);
		}

		const verifiedOrg = await transaction.reliefOrg.update({
			where: {
				id,
			},
			data: {
				adminVerified: true,
			},
		});

		// admins keep their role; everyone else becomes a relief organization account
		if (
			reliefOrg.user.role !== UserRole.ADMIN &&
			reliefOrg.user.role !== UserRole.SUPER_ADMIN
		) {
			await transaction.user.update({
				where: {
					id: reliefOrg.user.id,
				},
				data: {
					role: UserRole.RELIEF_ORG,
				},
			});
		}

		return { verifiedOrg, owner: reliefOrg.user };
	});

	await sendEmail({
		to: result.owner.email,
		subject: "Your relief organization has been verified",
		templateName: "relief-org-verified",
		templateData: {
			name: result.owner.name,
			organizationName: result.verifiedOrg.organizationName,
		},
	}).catch((error) => {
		logger.error(
			{ err: error },
			"Failed to send relief org verification email",
		);
	});

	return result.verifiedOrg;
};

const getMyReliefOrgProfileFromDB = async (userId: string) => {
	const reliefOrg = await prisma.reliefOrg.findUnique({
		where: {
			userId,
		},
		include: {
			shelters: activeSheltersInclude,
		},
	});

	if (!reliefOrg) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Relief organization profile not found",
		);
	}

	return reliefOrg;
};

const getAllReliefOrgsFromDB = async (query: IReliefOrgQuery) => {
	const limit = query.limit ? Number(query.limit) : 10;
	const page = query.page ? Number(query.page) : 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ? query.sortBy : "createdAt";
	const sortOrder = query.sortOrder ? query.sortOrder : "desc";

	const andConditions: ReliefOrgWhereInput[] = [];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{
					organizationName: { contains: query.searchTerm, mode: "insensitive" },
				},
				{ address: { contains: query.searchTerm, mode: "insensitive" } },
				{
					registrationNumber: {
						contains: query.searchTerm,
						mode: "insensitive",
					},
				},
			],
		});
	}

	if (query.adminVerified !== undefined) {
		andConditions.push({ adminVerified: query.adminVerified === "true" });
	}

	if (query.organizationType) {
		andConditions.push({
			organizationType: { equals: query.organizationType, mode: "insensitive" },
		});
	}

	const reliefOrgs = await prisma.reliefOrg.findMany({
		where: {
			AND: andConditions,
		},
		include: {
			shelters: activeSheltersInclude,
		},
		omit: publicReliefOrgOmit,
		take: limit,
		skip,
		orderBy: {
			[sortBy]: sortOrder,
		},
	});

	const total = await prisma.reliefOrg.count({
		where: {
			AND: andConditions,
		},
	});

	return {
		data: reliefOrgs,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getReliefOrgByIdFromDB = async (id: string) => {
	const reliefOrg = await prisma.reliefOrg.findUnique({
		where: {
			id,
		},
		include: {
			shelters: activeSheltersInclude,
		},
		omit: publicReliefOrgOmit,
	});

	if (!reliefOrg) {
		throw new AppError(httpStatus.NOT_FOUND, "Relief organization not found");
	}

	return reliefOrg;
};

const getReliefOrgDocumentsFromDB = async (id: string) => {
	const reliefOrg = await prisma.reliefOrg.findUnique({
		where: {
			id,
		},
		select: {
			id: true,
			organizationName: true,
			registrationNumber: true,
			adminVerified: true,
			verificationDocs: true,
		},
	});

	if (!reliefOrg) {
		throw new AppError(httpStatus.NOT_FOUND, "Relief organization not found");
	}

	return reliefOrg;
};

export const reliefOrgService = {
	signUpAsReliefOrgIntoDB,
	verifyReliefOrgIntoDB,
	getMyReliefOrgProfileFromDB,
	getAllReliefOrgsFromDB,
	getReliefOrgByIdFromDB,
	getReliefOrgDocumentsFromDB,
};
