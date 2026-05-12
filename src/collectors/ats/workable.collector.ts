import type { SourceConfig } from '../../config/sources.js';
import { PublicHtmlCollector } from '../html-public.collector.js';

export class WorkableCollector extends PublicHtmlCollector {
  constructor(source: SourceConfig) {
    super(source);
  }
}
