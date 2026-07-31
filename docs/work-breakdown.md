# Casero work breakdown

## 1. Work packages

### Domain

- Zod schemas and versioning
- decimal money and ISO currency primitives
- date, timezone, and expiry normalization
- offer fingerprints and comparability
- promotion-strength and purchase-fit components
- product, listing, seller, condition, and variant identity
- project constraints and deterministic bundle checks
- claim-level evidence and history-coverage contracts

### Email

- identity login and separate Gmail-consent lifecycle
- encrypted access/refresh tokens and revocation
- initial Promotions backfill and incremental `historyId` synchronization
- local polling plus optional authenticated Pub/Sub push
- Gmail message normalization and safe HTML-to-text conversion
- content and attachment limits
- no raw-body persistence and derived-data purge on disconnect
- merchant normalization

### Agents

- graph state and terminal statuses
- deal-intake nodes
- source adapters and typed tool schemas
- research graph
- project graph and subgraphs
- model router and escalation policy
- checkpointer, retry, cancellation, and idempotency rules

### Product UI

- onboarding and history-building state
- Today feed
- Deals and evidence drawer
- Projects and item progress
- Watchlist
- Purchase Plan
- Programs
- Activity
- feedback and correction
- Settings, consent, notifications, export, and deletion

### Quality and operations

- fixture consent and dataset provenance
- held-out offline eval runner
- integration tests with recorded provider responses
- prompt, schema, graph, model, and comparison registry
- trace redaction
- cost and latency metrics
- source health and freshness
- retention, incident, and deletion runbooks

## 2. Repository milestones

### Milestone A

```text
apps/web
apps/worker
packages/core
packages/database
packages/gmail
packages/agent
```

Prove direct Gmail authorization, safe extraction, deterministic scoring, the
business data model, and the dashboard without premature deployment complexity.

### Milestone B

Add redacted fixtures, feedback actions, intent editing, evidence detail, and
measured extraction/ranking improvements. Product research adapters come only
after the Gmail deal loop is useful.

Keep files focused. Split mixed responsibilities before files approach roughly
250–300 lines.

## 3. Current decisions and next checkpoints

Decided:

1. The first release is a personal tool used only by its owner.
2. Gmail is integrated from the beginning with `gmail.readonly`.
3. Identity login and mailbox authorization are separate grants.
4. The app processes body content in memory and retains only normalized facts
   and redacted evidence.
5. Local polling and manual sync precede optional Pub/Sub deployment.
6. No notification, navigation, email, or purchase action is automated.

Decide from owner-use evidence:

1. Which merchants and categories need specialized parsing?
2. What monthly model budget and escalation threshold are justified?
3. Which feedback and intent-editing interactions matter most?
4. Which product-data adapter should be the first research source?
5. Whether redacted tracing is valuable enough to add.
