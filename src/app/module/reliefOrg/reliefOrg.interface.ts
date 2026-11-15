export interface ISignUpReliefOrg {
	organizationName: string;
	registrationNumber: string;
	address: string;
	contactEmail?: string;
	contactPhone?: string;
	website?: string;
	description?: string;
	organizationType?: string;
}

export interface IReliefOrgQuery {
	searchTerm?: string;
	page?: number;
	limit?: number;
	sortBy?: "createdAt" | "organizationName";
	sortOrder?: "asc" | "desc";
	adminVerified?: "true" | "false";
	organizationType?: string;
}
