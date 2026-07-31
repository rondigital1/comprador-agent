# Casero Gmail integration

## 1. Current decision

Direct Gmail integration is part of the first working version. The owner is the
only user for the first several weeks or months, so the goal is to build the
correct long-term boundary while keeping local operation simple.

Use two Google grants:

1. Auth.js login requests `openid email profile`.
2. **Connect Gmail** requests `gmail.readonly` with offline access.

This avoids making permanent mailbox permission a hidden consequence of login.
It also lets the user disconnect Gmail without deleting the Casero account.

## 2. OAuth flow

```text
authenticated user selects Connect Gmail
→ server creates random state in an HttpOnly SameSite cookie
→ redirect to Google with gmail.readonly + access_type=offline
→ callback validates session, state, code, and error
→ exchange code on the server
→ fetch Gmail profile and current historyId
→ encrypt access/refresh tokens with AES-256-GCM
→ store a versioned consent grant
→ enqueue the initial sync
```

The application never sends OAuth tokens to the browser. Encryption uses a
separate `TOKEN_ENCRYPTION_KEY`, not the Auth.js session secret. A refreshed
access token is encrypted and persisted by the Gmail client token event.

The Google OAuth web client has these local callbacks:

- `http://localhost:3001/api/auth/callback/google`
- `http://localhost:3001/api/gmail/callback`

Register both as authorized redirect URIs on the same Google OAuth web client.
Google requires an exact match, including the port and path, and
`GOOGLE_GMAIL_REDIRECT_URI` must equal the second URI.

## 3. Initial and incremental sync

The default initial query is:

```text
category:promotions newer_than:1y
```

The query is application configuration, not an OAuth limitation. Google has
authorized read access to the mailbox; Casero enforces the Promotions and
date boundary in code and explains that distinction in the UI.

Initial sync:

```text
capture current Gmail profile historyId
→ list up to the configured cap with messages.list
→ create one idempotent message-processing job per Gmail message ID
→ store the captured historyId
→ enqueue an incremental sync to close the race window
```

Incremental sync:

```text
history.list from stored historyId
→ collect messageAdded IDs for CATEGORY_PROMOTIONS
→ enqueue idempotent message-processing jobs
→ atomically advance the cursor after enqueueing
```

If Gmail returns 404 because a history cursor is outside the retained range,
the worker runs a scoped full sync. Existing message/job uniqueness prevents
duplicate offers.

Local development works without a public webhook: the worker polls the Gmail
history cursor, and **Sync now** creates an immediate job. Deployment can add:

```text
Gmail watch
→ Google Cloud Pub/Sub
→ authenticated POST /api/gmail/push
→ verify Google OIDC token and expected service account
→ enqueue incremental sync by email address + historyId
```

The watch filters `CATEGORY_PROMOTIONS` and is renewed daily when its expiration
is less than 24 hours away. Gmail requires renewal at least every seven days.

## 4. Durable worker

PostgreSQL is both the business store and initial queue. The web process only
creates `OutboxJob` rows. The long-running worker:

- claims due rows with an atomic conditional update;
- records `leaseOwner`, random `leaseToken`, and `leaseExpiresAt`;
- permits only the current token to complete or fail a job;
- retries with capped exponential backoff and jitter;
- moves exhausted jobs to `DEAD`;
- uses stable idempotency keys for sync, message, watch, and disconnect jobs;
- rechecks the Gmail connection status before every external read.

No Redis or in-memory production queue is needed at this scale.

## 5. Message safety and privacy

The Gmail API message is normalized in memory:

- attachments are skipped;
- plain text is preferred;
- HTML is converted to text without loading images or remote resources;
- model input is capped;
- full HTML and raw MIME are not stored.

Before any model call, deterministic local patterns block:

- password, sign-in, verification, and security notices;
- receipts, order confirmations, tracking, returns, and refunds;
- invoices, payment notices, account statements, and gift-card secrets;
- malformed messages without a sender or subject.

Blocked messages retain only minimal Gmail metadata and a safe discard category.

Accepted content goes to the OpenAI Responses API with:

- `store: false`;
- a strict structured-output schema;
- instructions that email is untrusted data;
- no tools;
- no browser, URL fetch, send, modify, or purchase capability.

The stored durable evidence is a short claim excerpt and its hash. Raw message
bodies are not persisted in the scaffold.

## 6. Deal history wording

Promotion strength and purchase fit are independent:

- promotion strength asks how the terms compare with observed comparable offers;
- purchase fit asks whether the promotion matches an active shopping intent.

History labels are bounded:

- fewer than 5 comparable offers: **not enough observed history**;
- 5–19: **best among N observed** or **routine**, with the sample visible;
- 20 or more: percentile-based **stronger than usual** is allowed;
- “best ever” is never claimed without a complete external dataset.

## 7. Disconnect

Disconnect is a durable job, not merely token revocation:

1. mark the connection `DISCONNECTING`;
2. stop the Gmail watch when present;
3. revoke the Google token;
4. cancel pending Gmail work;
5. revoke the consent grant;
6. delete the Gmail connection, messages, offers, and evidence through cascades;
7. complete the disconnect job.

The Auth.js identity account remains so the owner can keep using the application
or reconnect Gmail later.

## 8. Personal-use Google status

`gmail.readonly` is restricted. Google's current guidance lists personal-use
apps with fewer than 100 personally known users as exempt from mandatory OAuth
verification, but an unverified warning and user cap still apply.

An External app in **Testing** expires non-basic authorizations and offline
refresh tokens after seven days. During early development, reconnect weekly.
Before changing to **In production** or adding users, re-evaluate verification,
Limited Use, retention, security assessment, domain, and privacy requirements.

References:

- [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync)
- [Gmail push notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Google personal-use exception](https://support.google.com/cloud/answer/13464323)
- [Google OAuth publishing states](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview)
