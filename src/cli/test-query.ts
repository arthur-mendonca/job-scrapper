import { env } from '../config/env.js';
import { enabledSources, loadSourceConfigs } from '../config/sources.js';
import { logger } from '../logger/logger.js';
import { searxngHeaders } from '../collectors/searxng.collector.js';
import { fetchJson } from '../utils/http.js';
import { domainFromUrl } from '../utils/url.js';

async function main(): Promise<void> {
  const sources = enabledSources(await loadSourceConfigs());
  const searxng = sources.find((source) => source.id === 'searxng');
  const cliQuery = process.argv.slice(2).join(' ').trim();
  const queries = cliQuery ? [cliQuery] : searxng?.queries ?? ['remote TypeScript Node.js LATAM'];

  for (const query of queries) {
    const url = `${env.SEARXNG_BASE_URL.replace(/\/$/, '')}/search?q=${encodeURIComponent(
      query
    )}&format=json&categories=general&language=en-US`;
    const data = await fetchJson<{ results?: Array<{ title?: string; url?: string; content?: string; engine?: string }> }>(
      url,
      { headers: searxngHeaders() }
    );
    const results = data.results ?? [];
    logger.info(
      {
        query,
        url,
        count: results.length,
        results: results.slice(0, 10).map((result) => ({
          title: result.title,
          url: result.url,
          domain: result.url ? domainFromUrl(result.url) : null,
          engine: result.engine,
          content: result.content
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
