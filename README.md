# Job Intelligence Pipeline

TypeScript/Node.js backend for discovering international remote software engineering opportunities and serving them to a separate frontend. It collects jobs from configured public sources, normalizes them, deduplicates repeated postings, scores them against a backend-leaning full stack profile, stores everything in PostgreSQL, exposes a Fastify API, and sends Telegram notifications for high-scoring matches.

This MVP is designed to run as two Dockerized runtimes on a VPS: a background worker that writes to PostgreSQL and an API server that reads/updates data for a frontend. It does not include the frontend app in this repository.

## What It Does Not Do

- No authenticated LinkedIn scraping.
- No cookies, session reuse, CAPTCHA bypass, or stealth browser automation.
- No private APIs or credentials for job boards.
- No GitHub Actions scheduler.
- No NestJS application for the MVP.
- No built-in auth inside the API; put Cloudflare Access, Basic Auth, or another proxy in front of it when exposing it.

## Stack

- TypeScript, Node.js, pnpm
- Prisma ORM and PostgreSQL
- Fastify for the API server
- Zod for environment/config validation
- Cheerio for static HTML/RSS parsing
- node-cron for worker scheduling
- Pino structured logging
- Telegram Bot API notifications
- Optional SMTP email digest
- Docker and Docker Compose

## Source Trust Score

Every source has a `sourceTrustScore` in `config/sources.example.json`. This is separate from the job match score.

- `90-100`: API/RSS official or public company careers page
- `70-89`: known job board without a clear API
- `50-69`: useful platform with login, subscription, or closed flow
- `30-49`: individual post, shortened link, or indirect source
- `0-29`: suspicious, generic, data entry, task job, or paid onboarding signal

Initial defaults:

- Remotive: `95`
- Himalayas: `95`
- We Work Remotely: `90`
- Get on Board: `90`
- Remote OK: `85`
- Y Combinator Jobs: `80`
- CI&T Careers: `90`
- Strider / Onstrider: `75`
- IT Recruiter / Recrut.ai: `60`
- SearXNG: `40`, unless a result URL maps back to a known source
- Email alerts: `50`

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create your local env file:

```bash
cp .env.example .env
```

Generate Prisma client and compile:

```bash
pnpm prisma:generate
pnpm build
```

Run migrations against your configured database:

```bash
pnpm prisma:migrate
```

Run one collection cycle:

```bash
pnpm collect
```

Start worker mode:

```bash
pnpm start
```

Run tests:

```bash
pnpm test
```

## Docker Setup

Create `.env` from `.env.example`, then start PostgreSQL, migrations, API, worker and SearXNG:

```bash
docker compose up -d
docker compose logs -f app worker
```

Run a one-shot cycle inside the worker container:

```bash
docker compose exec worker pnpm collect
```

Run migrations manually:

```bash
docker compose run --rm migrate
```

## Commands

- `pnpm dev`: start the worker through `tsx` for local development.
- `pnpm dev:api`: start the Fastify API through `tsx`.
- `pnpm dev:worker`: start the worker through `tsx`.
- `pnpm build`: generate Prisma client and compile TypeScript to `dist`.
- `pnpm start`: start scheduled worker mode from `dist`.
- `pnpm start:api`: start the compiled Fastify API from `dist`.
- `pnpm start:worker`: start scheduled worker mode from `dist`.
- `pnpm collect`: run one complete collection cycle from `dist`.
- `pnpm report`: log recent and high-scoring jobs.
- `pnpm test:query`: test configured SearXNG queries.
- `pnpm prisma:migrate`: apply Prisma migrations.
- `pnpm prisma:generate`: generate Prisma client.

`pnpm collect`, `pnpm start`, `pnpm start:api`, `pnpm start:worker`, and `pnpm report` expect the project to be built first.

## API

The API listens on `API_HOST` and `API_PORT` and exposes:

- `GET /health`: process and database health.
- `GET /api/dashboard`: operational metrics, top sources/stacks, last collection run and recent run errors.
- `GET /api/jobs`: paginated jobs with server-side filters and sorting.
- `GET /api/jobs/:id`: job detail with event history.
- `PATCH /api/jobs/:id/status`: update workflow status to `new`, `saved`, `discarded` or `applied`.
- `GET /api/sources`: configured sources enriched with persisted job stats.
- `GET /api/events`: recent job events with optional filters.
- `GET /api/settings`: read-only settings useful to the frontend.

`GET /api/jobs` supports `page`, `pageSize`, `status`, `source`, `stack`, `minScore`, `remoteType`, `seniority`, `q` and `sort`. Supported sort values are `lastSeen_desc`, `score_desc`, `discovered_desc`, `company_asc` and `title_asc`.

## Environment Variables

All environment parsing lives in `src/config/env.ts`. Do not read `process.env` elsewhere.

Key variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `TELEGRAM_BOT_TOKEN`: Telegram bot token. Leave blank to skip Telegram.
- `TELEGRAM_CHAT_ID`: Telegram chat ID. Leave blank to skip Telegram.
- `NOTIFICATION_SCORE_THRESHOLD`: minimum final score for notifications.
- `COLLECT_CRON`: cron expression for worker mode.
- `SEARXNG_BASE_URL`: SearXNG base URL.
- `INPUT_EMAIL_ALERTS_DIR`: directory for `.txt` and `.html` job alert files.
- `SOURCES_CONFIG_PATH`: source registry JSON path.
- `API_HOST`: Fastify listen host.
- `API_PORT`: Fastify listen port.
- `API_CORS_ORIGIN`: comma-separated frontend origins, or `*`.

See `.env.example` for the full list.

## Configuring Sources

Edit `config/sources.example.json` or point `SOURCES_CONFIG_PATH` to another JSON file with the same schema. Each source includes:

- `id`
- `name`
- `type`
- `enabled`
- `baseUrl`
- `accessMode`
- `sourceTrustScore`
- `rateLimitMs`
- `attributionRequired`
- optional `queries` or `endpoints`

Collectors fail source-by-source. A blocked or changed source logs an error but should not stop the whole cycle.

## Adding A Collector

1. Add a class implementing `JobCollector`.
2. Return only `RawJobItem[]`.
3. Do not write to Prisma, score jobs, or notify users inside the collector.
4. Register it in `src/collectors/collector.registry.ts`.
5. Add or update source config in `config/sources.example.json`.
6. Add focused parser tests if the source uses HTML.

## Data Flow

1. Collector returns raw items.
2. Normalizer creates `NormalizedJob`.
3. Deduplication checks canonical URL, normalized title/company, then content hash.
4. Scoring computes technical match and source trust adjustment separately.
5. Repositories persist jobs and job events.
6. Collection runs are persisted for dashboard visibility.
7. Notification service sends Telegram messages for jobs above threshold.
8. Scheduler runs the cycle using `COLLECT_CRON` and prevents overlapping runs.

## Known Limitations

- HTML collectors are best-effort and may need selector updates when a site changes.
- Recrut.ai and similar JS-heavy closed-flow sources may only be discoverable through public pages or SearXNG results.
- SearXNG results are indirect by default and get lower trust unless the final URL matches a known source.
- Email parsing is intentionally simple for MVP `.txt` and `.html` exports.
- The app respects public access boundaries and does not attempt anti-bot evasion.
