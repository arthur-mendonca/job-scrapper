import { enabledSources, loadSourceConfigs } from '../config/sources.js';
import { buildCollectors } from '../collectors/collector.registry.js';
import { env } from '../config/env.js';
import { CollectionCycle } from '../pipeline/collection-cycle.js';

export async function buildCollectionCycle(): Promise<CollectionCycle> {
  const sources = enabledSources(await loadSourceConfigs());
  const collectors = buildCollectors(sources);
  return new CollectionCycle(collectors, {
    notificationScoreThreshold: env.NOTIFICATION_SCORE_THRESHOLD
  });
}
