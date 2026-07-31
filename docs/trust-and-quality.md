# Casero trust and quality plan

## 1. Security and privacy boundaries

- Verify webhook signatures against the raw request.
- Parse MIME with limits; reject oversized or unsupported attachments by default.
- Sanitize HTML and never load remote images or tracking pixels.
- Record SPF, DKIM, and DMARC results as signals, never as proof of safe content.
- Treat email, product pages, snippets, and reviews as adversarial content.
- Separate untrusted source content from instructions.
- Give extraction nodes no action tools.
- Never resolve or fetch email links during extraction.
- Canonicalize links locally and remove recipient, signature, and tracking
  parameters before any later use.
- Put later page verification behind isolated egress with HTTPS, domain, DNS/IP,
  redirect, timeout, response-size, and SSRF controls.
- Never pass a model-produced URL directly into a tool.
- Normalize and display destination domains before user-approved navigation.
- Never put personal email bodies, OAuth tokens, or full URLs with recipient
  parameters in logs or traces.
- Treat project briefs, style references, room measurements, preferences, and
  delivery region as personal data. Do not log or trace their raw values.
- Use only a coarse delivery region for research; the exact address stays on the
  merchant checkout site.
- Use `store: false` for model requests containing email. OpenAI says API data is
  not used to train by default, but standard abuse-monitoring logs can retain
  content for up to 30 days. Evaluate Zero Data Retention before public launch.
- Use `store: false` for model requests containing personal project or preference
  data as well.
- Encrypt raw artifacts and OAuth tokens with separate keys.
- Obtain versioned, affirmative consent before connecting Gmail.
- Do not persist Gmail MIME/HTML in the initial implementation.
- Keep normalized offer facts and minimal evidence only under the disclosed
  purpose and retention choice.
- Delete raw and derived connector data on disconnect or account deletion.
- Scope every query by user and audit staff access.
- Obtain explicit approval for navigation, sending, purchasing, subscribing, or
  transmitting personal data.

Prompt injection cannot be solved by filtering alone. A promotion can contain
instructions intended to manipulate the model. The system therefore constrains
the source-to-action path: the extraction graph has no dangerous sink, links are
data, and untrusted content cannot authorize a tool or external action.

## 2. Email-provider policy boundary

Direct Gmail is the default personal-use connector. The application requests
`gmail.readonly`, limits the backfill query to Promotions, locally rejects
sensitive and transactional mail, and never claims that the Gmail label is an
OAuth security boundary.

A public Gmail connector is a different privacy and compliance tier:

- `gmail.readonly` is a restricted scope;
- Google requires clear, in-context, affirmative consent;
- Limited Use applies to raw and derived Workspace data;
- transfers and human access are restricted;
- data cannot be sold or used for advertising;
- this server-side restricted-scope design requires verification, security
  controls, and assessment unless a documented exception applies;
- retention and deletion must follow provider rules, not only product preference.

Do not pool private mailbox-derived promotions into a cross-user corpus, train a
general model on them, or fund ranking through mailbox-derived advertising.
Before a public connector ships, obtain a current provider-policy and legal
review for storage, LLM subprocessors, affiliate links, and derived data.

Microsoft Graph mail access receives the same product treatment: delegated
least-privilege access, a user-selected folder, explicit purpose, retention and
deletion, and a current terms review.

The full connector design and provider references are in the
[email integration plan](email-integration.md).

## 3. Retention and deletion matrix

These are proposed private-alpha defaults. Confirm them against contracts,
deployment choices, and user-facing consent before collection.
Connector-specific rows override the general normalized-offer default.

| Data plane                   | Proposed default                     | Deletion behavior and caveat                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| PostgreSQL normalized offers | Account lifetime                     | User item/account deletion queues tenant-scoped erasure            |
| Redacted claim excerpts      | Account lifetime during personal use | Reassess before adding users                                       |
| Project briefs/preferences   | Account lifetime                     | Coarse region only; user/project deletion erases records           |
| Local raw MIME/HTML artifact | Not stored                           | Bodies exist only while the worker processes one message           |
| Gmail provider copy          | Gmail account lifetime               | Casero disconnect cannot delete the source message                 |
| Agent run record             | Account lifetime                     | Contains status and model/schema metadata, never raw bodies        |
| Model trace/eval             | Disabled for message content         | Add a provider only after retention and redaction review           |
| OpenAI API request           | `store: false`                       | Standard abuse logs may last up to 30 days unless approved for ZDR |
| Gmail-derived local data     | Minimum necessary for personal use   | Disconnect deletes the local connection and derived records        |
| Encrypted backups            | 30-day rolling window                | Tombstones prevent deleted tenant data from being reactivated      |

`DataDeletionJob` records each required target, attempt, completion, and
exception. Account deletion is not complete until all controllable targets
confirm erasure. Any uncontrollable provider retention is stated before consent
and in the completion receipt.

Adding other users remains gated on a current review of the exact normalized
history fields, retention, Limited Use obligations, verification, and any
required security assessment.

## 4. Observability

Trace:

- graph and node version;
- prompt and schema version;
- configured and returned model;
- token, cache, tool-call, latency, and estimated cost;
- source count, source type, and freshness;
- retries, failures, cancellation, and terminal state;
- evidence coverage and comparison sample size;
- redacted tenant-safe identifiers.

Do not trace raw email. Redact recipient-specific URL parameters and evidence
excerpts by default. Production support cannot open source content without
case-specific user consent and an auditable access path.

Operational dashboards:

- offer volume, surfaced volume, and alert volume;
- extraction failures by merchant and template;
- source success, latency, block, and stale rates;
- task latency and cost percentiles;
- schema retry and Sol-escalation rates;
- recommendation correction and dismissal rates;
- purge, export, disconnect, and deletion job status.

## 5. Evaluation datasets

Maintain versioned, provenance-recorded datasets for:

- promotional versus non-promotional classification;
- discount, threshold, cap, code, dates, scope, eligibility, and exclusions;
- comparable and non-comparable promotion groups;
- effective value across representative baskets;
- exact product, listing, variant, seller, and condition identity;
- hard-constraint compliance and visible unknowns;
- current price and specification evidence;
- preference ranking and pairwise user choices;
- project required-item, budget, dimension, and delivery compliance;
- malicious email/page prompt-injection cases;
- retries, resumes, partial failures, and idempotency.

Use deterministic graders for schemas, arithmetic, constraints, claims, and
evidence. Human review judges subjective relevance and style. An LLM judge can
supplement those signals but never be the only release gate.

Disputed production recommendations become labeled regression cases after
privacy-safe review.

Fixtures require message-specific permission and source provenance. Remove
addresses, unique codes, order details, tracking parameters, and recipient-bound
links. Deletion propagates to all derived fixtures. Hold out entire merchants,
templates, or campaigns so near-duplicate newsletters do not inflate accuracy.
Never pool Gmail- or Outlook-derived content into a general corpus.

## 6. Verification matrix

| Area             | Verification                                                                     |
| ---------------- | -------------------------------------------------------------------------------- |
| Offer extraction | Exact field scoring against labeled email fixtures                               |
| Comparison       | Table-driven comparable/non-comparable cases and basket examples                 |
| Money            | Decimal arithmetic, currency, caps, thresholds, BOGO, and rewards tests          |
| Expiry           | Timezone, missing year, daylight saving, and already-expired tests               |
| Ingestion        | Signature, replay, crash-after-ack, duplicate, retry, outbox, and purge tests    |
| Prompt injection | Malicious sources cannot alter instructions, arguments, approvals, or tools      |
| Link egress      | Scheme, DNS/IP, redirects, size, timeout, and SSRF test matrix                   |
| Product identity | SKU/GTIN/variant/seller/condition deduplication tests                            |
| Constraints      | Hard failures never rank; unknowns remain visible                                |
| Evidence         | Claim-to-source coverage and freshness checks                                    |
| Graph durability | Retry, resume, cancellation, partial failure, and idempotency                    |
| Privacy          | Tenant isolation, log redaction, export, disconnect, and deletion tests          |
| Monetization     | Affiliate inputs never change rank; plain disclosure renders beside every link   |
| UI               | Desktop/mobile, keyboard, screen reader, loading, empty, error, and stale states |
| Cost             | Fixed representative runs with model, search, token, and call budgets            |

## 7. Risk register

| Risk                        | Mitigation                                                                |
| --------------------------- | ------------------------------------------------------------------------- |
| Users do not value the feed | Concierge pilot before broad implementation                               |
| Too many false alerts       | Intent gate, confidence gate, low default alert volume                    |
| False historical claim      | Bounded labels, fingerprints, sample/window display                       |
| Stale or wrong product      | Exact identity, top-only live verification, observation time              |
| Retail source breaks        | Adapter health, fallback, lower confidence, no silent inference           |
| Gmail approval or policy    | Personal-use exemption first; make verification a multi-user release gate |
| OAuth exceeds UI filter     | State actual mailbox capability; enforce and test selected scope          |
| Upstream mail retention     | Contract check and disclosure; no end-to-end local-only promise           |
| Email prompt injection      | Extraction-only graph with no action tools                                |
| Privacy breach              | Minimal access, encryption, short raw retention, deletion                 |
| Model cost grows            | Luna-first, caps, caching, batch backfill, selective escalation           |
| Agent complexity grows      | Three bounded graphs, deterministic gates, no swarm                       |
| Affiliate bias              | Subscription-first; disclose and firewall later commissions               |
| Local item optimization     | Shared project constraints and deterministic bundle audit                 |

## 8. Launch incident rules

- An unsupported "best ever" or price claim blocks release.
- A cross-tenant access failure blocks release and triggers incident handling.
- Any source content reaching an external action without approval blocks release.
- A stale or unavailable source must downgrade confidence, never preserve a live
  badge.
- Model or source changes rerun the relevant offline corpus before rollout.
- Rollouts are versioned, sampled, reversible, and compared to the prior route.
- A deletion receipt cannot say complete while a controllable data plane is
  pending.

## 9. Monetization boundary

Subscription is the default business model. If affiliate links are introduced:

- commission availability and rate are excluded from retrieval and ranking;
- non-affiliate candidates remain eligible;
- affected links have adjacent disclosure;
- disclosure uses understandable language such as "We may earn a commission if
  you buy through this link" in the app and digests;
- ranking and attribution logs are separate and testable;
- mailbox-derived recommendations are not monetized without current provider
  policy and legal approval.

## 10. Primary sources

- [OpenAI current-model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search)
- [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
- [OpenAI pricing](https://developers.openai.com/api/docs/pricing)
- [OpenAI prompt-injection design](https://openai.com/index/designing-agents-to-resist-prompt-injection/)
- [LangChain OpenAI Responses integration](https://docs.langchain.com/oss/javascript/integrations/chat/openai#responses-api)
- [LangGraph overview](https://docs.langchain.com/oss/javascript/langgraph/overview)
- [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [LangGraph interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts)
- [LangGraph deployment](https://docs.langchain.com/oss/javascript/langgraph/deploy)
- [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Gmail user-data policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy)
- [Gmail synchronization](https://developers.google.com/workspace/gmail/api/guides/sync)
- [Gmail push notifications](https://developers.google.com/workspace/gmail/api/guides/push)
- [Microsoft Graph Mail.Read](https://learn.microsoft.com/en-us/graph/permissions-reference#mailread)
- [Outlook change notifications](https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview)
- [Microsoft Graph message delta](https://learn.microsoft.com/en-us/graph/delta-query-messages)
- [Best Buy APIs](https://developers.bestbuy.com/apis)
- [eBay Browse API](https://developer.ebay.com/develop/api/buy/browse_api)
