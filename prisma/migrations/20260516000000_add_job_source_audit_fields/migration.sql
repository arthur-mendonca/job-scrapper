ALTER TABLE "Job"
ADD COLUMN "sourceId" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "collector" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "discoveredVia" TEXT NOT NULL DEFAULT 'direct';

CREATE INDEX "Job_sourceId_idx" ON "Job"("sourceId");
CREATE INDEX "Job_collector_idx" ON "Job"("collector");
CREATE INDEX "Job_discoveredVia_idx" ON "Job"("discoveredVia");
