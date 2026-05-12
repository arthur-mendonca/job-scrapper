CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT,
    "remoteType" TEXT NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "seniority" TEXT,
    "description" TEXT,
    "requirements" TEXT,
    "stackTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postedAt" TIMESTAMP(3),
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 0,
    "sourceTrustScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "contentHash" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "matchReasons" JSONB,
    "riskFlags" JSONB,
    "recommendedAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "careersUrl" TEXT,
    "atsType" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "linkedinUrl" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Recruiter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_canonicalUrl_key" ON "Job"("canonicalUrl");
CREATE INDEX "Job_contentHash_idx" ON "Job"("contentHash");
CREATE INDEX "Job_companyName_idx" ON "Job"("companyName");
CREATE INDEX "Job_normalizedTitle_idx" ON "Job"("normalizedTitle");
CREATE INDEX "Job_score_idx" ON "Job"("score");
CREATE INDEX "Job_sourceTrustScore_idx" ON "Job"("sourceTrustScore");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_notifiedAt_idx" ON "Job"("notifiedAt");
CREATE INDEX "Job_lastSeenAt_idx" ON "Job"("lastSeenAt");
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");
CREATE INDEX "Recruiter_companyName_idx" ON "Recruiter"("companyName");
CREATE INDEX "Recruiter_email_idx" ON "Recruiter"("email");
CREATE INDEX "JobEvent_jobId_idx" ON "JobEvent"("jobId");
CREATE INDEX "JobEvent_eventType_idx" ON "JobEvent"("eventType");
CREATE INDEX "JobEvent_createdAt_idx" ON "JobEvent"("createdAt");

ALTER TABLE "JobEvent" ADD CONSTRAINT "JobEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
