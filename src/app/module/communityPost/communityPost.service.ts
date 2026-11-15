import type { Request } from "express";
import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import {
	PostStatus,
	ReactionType,
	TrashItemType,
	UserRole,
	UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { logger } from "../../lib/logger";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from "../../utils/uploadToCloudinary";
import { trashService } from "../trash/trash.service";
import type {
	ICommentQuery,
	ICreateComment,
	ICreateCommunityPost,
	IPostQuery,
	IReactionCounts,
	IReactToPost,
	IReportPost,
	IUpdateCommunityPost,
	IUpdatePostStatus,
	IViewer,
} from "./communityPost.interface";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"video/mp4",
	"video/x-matroska",
	"video/mkv",
	"video/x-mkv",
	"application/x-matroska",
];

const MEDIA_FOLDER = "edrms/community-posts";

const authorSelect = {
	id: true,
	name: true,
	role: true,
	city: true,
} satisfies Prisma.UserSelect;

const postInclude = {
	author: { select: authorSelect },
	_count: { select: { comments: true, reactions: true } },
} satisfies Prisma.CommunityPostInclude;

type PostWithRelations = Prisma.CommunityPostGetPayload<{
	include: typeof postInclude;
}>;

type AuthorInfo = { name: string; role: string; city: string | null };

const isAdminRole = (role: string) =>
	role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const formatPostedBy = (author?: AuthorInfo | null) => ({
	name: author?.name ?? null,
	role: author?.role ?? UserRole.USER,
	location: author?.city ?? null,
});

const emptyReactionCounts = (total = 0): IReactionCounts => ({
	total,
	like: 0,
	care: 0,
	sad: 0,
	dislike: 0,
});

// Per-type reaction counts for a set of posts in a single query
const getReactionBreakdown = async (postIds: string[]) => {
	const breakdown = new Map<string, IReactionCounts>();

	if (postIds.length === 0) {
		return breakdown;
	}

	const groups = await prisma.communityPostReaction.groupBy({
		by: ["postId", "type"],
		where: { postId: { in: postIds } },
		_count: { _all: true },
	});

	for (const group of groups) {
		const counts = breakdown.get(group.postId) ?? emptyReactionCounts();
		const count = group._count._all;

		counts.total += count;
		if (group.type === ReactionType.LIKE) counts.like += count;
		else if (group.type === ReactionType.CARE) counts.care += count;
		else if (group.type === ReactionType.SAD) counts.sad += count;
		else if (group.type === ReactionType.DISLIKE) counts.dislike += count;

		breakdown.set(group.postId, counts);
	}

	return breakdown;
};

const formatPost = (
	post: PostWithRelations,
	breakdown: Map<string, IReactionCounts>,
) => {
	const { author, _count, ...rest } = post;

	return {
		...rest,
		postedBy: formatPostedBy(author),
		reactions: breakdown.get(post.id) ?? emptyReactionCounts(_count.reactions),
		totalComments: _count.comments,
	};
};

const getActivePostOrThrow = async (id: string) => {
	const post = await prisma.communityPost.findFirst({
		where: {
			id,
			isDeleted: false,
			status: { not: PostStatus.REMOVED },
		},
	});

	if (!post) {
		throw new AppError(httpStatus.NOT_FOUND, "Community post not found");
	}

	return post;
};

const uploadMediaFiles = async (files: Express.Multer.File[]) => {
	for (const file of files) {
		if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, MP4, MKV`,
			);
		}
	}

	const results = await Promise.all(
		files.map((file) =>
			uploadToCloudinary(file.buffer, {
				resource_type: "auto",
				folder: MEDIA_FOLDER,
			}),
		),
	);

	return results.map((result) => ({
		url: result.secure_url,
		publicId: result.public_id,
	}));
};

const cleanupUploads = async (uploaded: { publicId: string }[]) => {
	await Promise.all(
		uploaded.map(async (item) => {
			try {
				await deleteFromCloudinary(item.publicId);
			} catch (error) {
				logger.error(
					{ error, publicId: item.publicId },
					"Cloudinary cleanup failed",
				);
			}
		}),
	);
};

// Optional authentication for public endpoints: invalid or missing token means anonymous
const resolveViewer = async (req: Request): Promise<IViewer | undefined> => {
	const authorization = req.headers.authorization;
	const token =
		req.cookies?.accessToken ||
		(authorization?.startsWith("Bearer ")
			? authorization.split(" ")[1]
			: undefined);

	if (typeof token !== "string" || !token) {
		return undefined;
	}

	const verified = jwtUtils.verifyToken(token, config.jwt_access_secret);
	const decoded = verified.data;

	if (
		!verified.success ||
		typeof decoded !== "object" ||
		decoded === null ||
		typeof decoded.id !== "string"
	) {
		return undefined;
	}

	const user = await prisma.user.findUnique({
		where: { id: decoded.id },
		select: { id: true, role: true, status: true, isDeleted: true },
	});

	if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
		return undefined;
	}

	return { id: user.id, role: user.role };
};

const createPostIntoDB = async (
	authorId: string,
	payload: ICreateCommunityPost,
	files: Express.Multer.File[],
) => {
	const uploaded = files.length > 0 ? await uploadMediaFiles(files) : [];

	try {
		const post = await prisma.communityPost.create({
			data: {
				title: payload.title,
				body: payload.body,
				authorId,
				mediaUrls: uploaded.map((item) => item.url),
			},
			include: postInclude,
		});

		return formatPost(post, new Map());
	} catch (error) {
		await cleanupUploads(uploaded);
		throw error;
	}
};

const getAllPostsFromDB = async (query: IPostQuery, viewer?: IViewer) => {
	const limit = query.limit ?? 10;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;
	const sortBy = query.sortBy ?? "bumpedAt";
	const sortOrder = query.sortOrder ?? "desc";

	const andConditions: Prisma.CommunityPostWhereInput[] = [
		{ isDeleted: false },
		viewer
			? {
					OR: [
						{ status: PostStatus.POSTED },
						{ status: PostStatus.ARCHIVED, authorId: viewer.id },
					],
				}
			: { status: PostStatus.POSTED },
	];

	if (query.searchTerm) {
		andConditions.push({
			OR: [
				{ title: { contains: query.searchTerm, mode: "insensitive" } },
				{ body: { contains: query.searchTerm, mode: "insensitive" } },
			],
		});
	}

	if (query.authorId) {
		andConditions.push({ authorId: query.authorId });
	}

	const where: Prisma.CommunityPostWhereInput = { AND: andConditions };

	const [posts, total] = await Promise.all([
		prisma.communityPost.findMany({
			where,
			include: postInclude,
			take: limit,
			skip,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.communityPost.count({ where }),
	]);

	const breakdown = await getReactionBreakdown(posts.map((post) => post.id));

	return {
		data: posts.map((post) => formatPost(post, breakdown)),
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const getPostByIdFromDB = async (id: string, viewer?: IViewer) => {
	const post = await prisma.communityPost.findFirst({
		where: {
			id,
			isDeleted: false,
			status: { not: PostStatus.REMOVED },
		},
		include: postInclude,
	});

	if (!post) {
		throw new AppError(httpStatus.NOT_FOUND, "Community post not found");
	}

	if (
		post.status === PostStatus.ARCHIVED &&
		post.authorId !== viewer?.id &&
		!(viewer && isAdminRole(viewer.role))
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"This post is archived and can only be viewed by its author",
		);
	}

	const breakdown = await getReactionBreakdown([post.id]);

	return formatPost(post, breakdown);
};

const getPostCommentsFromDB = async (postId: string, query: ICommentQuery) => {
	await getActivePostOrThrow(postId);

	const limit = query.limit ?? 20;
	const page = query.page ?? 1;
	const skip = (page - 1) * limit;
	const sortOrder = query.sortOrder ?? "asc";

	const [comments, total] = await Promise.all([
		prisma.communityPostComment.findMany({
			where: { postId },
			include: { user: { select: authorSelect } },
			take: limit,
			skip,
			orderBy: { createdAt: sortOrder },
		}),
		prisma.communityPostComment.count({ where: { postId } }),
	]);

	return {
		data: comments.map(({ user, ...comment }) => ({
			...comment,
			postedBy: formatPostedBy(user),
		})),
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

const updatePostIntoDB = async (
	id: string,
	userId: string,
	payload: IUpdateCommunityPost,
	files: Express.Multer.File[],
) => {
	const post = await getActivePostOrThrow(id);

	if (post.authorId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only edit your own posts",
		);
	}

	const uploaded = files.length > 0 ? await uploadMediaFiles(files) : [];

	try {
		const updated = await prisma.communityPost.update({
			where: { id },
			data: {
				...(payload.title !== undefined && { title: payload.title }),
				...(payload.body !== undefined && { body: payload.body }),
				...(uploaded.length > 0 && {
					mediaUrls: [...post.mediaUrls, ...uploaded.map((item) => item.url)],
				}),
			},
			include: postInclude,
		});

		const breakdown = await getReactionBreakdown([id]);

		return formatPost(updated, breakdown);
	} catch (error) {
		await cleanupUploads(uploaded);
		throw error;
	}
};

const updatePostStatusIntoDB = async (
	id: string,
	user: RequestUser,
	payload: IUpdatePostStatus,
) => {
	const post = await prisma.communityPost.findFirst({
		where: { id, isDeleted: false },
	});

	if (!post) {
		throw new AppError(httpStatus.NOT_FOUND, "Community post not found");
	}

	const isAdmin = isAdminRole(user.role);
	const isAuthor = post.authorId === user.id;

	// moderation statuses (and touching a removed post) are admin-only
	const requiresAdmin =
		payload.status === PostStatus.REMOVED ||
		payload.status === PostStatus.FLAGGED ||
		payload.status === PostStatus.HIDDEN ||
		post.status === PostStatus.REMOVED;

	if (requiresAdmin && !isAdmin) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only an admin can flag, hide or remove posts",
		);
	}

	if (!isAdmin && !isAuthor) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only the post author or an admin can update post status",
		);
	}

	const updated = await prisma.communityPost.update({
		where: { id },
		data: { status: payload.status },
		include: { author: { select: authorSelect } },
	});

	return {
		id: updated.id,
		status: updated.status,
		postedBy: formatPostedBy(updated.author),
	};
};

const bumpPostIntoDB = async (id: string, userId: string) => {
	const post = await getActivePostOrThrow(id);

	if (post.authorId !== userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only bump your own posts",
		);
	}

	const updated = await prisma.communityPost.update({
		where: { id },
		data: { bumpedAt: new Date() },
		include: { author: { select: authorSelect } },
	});

	return {
		id: updated.id,
		status: updated.status,
		bumpedAt: updated.bumpedAt,
		postedBy: formatPostedBy(updated.author),
	};
};

const deletePostFromDB = async (id: string, user: RequestUser) => {
	const post = await prisma.communityPost.findFirst({
		where: { id, isDeleted: false },
	});

	if (!post) {
		throw new AppError(httpStatus.NOT_FOUND, "Community post not found");
	}

	if (post.authorId !== user.id && !isAdminRole(user.role)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only the post author or an admin can delete this post",
		);
	}

	await prisma.$transaction(async (tx) => {
		await trashService.addToTrashIntoDB(
			{
				userId: user.id,
				itemType: TrashItemType.COMMUNITY_POST,
				itemId: post.id,
				itemTitle: post.title,
				payload: {
					title: post.title,
					body: post.body,
					mediaUrls: post.mediaUrls,
					previousStatus: post.status,
					authorId: post.authorId,
				},
			},
			tx,
		);

		await tx.communityPost.update({
			where: { id },
			data: {
				isDeleted: true,
				deletedAt: new Date(),
				status: PostStatus.REMOVED,
			},
		});
	});

	return { id };
};

const reactToPostIntoDB = async (
	postId: string,
	userId: string,
	payload: IReactToPost,
) => {
	await getActivePostOrThrow(postId);

	const existing = await prisma.communityPostReaction.findUnique({
		where: { postId_userId: { postId, userId } },
	});

	// same reaction again toggles it off
	if (existing && existing.type === payload.type) {
		await prisma.communityPostReaction.delete({
			where: { postId_userId: { postId, userId } },
		});

		return { removed: true, postId, type: payload.type };
	}

	const reaction = await prisma.communityPostReaction.upsert({
		where: { postId_userId: { postId, userId } },
		update: { type: payload.type },
		create: { postId, userId, type: payload.type },
	});

	return { removed: false, ...reaction };
};

const addCommentIntoDB = async (
	postId: string,
	userId: string,
	payload: ICreateComment,
) => {
	await getActivePostOrThrow(postId);

	const comment = await prisma.communityPostComment.create({
		data: { postId, userId, content: payload.content },
		include: { user: { select: authorSelect } },
	});

	const { user, ...rest } = comment;

	return { ...rest, postedBy: formatPostedBy(user) };
};

const deleteCommentFromDB = async (
	postId: string,
	commentId: string,
	user: RequestUser,
) => {
	const post = await getActivePostOrThrow(postId);

	const comment = await prisma.communityPostComment.findFirst({
		where: { id: commentId, postId },
	});

	if (!comment) {
		throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
	}

	if (
		comment.userId !== user.id &&
		post.authorId !== user.id &&
		!isAdminRole(user.role)
	) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have permission to delete this comment",
		);
	}

	await prisma.communityPostComment.delete({ where: { id: commentId } });

	return { id: commentId };
};

const reportPostIntoDB = async (
	postId: string,
	reporterId: string,
	payload: IReportPost,
) => {
	await getActivePostOrThrow(postId);

	const report = await prisma.communityPostReport.create({
		data: { postId, reporterId, reason: payload.reason },
	});

	return report;
};

export const communityPostService = {
	resolveViewer,
	createPostIntoDB,
	getAllPostsFromDB,
	getPostByIdFromDB,
	getPostCommentsFromDB,
	updatePostIntoDB,
	updatePostStatusIntoDB,
	bumpPostIntoDB,
	deletePostFromDB,
	reactToPostIntoDB,
	addCommentIntoDB,
	deleteCommentFromDB,
	reportPostIntoDB,
};
