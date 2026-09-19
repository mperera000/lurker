# Competitive Launch Watcher — Build Plan

Hand this file to your AI coding tool. It is the instruction manual for the next slice: **usable every day**, on top of the existing v1 dashboard.

Session: vibe-check v2.6.1 · 18 Sep 2026  
Product manager: you. Engineer: the coding AI.

---

## 1. The Problem

Founders and operators miss competitor launches because they will not live on X all day. Manual checking is noisy. Hiring an analyst does not scale. v1 of this app already scores posts — but it is a costume until a real person can log in, pick who to watch, and get pinged at work.

In their words: **I do not have an X API bearer token, and I still need updates.**

## 2. The Vision

Open the app, sign in with email, type an industry, keep the suggested Top 5 (already checked), optionally search or “find companies I don’t know,” cap at 10, land on *your* alert feed, Add to Slack. Next launch from someone you watch shows up in Slack during work hours. Tap Open on X only when they want the exact post.

It should feel like a dense ops board, not a social network.

## 3. The Goal (three lines)

1. **Accomplish:** Catch competitor product launches without living on X.
2. **Do instead today:** Scroll competitor accounts (or miss them). v1 demo uses fake seeded posts.
3. **Why that sucks:** It is noisy, easy to skip, and you should not have to become an API developer to get a feed.

I’d know this worked if: **I logged in with X, watched 10 Voice AI (or another) accounts, and a real launch hit Slack the same day it posted.**

## 4. Who It’s For

Primary: **one operator** (founder, PM, competitive-intel person) who already cares about a market.

v1 was single-user. This slice is **multi-user, same product**: each person has their own industry + up to 10 accounts + their Slack.

Not a marketplace. Not “the whole internet watches everyone.”

First 10 users: you, plus people in founder / Voice AI / category Discords and X who already rant about missing launches.

## 5. User Flows

### Happy flow

1. Sign in or create an account with email.
2. Type industry (or tap a chip: Voice AI, Dev tools, Climate).
3. See Top 5 **already checked**, each with the company’s **exact X handle**. Uncheck freely. Type to search (e.g. `Gr` → Grok and other companies in that industry whose name or handle starts with `Gr`). Tap **Find companies I don’t know** for more suggestions. Stop at 10.
4. Land on alert feed filtered to *their* watches.
5. Add to Slack → pick a channel.
6. A `launch` alert posts to Slack with summary, score, Open on X.

### Rough day

- Wrong email/password → stay on login, friendly retry. Email already used → ask them to sign in.
- Grok returns junk handles → search to fix; never silently watch a wrong account. Never rewrite a handle to a “nicer” name (e.g. keep `@elevenlabsio`, do not show `@ElevenLabs` unless that is their X username).
- Ingest finds nothing → empty state: “Watching 7 accounts. No launches yet.”
- Slack install fails → dashboard still works; banner “Slack not connected.”
- Hit 10 accounts → Add disabled: “10 is the free cap. More accounts later.”

### Edge

- Come back after 3 months: watches still there; ingest still running.
- Two users watch ElevenLabs: one competitor row, two user_watch rows.
- User unchecks all Top 5: allow it, but block “Continue” until at least 1 account.

## 6. Features

### V1 (build now) — the walking skeleton

- Email + password login (no X developer app, no extra paid auth).
- Pick any industry (type + a few chips).
- Top 5 suggested, **pre-checked**. Each row shows company name + **exact X handle** as the company set it.
- Type-ahead search in that industry: after a short pause, suggest companies whose **name or handle starts with** what they typed (e.g. `Gr` → Grok). Do not call Grok on every keystroke.
- **Find companies I don’t know** (Grok + X Search suggestions; user accepts).
- Hard cap **10** watches per user (upgrade copy only, no Stripe).
- Alert feed = that user’s watches only.
- Heuristic classifier already in v1 (keep it).
- Ingest via **Grok X Search** (`x_search`, `allowed_x_handles`) on a cron — not a personal `X_BEARER_TOKEN`.
- **Add to Slack**, launch-only pings, honor quiet hours.
- Keep existing dashboard chrome (alerts, settings, digests) wired to the signed-in user.

### V2+ (do not build now)

- Pay for more than 10 accounts.
- WhatsApp, Teams, Discord, generic webhooks.
- LLM classifier as the primary scorer (keep the stub).
- LinkedIn / news.
- Custom lists per industry beyond one watchlist.
- Public shareable digest SEO pages.
- Quiet hours were store-only in v1 — **V1 of this slice does enforce them for Slack.**

## 7. System Architecture (plain labels)

```
Person → email login → Our app (Next.js)
                              ↓
                    Database (who they are, 10 watches)
                              ↓
              Timer (Vercel Cron) → Grok X Search → classify → alerts
                              ↓
                    Slack (launch only, if connected)
```

Code stays on GitHub. You own it. Keys live in `.env`, never in git.

## 8. Tech Stack

| Tool | What it does | Why | Cost |
|---|---|---|---|
| Next.js app we already have | The website | Don’t rewrite | Hosting: Vercel free → paid if cron/Pro |
| Postgres (Neon / existing) | Saves users, watches, posts | Already in v1 | Neon free tier, then paid |
| Auth.js + email/password | Sign in / create account | No X developer app; $0 extra | They still tap Open on X to see a post |
| xAI Grok API (`x_search`) | Find companies + fetch X activity | You have no X bearer; Grok can search X | Pay-per-token; start small |
| Heuristic `classifyPost` | Launch vs noise | Already tested | Free |
| Slack API (official) | Add to Slack | You chose Slack only | Slack is free for this |
| Vercel Cron | Every 30 min ingest | Already in v1 | Cron often needs Vercel Pro |

**Do not** add WhatsApp, Stripe, or a second classifier in this slice.

## 9. Data Model (plain words)

Keep v1 tables: industries (optional/global hints), competitors (shared companies), watch_keywords, raw_posts, signals, alerts, digests, app_settings.

**Add:**

- **User:** email, password hash, display name. Created on first Create account.
- **Watchlist:** belongs to one user. Industry name they typed. Quiet hours. Slack connection ids (or a sibling table).
- **User watch:** user + competitor. Max 10 per user. This is the cap.
- **Slack install:** user, workspace, channel, token (encrypted). One Slack dest per user for V1.

**Alert feed rule:** show alerts whose competitor is in that user’s watches.

**Do not** make alerts global for everyone anymore.

## 10. House Rules for Your AI

Copy into `CLAUDE.md` / project guide (keep that file under 100 lines):

```markdown
# House Rules for Competitive Launch Watcher

You're the engineer. I'm the product manager. Follow these on every change.

## How to work
- Think first: before non-trivial code, say what you'll build and ask about anything unclear. Don't guess.
- Keep it simple: build the simplest thing that solves the problem. No extra features, no "just in case" code.
- Change only what I asked: don't rewrite or "improve" unrelated code. If you spot something, tell me, don't do it.
- Aim at a finish line: work to a clear, checkable "done," then show me how each item checks out.

## How to write code
- Don't repeat yourself: one home for each piece of logic.
- Same name everywhere: if it's a "pickup," it's always a "pickup."
- Handle the sad path: every failure shows a friendly message and a way out.
- Leave a trail: log important actions (what happened, worked or failed, any error).
- Keep layers apart: screens, logic, and data storage stay separate.
- Self-contained features: each feature in its own folder.

## Definition of done (every change clears all of these)
- It works and didn't break anything that worked before.
- Build, linter, and formatter are green.
- Any test fails on the old code and passes on the new (fail-first).
- It touched only what the task needed.
- It matches the project's names and patterns.

Working is the floor, not the bar.

## This product (do not invent extra)
- Login is email + password. Ingest is Grok X Search. Pings are Slack only. No X OAuth.
- Top 5 industry suggestions start checked. Cap is 10 watches. No Stripe yet.
- Ping only launch-class alerts. Honor quiet hours for Slack.
- Do not add WhatsApp, Teams, LinkedIn, or an LLM classifier unless asked.
```

Names to keep: **watch**, **competitor**, **alert**, **signal**, **launch**, **industry**. Not “subscription,” “workspace,” or “tenant” unless we add billing.

## 11. Integrations (official only)

- **X:** OAuth 2.0 for login (developer.x.com app). Scopes: identify the user. Do not ask users for a bearer token.
- **xAI:** official API, Responses + tool `x_search`. `allowed_x_handles` (max 20; we only send up to 10). Company discovery prompt must return `{ name, xUsername }` JSON you validate.
- **Slack:** official Slack app, OAuth “Add to Slack,” chat.postMessage. Not a third-party Slack wrapper.

## 12. Cost Breakdown

| Service | Free-ish start | Watch-out |
|---|---|---|
| Vercel | Hobby | Cron every 30 min may need Pro |
| Neon Postgres | Free tier | Fine for tens of users |
| xAI Grok | Pay as you go | Ingest + “find companies” both spend tokens. Log usage. Don’t search 10 handles with a giant prompt every 30 min if a smaller one works |
| X developer app | Login is usually cheap | Login ≠ tweet firehose. Don’t buy X pay-per-use unless Grok ingest fails |
| Slack | Free | Fine |

Architecture trap: calling Grok for every competitor separately every 30 minutes. **Batch** the 10 handles in one `x_search` with `allowed_x_handles`.

## 13. Timeline

- **Phase 0 (1 sitting):** Grok search quality test — no product UI.
- **Phases 1–5 (about 2–3 weeks with AI):** login → onboarding → personal feed → ingest → Slack.
- **Phase 6:** deploy.
- **V2 (later):** paid extra seats/accounts, more channels.

This is about a **7 / 10** on complexity. A to-do list is a 2. Instagram is a 9. Doable; don’t add billing in the same breath.

## 14. Distribution

- **First 10:** you + operators who already track Voice AI (or one other niche you actually work in).
- **Where they gather:** X itself, category Discords, “I missed their launch” threads.
- **First move:** after Slack pings work for *you*, post a useful teardown (not spam) in one of those rooms: “I watch 10 Voice AI accounts and Slack me launches.” Waitlist optional.

If you cannot name those 10 people, distribution is the riskiest part — more than another feature.

## 15. Growth Loop

**Honest version:** this app does not grow by itself. Using it does not create the next user. No fake “invite 5 friends to unlock.”

Growth engine = **showing up in those communities** (Phase 14).

Later maybe a **content loop** (public industry digest pages). Not V1.

No cold-start marketplace problem. The first user gets value alone (their 10 watches + Slack).

## 16. Things to Handle Before Launch

| Item | When |
|---|---|
| Secrets in env (`AUTH_SECRET`, xAI, Slack, `CRON_SECRET`) | **Now** |
| Slack tokens encrypted at rest | **Now** |
| Privacy policy (you store X user id + watches) | Before other people log in |
| Terms | Before other people log in |
| Accessibility: keyboard, labels on switches/search | **Now** (don’t bolt on) |
| Error tracking (e.g. Sentry) | At launch |
| Postgres backups (Neon does this) | **Now** (managed) |
| Dependency updates | Later |

## 17. Pre-Launch Audits

Run these prompts on the repo before anyone else signs in:

- *Security audit:* "Audit my codebase for security vulnerabilities. Check authentication, authorization, input validation, rate limiting, secrets management, file upload security, CORS/CSRF protections, and timing attacks. Give me a severity rating for each issue found."
- *Scalability audit:* "Audit my codebase for scalability issues. Check for N+1 queries, unbounded database reads, missing pagination, polling vs real-time listeners, caching gaps, cold start performance, and concurrent user handling. Estimate the monthly cost impact of each issue."
- *Production readiness audit:* "Audit my codebase for production readiness. Check for error monitoring, test coverage on payment and authentication paths, accessibility basics, and deployment configuration. Tell me what will fail silently in production."

## 18. Working With Your AI Tool

- Keep the project guide under 100 lines. Details live next to the feature folder.
- Ask once: *Define a simple, consistent debug-logging plan for this app. Say what to log, the levels (from quiet INFO up to loud ERROR), and short category names for each feature. Write it to docs/DEBUG-LOGGING.md and follow it everywhere you write code.*
- Turn off unused Cursor plugins.
- Prompts are tiny specs: not “add Slack” — “Add to Slack OAuth. User picks one channel. Post only launch alerts. If Slack is down, show a toast and keep the dashboard working.”
- Before a fix: “How does this change what my user sees? Will it make the app slower? What does this look like on their worst day?”
- Working is the floor, not the bar.

Git: first working login → commit. Never put keys in git. Local = your laptop. Production = Vercel. Staging later if needed.

## 19. Build Phases with Checkpoints

Existing v1 stays. Do not scaffold a new app.

### Phase 0 — Prove Grok can see the accounts

Cheap test **before** OAuth UI.

- Call xAI `x_search` with Voice AI handles from seed (e.g. elevenlabsio, OpenAI) and one industry you don’t know well.
- Pass/fail: we get real post URLs/handles we can open on X, not hallucinated @names.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Prove Grok can see X
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished the Grok search test. Here's what your app can do now: nothing new on the website. We know whether Grok can actually find competitor posts."

🔧 WHAT WE JUST BUILT
- A one-off script or notebook that asks Grok to search X for a short list of usernames.
- A written pass/fail: real links vs made-up handles.

💡 WHY WE BUILT IT THIS WAY
- You said you do not have an X API bearer. The whole "usable every day" bet sits on Grok X Search. If this fails, we do not build login on sand.

📋 WHAT'S NEXT
"Next up, email login — so a person can get in without an X developer app."

❓ QUESTIONS?
Ask the user: "Does all of this make sense so far? Want to see any of it actually working before we move on? Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 1 — Email login

- Auth.js email + password.
- `users` table.
- Logged-out people see login. Logged-in people see the app.
- Alerts do not require X. Open on X is a link to the exact post.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Email login
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished login. Here's what your app can do now: you create an account with email, sign in, and land inside Launch Watcher. Alerts do not require X. Open on X is a link to the exact post."

🔧 WHAT WE JUST BUILT
- Email sign in and create account.
- A users table so we remember who came back.

💡 WHY WE BUILT IT THIS WAY
- You did not want to pay for an X login app. Login is identity. Grok still watches X. Slack still pings.

📋 WHAT'S NEXT
"Next up, pick an industry and the Top 5 companies — that's the aha."

❓ QUESTIONS?
Ask the user: "Does all of this make sense so far? Open localhost:3000. You should see email sign in. Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 2 — Industry + Top 5 + search + discover + cap 10

- Onboarding screens (skip if they already have watches).
- Grok suggests Top 5 for the typed industry; **checked by default**.
- Checklist handles must be the **exact X username** the company uses. Do not invent or alias handles.
- Type-ahead search: user types letters; after a pause, Grok suggests companies **in that industry** whose name or `@handle` starts with those letters. Search adds a competitor (create-or-link on exact `x_username`).
- Find companies I don’t know: more suggestions, user accepts.
- Cannot exceed 10.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Pick who to watch
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished onboarding. Here's what your app can do now: type Voice AI (or anything), see five companies already checked, search, or find hidden ones, up to 10."

🔧 WHAT WE JUST BUILT
- Industry field + chips.
- Suggested accounts with checkboxes on.
- Search and discover.
- A hard stop at 10.

💡 WHY WE BUILT IT THIS WAY
- You asked for any industry, Top 5 checked, search, unknown companies, and a 10-account limit. Payments for more wait.

📋 WHAT'S NEXT
"Next up, the alert feed shows only YOUR watches, not the old global Voice AI list."

❓ QUESTIONS?
Ask the user: "Does all of this make sense so far? Finish onboarding once. You should have up to 10 names. Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 3 — Personal alert feed

- `/` filters by `user_watches`.
- Competitors / settings / digests belong to the signed-in user (or hide global seed from other people’s feeds).
- Empty state if ingest hasn’t run.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Your feed
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished the personal feed. Here's what your app can do now: you only see alerts for accounts you chose."

🔧 WHAT WE JUST BUILT
- Watches tied to your login.
- The same alert cards as v1, scoped to you.

💡 WHY WE BUILT IT THIS WAY
- "Everyone logs in" is useless if they all see one shared Voice AI list.

📋 WHAT'S NEXT
"Next up, the timer asks Grok for new posts from those 10 handles and classifies them."

❓ QUESTIONS?
Ask the user: "Does all of this make sense so far? Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 4 — Grok ingest on cron

- `POST /api/cron/ingest` still locked with `CRON_SECRET`.
- For each user (or batched handles), `x_search` with `allowed_x_handles`.
- Upsert `raw_posts` / `signals` / `alerts` using existing classifier.
- Mock mode remains if `XAI_API_KEY` missing.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Live ingest
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished live ingest. Here's what your app can do now: the 30-minute job can pull real X activity through Grok and score it. Seed mock posts are no longer the only thing in the feed."

🔧 WHAT WE JUST BUILT
- Grok X Search behind the existing cron route.
- The same classifier tests still pass.

💡 WHY WE BUILT IT THIS WAY
- You don't have an X bearer. Grok search is Plan B we chose on purpose. Batch handles so we don't light money on fire.

📋 WHAT'S NEXT
"Next up, Add to Slack so a launch pings you at work."

❓ QUESTIONS?
Ask the user: "Hit the ingest curl. Do you see mode live and a real Open on X link? Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 5 — Slack

- Slack app, Add to Slack, one channel.
- Notify only `label = launch` (score already at/above launch band).
- Quiet hours: do not post; dashboard still shows the alert.
- If Slack missing, no crash.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Slack pings
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished Slack. Here's what your app can do now: a launch-class alert can show up in the channel you picked, unless it's quiet hours. You now have a genuine daily-use product."

🔧 WHAT WE JUST BUILT
- Add to Slack.
- Launch-only messages with Open on X.
- Quiet hours actually enforced for pings.

💡 WHY WE BUILT IT THIS WAY
- You said usable every day, then Slack only — not WhatsApp, not three messengers. Noise kills the habit.

📋 WHAT'S NEXT
"Next up, put it on Vercel so it runs while you sleep."

❓ QUESTIONS?
Ask the user: "Trigger a launch-class alert (or wait for ingest). Did Slack get it? Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

### Phase 6 — Deploy

- Neon (or hosted Postgres), Vercel env vars, cron, production `NEXT_PUBLIC_APP_URL`.
- X and Slack callback URLs for production.

═══════════════════════════════════════════════════════════
🔖 CHECKPOINT: Live on the internet
═══════════════════════════════════════════════════════════

STOP here. Before moving to the next phase, explain to the user:

📍 WHERE WE ARE
"We just finished deploy. Here's what your app can do now: login, watches, ingest, and Slack work on a public URL, not only localhost."

🔧 WHAT WE JUST BUILT
- Production env and cron.
- Callback URLs for X and Slack.

💡 WHY WE BUILT IT THIS WAY
- Localhost is a demo. Every day means it runs while you sleep.

📋 WHAT'S NEXT
"Polish empty states and the audits. Do not start Stripe until someone hits the 10 cap and asks to pay."

❓ QUESTIONS?
Ask the user: "Does all of this make sense so far? Want to see any of it actually working before we move on? Anything nagging at you?"

Wait for the user to respond before continuing.
═══════════════════════════════════════════════════════════

## 20. Open Questions

- Will X approve the login app quickly enough? (Need the developer portal either way.)
- How messy is Grok’s handle quality on obscure industries? Phase 0 answers this.
- One Slack channel per user is enough for V1 — confirm no “post to multiple channels.”

## 21. The Riskiest Assumption

**If Grok X Search cannot return real, openable posts (and real @handles) for the accounts someone picked, “usable every day” is fake.**

- **Cheap test:** Phase 0 script. Cost: a few xAI cents. Time: one sitting.
- **Pass:** ≥ 1 real post URL that opens on X for a known handle (e.g. @OpenAI or @elevenlabsio), and suggested handles for a second industry are mostly real.
- **Fail:** switch to X API pay-per-use, or a manual “paste a post” stopgap — do not keep building onboarding on sand.

## 22. Words You Now Know

- **Bearer token:** a secret password for an API. You don’t have an X one; users shouldn’t need one either.
- **Email login:** you create an account with us. No X developer app. Open on X is still a link to the post.
- **Grok X Search:** Grok’s official tool to search posts on X via xAI, without your personal X API token.
- **Watch:** one competitor account you asked the app to keep tabs on (max 10).
- **Alert:** a post we scored as a likely launch (or feature) worth your time.
- **Classifier:** the rules that turn a post into a score and a label.
- **Cron:** a timer that wakes the app (every 30 minutes) to look for new posts.
- **Add to Slack:** official Slack login so we may post in one channel you pick.
- **Quiet hours:** a clock window when we store the alert but don’t ping Slack.
- **Cap:** a limit. 10 watches for now; paying for more is later.

---

## Framing check

- Started from a real v1 + a real blocker (no X bearer), not a random feature list.
- Outcome is “catch launches without living on X” — Slack + personal watches move that needle. Mockups do not.
- Discovery here is **plan-only / directional**. Needs are tagged **hunch** except where this session proved them (no bearer token). Don’t pretend we mined Reddit.
- Differentiator: **any industry + discover unknown companies**, not a prettier card.

Do not implement this whole plan in one shot. Start at Phase 0. Wait at each checkpoint.
