import type { Recruiter } from '@prisma/client';
import { prisma } from './prisma.js';

export class RecruiterRepository {
  async create(input: {
    name: string;
    companyName?: string | null;
    linkedinUrl?: string | null;
    email?: string | null;
    notes?: string | null;
  }): Promise<Recruiter> {
    return prisma.recruiter.create({ data: input });
  }
}
