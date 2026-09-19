# Competitive Launch Watcher

Ops dashboard that watches competitor X (Twitter) accounts and launch-related keywords, classifies posts as product launches vs noise, and surfaces alerts plus markdown digests.

v1 seed data is **Voice AI**. The schema and settings are industry-agnostic — swap the roster and keywords later.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Postgres via Drizzle (Neon, Supabase, or local Docker)
- Vercel Cron → `POST /api/cron/ingest`
- Auth.js — email + password

## Setup

```bash
pnpm install
cp .env.example .env.local
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You should see seeded Voice AI alerts.

Using Neon or Supabase instead of Docker: set `DATABASE_URL` to the provider connection string (use the pooled URL on Vercel) and skip `docker compose`.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `CRON_SECRET` | yes for ingest | Bearer token for `/api/cron/ingest` |
| `X_BEARER_TOKEN` | no | X API v2 bearer. Missing → mock mode |
| `NEXT_PUBLIC_APP_URL` | recommended | Public origin, e.g. `http://localhost:3000` |
| `AUTH_SECRET` | yes for login | Auth.js secret. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | recommended | App origin, e.g. `http://localhost:3000` |

Logged-out people see email sign in. Ingest still uses Grok X Search. Alert links can open the exact post on X.

## Seed

```bash
pnpm db:seed
```

Creates the `voice-ai` industry, 10 competitors, watch keywords (including downranks), settings (threshold `0.65`), and 12 mock posts with signals. Launch/feature rows above threshold become alerts so the UI works before X credentials exist.

## Local ingest (cron)

```bash
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

Without `X_BEARER_TOKEN` the route no-ops with `{ mode: "mock", ingested: 0 }`.

With a bearer token it fetches each active competitor timeline, searches recent posts for industry keywords, upserts `raw_posts` / `signals`, and opens `alerts` when `score >= threshold` and the label is `launch` or `feature`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm test` | Classifier unit tests (5 fixtures) |
| `pnpm db:migrate` | Apply SQL files in `drizzle/` |
| `pnpm db:seed` | Voice AI roster + mock alerts |
| `pnpm db:generate` | Drizzle kit generate (schema changes) |
| `pnpm db:push` | Drizzle kit push |

## Classifier (`lib/classifyPost.ts`)

Heuristic only (LLM hook is a stub):

- `+0.35` if the author is a watched competitor
- `+0.15 * weight` per matched phrase, capped at `+0.45`
- `+0.15` if the text contains an `http` link
- `+0.10` if product-y nouns appear (`model`, `api`, `sdk`, `agent`, `voice`, `realtime`)
- Negative keyword weights apply as written (hiring / podcast / congrats / meme ≈ `-0.8`)
- Clamp `0–1`
- `>= 0.75` → `launch`; `>= threshold` (default `0.65`) → `feature`; else `noise`

## Vercel deploy

1. Create a Neon or Supabase Postgres database.
2. Import the repo in Vercel. Framework preset: Next.js.
3. Set `DATABASE_URL`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, and optionally `X_BEARER_TOKEN` + auth vars.
4. After the first deploy, run migrate + seed against that database (`pnpm db:migrate && pnpm db:seed` with the production `DATABASE_URL`, or `drizzle-kit migrate` from CI).
5. `vercel.json` schedules `/api/cron/ingest` every 30 minutes. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set.

Cron is a Pro-plan feature on Vercel. Hobby can still hit the route with the curl above or an external scheduler.

## Product surfaces

- `/` — alert feed (newest first): competitor, summary, score, label, X link, timestamp, seen/dismiss
- `/competitors` — CRUD roster with active toggle
- `/settings` — industry name, score threshold, cron notes, quiet hours (stored only)
- `/digests` — generate a last-24h markdown digest from high-score signals

## Out of scope (v1)

LinkedIn/news scrapers, posting or replying on X, multi-tenant billing, LLM classifier, Slack/email (only `notified_at` is stored).
