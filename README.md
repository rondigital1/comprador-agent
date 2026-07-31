# Casero

Casero is a personal buying desk that reads promotional Gmail messages,
extracts their terms, compares them with the promotions observed so far, and
surfaces the offers worth attention.

This repository is now an executable Gmail-first scaffold. The current phase is
deliberately single-user: the owner will use it privately for several weeks or
months before any invited testing or public-release work.

## Current product decision

The first complete loop is:

```text
Google sign-in
→ explicit read-only Gmail connection
→ Promotions backfill and incremental sync
→ local sensitive/transactional filter
→ bounded LangGraph extraction
→ deterministic history and intent scoring
→ Today and Deals views
→ manual feedback and tuning
```

Login and Gmail access are separate grants. Signing in requests only identity
scopes. Connecting Gmail requests `gmail.readonly`, offline access, and stores
the Gmail access and refresh tokens encrypted with AES-256-GCM.

The Gmail capability is intentionally narrow:

- read-only; no send, modify, archive, label, or delete permission;
- initial backfill defaults to `category:promotions newer_than:1y`;
- incremental sync uses Gmail `historyId`;
- manual and polling sync work locally;
- Cloud Pub/Sub push and daily watch renewal are scaffolded for a deployed URL;
- raw message bodies are processed in memory and are not stored;
- transactional/security mail is blocked locally before an LLM call;
- OpenAI Responses requests use `store: false`;
- the extraction graph has no browser, email, or purchase tools.

## Repository

```text
apps/
  web/          Next.js dashboard, Auth.js, Gmail OAuth, Pub/Sub route
  worker/       PostgreSQL outbox worker and Gmail sync handlers
packages/
  agent/        LangGraph deal pipeline and OpenAI structured extraction
  core/         Promotion schema, local filter, deterministic scoring
  database/     Prisma schema, migration, and PostgreSQL client
  gmail/        OAuth, encrypted tokens, Gmail API, message normalization
docs/           Product, architecture, validation, and implementation notes
```

## Stack

- TypeScript 6 and pnpm workspace
- Next.js 16 App Router, React 19, Auth.js, Tailwind CSS, shadcn/ui
- PostgreSQL 17 and Prisma 7
- Gmail API and Google OAuth 2.0
- LangGraph.js with typed domain boundaries
- OpenAI Responses API with structured output
- Vitest, ESLint, and Prettier

The extraction model defaults to `gpt-5.6-luna`. The latest flagship model is
not used for every email because extraction is a high-volume, schema-bound job;
stronger model tiers remain an exception path after measured failures.

## First run

Requirements:

- Node.js 24+
- pnpm through Corepack
- Docker
- a Google Cloud project
- an OpenAI API key

Install and start PostgreSQL:

```bash
corepack pnpm install
docker compose up -d postgres
corepack pnpm db:migrate
```

Create local configuration:

```bash
cp .env.example .env
openssl rand -base64 32
openssl rand -base64 32
```

Use one generated value for `AUTH_SECRET` and the other for
`TOKEN_ENCRYPTION_KEY`. Then add the Google and OpenAI values described below.
Keep `AUTH_TRUST_HOST=true` for local development. For deployment, configure the
trusted host according to the platform rather than accepting arbitrary forwarded
hosts.

Start the dashboard and worker together:

```bash
corepack pnpm dev
```

Open [http://localhost:3001](http://localhost:3001). The web command pins this
port because Google OAuth redirect URIs must match exactly; it will fail clearly
instead of silently selecting another port when the port is unavailable.

## Google Cloud setup

1. Create a Google Cloud project and enable the Gmail API.
2. Set the OAuth app name to **Casero** and configure the audience for an
   external app. During early development, add your own Gmail address as an
   allowed test user.
3. Add the restricted scope
   `https://www.googleapis.com/auth/gmail.readonly`.
4. Create an OAuth 2.0 client with application type **Web application**.
5. Add both authorized redirect URIs:
   - `http://localhost:3001/api/auth/callback/google`
   - `http://localhost:3001/api/gmail/callback`
6. Put the client ID and secret in `AUTH_GOOGLE_ID` and
   `AUTH_GOOGLE_SECRET`.

Google compares the complete redirect URI, including the scheme, hostname,
port, path, and trailing slash. The value of `GOOGLE_GMAIL_REDIRECT_URI` must be
identical to the second authorized redirect URI above. After changing redirect
URIs in Google Cloud, allow a few minutes for the update to take effect, restart
`pnpm dev`, and begin the Gmail connection again.

Google's external **Testing** status expires authorizations that include Gmail
scopes after seven days, so weekly reconnection is expected during the safest
early-development phase. Google currently lists personal-use apps with fewer
than 100 personally known users as verification-exempt, though users still pass
an unverified-app warning. Revisit publishing status and policy requirements
before using the app beyond the owner.

Pub/Sub is optional locally. Without it, the worker polls Gmail history at the
configured interval and the UI provides **Sync now**. Before deployment, create
a Pub/Sub topic/subscription, grant Gmail's push service account publisher
access, configure an authenticated push to `/api/gmail/push`, and set:

- `GMAIL_PUBSUB_TOPIC`
- `GMAIL_PUBSUB_AUDIENCE`
- `GMAIL_PUBSUB_SERVICE_ACCOUNT`

## Commands

```bash
corepack pnpm dev
corepack pnpm dev:web
corepack pnpm dev:worker
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:studio
corepack pnpm format
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## What is implemented versus next

Implemented in the scaffold:

- database schema and initial migration;
- Google identity login;
- separate Gmail connection/callback;
- encrypted Gmail token storage and refresh updates;
- initial backfill, history sync, polling, and optional push/watch paths;
- lease-token-fenced PostgreSQL outbox worker;
- Gmail message normalization and pre-LLM sensitive filtering;
- structured OpenAI extraction inside a bounded LangGraph;
- deterministic scoring and bounded “best observed” wording;
- Today, Deals, Shopping List, and Integrations UI;
- immediate shopping-item research with verified public offers and optional
  daily monitoring;
- disconnect/revoke/delete job path;
- focused unit tests.

Next implementation slice:

1. run the first real Gmail connection with local credentials;
2. inspect 20–50 real Promotions messages and fix parsing/classification gaps;
3. add store-membership preferences and item-search autocomplete;
4. add useful/irrelevant/incorrect feedback actions;
5. introduce eval fixtures from redacted owner-approved messages;
6. only then tune scoring, alerts, and stronger-model escalation.

## Design documents

- [Product design](docs/product-design.md)
- [Product validation](docs/product-validation.md)
- [Technical design](docs/technical-design.md)
- [Gmail integration](docs/email-integration.md)
- [Implementation plan](docs/implementation-plan.md)
- [Work breakdown](docs/work-breakdown.md)
- [Trust and quality plan](docs/trust-and-quality.md)

Current external behavior was checked on July 31, 2026. Recheck Google scope,
publishing, retention, and verification rules before adding users.
