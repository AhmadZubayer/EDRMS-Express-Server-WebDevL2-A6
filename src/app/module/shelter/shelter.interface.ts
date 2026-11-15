export interface ICreateShelter {
	shelterName: string;
	shelterLocation: string;
	shelterCapacity: number;
	currentPeopleCount?: number;
	disasterId: string;
	// admins only: the relief organization the shelter is created for
	reliefOrgId?: string;
}

export interface IUpdateShelter {
	shelterName?: string;
	shelterLocation?: string;
	shelterCapacity?: number;
	currentPeopleCount?: number;
	disasterId?: string;
}

export interface IShelterQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?:
		| "createdAt"
		| "shelterName"
		| "shelterCapacity"
		| "currentPeopleCount";
	sortOrder?: "asc" | "desc";
	disasterId?: string;
	reliefOrgId?: string;
}
