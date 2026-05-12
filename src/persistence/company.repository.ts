import type { Company } from '@prisma/client';
import { prisma } from './prisma.js';

export class CompanyRepository {
  async upsertByName(input: {
    name: string;
    website?: string | null;
    careersUrl?: string | null;
    atsType?: string | null;
    priority?: number;
    notes?: string | null;
  }): Promise<Company> {
    return prisma.company.upsert({
      where: { name: input.name },
      create: {
        name: input.name,
        website: input.website,
        careersUrl: input.careersUrl,
        atsType: input.atsType,
        priority: input.priority ?? 0,
        notes: input.notes
      },
      update: {
        website: input.website,
        careersUrl: input.careersUrl,
        atsType: input.atsType,
        priority: input.priority,
        notes: input.notes
      }
    });
  }
}
