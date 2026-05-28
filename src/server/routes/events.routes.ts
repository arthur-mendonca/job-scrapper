import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../persistence/prisma.js';
import { toEventListItemDto } from '../dto.js';
import {
  listEventsQuerySchema,
  eventListResponseSchema,
} from '../api-schemas.js';

export async function registerEventsRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    '/events',
    {
      schema: {
        operationId: 'listEvents',
        tags: ['Events'],
        summary: 'List job events',
        description: 'Returns a paginated list of job lifecycle events, optionally filtered by job or event type.',
        querystring: listEventsQuerySchema,
        response: {
          200: eventListResponseSchema,
        },
      },
    },
    async (request) => {
      const query = request.query;
      const where = eventWhere(query);
      const skip = (query.page - 1) * query.pageSize;

      const [total, events] = await prisma.$transaction([
        prisma.jobEvent.count({ where }),
        prisma.jobEvent.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: query.pageSize,
          include: {
            job: {
              select: {
                id: true,
                title: true,
                companyName: true,
                status: true,
                score: true
              }
            }
          }
        })
      ]);

      const totalPages = Math.ceil(total / query.pageSize);

      return {
        data: events.map(toEventListItemDto),
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages,
          hasNextPage: query.page < totalPages
        }
      };
    }
  );
}

function eventWhere(query: z.infer<typeof listEventsQuerySchema>): Prisma.JobEventWhereInput {
  return {
    ...(query.jobId ? { jobId: query.jobId } : {}),
    ...(query.eventType ? { eventType: query.eventType } : {})
  };
}
