import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { jobSorts, JobRepository } from '../../persistence/job.repository.js';
import { notFound } from '../errors.js';
import { toJobDetailDto, toJobListItemDto } from '../dto.js';
import { USER_CONTROLLED_STATUSES } from '../job-status.js';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);

const listJobsQuerySchema = z.object({
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

const idParamsSchema = z.object({
  id: z.string().min(1)
});

/** User-controlled statuses accepted by the API update endpoint. */
export const writableJobStatuses = USER_CONTROLLED_STATUSES;

const updateStatusBodySchema = z.object({
  status: z.enum(USER_CONTROLLED_STATUSES)
});

export async function registerJobsRoutes(app: FastifyInstance): Promise<void> {
  const repository = new JobRepository();

  app.get('/jobs', async (request) => {
    const query = parseListJobsQuery(request.query);
    const result = await repository.listForApi(query);

    return {
      data: result.jobs.map(toJobListItemDto),
      pagination: result.pagination
    };
  });

  app.get('/jobs/:id', async (request) => {
    const params = idParamsSchema.parse(request.params);
    const job = await repository.findByIdWithEvents(params.id);

    if (!job) {
      throw notFound(`Job not found: ${params.id}`);
    }

    return toJobDetailDto(job);
  });

  app.patch('/jobs/:id/status', async (request) => {
    const params = idParamsSchema.parse(request.params);
    const body = parseUpdateJobStatusBody(request.body);
    const job = await repository.updateStatusWithEvent(params.id, body.status);

    if (!job) {
      throw notFound(`Job not found: ${params.id}`);
    }

    return toJobListItemDto(job);
  });
}

export function parseListJobsQuery(input: unknown): z.infer<typeof listJobsQuerySchema> {
  return listJobsQuerySchema.parse(input);
}

export function parseUpdateJobStatusBody(input: unknown): z.infer<typeof updateStatusBodySchema> {
  return updateStatusBodySchema.parse(input);
}
