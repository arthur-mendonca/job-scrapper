import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import '../config/env.js';
import { buildServer } from '../server/server.js';

async function main() {
  const app = await buildServer();
  await app.ready();

  const spec = (app as unknown as { swagger(): object }).swagger();
  const outputPath = resolve(process.cwd(), 'openapi.json');

  writeFileSync(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf-8');
  console.log(`OpenAPI spec written to ${outputPath}`);

  await app.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
