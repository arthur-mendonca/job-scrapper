import type { Job } from '@prisma/client';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

export class EmailNotifier {
  async sendDigest(jobs: Job[]): Promise<boolean> {
    if (!env.EMAIL_NOTIFICATIONS_ENABLED) return false;
    if (!env.SMTP_HOST || !env.SMTP_PORT || !env.EMAIL_FROM || !env.EMAIL_TO) {
      logger.warn('Email notifications enabled but SMTP settings are incomplete');
      return false;
    }

    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
    });

    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: env.EMAIL_TO,
      subject: `Job intelligence digest: ${jobs.length} high-scoring jobs`,
      text: jobs
        .map((job) => `${job.score}/100 - ${job.title} - ${job.companyName}\n${job.canonicalUrl}`)
        .join('\n\n')
    });

    return true;
  }
}
