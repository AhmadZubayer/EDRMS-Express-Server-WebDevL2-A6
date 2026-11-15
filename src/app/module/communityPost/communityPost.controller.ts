import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { communityPostService } from "./communityPost.service";
import type { ICommentQuery, IPostQuery } from "./communityPost.interface";

const getRequestUser = (req: Request) => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Please log in to access this resource",
		);
	}

	return req.user;
};

const getUploadedFiles = (req: Request) =>
	(req.files as Express.Multer.File[] | undefined) ?? [];

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
	const query = res.locals.validatedQuery as IPostQuery;
	const viewer = await communityPostService.resolveViewer(req);

	const { data, meta } = await communityPostService.getAllPostsFromDB(
		query,
		viewer,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Community posts retrieved successfully",
		data,
		meta,
	});
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
	const viewer = await communityPostService.resolveViewer(req);

	const post = await communityPostService.getPostByIdFromDB(
		res.locals.validatedParams.id,
		viewer,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Community post details retrieved successfully",
		data: post,
	});
});

const getPostComments = catchAsync(async (req: Request, res: Response) => {
	const query = res.locals.validatedQuery as ICommentQuery;

	const { data, meta } = await communityPostService.getPostCommentsFromDB(
		res.locals.validatedParams.id,
		query,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Post comments retrieved successfully",
		data,
		meta,
	});
});

const createPost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const post = await communityPostService.createPostIntoDB(
		user.id,
		req.body,
		getUploadedFiles(req),
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Community post created successfully",
		data: post,
	});
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const files = getUploadedFiles(req);

	if (
		req.body.title === undefined &&
		req.body.body === undefined &&
		files.length === 0
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Provide a title, body or media files to update",
		);
	}

	const post = await communityPostService.updatePostIntoDB(
		res.locals.validatedParams.id,
		user.id,
		req.body,
		files,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Community post updated successfully",
		data: post,
	});
});

const updatePostStatus = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const post = await communityPostService.updatePostStatusIntoDB(
		res.locals.validatedParams.id,
		user,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Post status updated successfully",
		data: post,
	});
});

const bumpPost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const post = await communityPostService.bumpPostIntoDB(
		res.locals.validatedParams.id,
		user.id,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Post bumped successfully",
		data: post,
	});
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const result = await communityPostService.deletePostFromDB(
		res.locals.validatedParams.id,
		user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Community post moved to trash successfully",
		data: result,
	});
});

const reactToPost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const result = await communityPostService.reactToPostIntoDB(
		res.locals.validatedParams.id,
		user.id,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: result.removed
			? "Reaction removed successfully"
			: "Reaction recorded successfully",
		data: result,
	});
});

const addComment = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const comment = await communityPostService.addCommentIntoDB(
		res.locals.validatedParams.id,
		user.id,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Comment added successfully",
		data: comment,
	});
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const { id, commentId } = res.locals.validatedParams;

	const result = await communityPostService.deleteCommentFromDB(
		id,
		commentId,
		user,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.OK,
		message: "Comment deleted successfully",
		data: result,
	});
});

const reportPost = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);

	const report = await communityPostService.reportPostIntoDB(
		res.locals.validatedParams.id,
		user.id,
		req.body,
	);

	sendResponse(res, {
		success: true,
		statusCode: httpStatus.CREATED,
		message: "Post reported successfully",
		data: report,
	});
});

export const communityPostController = {
	getAllPosts,
	getPostById,
	getPostComments,
	createPost,
	updatePost,
	updatePostStatus,
	bumpPost,
	deletePost,
	reactToPost,
	addComment,
	deleteComment,
	reportPost,
};
