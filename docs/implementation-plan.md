# Comprador implementation plan

## Current mode

Build for one owner first. Do not recruit test users during the first several
weeks or months. Direct Gmail integration is the first data source, not a later
phase.

The goal is a reliable personal loop before broader shopping research:

```text
connect → ingest → filter → extract → compare → surface → correct
```

## Phase 1: scaffold and local Gmail loop

Status: scaffold complete; real credentials and live-message verification are
next.

Included:

- pnpm TypeScript workspace;
- Next.js dashboard and Google login;
- separate read-only Gmail OAuth grant;
- PostgreSQL/Prisma schema and initial migration;
- encrypted Gmail token storage;
- initial backfill and `historyId` sync;
- polling/manual sync plus optional Pub/Sub/watch path;
- durable outbox worker with fenced leases and retries;
- local sensitive/transactional filter;
- bounded LangGraph and OpenAI structured extraction;
- deterministic history/intent evaluation;
- Today, Deals, and Integrations surfaces;
- disconnect/revoke/delete path;
- lint, type-check, test, and build commands.

Exit gate:

- connect the owner's Gmail successfully;
- process at least 20 real Promotions messages;
- show no receipt/security message sent to the model in the inspected sample;
- reconnect and resume cleanly after an expired token;
- disconnect removes Gmail-derived rows and prevents queued reads.

## Phase 2: correctness corpus

Duration: two to four weeks of personal use.

Work:

- review each surfaced and discarded promotion;
- save redacted, owner-approved fixtures for extraction and filter failures;
- label critical fields: merchant, promotion status, discount, minimum, code,
  dates, exclusions, and evidence;
- add per-field precision/recall reporting;
- tune deterministic rules before changing models;
- add a stronger-model retry only for measured schema/conflict failures;
- add an evidence-detail view and useful/irrelevant/incorrect feedback.

Exit gate:

- at least 100 reviewed messages across at least five merchants;
- zero known security/account messages passed to the model;
- critical surfaced claims reach at least 98% precision on the personal corpus;
- invalid or misleading top recommendations stay below 5%;
- every surfaced claim has a supporting excerpt or is explicitly unknown.

These are personal acceptance gates, not statistically generalizable product
claims.

## Phase 3: active shopping intent

Work:

- create/edit/archive shopping intents;
- match promotions to intents without letting relevance inflate promo strength;
- add save, dismiss, and purchased feedback;
- show `NO_ACTIVE_INTENT`, `LOW`, `MEDIUM`, or `HIGH` purchase fit;
- tune the Today queue to remain short and useful;
- optionally add a daily digest only after the dashboard ranking is trusted.

Exit gate:

- the owner makes at least one evidence-backed decision per week for four weeks;
- the top queue is useful at least 80% of the time in owner review;
- routine promotions do not dominate the feed;
- digest volume, if enabled, remains at or below three alerts per week.

## Phase 4: product research

Only after email value is proven:

- add a bounded single-item research brief;
- use permitted retailer/search adapters;
- normalize exact product variants and current listings;
- verify the top candidates;
- rank hard constraints in code;
- present three sourced candidates and explicit trade-offs.

Do not add universal scraping, autonomous checkout, a universal cart, or
free-running agent swarms.

## Phase 5: multi-item projects

Only after single-item research is reliable:

- create project and item-requirement records;
- allocate budgets across items;
- run bounded item subgraphs;
- review compatibility and shared constraints;
- produce a purchase plan with incomplete-coverage warnings.

Before committing to room furnishing, run a source-coverage spike across 20 real
home-item briefs. Narrow the vertical if at least 80% do not produce three exact
current candidates across two permitted sellers.

## Later release gate

Invited users and public launch are separate decisions. Before either:

- create separate Google Cloud projects for development and production;
- repeat the OAuth, Limited Use, retention, and security review;
- determine verification and security-assessment requirements;
- add hosted secrets, backups, deletion receipts, support access controls, and
  incident procedures;
- run a real multi-user evaluation rather than extrapolating from owner usage.

## Immediate next tasks

1. Create `.env` from `.env.example`.
2. Configure the Google Cloud OAuth client and Gmail API.
3. Add the OpenAI API key.
4. Run `corepack pnpm dev`.
5. Sign in, connect Gmail, and inspect the first sync.
6. Record the first parsing/filter failures as redacted fixtures.
7. Implement the shopping-intent editor after ingestion is stable.
