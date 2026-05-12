import { env } from '../config/env.js';
import { enabledSources, loadSourceConfigs } from '../config/sources.js';
import { logger } from '../logger/logger.js';
import { fetchJson } from '../utils/http.js';

async function main(): Promise<void> {
  const sources = enabledSources(await loadSourceConfigs());
  const searxng = sources.find((source) => source.id === 'searxng');
  const queries = searxng?.queries?.slice(0, 3) ?? ['remote TypeScript Node.js LATAM'];

  for (const query of queries) {
    const url = `${env.SEARXNG_BASE_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(
      query
    )}&format=json&categories=general&language=en-US`;
    const data = await fetchJson<{ results?: Array<{ title?: string; url?: string }> }>(url);
    logger.info(
      {
        query,
        results: (data.results ?? []).slice(0, 5).map((result) => ({
          title: result.title,
          url: result.url
        }))
      },
      'SearXNG query test'
    );
  }
}

main().catch((error) => {
  logger.error({ err: error }, 'SearXNG query test failed');
  process.exitCode = 1;
});
