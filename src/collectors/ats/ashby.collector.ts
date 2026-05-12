import type { SourceConfig } from '../../config/sources.js';
import { PublicHtmlCollector } from '../html-public.collector.js';

export class AshbyCollector extends PublicHtmlCollector {
  constructor(source: SourceConfig) {
    super(source);
  }
}
