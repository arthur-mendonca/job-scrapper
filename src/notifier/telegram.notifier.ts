import type { Job } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { truncate } from '../utils/text.js';

export class TelegramNotifier {
  async sendJob(job: Job): Promise<boolean> {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      logger.warn({ jobId: job.id }, 'Telegram credentials not configured; skipping notification');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: formatTelegramJob(job),
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
    }

    return true;
  }

  async sendSummary(summary: string): Promise<boolean> {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: summary,
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Telegram summary failed: ${response.status} ${body}`);
    }

    return true;
  }
}

export function formatTelegramJob(job: Job): string {
  const salary = formatSalary(job);
  const matchReasons = asStringArray(job.matchReasons).slice(0, 5);
  const riskFlags = asStringArray(job.riskFlags).slice(0, 5);
  const tags = job.stackTags.slice(0, 4).join('/');
  const sourceTrust = `Source trust: ${job.sourceTrustScore}/100`;

  return [
    `${job.score}/100 - ${job.title}${tags ? ` - ${tags}` : ''}`,
    '',
    `Company: ${job.companyName}`,
    `Location: ${job.location ?? 'Unknown'}`,
    `Source: ${job.source}`,
    sourceTrust,
    salary ? `Salary: ${salary}` : null,
    '',
    'Why it matches:',
    ...(matchReasons.length ? matchReasons.map((reason) => `- ${reason}`) : ['- No explicit match reasons']),
    '',
    'Risks:',
    ...(riskFlags.length ? riskFlags.map((risk) => `- ${risk}`) : ['- No major risks detected']),
    '',
    'Recommended action:',
    job.recommendedAction ?? 'Save for manual review.',
    '',
    `Link: ${job.canonicalUrl}`
  ]
    .filter((line): line is string => line !== null)
    .map((line) => truncate(line, 700))
    .join('\n');
}

function formatSalary(job: Job): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null;
  const currency = job.currency ?? 'USD';
  if (job.salaryMin !== null && job.salaryMax !== null && job.salaryMin !== job.salaryMax) {
    return `${currency} ${job.salaryMin}-${job.salaryMax}`;
  }
  return `${currency} ${job.salaryMin ?? job.salaryMax}`;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
