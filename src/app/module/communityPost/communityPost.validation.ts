import { z } from "zod";
import { PostStatus, ReactionType } from "../../../generated/prisma/enums";

const postIdParamsSchema = z.object({
	id: z.uuid("Invalid post id"),
});

const commentParamsSchema = z.object({
	id: z.uuid("Invalid post id"),
	commentId: z.uuid("Invalid comment id"),
});

const getAllPostsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	searchTerm: z.string().trim().optional(),
	sortBy: z
		.enum(["createdAt", "updatedAt", "bumpedAt", "title"])
		.default("bumpedAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
	authorId: z.uuid().optional(),
});

const getCommentsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// multipart text fields; media files are handled by multer
const createPostSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, "Title must contain at least 3 characters")
		.max(200),
	body: z.string().trim().min(1, "Body is required").max(10000),
});

const updatePostSchema = z.object({
	title: z.string().trim().min(3).max(200).optional(),
	body: z.string().trim().min(1).max(10000).optional(),
});

const updatePostStatusSchema = z.object({
	status: z.enum(PostStatus),
});

const reactToPostSchema = z.object({
	type: z.enum(ReactionType).default(ReactionType.LIKE),
});

const createCommentSchema = z.object({
	content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

const reportPostSchema = z.object({
	reason: z
		.string()
		.trim()
		.min(3, "Reason must contain at least 3 characters")
		.max(1000),
});

export const communityPostValidation = {
	postIdParamsSchema,
	commentParamsSchema,
	getAllPostsQuerySchema,
	getCommentsQuerySchema,
	createPostSchema,
	updatePostSchema,
	updatePostStatusSchema,
	reactToPostSchema,
	createCommentSchema,
	reportPostSchema,
};
