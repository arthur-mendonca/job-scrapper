import { z } from 'zod';
import { ALL_JOB_STATUSES, USER_CONTROLLED_STATUSES } from './job-status.js';
import { jobSorts } from '../persistence/job.repository.js';

// ─── Common / Shared ────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNextPage: z.boolean()
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  })
});

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);

// ─── Health ─────────────────────────────────────────────────────────────────

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  database: z.enum(['ok', 'unavailable']),
  uptimeSeconds: z.number().int(),
  timestamp: z.string()
});

// ─── Jobs ───────────────────────────────────────────────────────────────────

export const jobListItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceId: z.string(),
  collector: z.string(),
  discoveredVia: z.string(),
  sourceUrl: z.string(),
  canonicalUrl: z.string().nullable(),
  title: z.string(),
  companyName: z.string(),
  location: z.string().nullable(),
  remoteType: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  currency: z.string().nullable(),
  seniority: z.string().nullable(),
  stackTags: z.array(z.string()),
  geoRestrictions: z.array(z.string()),
  score: z.number(),
  sourceTrustScore: z.number(),
  status: z.string(),
  notifiedAt: z.string().nullable(),
  matchReasons: z.array(z.string()),
  riskFlags: z.array(z.string()),
  recommendedAction: z.string().nullable(),
  postedAt: z.string().nullable(),
  discoveredAt: z.string(),
  lastSeenAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const jobEventSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  eventType: z.string(),
  metadata: z.unknown().nullable(),
  createdAt: z.string()
});

export const jobDetailSchema = jobListItemSchema.extend({
  normalizedTitle: z.string().nullable(),
  description: z.string().nullable(),
  requirements: z.string().nullable(),
  events: z.array(jobEventSchema)
});

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: optionalString,
  source: optionalString,
  stack: optionalString,
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  remoteType: optionalString,
  seniority: optionalString,
  q: optionalString,
  sort: z.enum(jobSorts).default('lastSeen_desc')
});

export const jobListResponseSchema = z.object({
  data: z.array(jobListItemSchema),
  pagination: paginationSchema
});

export const idParamsSchema = z.object({
  id: z.string().min(1)
});

export const updateStatusBodySchema = z.object({
  status: z.enum(USER_CONTROLLED_STATUSES)
});

// ─── Events ─────────────────────────────────────────────────────────────────

export const eventListItemSchema = jobEventSchema.extend({
  job: z.object({
    id: z.string(),
    title: z.string(),
    companyName: z.string(),
    status: z.string(),
    score: z.number()
  }).nullable()
});

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  jobId: optionalString,
  eventType: optionalString
});

export const eventListResponseSchema = z.object({
  data: z.array(eventListItemSchema),
  pagination: paginationSchema
});

// ─── Sources ────────────────────────────────────────────────────────────────

export const sourceStatsSchema = z.object({
  totalJobs: z.number().int(),
  averageScore: z.number(),
  sourceTrustScore: z.number(),
  lastSeenAt: z.string().nullable()
});

export const sourceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  enabled: z.boolean(),
  baseUrl: z.string(),
  accessMode: z.string(),
  sourceTrustScore: z.number(),
  trustBucket: z.string(),
  rateLimitMs: z.number(),
  attributionRequired: z.boolean(),
  notes: z.string().nullable(),
  queries: z.array(z.unknown()),
  endpoints: z.array(z.unknown()),
  stats: sourceStatsSchema
});

export const sourceListResponseSchema = z.object({
  data: z.array(sourceItemSchema)
});

// ─── Dashboard ──────────────────────────────────────────────────────────────

export const dashboardSourceStatSchema = z.object({
  sourceId: z.string(),
  source: z.string(),
  count: z.number().int(),
  averageScore: z.number(),
  lastSeenAt: z.string().nullable(),
  sourceTrustScore: z.number()
});

export const collectionRunSchema = z.object({
  id: z.string(),
  status: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  rawItems: z.number().int(),
  normalizedJobs: z.number().int(),
  acceptedJobs: z.number().int(),
  rejectedJobs: z.number().int(),
  newJobs: z.number().int(),
  rediscoveredJobs: z.number().int(),
  highScoringJobs: z.number().int(),
  notificationsSent: z.number().int(),
  collectorFailures: z.number().int(),
  sourceMetrics: z.array(z.unknown()),
  errors: z.array(z.unknown())
});

export const recentErrorSchema = z.object({
  runId: z.string(),
  status: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  errors: z.array(z.unknown())
});

export const topStackSchema = z.object({
  stack: z.string(),
  count: z.number().int()
});

export const jobsByStatusSchema = z.object({
  status: z.string(),
  count: z.number().int()
});

export const dashboardResponseSchema = z.object({
  newJobsToday: z.number().int(),
  rediscoveredJobsToday: z.number().int(),
  highScoreJobs: z.number().int(),
  averageScore: z.number(),
  notificationScoreThreshold: z.number().int(),
  jobsByStatus: z.array(jobsByStatusSchema),
  jobsBySource: z.array(dashboardSourceStatSchema),
  topSources: z.array(dashboardSourceStatSchema),
  topStacks: z.array(topStackSchema),
  lastRun: collectionRunSchema.nullable(),
  recentErrors: z.array(recentErrorSchema)
});

// ─── Settings ───────────────────────────────────────────────────────────────

export const settingsResponseSchema = z.object({
  notificationScoreThreshold: z.number().int(),
  collectCron: z.string(),
  searxngBaseUrl: z.string(),
  apiCorsOrigin: z.string()
});
