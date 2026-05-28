import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { JobRepository } from '../../persistence/job.repository.js';
import { notFound } from '../errors.js';
import { toJobDetailDto, toJobListItemDto } from '../dto.js';
import { USER_CONTROLLED_STATUSES } from '../job-status.js';
import {
  listJobsQuerySchema,
  idParamsSchema,
  updateStatusBodySchema,
  jobListResponseSchema,
  jobDetailSchema,
  jobListItemSchema,
  apiErrorSchema,
} from '../api-schemas.js';

/** User-controlled statuses accepted by the API update endpoint. */
export const writableJobStatuses = USER_CONTROLLED_STATUSES;

export async function registerJobsRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  const repository = new JobRepository();

  typedApp.get(
    '/jobs',
    {
      schema: {
        operationId: 'listJobs',
        tags: ['Jobs'],
        summary: 'List jobs',
        description: 'Returns a paginated, filterable list of jobs.',
        querystring: listJobsQuerySchema,
        response: {
          200: jobListResponseSchema,
        },
      },
    },
    async (request) => {
      const query = request.query;
      const result = await repository.listForApi(query);

      return {
        data: result.jobs.map(toJobListItemDto),
        pagination: result.pagination
      };
    }
  );

  typedApp.get(
    '/jobs/:id',
    {
      schema: {
        operationId: 'getJobDetail',
        tags: ['Jobs'],
        summary: 'Get job details',
        description: 'Returns detailed information about a specific job including its events.',
        params: idParamsSchema,
        response: {
          200: jobDetailSchema,
          404: apiErrorSchema,
        },
      },
    },
    async (request) => {
      const job = await repository.findByIdWithEvents(request.params.id);

      if (!job) {
        throw notFound(`Job not found: ${request.params.id}`);
      }

      return toJobDetailDto(job);
    }
  );

  typedApp.patch(
    '/jobs/:id/status',
    {
      schema: {
        operationId: 'updateJobStatus',
        tags: ['Jobs'],
        summary: 'Update job status',
        description: 'Updates a job status to a user-controlled status value.',
        params: idParamsSchema,
        body: updateStatusBodySchema,
        response: {
          200: jobListItemSchema,
          404: apiErrorSchema,
        },
      },
    },
    async (request) => {
      const job = await repository.updateStatusWithEvent(request.params.id, request.body.status);

      if (!job) {
        throw notFound(`Job not found: ${request.params.id}`);
      }

      return toJobListItemDto(job);
    }
  );
}

export function parseListJobsQuery(input: unknown): z.infer<typeof listJobsQuerySchema> {
  return listJobsQuerySchema.parse(input);
}

export function parseUpdateJobStatusBody(input: unknown): z.infer<typeof updateStatusBodySchema> {
  return updateStatusBodySchema.parse(input);
}
