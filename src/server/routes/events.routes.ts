import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../persistence/prisma.js';
import { toEventListItemDto } from '../dto.js';

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional()
);

const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  jobId: optionalString,
  eventType: optionalString
});

export async function registerEventsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/events', async (request) => {
    const query = listEventsQuerySchema.parse(request.query);
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
  });
}

function eventWhere(query: z.infer<typeof listEventsQuerySchema>): Prisma.JobEventWhereInput {
  return {
    ...(query.jobId ? { jobId: query.jobId } : {}),
    ...(query.eventType ? { eventType: query.eventType } : {})
  };
}
