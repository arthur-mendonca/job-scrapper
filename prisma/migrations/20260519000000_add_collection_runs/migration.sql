CREATE TABLE "CollectionRun" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "rawItems" INTEGER NOT NULL DEFAULT 0,
    "normalizedJobs" INTEGER NOT NULL DEFAULT 0,
    "acceptedJobs" INTEGER NOT NULL DEFAULT 0,
    "rejectedJobs" INTEGER NOT NULL DEFAULT 0,
    "newJobs" INTEGER NOT NULL DEFAULT 0,
    "rediscoveredJobs" INTEGER NOT NULL DEFAULT 0,
    "highScoringJobs" INTEGER NOT NULL DEFAULT 0,
    "notificationsSent" INTEGER NOT NULL DEFAULT 0,
    "collectorFailures" INTEGER NOT NULL DEFAULT 0,
    "sourceMetrics" JSONB,
    "errors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CollectionRun_status_idx" ON "CollectionRun"("status");
CREATE INDEX "CollectionRun_startedAt_idx" ON "CollectionRun"("startedAt");
CREATE INDEX "CollectionRun_finishedAt_idx" ON "CollectionRun"("finishedAt");
