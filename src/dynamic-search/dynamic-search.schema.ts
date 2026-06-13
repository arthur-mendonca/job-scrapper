import { z } from 'zod';
import { CronExpressionParser } from 'cron-parser';

export const createDynamicSearchConfigSchema = z.object({
  label: z.string().min(1).max(200),
  queryText: z.string().min(2).max(500),
  normalizedQueryText: z.string().min(2).max(500),
  targetEngines: z.array(z.string().min(1)).min(1).default(['google', 'bing', 'duckduckgo']),
  intervalMinutes: z.number().int().min(15).default(360),
  cronExpression: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      CronExpressionParser.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'Invalid cron expression' }),
  isActive: z.boolean().default(true),

  // Enrichment controls
  targetSites: z.array(z.string().min(1)).default([]),
  excludedTerms: z.array(z.string().min(1)).default([]),
  requiredTerms: z.array(z.string().min(1)).default([]),
  locale: z.string().min(2).max(10).default('en-US'),
  maxResults: z.number().int().min(1).max(100).default(30)
});

export type CreateDynamicSearchConfigInput = z.infer<typeof createDynamicSearchConfigSchema>;

export const updateDynamicSearchConfigSchema = createDynamicSearchConfigSchema.partial();

export type UpdateDynamicSearchConfigInput = z.infer<typeof updateDynamicSearchConfigSchema>;
