import type { JobEvent, Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export class JobEventRepository {
  async create(input: {
    jobId: string;
    eventType: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<JobEvent> {
    return prisma.jobEvent.create({
      data: {
        jobId: input.jobId,
        eventType: input.eventType,
        metadata: input.metadata
      }
    });
  }
}
