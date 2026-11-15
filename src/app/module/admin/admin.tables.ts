import { prisma } from "../../lib/prisma";

interface ITablePage {
	skip: number;
	take: number;
}

interface ITableEntry {
	model: string;
	count: () => Promise<number>;
	findMany: (page: ITablePage) => Promise<unknown[]>;
}

// Hard-coded whitelist of Prisma model delegates the admin may browse.
// Nothing here is built from user input, and secret columns are omitted.
export const adminTables = {
	users: {
		model: "User",
		count: () => prisma.user.count(),
		findMany: (page) =>
			prisma.user.findMany({
				...page,
				omit: { password: true, googleId: true },
				orderBy: { createdAt: "desc" },
			}),
	},
	volunteers: {
		model: "Volunteer",
		count: () => prisma.volunteer.count(),
		findMany: (page) =>
			prisma.volunteer.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	volunteer_tasks: {
		model: "VolunteerTask",
		count: () => prisma.volunteerTask.count(),
		findMany: (page) =>
			prisma.volunteerTask.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	volunteer_field_reports: {
		model: "FieldReport",
		count: () => prisma.fieldReport.count(),
		findMany: (page) =>
			prisma.fieldReport.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	organization_volunteer_requests: {
		model: "OrganizationVolunteerRequest",
		count: () => prisma.organizationVolunteerRequest.count(),
		findMany: (page) =>
			prisma.organizationVolunteerRequest.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	volunteer_organization_joins: {
		model: "VolunteerOrganizationJoin",
		count: () => prisma.volunteerOrganizationJoin.count(),
		findMany: (page) =>
			prisma.volunteerOrganizationJoin.findMany({
				...page,
				orderBy: { joinedAt: "desc" },
			}),
	},
	volunteer_group_joins: {
		model: "VolunteerGroupJoin",
		count: () => prisma.volunteerGroupJoin.count(),
		findMany: (page) =>
			prisma.volunteerGroupJoin.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	relief_orgs: {
		model: "ReliefOrg",
		count: () => prisma.reliefOrg.count(),
		findMany: (page) =>
			prisma.reliefOrg.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	disasters: {
		model: "Disaster",
		count: () => prisma.disaster.count(),
		findMany: (page) =>
			prisma.disaster.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	shelters: {
		model: "Shelter",
		count: () => prisma.shelter.count(),
		findMany: (page) =>
			prisma.shelter.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	missing_persons: {
		model: "MissingPerson",
		count: () => prisma.missingPerson.count(),
		findMany: (page) =>
			prisma.missingPerson.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	rescue_requests: {
		model: "RescueRequest",
		count: () => prisma.rescueRequest.count(),
		findMany: (page) =>
			prisma.rescueRequest.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	community_posts: {
		model: "CommunityPost",
		count: () => prisma.communityPost.count(),
		findMany: (page) =>
			prisma.communityPost.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	community_post_comments: {
		model: "CommunityPostComment",
		count: () => prisma.communityPostComment.count(),
		findMany: (page) =>
			prisma.communityPostComment.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	community_post_reactions: {
		model: "CommunityPostReaction",
		count: () => prisma.communityPostReaction.count(),
		findMany: (page) =>
			prisma.communityPostReaction.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	community_post_reports: {
		model: "CommunityPostReport",
		count: () => prisma.communityPostReport.count(),
		findMany: (page) =>
			prisma.communityPostReport.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	donation_campaigns: {
		model: "DonationCampaign",
		count: () => prisma.donationCampaign.count(),
		findMany: (page) =>
			prisma.donationCampaign.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	donation_applications: {
		model: "DonationApplication",
		count: () => prisma.donationApplication.count(),
		findMany: (page) =>
			prisma.donationApplication.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	donations: {
		model: "Donation",
		count: () => prisma.donation.count(),
		findMany: (page) =>
			prisma.donation.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	donation_payouts: {
		model: "DonationPayout",
		count: () => prisma.donationPayout.count(),
		findMany: (page) =>
			prisma.donationPayout.findMany({
				...page,
				orderBy: { createdAt: "desc" },
			}),
	},
	payments: {
		model: "Payment",
		count: () => prisma.payment.count(),
		findMany: (page) =>
			prisma.payment.findMany({ ...page, orderBy: { createdAt: "desc" } }),
	},
	trash_items: {
		model: "TrashItem",
		count: () => prisma.trashItem.count(),
		findMany: (page) =>
			prisma.trashItem.findMany({ ...page, orderBy: { deletedAt: "desc" } }),
	},
} satisfies Record<string, ITableEntry>;

export type AdminTableName = keyof typeof adminTables;

export const adminTableNames = Object.keys(adminTables) as [
	AdminTableName,
	...AdminTableName[],
];
