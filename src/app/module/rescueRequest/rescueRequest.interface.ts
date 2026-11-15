import type {
	RescueStatus,
	UrgencyLevel,
} from "../../../generated/prisma/enums";

export interface ICreateRescueRequest {
	latitude: number;
	longitude: number;
	description: string;
	contactPhone: string;
	address?: string;
	peopleCount?: number;
	urgencyLevel?: UrgencyLevel;
	medicalNotes?: string;
	photoUrl?: string;
}

export type IUpdateRescueRequest = Partial<ICreateRescueRequest>;

export interface IUpdateRescueRequestStatus {
	status: RescueStatus;
	assignedRescuerId?: string;
}

export interface IRescueRequestQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "urgencyLevel" | "peopleCount" | "status";
	sortOrder?: "asc" | "desc";
	status?: RescueStatus;
	urgencyLevel?: UrgencyLevel;
	assignedRescuerId?: string;
}
