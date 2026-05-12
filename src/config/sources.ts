import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { env } from './env.js';

export const sourceTypes = ['job_board', 'company', 'search', 'email'] as const;
export const sourceAccessModes = ['api', 'rss', 'html', 'search', 'email', 'closed_public'] as const;

export type SourceType = (typeof sourceTypes)[number];
export type SourceAccessMode = (typeof sourceAccessModes)[number];

export const sourceConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(sourceTypes),
  enabled: z.boolean().default(true),
  baseUrl: z.string().default(''),
  accessMode: z.enum(sourceAccessModes),
  sourceTrustScore: z.number().int().min(0).max(100),
  rateLimitMs: z.number().int().min(0).default(1500),
  attributionRequired: z.boolean().default(false),
  notes: z.string().optional(),
  queries: z.array(z.string()).optional(),
  endpoints: z.array(z.string()).optional()
});

export type SourceConfig = z.infer<typeof sourceConfigSchema>;

export async function loadSourceConfigs(configPath = env.SOURCES_CONFIG_PATH): Promise<SourceConfig[]> {
  const resolvedPath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
  const raw = await readFile(resolvedPath, 'utf8');
  return z.array(sourceConfigSchema).parse(JSON.parse(raw));
}

export function enabledSources(sources: SourceConfig[]): SourceConfig[] {
  return sources.filter((source) => source.enabled);
}

export function trustBucket(sourceTrustScore: number): string {
  if (sourceTrustScore >= 90) return 'official-or-company';
  if (sourceTrustScore >= 70) return 'known-board';
  if (sourceTrustScore >= 50) return 'useful-closed-flow';
  if (sourceTrustScore >= 30) return 'indirect';
  return 'suspicious';
}
