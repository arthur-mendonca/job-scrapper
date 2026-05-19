import { isoOrNull } from './dto.js';

export interface DashboardSourceStatsInput {
  sourceId: string;
  source: string;
  count: number;
  averageScore: number | null;
  lastSeenAt: Date | null;
  sourceTrustScore: number | null;
}

export function buildDashboardSourceStats(rows: DashboardSourceStatsInput[]) {
  return rows
    .map((row) => ({
      sourceId: row.sourceId,
      source: row.source,
      count: row.count,
      averageScore: roundMetric(row.averageScore),
      lastSeenAt: isoOrNull(row.lastSeenAt),
      sourceTrustScore: row.sourceTrustScore ?? 0
    }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

export function roundMetric(value: number | null): number {
  return value === null ? 0 : Math.round(value * 100) / 100;
}
