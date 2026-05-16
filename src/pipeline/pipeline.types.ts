export interface SourceRunMetrics {
  source: string;
  sourceTrustScore: number;
  trustBucket: string;
  rawItems: number;
  normalizedItems: number;
  acceptedItems: number;
  rejectedItems: number;
  failures: number;
}

export interface CollectionCycleSummary {
  startedAt: Date;
  finishedAt: Date;
  rawItems: number;
  normalizedJobs: number;
  acceptedJobs: number;
  rejectedJobs: number;
  newJobs: number;
  rediscoveredJobs: number;
  highScoringJobs: number;
  notificationsSent: number;
  collectorFailures: number;
  sourceMetrics: SourceRunMetrics[];
}
