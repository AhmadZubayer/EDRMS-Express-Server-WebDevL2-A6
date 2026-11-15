import type {
	PostStatus,
	ReactionType,
	UserRole,
} from "../../../generated/prisma/enums";

export interface ICreateCommunityPost {
	title: string;
	body: string;
}

export interface IUpdateCommunityPost {
	title?: string;
	body?: string;
}

export interface IUpdatePostStatus {
	status: PostStatus;
}

export interface IReactToPost {
	type: ReactionType;
}

export interface ICreateComment {
	content: string;
}

export interface IReportPost {
	reason: string;
}

export interface IPostQuery {
	page?: number;
	limit?: number;
	searchTerm?: string;
	sortBy?: "createdAt" | "updatedAt" | "bumpedAt" | "title";
	sortOrder?: "asc" | "desc";
	authorId?: string;
	authorRole?: UserRole;
}

export interface ICommentQuery {
	page?: number;
	limit?: number;
	sortOrder?: "asc" | "desc";
}

export interface IViewer {
	id: string;
	role: string;
}

export interface IReactionCounts {
	total: number;
	like: number;
	care: number;
	sad: number;
	dislike: number;
}
