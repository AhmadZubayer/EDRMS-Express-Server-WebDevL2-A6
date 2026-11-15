-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'VOLUNTEER', 'RELIEF_ORG', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'CREDENTIAL');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'BKASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUND_FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('INITIATED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisasterType" AS ENUM ('CYCLONE', 'FLOOD', 'FLASH_FLOOD', 'HEAVY_RAIN', 'DROUGHT', 'EARTHQUAKE', 'LANDSLIDE', 'WILDFIRE', 'TSUNAMI', 'HEATWAVE', 'COLD_WAVE', 'RIVER_EROSION', 'STORM_SURGE', 'TORNADO', 'AVALANCHE');

-- CreateEnum
CREATE TYPE "MissingPersonStatus" AS ENUM ('MISSING', 'FOUND', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RescueStatus" AS ENUM ('PENDING', 'ACKNOWLEDGED', 'DISPATCHED', 'IN_PROGRESS', 'RESCUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('POSTED', 'FLAGGED', 'HIDDEN', 'ARCHIVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'CARE', 'SAD', 'DISLIKE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VolunteerVerificationStatus" AS ENUM ('NOT_APPLIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VolunteerTaskStatus" AS ENUM ('ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "FieldReportType" AS ENUM ('BLOCKED_ROUTE', 'DANGEROUS_ROUTE', 'RESOURCE_SHORTAGE');

-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OrganizationRequestStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "VolunteerSkill" AS ENUM ('FIRST_AID', 'SEARCH_AND_RESCUE', 'FIRE_SAFETY', 'MEDICAL_ASSISTANCE', 'LOGISTICS_TRANSPORT', 'FLOOD_RESCUE', 'SHELTER_MANAGEMENT', 'FOOD_DISTRIBUTION', 'PSYCHOSOCIAL_SUPPORT', 'TELECOMMUNICATIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "GroupTargetType" AS ENUM ('RESCUE_REQUEST', 'MISSING_PERSON');

-- CreateEnum
CREATE TYPE "GroupJoinStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrashItemType" AS ENUM ('MISSING_PERSON', 'RESCUE_REQUEST', 'COMMUNITY_POST');

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "status" "PostStatus" NOT NULL DEFAULT 'POSTED',
    "bumpedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_reactions" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_post_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_post_reports" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disasters" (
    "id" TEXT NOT NULL,
    "disasterName" TEXT NOT NULL,
    "impactedLocation" TEXT NOT NULL,
    "impactTime" TIMESTAMP(3) NOT NULL,
    "type" "DisasterType" NOT NULL DEFAULT 'FLOOD',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disasters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "raisedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_applications" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "payoutDetails" TEXT NOT NULL,
    "proofDocumentUrl" TEXT,
    "proofPublicId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAmount" DECIMAL(12,2),
    "reviewedAt" TIMESTAMP(3),
    "campaignId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'INITIATED',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "donorName" TEXT,
    "donorEmail" TEXT,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_payouts" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missing_persons" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "lastSeenLocation" TEXT NOT NULL,
    "lastSeenDate" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "description" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" "MissingPersonStatus" NOT NULL DEFAULT 'MISSING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missing_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "providerRefundId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "donationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relief_orgs" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "description" TEXT,
    "organizationType" TEXT,
    "verificationDocs" TEXT[],
    "adminVerified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relief_orgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rescue_requests" (
    "id" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" TEXT,
    "peopleCount" INTEGER NOT NULL DEFAULT 1,
    "urgencyLevel" "UrgencyLevel" NOT NULL DEFAULT 'HIGH',
    "photoUrl" TEXT,
    "photoPublicId" TEXT,
    "description" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "medicalNotes" TEXT,
    "status" "RescueStatus" NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "assignedRescuerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rescue_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelters" (
    "id" TEXT NOT NULL,
    "shelterName" TEXT NOT NULL,
    "shelterLocation" TEXT NOT NULL,
    "shelterCapacity" INTEGER NOT NULL,
    "currentPeopleCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "disasterId" TEXT NOT NULL,
    "reliefOrgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trash_items" (
    "id" TEXT NOT NULL,
    "itemType" "TrashItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "payload" JSONB,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "trash_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIAL',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "needPasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "imagePublicId" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "house" TEXT,
    "city" TEXT,
    "district" TEXT,
    "country" TEXT DEFAULT 'Bangladesh',
    "gpsLat" DECIMAL(10,7),
    "gpsLng" DECIMAL(10,7),
    "isSafe" BOOLEAN,
    "emergencyMessage" TEXT,
    "medicalInformation" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL,
    "skills" "VolunteerSkill"[],
    "whyJoin" TEXT NOT NULL,
    "nidCardUrl" TEXT,
    "nidCardPublicId" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VolunteerVerificationStatus" NOT NULL DEFAULT 'NOT_APPLIED',
    "currentLatitude" DECIMAL(10,7),
    "currentLongitude" DECIMAL(10,7),
    "onDuty" BOOLEAN NOT NULL DEFAULT false,
    "lastLocationUpdate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_tasks" (
    "id" TEXT NOT NULL,
    "status" "VolunteerTaskStatus" NOT NULL,
    "progressNote" TEXT,
    "completedAt" TIMESTAMP(3),
    "volunteerId" TEXT NOT NULL,
    "rescueRequestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_field_reports" (
    "id" TEXT NOT NULL,
    "reportType" "FieldReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "address" TEXT,
    "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "resourceName" TEXT,
    "quantityNeeded" INTEGER,
    "volunteerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_field_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_volunteer_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "location" TEXT NOT NULL,
    "neededVolunteers" INTEGER NOT NULL DEFAULT 1,
    "disasterName" TEXT,
    "status" "OrganizationRequestStatus" NOT NULL DEFAULT 'OPEN',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "organizationUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_volunteer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_organization_joins" (
    "id" TEXT NOT NULL,
    "status" "GroupJoinStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volunteerId" TEXT NOT NULL,
    "organizationRequestId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_organization_joins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_group_joins" (
    "id" TEXT NOT NULL,
    "targetType" "GroupTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "whyJoin" TEXT NOT NULL,
    "status" "GroupJoinStatus" NOT NULL DEFAULT 'PENDING',
    "volunteerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_group_joins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_posts_authorId_idx" ON "community_posts"("authorId");

-- CreateIndex
CREATE INDEX "community_posts_status_idx" ON "community_posts"("status");

-- CreateIndex
CREATE INDEX "community_post_comments_postId_idx" ON "community_post_comments"("postId");

-- CreateIndex
CREATE INDEX "community_post_comments_userId_idx" ON "community_post_comments"("userId");

-- CreateIndex
CREATE INDEX "community_post_reactions_userId_idx" ON "community_post_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_reactions_postId_userId_key" ON "community_post_reactions"("postId", "userId");

-- CreateIndex
CREATE INDEX "community_post_reports_postId_idx" ON "community_post_reports"("postId");

-- CreateIndex
CREATE INDEX "community_post_reports_reporterId_idx" ON "community_post_reports"("reporterId");

-- CreateIndex
CREATE INDEX "donation_campaigns_createdByUserId_idx" ON "donation_campaigns"("createdByUserId");

-- CreateIndex
CREATE INDEX "donation_campaigns_status_idx" ON "donation_campaigns"("status");

-- CreateIndex
CREATE INDEX "donation_applications_campaignId_idx" ON "donation_applications"("campaignId");

-- CreateIndex
CREATE INDEX "donation_applications_applicantId_idx" ON "donation_applications"("applicantId");

-- CreateIndex
CREATE INDEX "donation_applications_reviewedByUserId_idx" ON "donation_applications"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "donations_campaignId_idx" ON "donations"("campaignId");

-- CreateIndex
CREATE INDEX "donations_userId_idx" ON "donations"("userId");

-- CreateIndex
CREATE INDEX "donation_payouts_campaignId_idx" ON "donation_payouts"("campaignId");

-- CreateIndex
CREATE INDEX "donation_payouts_applicationId_idx" ON "donation_payouts"("applicationId");

-- CreateIndex
CREATE INDEX "missing_persons_reporterId_idx" ON "missing_persons"("reporterId");

-- CreateIndex
CREATE INDEX "missing_persons_status_idx" ON "missing_persons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerTransactionId_key" ON "payments"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerRefundId_key" ON "payments"("providerRefundId");

-- CreateIndex
CREATE INDEX "payments_donationId_idx" ON "payments"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "relief_orgs_registrationNumber_key" ON "relief_orgs"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "relief_orgs_userId_key" ON "relief_orgs"("userId");

-- CreateIndex
CREATE INDEX "rescue_requests_userId_idx" ON "rescue_requests"("userId");

-- CreateIndex
CREATE INDEX "rescue_requests_assignedRescuerId_idx" ON "rescue_requests"("assignedRescuerId");

-- CreateIndex
CREATE INDEX "rescue_requests_status_idx" ON "rescue_requests"("status");

-- CreateIndex
CREATE INDEX "shelters_disasterId_idx" ON "shelters"("disasterId");

-- CreateIndex
CREATE INDEX "shelters_reliefOrgId_idx" ON "shelters"("reliefOrgId");

-- CreateIndex
CREATE INDEX "trash_items_userId_idx" ON "trash_items"("userId");

-- CreateIndex
CREATE INDEX "trash_items_expiresAt_idx" ON "trash_items"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_userId_key" ON "volunteers"("userId");

-- CreateIndex
CREATE INDEX "volunteer_tasks_rescueRequestId_idx" ON "volunteer_tasks"("rescueRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_tasks_volunteerId_rescueRequestId_key" ON "volunteer_tasks"("volunteerId", "rescueRequestId");

-- CreateIndex
CREATE INDEX "volunteer_field_reports_volunteerId_idx" ON "volunteer_field_reports"("volunteerId");

-- CreateIndex
CREATE INDEX "organization_volunteer_requests_organizationUserId_idx" ON "organization_volunteer_requests"("organizationUserId");

-- CreateIndex
CREATE INDEX "volunteer_organization_joins_organizationRequestId_idx" ON "volunteer_organization_joins"("organizationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_organization_joins_volunteerId_organizationReques_key" ON "volunteer_organization_joins"("volunteerId", "organizationRequestId");

-- CreateIndex
CREATE INDEX "volunteer_group_joins_volunteerId_idx" ON "volunteer_group_joins"("volunteerId");

-- CreateIndex
CREATE INDEX "volunteer_group_joins_targetType_targetId_idx" ON "volunteer_group_joins"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_comments" ADD CONSTRAINT "community_post_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_applications" ADD CONSTRAINT "donation_applications_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "donation_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_applications" ADD CONSTRAINT "donation_applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_applications" ADD CONSTRAINT "donation_applications_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "donation_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_payouts" ADD CONSTRAINT "donation_payouts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "donation_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_payouts" ADD CONSTRAINT "donation_payouts_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "donation_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missing_persons" ADD CONSTRAINT "missing_persons_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relief_orgs" ADD CONSTRAINT "relief_orgs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_requests" ADD CONSTRAINT "rescue_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rescue_requests" ADD CONSTRAINT "rescue_requests_assignedRescuerId_fkey" FOREIGN KEY ("assignedRescuerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelters" ADD CONSTRAINT "shelters_disasterId_fkey" FOREIGN KEY ("disasterId") REFERENCES "disasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelters" ADD CONSTRAINT "shelters_reliefOrgId_fkey" FOREIGN KEY ("reliefOrgId") REFERENCES "relief_orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trash_items" ADD CONSTRAINT "trash_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_tasks" ADD CONSTRAINT "volunteer_tasks_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_tasks" ADD CONSTRAINT "volunteer_tasks_rescueRequestId_fkey" FOREIGN KEY ("rescueRequestId") REFERENCES "rescue_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_field_reports" ADD CONSTRAINT "volunteer_field_reports_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_volunteer_requests" ADD CONSTRAINT "organization_volunteer_requests_organizationUserId_fkey" FOREIGN KEY ("organizationUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_organization_joins" ADD CONSTRAINT "volunteer_organization_joins_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_organization_joins" ADD CONSTRAINT "volunteer_organization_joins_organizationRequestId_fkey" FOREIGN KEY ("organizationRequestId") REFERENCES "organization_volunteer_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_group_joins" ADD CONSTRAINT "volunteer_group_joins_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
