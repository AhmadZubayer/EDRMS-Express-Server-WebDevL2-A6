import type { MissingPersonStatus } from "../../../generated/prisma/enums";

export interface ICreateMissingPerson {
	fullName: string;
	age: number;
	gender: string;
	lastSeenLocation: string;
	lastSeenDate: Date;
	description: string;
	contactPhone?: string;
	photoUrl?: string;
}

export type IUpdateMissingPerson = Partial<ICreateMissingPerson>;

export interface IUpdateMissingPersonStatus {
	status: MissingPersonStatus;
}

export interface IMissingPersonQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "lastSeenDate" | "fullName" | "age";
	sortOrder?: "asc" | "desc";
	status?: MissingPersonStatus;
	gender?: string;
}
