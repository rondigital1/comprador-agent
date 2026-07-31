# Comprador product validation

## 1. Market position

The broad "AI shopping assistant" category is validated but crowded. Comprador
should not compete on generic chat-based product search. Its wedge is a personal,
longitudinal decision layer:

> Connect promotions the user intentionally receives to purchases the user
> already plans, then explain both promotion strength and purchase fit with
> evidence.

Closest substitutes:

| Substitute                     | What it already covers                                           | Remaining opening for Comprador                                  |
| ------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| ChatGPT product discovery      | Conversational discovery, comparison, and merchant links         | Persistent user intent plus private promotion history            |
| Google/Gmail shopping features | Promotion organization and shopping context inside a large inbox | Cross-mailbox projects and explicit evidence-based rarity        |
| Capital One Shopping           | Coupon discovery, price comparison, alerts, and rewards          | User-controlled buying projects and transparent comparison logic |
| Milled                         | Searchable public retailer-email archive                         | Private eligibility, watchlist matching, and purchase decisions  |
| Amazon price history           | Product price history inside Amazon                              | Cross-retailer promotions, constraints, and bundle planning      |

Sources:

- [OpenAI product discovery](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- [Google agentic commerce and UCP](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/)
- [Gmail shopping and promotions](https://blog.google/products-and-platforms/products/gmail/one-stop-purchase-tracking-in-gmail/)
- [Capital One Shopping](https://www.capitalone.com/learn-grow/money-management/capital-one-shopping/)
- [Milled](https://milled.com/)
- [Amazon price history](https://www.aboutamazon.com/news/retail/how-to-check-amazon-price-history)

This is a differentiated feature combination, not yet proof of a durable
business. Retention depends on whether users have enough active purchase intent
and promotions for the product to save time every week.

## 2. Owner-use validation

The first validation period is several weeks of real use by the owner. No test
users or concierge pilot are required yet:

- connect the owner's Gmail account through the real authorization flow;
- process 20–50 recent Promotions messages for an initial parsing review;
- record at least three active buying needs or watched products;
- review the surfaced queue for at least four weeks;
- label opened results as useful, irrelevant, incorrect, or already purchased;
- record misses discovered directly in Gmail;
- measure time from connection to first useful result and time spent reviewing
  the daily queue.

The goal is to learn whether the product saves the owner time, whether private
promotion history changes decisions, and which fields fail on real messages.
This phase should improve the extractor and ranking before adding product
research breadth or more users.

Any test fixture derived from the owner's mail needs explicit selection and
provenance. Remove personal addresses, recipient-bound URLs, unique codes, order
details, and tracking tokens. Split future development and held-out evaluation
by merchant, template, and campaign, not random messages from one campaign.

Do not pool Gmail- or Outlook-derived content into a reusable product corpus.

## 3. Initial quality hypotheses

These thresholds are launch hypotheses to test, not established benchmarks.

The primary outcome is the percentage of activated users who make at least one
evidence-backed save, reject, shortlist, or purchase decision in a week. Report
it with the denominator, candidate-promotion volume, and median decisions per
user. Precision, recall, coverage, and interruption limits remain guardrails.

### Extraction

- at least 98% precision and 95% recall for each critical field: discount,
  minimum, cap, expiry, and eligibility;
- 100% exact evidence coverage for surfaced critical fields;
- zero unbounded "best ever" claims;
- zero recipient-specific secrets in logs, traces, or fixtures.

Field-level metrics matter more than a single averaged extraction score. A
perfect merchant name must not hide an unsafe expiry or eligibility error.

Report 95% confidence intervals and positive/negative example counts per field.
During owner use, treat field metrics as directional until there are at least 50
positive and 50 negative held-out examples. Mark insufficiently tested fields
unverified. Before a broader beta, grow the corpus to at least 200 positive and
200 negative held-out examples per critical field.

### Deal usefulness

- at least 80% precision among the top deals: the user marks them worth seeing;
- at least 60% recall on human-labeled relevant offers;
- at least one labeled relevant owner offer is surfaced during each active week;
- no more than three real-time alerts per week when alerts are introduced;
- fewer than 5% of top recommendations are invalid or materially misleading.

Measure alert precision separately from digest precision. A mediocre item in a
digest is less costly than a disruptive real-time notification.

### Product behavior

- the owner returns in at least three of the first four weeks;
- the owner adds another need, product, or project after the first useful result;
- users can identify the evidence and coverage behind every historical claim;
- every hard product constraint is passed, failed, or visibly unknown;
- zero affiliate-rate inputs enter retrieval or ranking.

Also record median time saved per decision and the number of surfaced items
opened, saved, dismissed, corrected, and purchased. Do not claim "money saved":
counterfactual purchase behavior is not observable.

## 4. History-quality thresholds

Historical labels depend on both sample size and coverage:

| Comparable observations | Allowed output                                                             |
| ----------------------: | -------------------------------------------------------------------------- |
|                     0–4 | "Not enough observed history"                                              |
|                    5–19 | "Best among N observed offers; limited sample" or "routine in this sample" |
|                     20+ | Percentile labels, only when interval coverage is sufficiently continuous  |

Every label displays merchant, cohort, date window, comparable count, collection
mode, and material gaps. A later import can expand the window but cannot silently
erase earlier gaps.

Product price history is separate from promotion history. "Lowest verified
price" requires the exact product, variant, seller/condition policy, observation
window, and source.

## 5. Go, revise, or stop

Continue owner use when targets pass for every field allowed in verified output,
unsupported fields abstain, and at least 70% of manually curated intent-linked
deals are rated worth seeing.

Revise matching and comparison if extraction passes but deal precision fails.
Do not add more agents or retailers as a response to low relevance.

Reconsider the standalone-product direction if four to eight weeks of normal
owner use cannot generate recurring useful decisions. The technology could
still become a narrower email digest or a feature inside a shopping/project
tool.

Before a paid or public beta, recruit an invited cohort and run it for 6–8
weeks. Measure second-mission
creation, useful decisions after the first purchase closes, continued week-six
use, and willingness to pay at the proposed price. A two-week pilot validates
activation and immediate utility, not subscription durability.
