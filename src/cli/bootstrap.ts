import type { SourceConfig } from '../config/sources.js';
import { enabledSources, loadSourceConfigs } from '../config/sources.js';
import { buildCollectors } from '../collectors/collector.registry.js';
import { env } from '../config/env.js';
import { CollectionCycle } from '../pipeline/collection-cycle.js';

export interface BootstrapResult {
  cycle: CollectionCycle;
  sources: SourceConfig[];
}

export async function buildCollectionCycle(): Promise<BootstrapResult> {
  const sources = enabledSources(await loadSourceConfigs());
  const collectors = buildCollectors(sources);
  const cycle = new CollectionCycle(collectors, {
    notificationScoreThreshold: env.NOTIFICATION_SCORE_THRESHOLD
  });
  return { cycle, sources };
}
