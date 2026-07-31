# Casero product design

## 1. Product decision

Casero should be a **trusted personal buying desk**, not an autonomous
universal shopper.

The strongest initial job is:

> From the promotions in my connected Gmail account, show me only the deals
> relevant to things I already want, tell me how unusual each offer is, and
> preserve the evidence.

The second job is:

> Turn a buying mission such as "furnish this room" into a complete,
> budget-aware set of item requirements and sourced shortlists.

This is useful because the user currently has to combine email, browser tabs,
price history, memberships, product comparisons, and memory. It is realistic
when the product is explicit about source coverage and uncertainty.

## 2. Target user and non-user

The primary early user:

- subscribes to many retailer newsletters;
- has at least one active or recurring buying plan;
- prefers deliberate purchases over deal browsing;
- values time saved and confidence more than maximum catalog coverage;
- is willing to connect Gmail with explicit read-only access.

The product is less compelling for an infrequent shopper, a pure impulse-deal
hunter, or a user who expects the application to complete every checkout.

## 3. Product principles

1. **Intent before discount.** A large discount on an unwanted item is not
   savings.
2. **Promotion quality and purchase quality are separate.** A rare 30% promotion
   can still leave a product more expensive than another seller.
3. **Facts require evidence.** Price, stock, dimensions, terms, and historical
   claims show a source and observation time.
4. **Use bounded language.** Say "best observed in this window," not "best ever."
5. **Use agents behind the interface.** Users launch research tasks; they do not
   manage a noisy cast of agent personas.
6. **High precision beats high recall.** Three worthwhile alerts are better than
   another crowded promotional feed.
7. **The user remains the buyer.** No purchase, subscription, message, or other
   external action occurs without explicit approval.

## 4. Core experience

### Navigation and cold start

Primary navigation is Today, Projects, Deals, Shopping List, Purchase Plan, and
Programs. Activity and Settings/Connections are secondary. Purchase Plan is
available globally and as a project-filtered view. Home, Clothing, Kitchen, and
Bedroom remain filters and project tags.

The first session must be useful without historical claims:

1. The user signs in with Google.
2. The user separately approves read-only Gmail access.
3. The app backfills recent Promotions messages and records one buying need.
4. Casero explains the strongest current messages and any intent matches.
5. Comparison areas say "history building" until their minimum sample is met.

The app never turns absence of history into a weak pseudo-comparison. It can
still extract terms, assess eligibility, compare a known product price against
approved current sources, and save the offer.

### Today

The home page answers "What deserves my attention?"

- up to three high-confidence deals tied to active intent;
- watched products that reached a target;
- active project progress;
- questions blocking a research task;
- recently changed or invalidated recommendations.

There is no infinite discount feed.

Daily/weekly digest, email alert, and future push alert are separate explicit
opt-ins. No channel is enabled by default. An active channel opt-in is standing
approval to send qualifying notifications until the user pauses it.

### Deals

Deals are grouped as Recommended, Relevant, Routine, Unverified, and Expired.
Every surfaced deal shows:

- merchant and offer summary;
- eligibility, minimum spend, cap, exclusions, and membership requirements;
- verified expiration and timezone when available;
- the matching project, need, or watched product;
- comparable-history window and sample size;
- redacted evidence excerpts and source metadata; the full message is available
  only during its disclosed raw-retention window;
- whether the promoted product price is competitive;
- a clear "why this matters" explanation;
- useful, irrelevant, incorrect, and already-purchased feedback.

### Projects

A project represents an outcome such as "Furnish the guest bedroom under
$3,000 by October."

The project brief contains:

- total budget and optional per-item caps;
- room measurements or other shared constraints;
- required, optional, and already-owned items;
- style references and disliked attributes;
- delivery deadline and coarse region; the exact address stays at checkout;
- merchant, material, sustainability, return, and membership preferences.

The system decomposes the mission into item requirements. The user reviews that
list before research begins. Item research runs in parallel, but all items share
the same project budget and constraints.

### Shopping List

The shopping list supports:

- an exact product and variant;
- a flexible need such as "queen mattress under $1,200";
- a replacement or recurring purchase;
- a desired date and alert threshold.

Adding an item immediately starts a bounded public-source search. Results stay
grouped under that item and items with the strongest currently verified options
rise to the top. If the current options are not good enough, the user can turn
on daily monitoring for that item. Membership-only prices remain labeled and
rank below usable public prices until the user records the applicable store
membership. Item-search autocomplete and store-membership preferences are
separate follow-up slices.

### Programs

Programs has tabs for Memberships, Benefits, and Saved codes. Memberships and
rewards begin as user-entered facts:

- program and tier;
- benefits and restrictions;
- renewal or expiration;
- estimated point value chosen by the user;
- notes and evidence.

Saved codes retain merchant, scope, eligibility, expiration, source, and last
verification. They never show as guaranteed until the merchant accepts them.

Casero never stores retailer passwords. Points, gift cards, and future credits
are shown separately from immediate cash savings.

### Purchase plan

The cross-store "cart" is initially a saved purchase plan:

- selected exact variants and sellers;
- last verified price and availability;
- estimated shipping, tax, and reward effects when known;
- project total and remaining budget;
- merchant-grouped checkout links.

It does not imply stock reservation, final checkout price, or a single
transaction.

## 5. Deal evaluation

### Normalize first

Each promotion is converted into a versioned structured record:

- merchant, sender domain, locale, and currency;
- offer class: percent, fixed, threshold, BOGO, free shipping, gift, or points;
- discount value, cap, and minimum spend;
- start and end dates;
- sitewide, category, SKU, or variant scope;
- membership, card, region, or new-customer eligibility;
- code and known stackability;
- exclusions;
- landing domain;
- field-level evidence and confidence.

MIME parsing, HTML sanitization, JSON-LD extraction, money arithmetic, time
comparison, and scoring are deterministic. The model extracts ambiguous terms
and explains results; it is not the source of truth.

### Compare like with like

`20% off` and `$50 off $200` do not have a universal ordering. Compare them on
the user's known basket or show effective values at reference baskets. Offers
are comparable only when merchant, scope, eligibility, region, and important
conditions align.

Historical labels:

- **Best observed in connected history**
- **Top 10% of comparable observed offers**
- **Matches the lowest verified product price in 90 days**
- **Routine for this merchant**
- **Not comparable**
- **Retailer claims "best ever" — not independently verified**

Every label includes the window, comparable count, coverage, and missing facts.

### Two separate decisions

Do not collapse promotion strength and purchase quality into one score.

**Promotion strength** answers "How good is this promotion?" Its components are
effective value at a disclosed basket, rarity among comparable observed offers,
eligible breadth, restrictions/friction, and evidence completeness.

**Purchase fit** answers "Should I consider buying this now?" Its components are
active intent, hard-constraint status, exact product/variant fit, current landed
price versus verified alternatives, delivery/return context, timing, and source
freshness.

Components are never silently reweighted. If a required basket, baseline, or
product fact is missing, the interface shows the available components and marks
the corresponding overall judgment incomplete.

The interface can therefore say:

- strong promotion, strong purchase fit;
- strong promotion, poor purchase fit;
- routine promotion, but currently the best verified purchase option;
- promotion strength known, purchase facts still need verification.

If a critical constraint is false, the candidate is rejected. If a critical
constraint or price fact is unknown, it is labeled **Needs verification** and
cannot be Best Fit or trigger a real-time alert. Non-critical unknowns remain
visible and lower certainty.

Today ranking first requires active intent and viable purchase fit, then uses
promotion strength. Expiry is only a tie-breaker after relevance and value
gates; urgency cannot turn a weak offer into a good purchase.

## 6. Product research

An item brief distinguishes:

- hard constraints that must pass;
- preferences that affect rank;
- trade-offs the user is willing to make;
- facts that still require clarification.

The result is normally three candidates:

1. best fit;
2. best value;
3. a meaningful alternative.

Each candidate shows exact product, variant, condition, seller, source,
`observedAt`, landed-cost estimate, constraint coverage, trade-offs, return
terms, and missing evidence. "Optimal" becomes "best fit among the checked
sources under these stated weights."

For a room, deterministic code checks total budget, dimensions, required-item
coverage, duplicate items, and delivery constraints. The model can assess softer
style coherence, but must cite the attributes it used.

## 7. What not to build initially

- autonomous purchasing or stored payment credentials;
- browser-driven checkout;
- a universal transactional cart;
- unrestricted mailbox access;
- automatic reward-balance login;
- every category, country, and retailer;
- local inventory guarantees;
- continuous whole-web crawling;
- public promo-code sharing;
- photorealistic room generation or AR;
- an agent marketplace or agent personas;
- order tracking, returns, social feeds, or native mobile apps;
- affiliate-influenced ranking;
- claims of "money saved," "cheapest everywhere," "optimal," or "best ever"
  without the evidence to define them.

## 8. Validation

The north-star metric is the **share of activated users making at least one
evidence-backed decision each week**, with minimum-volume, precision, recall,
coverage, and interruption guardrails. The qualified pilot, competitor review,
history thresholds, metric definitions, and go/revise/stop criteria are in the
[product validation plan](product-validation.md).

Email-provider feasibility, consent, retention, and connector sequencing are in
the [email integration plan](email-integration.md).
