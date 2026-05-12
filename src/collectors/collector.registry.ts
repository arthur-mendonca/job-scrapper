import type { SourceConfig } from '../config/sources.js';
import { logger } from '../logger/logger.js';
import type { JobCollector } from './collector.types.js';
import { EmailAlertsCollector } from './email-alerts.collector.js';
import { PublicHtmlCollector } from './html-public.collector.js';
import { SearxngCollector } from './searxng.collector.js';
import { GetOnBoardCollector } from './job-boards/get-on-board.collector.js';
import { HimalayasCollector } from './job-boards/himalayas.collector.js';
import { RemoteOkCollector } from './job-boards/remote-ok.collector.js';
import { RemotiveCollector } from './job-boards/remotive.collector.js';
import { WeWorkRemotelyCollector } from './job-boards/we-work-remotely.collector.js';

export function buildCollectors(sources: SourceConfig[]): JobCollector[] {
  const enabled = sources.filter((source) => source.enabled);
  const collectors: JobCollector[] = [];

  for (const source of enabled) {
    const collector = buildCollector(source, sources);
    if (collector) {
      collectors.push(collector);
    } else {
      logger.warn({ sourceId: source.id }, 'No collector registered for enabled source');
    }
  }

  return collectors;
}

function buildCollector(source: SourceConfig, allSources: SourceConfig[]): JobCollector | null {
  switch (source.id) {
    case 'remotive':
      return new RemotiveCollector(source);
    case 'himalayas':
      return new HimalayasCollector(source);
    case 'we-work-remotely':
      return new WeWorkRemotelyCollector(source);
    case 'remote-ok':
      return new RemoteOkCollector(source);
    case 'get-on-board':
      return new GetOnBoardCollector(source);
    case 'searxng':
      return new SearxngCollector(source, allSources);
    case 'email-alerts':
      return new EmailAlertsCollector(source);
    case 'y-combinator-jobs':
    case 'ciandt-careers':
    case 'onstrider':
    case 'recrut-ai':
      return new PublicHtmlCollector(source);
    default:
      if (source.accessMode === 'html' || source.accessMode === 'closed_public') {
        return new PublicHtmlCollector(source);
      }
      return null;
  }
}
