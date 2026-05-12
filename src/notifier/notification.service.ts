import type { Job } from '@prisma/client';
import { logger } from '../logger/logger.js';
import { EmailNotifier } from './email.notifier.js';
import { TelegramNotifier } from './telegram.notifier.js';

export class NotificationService {
  constructor(
    private readonly telegramNotifier = new TelegramNotifier(),
    private readonly emailNotifier = new EmailNotifier()
  ) {}

  async notifyJob(job: Job): Promise<boolean> {
    try {
      return await this.telegramNotifier.sendJob(job);
    } catch (error) {
      logger.error({ err: error, jobId: job.id }, 'Failed to send job notification');
      return false;
    }
  }

  async sendRunSummary(summary: string): Promise<void> {
    try {
      await this.telegramNotifier.sendSummary(summary);
    } catch (error) {
      logger.error({ err: error }, 'Failed to send Telegram run summary');
    }
  }

  async sendEmailDigest(jobs: Job[]): Promise<void> {
    try {
      await this.emailNotifier.sendDigest(jobs);
    } catch (error) {
      logger.error({ err: error }, 'Failed to send email digest');
    }
  }
}
