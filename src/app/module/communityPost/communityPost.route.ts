import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { validateParams } from "../../middleware/validateParams";
import { validateQuery } from "../../middleware/validateQuery";
import { validateRequest } from "../../middleware/validateRequest";
import { upload } from "../../lib/multer";
import { communityPostController } from "./communityPost.controller";
import { communityPostValidation } from "./communityPost.validation";

export const communityPostRoutes = Router();

// Public (optionally authenticated: logged-in users also see their own archived posts)
communityPostRoutes.get(
	"/",
	validateQuery(communityPostValidation.getAllPostsQuerySchema),
	communityPostController.getAllPosts,
);

communityPostRoutes.get(
	"/:id",
	validateParams(communityPostValidation.postIdParamsSchema),
	communityPostController.getPostById,
);

communityPostRoutes.get(
	"/:id/comments",
	validateParams(communityPostValidation.postIdParamsSchema),
	validateQuery(communityPostValidation.getCommentsQuerySchema),
	communityPostController.getPostComments,
);

// Authenticated
communityPostRoutes.post(
	"/",
	auth(),
	upload.array("files", 10),
	validateRequest(communityPostValidation.createPostSchema),
	communityPostController.createPost,
);

communityPostRoutes.patch(
	"/:id",
	auth(),
	upload.array("files", 10),
	validateParams(communityPostValidation.postIdParamsSchema),
	validateRequest(communityPostValidation.updatePostSchema),
	communityPostController.updatePost,
);

communityPostRoutes.patch(
	"/:id/status",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	validateRequest(communityPostValidation.updatePostStatusSchema),
	communityPostController.updatePostStatus,
);

communityPostRoutes.patch(
	"/:id/bump",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	communityPostController.bumpPost,
);

communityPostRoutes.delete(
	"/:id",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	communityPostController.deletePost,
);

communityPostRoutes.post(
	"/:id/react",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	validateRequest(communityPostValidation.reactToPostSchema),
	communityPostController.reactToPost,
);

communityPostRoutes.post(
	"/:id/comments",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	validateRequest(communityPostValidation.createCommentSchema),
	communityPostController.addComment,
);

communityPostRoutes.delete(
	"/:id/comments/:commentId",
	auth(),
	validateParams(communityPostValidation.commentParamsSchema),
	communityPostController.deleteComment,
);

communityPostRoutes.post(
	"/:id/report",
	auth(),
	validateParams(communityPostValidation.postIdParamsSchema),
	validateRequest(communityPostValidation.reportPostSchema),
	communityPostController.reportPost,
);
