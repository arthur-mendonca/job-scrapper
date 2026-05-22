# AGENTS.md — Codex Guidelines for Job Intelligence Pipeline

## 1. Project Mission

You are building a backend-only TypeScript/Node.js job intelligence pipeline for personal use.

The purpose of the application is to automate the discovery of international remote software engineering opportunities without requiring manual daily searches across job boards, search engines, ATS pages, hiring posts, or job alert emails.

The application must:

- collect jobs and hiring posts from multiple public/configured sources;
- normalize the collected data into a common schema;
- deduplicate repeated jobs;
- score each opportunity against the target profile;
- persist jobs, companies, recruiters, and job events in PostgreSQL;
- notify relevant opportunities through Telegram and optionally email;
- run as a Dockerized background worker on a VPS;
- support both scheduled execution and one-shot execution.

This is an MVP. Build it in a modular, maintainable way, but do not over-engineer it.

---

## 2. Non-Negotiable Constraints

Follow these constraints strictly.

### 2.1 Do Not Build

Do **not** build:

- a frontend;
- a NestJS application for the MVP;
- a GitHub Actions-based scheduler;
- authenticated LinkedIn scraping;
- cookie-based scraping;
- CAPTCHA bypass;
- stealth browser automation;
- browser automation that logs into LinkedIn;
- any scraping strategy that requires user credentials, session cookies, or anti-bot evasion.

### 2.2 LinkedIn Rules

LinkedIn-related discovery must be limited to:

- public search-engine-indexed results;
- public search results via SearXNG or similar metasearch;
- manually provided public URLs;
- parsing job alert emails or exported email HTML/text files.

Do not implement login flows, cookies, session reuse, headless stealth tricks, CAPTCHA workarounds, or private API access.

### 2.3 Runtime and Hosting Rules

The app must:

- run on a VPS using Docker Compose;
- run as a Dockerized background worker;
- support scheduled execution using an internal scheduler such as `node-cron`, or an equivalent container-safe cron strategy;
- support manual one-shot execution;
- be configurable through environment variables;
- use PostgreSQL as the persistent database;
- use Prisma as the ORM;
- use structured logging suitable for VPS operation.

---

## 3. Target Candidate Profile for Scoring

Score jobs against this target profile:

- Backend-leaning Full Stack Software Engineer.
- Full Stack positions are also acceptable. 
- Main stack: TypeScript, Node.js, NestJS, React/Next.js.
- Additional skills: AWS, Docker, CI/CD, PostgreSQL, AI/LLM automation.
- Target roles:
  - Mid-level / Intermediate Full Stack Engineer;
  - Node.js Developer;
  - Backend-leaning Full Stack Engineer;
  - AI Automation Engineer.
- Preferred market:
  - remote international roles;
  - LATAM-friendly;
  - USD compensation;
  - contract or full-time roles open to international candidates.

### 3.1 Roles to Penalize or Ignore

Penalize or ignore roles that are primarily:

- 7+ years required;
- staff/principal-only;
- onsite or hybrid;
- US-only;
- Python-first;
- Java-first;
- .NET-first;
- PHP-first;
- vague, low-information, or generic;
- unpaid test-project-heavy;
- unclear compensation with other risk signals.

---

## 4. Required Technical Stack

Use this stack unless explicitly instructed otherwise:

- TypeScript;
- Node.js;
- pnpm;
- Prisma ORM;
- PostgreSQL;
- Zod for validation and environment parsing;
- Cheerio for static HTML parsing;
- Playwright only for public pages that require rendering, without login or anti-bot bypass;
- Telegram Bot API for notifications;
- optional email notifications;
- SearXNG as a self-hosted or external metasearch API;
- Docker;
- Docker Compose;
- `node-cron` or similar scheduler;
- Pino or Winston for structured logging.

Prefer simple, explicit code over clever abstractions.

---

## 5. Expected Runtime Commands

The project must expose these commands through `package.json`:

```bash
pnpm dev              # local development
pnpm build            # compile TypeScript
pnpm start            # start worker mode
pnpm collect          # run one collection cycle and exit
pnpm report           # generate a summary report
pnpm test:query       # test SearXNG queries
pnpm prisma:migrate   # run Prisma migrations
pnpm prisma:generate  # generate Prisma client
```

The command behavior must be documented in the README.

---

## 6. Required Application Modes

Implement two execution modes.

### 6.1 One-Shot Mode

Command:

```bash
pnpm collect
```

Behavior:

- run one complete collection cycle;
- collect from configured sources;
- normalize results;
- deduplicate results;
- persist jobs;
- score jobs;
- notify jobs above the configured threshold if not already notified;
- generate structured logs;
- exit cleanly.

### 6.2 Worker Mode

Command:

```bash
pnpm start
```

Behavior:

- keep the process alive;
- schedule collection using `COLLECT_CRON`;
- run collection on schedule;
- log start/end/failure of each cycle;
- handle errors without crashing the worker when possible;
- shut down gracefully on SIGINT/SIGTERM.

---

## 7. Environment Variables

Create a `.env.example` containing all required variables.

Required variables:

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_pipeline?schema=public
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
NOTIFICATION_SCORE_THRESHOLD=75
COLLECT_CRON=0 */6 * * 1-5
SEARXNG_BASE_URL=http://searxng:8080
EMAIL_NOTIFICATIONS_ENABLED=false
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
EMAIL_TO=
LOG_LEVEL=info
INPUT_EMAIL_ALERTS_DIR=/app/input/email-alerts
```

Rules:

- Parse environment variables through a typed config module.
- Validate env variables with Zod.
- Do not read `process.env` directly across the codebase except inside the config module.
- Do not commit secrets.
- `.env` must be ignored by Git.

---

## 8. Suggested Project Structure

Use this structure unless there is a strong reason to alter it:

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── cli/
│   │   ├── collect.ts
│   │   ├── report.ts
│   │   ├── test-query.ts
│   │   └── worker.ts
│   ├── collectors/
│   │   ├── ats/
│   │   │   ├── ashby.collector.ts
│   │   │   ├── greenhouse.collector.ts
│   │   │   ├── lever.collector.ts
│   │   │   └── workable.collector.ts
│   │   ├── email-alerts.collector.ts
│   │   ├── job-boards/
│   │   │   ├── remote-ok.collector.ts
│   │   │   ├── remotive.collector.ts
│   │   │   └── we-work-remotely.collector.ts
│   │   ├── searxng.collector.ts
│   │   ├── collector.types.ts
│   │   └── collector.registry.ts
│   ├── config/
│   │   ├── env.ts
│   │   ├── companies.ts
│   │   └── sources.ts
│   ├── deduplication/
│   │   └── deduplication.service.ts
│   ├── logger/
│   │   └── logger.ts
│   ├── normalizer/
│   │   ├── normalizer.service.ts
│   │   └── normalizer.types.ts
│   ├── notifier/
│   │   ├── email.notifier.ts
│   │   ├── telegram.notifier.ts
│   │   └── notification.service.ts
│   ├── persistence/
│   │   ├── prisma.ts
│   │   ├── job.repository.ts
│   │   ├── company.repository.ts
│   │   ├── recruiter.repository.ts
│   │   └── job-event.repository.ts
│   ├── pipeline/
│   │   ├── collection-cycle.ts
│   │   └── pipeline.types.ts
│   ├── scheduler/
│   │   └── scheduler.ts
│   ├── scoring/
│   │   ├── scoring.service.ts
│   │   └── scoring.rules.ts
│   ├── utils/
│   │   ├── hashing.ts
│   │   ├── http.ts
│   │   ├── sleep.ts
│   │   └── url.ts
│   └── index.ts
├── config/
│   ├── companies.example.yml
│   └── sources.example.json
├── input/
│   └── email-alerts/.gitkeep
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

Keep collectors isolated from persistence. Collectors return raw items only. Persistence is handled by repositories and the pipeline service.

---

## 9. Core Interfaces

Define shared interfaces before implementing collectors.

### 9.1 JobCollector

```ts
export interface JobCollector {
  name: string;
  collect(): Promise<RawJobItem[]>;
}
```

### 9.2 RawJobItem

```ts
export interface RawJobItem {
  source: string;
  sourceUrl: string;
  title?: string;
  companyName?: string;
  location?: string;
  salaryText?: string;
  description?: string;
  requirements?: string;
  postedAt?: Date | null;
  raw?: unknown;
}
```

### 9.3 NormalizedJob

```ts
export interface NormalizedJob {
  source: string;
  sourceUrl: string;
  canonicalUrl: string;
  title: string;
  normalizedTitle: string;
  companyName: string;
  location: string | null;
  remoteType: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  seniority: string | null;
  description: string | null;
  requirements: string | null;
  stackTags: string[];
  postedAt: Date | null;
  contentHash: string;
}
```

### 9.4 JobScore

```ts
export interface JobScore {
  score: number;
  matchReasons: string[];
  riskFlags: string[];
  recommendedAction: string;
}
```

---

## 10. Collectors

Implement collectors as independent modules. Each collector must:

- implement `JobCollector`;
- return `RawJobItem[]`;
- not write to the database;
- not send notifications;
- not perform scoring;
- handle request failures gracefully;
- log source-specific errors without stopping the entire pipeline;
- use reasonable HTTP timeouts;
- avoid aggressive request rates.

### 10.1 SearXNG Collector

The SearXNG collector must:

- query `SEARXNG_BASE_URL`;
- use the SearXNG HTTP Search API;
- support configurable query templates;
- search for formal job pages and hiring posts;
- return search results as raw job-like items.

Suggested query themes:

- `remote TypeScript Node.js LATAM USD developer`
- `remote Node.js backend engineer LATAM contract`
- `remote NestJS developer USD`
- `remote full stack TypeScript React Node LATAM`
- `AI automation engineer Node.js remote`
- `site:greenhouse.io TypeScript Node.js remote LATAM`
- `site:lever.co Node.js remote LATAM`
- `site:ashbyhq.com TypeScript remote LATAM`

Do not assume search results are valid jobs. Normalize and score them later.

### 10.2 ATS Collectors

Implement skeletons or working collectors for:

- Greenhouse;
- Lever;
- Ashby;
- Workable.

Rules:

- use public company career pages only;
- allow company career pages to be configured through `config/companies.example.yml` or `config/sources.example.json`;
- avoid login or authenticated endpoints;
- implement each ATS collector independently;
- do not hardcode all companies inside source files.

### 10.3 Job Board Collectors

Implement collectors for accessible sources such as:

- Remote OK;
- We Work Remotely;
- Remotive;
- Himalayas or similar public sources where accessible.

Rules:

- prefer official public endpoints where available;
- otherwise parse public HTML cautiously;
- do not bypass anti-bot systems;
- if a site blocks or restricts automated access, fail gracefully and document the limitation.

### 10.4 Email / Job Alert Collector

Implement an MVP collector that reads local files from:

```text
/app/input/email-alerts
```

The directory must be configurable through `INPUT_EMAIL_ALERTS_DIR`.

Support:

- `.txt` files;
- `.html` files;
- raw exported job alert emails where practical.

Extract when available:

- title;
- company;
- URL;
- location;
- description;
- source.

Do not connect to Gmail or any email account in the MVP unless explicitly requested later.

---

## 11. Normalization Rules

The normalizer must convert `RawJobItem` into `NormalizedJob`.

Normalize:

- title;
- company name;
- location;
- seniority;
- remote type;
- salary range;
- currency;
- stack tags;
- source URL;
- canonical URL;
- posted date;
- content hash.

### 11.1 Stack Tag Detection

Detect stack tags from title, description, and requirements.

Important positive tags:

- TypeScript;
- JavaScript;
- Node.js;
- NestJS;
- React;
- Next.js;
- AWS;
- Docker;
- CI/CD;
- PostgreSQL;
- REST APIs;
- AI;
- LLM;
- automation.

Important negative or lower-priority tags when primary:

- Python;
- Java;
- .NET;
- C#;
- PHP;
- Ruby;
- mobile-only;
- WordPress-only.

### 11.2 Remote Compatibility Detection

Classify `remoteType` as:

- `remote`;
- `hybrid`;
- `onsite`;
- `unknown`.

Detect and preserve restrictions such as:

- LATAM;
- Americas;
- worldwide;
- US-only;
- Europe-only;
- specific country only.

US-only should be penalized heavily.

### 11.3 Seniority Detection

Detect seniority from title and description.

Examples:

- Intern;
- Junior;
- Mid-level;
- Intermediate;
- Senior;
- Staff;
- Principal;
- Lead.

The target is mid-level/intermediate. Senior may be acceptable if requirements are realistic. Staff/principal-only should be penalized heavily.

---

## 12. Scoring Rules

Implement scoring from 0 to 100.

The scoring service must return:

- score;
- match reasons;
- risk flags;
- recommended action.

### 12.1 Positive Signals

Add points for:

- TypeScript;
- Node.js;
- NestJS;
- React;
- Next.js;
- AWS;
- Docker;
- CI/CD;
- PostgreSQL;
- REST APIs;
- AI/LLM;
- automation;
- backend-leaning full stack;
- remote;
- LATAM-friendly;
- USD compensation;
- contract role;
- clear company;
- clear compensation;
- realistic requirements.

### 12.2 Negative Signals

Subtract points or add risk flags for:

- 7+ years required;
- staff/principal-only;
- onsite;
- hybrid;
- US-only;
- vague company;
- unpaid test project;
- Python/Java/.NET/PHP as the primary stack;
- unclear compensation;
- generic description;
- unclear location restrictions;
- unrealistic requirement list.

### 12.3 Recommended Actions

Return one of these action styles:

- `Apply through company website.`
- `Apply and contact recruiter if available.`
- `Save for manual review.`
- `Ignore unless compensation is confirmed.`
- `Ignore due to location or seniority mismatch.`

Avoid black-box scoring. Make reasons explicit.

---

## 13. Deduplication Rules

Deduplicate jobs using:

1. canonical URL;
2. normalized title + normalized company name;
3. content hash.

Rules:

- Do not notify the same job more than once.
- If an existing job is found again, update `lastSeenAt` and `updatedAt`.
- Optionally create a `JobEvent` when an existing job is rediscovered.
- Keep deduplication logic outside collectors.
- Normalize URLs before comparison by removing tracking parameters where safe.

---

## 14. Persistence Layer

Use Prisma repositories.

Do not call Prisma directly from collectors, normalizer, scoring, or notifier modules unless there is a clear reason. Prefer repository classes/functions.

Required repositories:

- `JobRepository`;
- `CompanyRepository`;
- `RecruiterRepository`;
- `JobEventRepository`.

Repositories should handle:

- create;
- update;
- find by canonical URL;
- find by title/company;
- mark as notified;
- list high-scoring jobs;
- list recent jobs;
- create job events.

---

## 15. Database Models

Create a Prisma schema with at least these models.

### 15.1 Job

Fields:

- id;
- source;
- sourceUrl;
- canonicalUrl;
- title;
- normalizedTitle;
- companyName;
- location;
- remoteType;
- salaryMin;
- salaryMax;
- currency;
- seniority;
- description;
- requirements;
- stackTags;
- postedAt;
- discoveredAt;
- lastSeenAt;
- score;
- status;
- contentHash;
- notifiedAt;
- createdAt;
- updatedAt.

Recommended statuses:

- `new`;
- `notified`;
- `saved`;
- `applied`;
- `ignored`;
- `rejected`;
- `interviewing`;
- `offer`;
- `ghosted`.

### 15.2 Company

Fields:

- id;
- name;
- website;
- careersUrl;
- atsType;
- priority;
- notes;
- createdAt;
- updatedAt.

### 15.3 Recruiter

Fields:

- id;
- name;
- companyName;
- linkedinUrl;
- email;
- notes;
- lastContactedAt;
- createdAt;
- updatedAt.

### 15.4 JobEvent

Fields:

- id;
- jobId;
- eventType;
- metadata;
- createdAt.

Use indexes where appropriate:

- `canonicalUrl`;
- `contentHash`;
- `companyName`;
- `normalizedTitle`;
- `score`;
- `status`;
- `notifiedAt`;
- `lastSeenAt`.

---

## 16. Notification Rules

Implement Telegram notifications for jobs above `NOTIFICATION_SCORE_THRESHOLD`.

Rules:

- do not notify jobs already notified;
- mark jobs as notified only after successful notification;
- include a per-run summary;
- optionally support email digest if `EMAIL_NOTIFICATIONS_ENABLED=true`;
- keep notification formatting readable on mobile.

### 16.1 Telegram Message Format

Use this format:

```text
87/100 — Full Stack Engineer — TypeScript/Node/AWS

Company: ExampleCo
Location: Remote LATAM
Source: Greenhouse
Salary: $5k–$7k USD, if available

Why it matches:
- TypeScript + Node.js
- AWS/Docker
- Remote LATAM

Risks:
- asks for 5+ years

Recommended action:
Apply through company website and contact recruiter.

Link: https://example.com/job
```

Avoid overly long messages. If the data is too long, truncate description fields.

---

## 17. Scheduler Rules

Implement a scheduler module using `COLLECT_CRON`.

Example:

```env
COLLECT_CRON=0 */6 * * 1-5
```

This means every 6 hours on weekdays.

Rules:

- validate the cron expression at startup;
- log next scheduled execution when possible;
- prevent overlapping runs;
- if one collection cycle is still running, skip the next scheduled execution and log a warning;
- handle SIGINT/SIGTERM gracefully.

---

## 18. Docker and Deployment Requirements

Generate:

- production-ready `Dockerfile` using multi-stage build;
- `docker-compose.yml`;
- `.dockerignore`;
- `.env.example`;
- persistent PostgreSQL volume;
- mounted folder for input email alerts;
- app restart policy;
- healthcheck where reasonable.

### 18.1 Dockerfile Rules

The Dockerfile must:

- use pnpm;
- use a reasonably small Node base image;
- install dependencies reproducibly;
- build TypeScript;
- generate Prisma client as needed;
- not run the app as root;
- use production dependencies in the runtime image where practical.

### 18.2 Docker Compose Rules

`docker-compose.yml` must include at least:

- `app` worker container;
- `postgres` container;
- optional `searxng` container or support for external `SEARXNG_BASE_URL`;
- named PostgreSQL volume;
- input volume for raw email/job alert files;
- restart policy.

Include example commands in the README:

```bash
docker compose up -d
docker compose logs -f app
docker compose exec app pnpm collect
docker compose exec app pnpm prisma:migrate
```

---

## 19. README Requirements

The README must explain:

- project purpose;
- what the app does;
- what the app explicitly does not do;
- local setup;
- Docker setup;
- VPS deployment using Docker Compose;
- environment variables;
- database migrations;
- how to run one-shot mode;
- how to run worker mode;
- how to configure sources;
- how to configure SearXNG;
- how to configure Telegram;
- how to add new collectors;
- known limitations;
- anti-abuse and LinkedIn constraints.

The README must make clear that the MVP does not perform authenticated scraping or bypass anti-bot systems.

---

## 20. Code Quality Guidelines

Follow these rules:

- Write TypeScript with strict typing.
- Prefer explicit interfaces and return types.
- Avoid `any` unless absolutely necessary; use `unknown` and validate with Zod when appropriate.
- Keep side effects isolated.
- Keep collectors, normalization, scoring, persistence, notifications, and scheduling separate.
- Do not let collectors write to the database.
- Do not let collectors send notifications.
- Do not let notification logic decide persistence rules.
- Use structured logs.
- Handle errors per source, not by killing the entire pipeline.
- Keep functions small and testable.
- Add comments only where they explain non-obvious decisions.

---

## 21. Error Handling and Logging

Use structured logging with Pino or Winston.

Log:

- collection cycle start;
- collection cycle end;
- collector start/end;
- number of raw items collected per source;
- number of normalized jobs;
- number of deduplicated jobs;
- number of new jobs persisted;
- number of jobs scored above threshold;
- number of notifications sent;
- collector failures;
- notification failures;
- database errors;
- scheduler events.

Do not log secrets.

A failed collector should not stop the whole collection cycle unless it causes an unrecoverable system error.

---

## 22. Testing and Validation

Add practical tests where useful.

Minimum expectations:

- unit tests for scoring rules;
- unit tests for URL canonicalization;
- unit tests for deduplication matching;
- unit tests for stack/seniority/remote detection;
- test command for SearXNG queries;
- sample email alert files for parser validation.

Do not block MVP delivery by building an excessive testing framework, but critical matching and scoring logic must be testable.

---

## 23. Implementation Order

Implement in this order unless instructed otherwise:

1. base project setup: package.json, tsconfig, folder structure;
2. env config module with Zod;
3. logger;
4. Prisma schema and repository layer;
5. shared collector interfaces;
6. normalizer;
7. scoring service;
8. deduplication service;
9. SearXNG collector;
10. email/job alert collector;
11. one or two job board collectors;
12. ATS collector skeletons;
13. Telegram notifier;
14. collection pipeline orchestration;
15. CLI commands;
16. scheduler/worker;
17. Dockerfile and docker-compose.yml;
18. README;
19. tests for scoring/deduplication/canonicalization.

At each step, keep the app runnable.

---

## 24. Definition of Done for the MVP

The MVP is complete when:

- `pnpm build` succeeds;
- `pnpm collect` runs one collection cycle and exits;
- `pnpm start` starts the scheduled worker;
- PostgreSQL persistence works through Prisma;
- duplicate jobs are not reinserted as new jobs;
- jobs are scored from 0 to 100;
- high-scoring jobs trigger Telegram notifications;
- already notified jobs are not notified again;
- `.env.example` documents all required variables;
- Docker build succeeds;
- `docker compose up -d` starts the app and database;
- README explains local setup and VPS deployment;
- LinkedIn/authenticated scraping constraints are respected.

---

## 25. Important Behavioral Instruction for Codex

When implementing this project:

- do not silently change the stack;
- do not introduce NestJS;
- do not introduce a frontend;
- do not introduce GitHub Actions as scheduler;
- do not add authenticated scraping;
- do not add stealth browsing;
- do not require paid APIs unless explicitly made optional;
- do not hardcode secrets;
- do not skip Docker deployment files;
- do not collapse all logic into one file;
- do not let the pipeline become coupled to a single data source.

Prefer an MVP that works reliably over an ambitious system that is difficult to run on a VPS.
