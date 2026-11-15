import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import type { ICompleteProfile, IUpdateProfile } from "./user.interface";

const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
];

const getProfileFromDB = async (userId: string) => {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		omit: {
			password: true,
		},
	});

	if (!user || user.isDeleted) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return user;
};

const uploadProfilePhoto = async (file: Express.Multer.File) => {
	if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only JPEG, PNG or WEBP images are allowed",
		);
	}

	const result = await uploadToCloudinary(file.buffer, {
		resource_type: "image",
		folder: "edrms/profile-pictures",
	});

	return {
		imageUrl: result.secure_url,
		imagePublicId: result.public_id,
	};
};

// The new photo is uploaded first and the old one is deleted last,
// so a failed upload never leaves the user without an image.
const saveProfile = async (
	userId: string,
	data: IUpdateProfile | ICompleteProfile,
	file?: Express.Multer.File,
) => {
	const currentUser = await getProfileFromDB(userId);

	if ("phone" in data && data.phone && data.phone !== currentUser.phone) {
		const phoneOwner = await prisma.user.findUnique({
			where: {
				phone: data.phone,
			},
			select: {
				id: true,
			},
		});

		if (phoneOwner && phoneOwner.id !== userId) {
			throw new AppError(
				httpStatus.CONFLICT,
				"Phone number is already registered by another account",
			);
		}
	}

	const photo = file ? await uploadProfilePhoto(file) : undefined;

	let updatedUser: Awaited<ReturnType<typeof getProfileFromDB>>;

	try {
		updatedUser = await prisma.user.update({
			where: {
				id: userId,
			},
			data: {
				...data,
				...photo,
			},
			omit: {
				password: true,
			},
		});
	} catch (error) {
		// the row was not updated, so the freshly uploaded file would be orphaned
		if (photo) {
			await deleteFromCloudinary(photo.imagePublicId).catch(() => undefined);
		}

		throw error;
	}

	if (photo && currentUser.imagePublicId) {
		await deleteFromCloudinary(currentUser.imagePublicId).catch(
			() => undefined,
		);
	}

	return updatedUser;
};

const updateProfileIntoDB = async (
	userId: string,
	payload: IUpdateProfile,
	file?: Express.Multer.File,
) => {
	return saveProfile(userId, payload, file);
};

const completeProfileIntoDB = async (
	userId: string,
	payload: ICompleteProfile,
	file?: Express.Multer.File,
) => {
	return saveProfile(userId, payload, file);
};

const toggleIsSafeIntoDB = async (userId: string) => {
	const user = await getProfileFromDB(userId);

	const updatedUser = await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			isSafe: !user.isSafe,
		},
		omit: {
			password: true,
		},
	});

	return updatedUser;
};

export const userService = {
	getProfileFromDB,
	updateProfileIntoDB,
	completeProfileIntoDB,
	toggleIsSafeIntoDB,
};
