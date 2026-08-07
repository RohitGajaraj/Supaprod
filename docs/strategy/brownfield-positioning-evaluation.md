# Brownfield positioning: is serving existing products a shift?

> _Created: 2026-08-07 · Evaluates the founder's question about expanding positioning to companies with existing products, three days before the 2026-08-10 soft launch._

**The question, verbatim:** "I'm also considering expanding our positioning. Instead of serving only new product teams, the platform could also help companies with existing products. They could connect their existing data sources and workflows, allowing our platform to collect signals, analyze opportunities, decide priorities, plan, design, build, shape outcomes, and continuously learn from results. Evaluate whether this requires a strategic positioning shift or changes to our go-to-market strategy."

**Short answer: no shift, and no GTM change. The premise contains a false belief about our own product.** Supaprod was never positioned for new product teams only. Brownfield is the shipped position, the shipped code and the shipped onboarding. The work this question implies is not repositioning, it is closing the gap between what the connector catalogue advertises and what a stranger can actually reach.

---

## 0. Read this first: the question rests on a premise the repo contradicts

There is no document in the strategy canon that scopes Supaprod to new product teams. The words "brownfield" and "greenfield" appear zero times across `v11-guiding-star.md`, `v12-self-improving-os.md`, `moat.md`, `horizon-bets.md`, `README.md` and the archived `v10-master-blueprint.md`. The canon segments by **role**, never by product maturity: individual PM or founding PM as the front door, product team as expansion, VP or Head of Product as buyer ([`README.md`](../../README.md) §"Who it is for", [`v11-guiding-star.md`](./v11-guiding-star.md) L205).

The one place "new product teams only" was ever written down is a **rejected option** in an archived file: `docs/planning/archive/FOUNDER-DECISIONS-2026-08-07.md` §"DECISION 1", Option A. It was not chosen.

**It was ruled on today.** [`docs/planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) L27, dated 2026-08-07:

> Positioning: hold the current message. Brownfield is not an expansion to announce, it is already the shipped position.

This evaluation was asked to test that ruling rather than repeat it. **The ruling holds.** Two of its three supporting claims verify exactly; its connector claim is wrong in both directions, and §2 corrects it.

One warning for whoever reads the tracker: it contradicts itself. L27 rules the decision; L164 and L353 still present it as an open blocker with "Narrow recommended for clarity". L164 is the stale row that L27 rules on. Do not let an agent pick up L164 and reopen a settled question.

---

## 1. Is brownfield a shift, or already the shipped position?

Already shipped. Six independent pieces of evidence, none of them a matter of opinion.

**1. The pitch corpus already sells brownfield as the LARGER of two motions.** [`docs/pitch/repositioning-2026-07-22.md`](../pitch/repositioning-2026-07-22.md) L12 names "Motion 1 Transform: 650K existing teams; Motion 2 Create: 500K new agent-native orgs by 2030". Restated in [`docs/pitch/yc/fall-2026-application.md`](../pitch/yc/fall-2026-application.md) L6 and [`docs/pitch/applications/answer-bank.md`](../pitch/applications/answer-bank.md) L319. The founder is asking to add a motion the investor materials have led with since 2026-07-22.

> **On that 650K figure.** It is a repo-internal estimate. Both citations state it without a derivation, and I did not find one. If it goes on a launch surface or in front of an investor, it needs a source before it is quoted. Do not treat this evaluation as having validated it.

**2. A founder ruling already routes existing products through the lifecycle.** [`README.md`](../../README.md) L94, ruling dated 2026-08-01:

> An existing product getting one feature enters at Plan or Design, not at Discover, and the loop must never force a real customer through discovery for work whose problem is already settled.

Restated at L325: "an existing product getting one feature starts at `/plan` and never sees discovery." That is a brownfield accommodation written into the route model six days ago.

**3. The homepage sells brownfield above the fold and below it.** `src/components/landing/TheGap.tsx:576-585` is the page's second beat: "The building was never the problem. The choosing was." A team with no product has no choosing problem worth paying for. `src/components/landing/ThreeLayers.tsx:62` describes layer 01 as reading "your feedback, your data, your competitors, the market", all four of which presuppose an existing product. `src/components/landing/TrustClose.tsx:23` promises "Connect your sources without granting a single write."

**4. The onboarding seed data is entirely brownfield.** `src/lib/onboarding/track-seeds.ts` seeds every one of the three tracks with signals that only exist for a live product: "90% of sign-ups drop after day 1", "Premium tier at 8% conversion", "Users asking for offline mode" (solo); "Beta testers love the workflows, not the UX" (founding); "API latency hitting 500ms under load", "Five-figure monthly cloud bill, still growing" (tech). There is no zero-to-one track. A genuinely new product team would find the seeded workspace meaningless.

**5. The demo is a brownfield story and always was.** [`docs/pitch/demo-story.md`](../pitch/demo-story.md) L33: the protagonist owns a consumer app with 41,000 active users and has owned it for fourteen months. The most persuasive beat in the video (L121, L127) is an outcome measured on an existing funnel, checkout completion moving from 59 percent to 78 percent.

**6. The wedge was deliberately designed to need no migration.** [`v11-guiding-star.md`](./v11-guiding-star.md) L511: "the wedge is not 'rip out Jira'; it is the Critic teardown beside Jira, needing no migration". Needing no migration is a brownfield design constraint. It only matters if the customer already has systems.

**Conclusion.** Announcing brownfield as an expansion would tell the market that Supaprod previously could not do the thing its homepage, its onboarding, its demo and its investor deck have all been describing. That is a downgrade dressed as news.

---

## 2. What the connector reality actually is, and where the site over-promises

The 2026-08-07 ruling says "GitHub is the one path that works end to end". **That is wrong in both directions, and the correction matters because a brownfield motion lives or dies here.** The code is considerably broader than the ruling claims. The production proof is considerably narrower than the connector catalogue implies.

Three different gates decide whether a customer can connect a source, and they do not agree with each other.

### Gate 1: the adapter map. Verified in `src/lib/connectors/providers/index.server.ts`

Twenty providers are registered. Nine have a real adapter, eleven are `stubAdapter`, whose `validate` returns `{ ok: false, detail: "adapter not implemented" }`.

| Real adapter (9) | `stubAdapter` (11) |
| --- | --- |
| `github` | `linear` |
| `intercom` | `notion` |
| `stripe` | `google_docs` |
| `slack` | `google_calendar` |
| `zendesk` | `google_tasks` |
| `hubspot` | `microsoft_outlook` |
| `salesforce` | `gmail` |
| `canny` | `microsoft_mail` |
| `productboard` | `figma` |
| | `jira` |
| | `firecrawl` |

I read all nine adapter files. They are real HTTP implementations against real provider APIs, not shells: Intercom probes `/me` and lists admin inboxes, Stripe probes `/v1/account`, Slack probes `auth.test` and lists channels, Zendesk uses Basic auth against the customer subdomain, HubSpot probes the deals endpoint, Salesforce probes the org limits endpoint with PKCE support, Canny posts its key in the body as Canny requires, Productboard sends the mandatory version header.

### Gate 2: the ingest registry. Verified in `pull-ingestors.server.ts`

**Ten providers have a wired, real ingest**, and this is where the ruling understates the product. `PULL_INGESTORS` registers intercom, stripe, slack, zendesk, hubspot, salesforce, canny, productboard, **gmail and microsoft_mail**. GitHub has its own separate call in `sense-tick` because it ingests shipped work rather than customer voice, making **eleven providers with a genuine ingest path**.

Note the asymmetry this creates: **gmail and microsoft_mail have real ingest but stub adapters.** They resolve credentials through `suite-resolve.server.ts` instead of the adapter map. So a user who connects Gmail and clicks "Test it" is told "adapter not implemented" about a connector that actually works.

The reverse asymmetry also exists, and it is worse. **Linear, Notion and Google Docs have real two-way sync code but stub adapters, and the sync authenticates with shared admin env keys through the Lovable gateway rather than the per-user token the OAuth flow mints.** The registry documents this against itself at `registry.ts:424-437`: the per-user token "is written and never read", and one real person connected Linear on 2026-07-17 and is still told by `linear.functions.ts` to go connect it.

### Gate 3: tier entitlement, and this is where the site contradicts itself

Two gates disagree, in the direction that suppresses exactly the brownfield motion the founder is asking about.

- **Enforcement** lives at the credential chokepoint: `resolve.server.ts` calls `assertConnectorCapability` from `entitlements.ts`. Free is now `connectorTier: "read"` with `connectorLimit: 3` (`entitlements.ts:269-283`). **A Free user is entitled to connect three read-only sources.**
- **Display** lives in `catalog.ts:147-148`, which derives `minTier` as `'pro'` for every inflow-only provider and `'team'` for outflow-capable ones. I grepped every call site: **`minTier` is never enforced anywhere.** It only labels the catalogue.

So a Free user is entitled to connect a source and is told by the catalogue that they need Pro. [`README.md`](../../README.md) L218 still carries a note saying the Free connector ruling is "not yet implemented", which is itself stale, because `entitlements.ts` implements it. The stale artifact is the label and the note, not the entitlement.

**This is the single highest-leverage brownfield defect on the board, and it is roughly a one-line fix.** The brownfield motion is "connect your existing data". The product grants that on Free and then tells the visitor it costs $20.

### What production actually proves

Queried live on 2026-08-07 against the production database.

**The ambient loop is running.** `sense-tick` is scheduled and active at `*/5 * * * *`, `cluster-tick` at `*/10`. **KI-39 in [`docs/planning/known-issues.md`](../planning/known-issues.md) L54, which says these jobs are absent from `cron.job`, is stale and should be closed.** It was last audited 2026-06-24.

**Real customer connections ever made: five, all internal.** `connections` holds github 2, linear 1, slack 1, salesforce 1. Nothing from intercom, stripe, zendesk, hubspot, canny or productboard.

**Genuinely ingested external signals: two providers, seven distinct items.** Grouping `signals` where `source_kind = 'pull_connector'` by distinct `external_id`:

| Source | Rows | Distinct external ids | Workspaces | Verdict |
| --- | --- | --- | --- | --- |
| `github` | 21 | **6** | 4 | Real ingest |
| `canny` | 4 | **1** | 4 | Real ingest, one post, via the shared admin `CANNY_API_KEY` |
| `slack` | 21 | 3 | 7 | **Seed.** 3 items fanned across 7 workspaces |
| `sales-call` | 21 | 3 | 7 | **Seed.** External id `gong-call-45330`, and Gong is not a registered connector |
| `analytics` | 21 | **1** | 7 | **Seed.** One item, 21 rows |

The seeded rows trace to `supabase/migrations/20260705120000_sample_workspace_seed.sql`.

**So the honest state is: eleven providers have real ingest code, one has ever ingested a customer's own data at any volume, and it is GitHub.** The ruling's conclusion (GitHub is the launch proof point) is right. Its reasoning (GitHub is the only working path) is wrong, and the difference is worth about ten connectors of credibility in a launch conversation.

### Where the site promises what the code stubs

Blunt list, since the brief asked for it.

- `TrustClose.tsx:23` says "Connect your sources without granting a single write." True for the eleven with ingest. **Not true for Jira, Figma, Notion, Linear, Google Docs, Calendar, Tasks or Outlook as a per-user connection.** A visitor reads that sentence next to a catalogue containing all of them.
- The connector `description` strings are consumer copy on six different paths, including the agent tool `sources.connect`, which speaks them out loud. `registry.ts:24-46` documents this and notes that three entries (figma, jira, google_tasks) say "not built yet" in their own description while the rest do not.
- `check-humanized.sh` does not scan `src/lib/connectors/`, so no automated gate is watching those strings.
- The Free catalogue labels every inflow provider Pro+ while the entitlement grants three.

**None of this is a positioning problem. All of it is a truth-in-labelling problem, and it exists whether or not brownfield is ever mentioned again.**

---

## 3. What a team with an existing product can genuinely do today

**Works today, no caveat.** Paste a bet into `/p/teardown` with no account and get a Critic verdict. Sign up free. Pick a track and land in a workspace that is not empty. Connect GitHub and have real issues and PRs ingested as signals within seconds, because `kickFirstIngest` inline-ingests at connect time rather than waiting for the tick. Have signals clustered into themes on a 10 minute tick and scored into opportunities. Enter the lifecycle at Plan or Design and skip discovery entirely. Get a spec, a design pass, a real PR with CI, under a merge gate.

**Works in code, unproven on a stranger's data.** Intercom, Stripe, Slack, Zendesk, HubSpot, Salesforce, Canny, Productboard, Gmail, Outlook Mail. Each has an adapter or a suite resolver, a real ingest, unit tests and a registry entry. Each needs its OAuth client registered by the founder before a stranger sees a working Connect button, and none has ever ingested a non-internal customer's data.

**Advertised but not reachable per user.** Linear, Notion, Google Docs two-way sync: real code, admin-shared credentials, per-user tokens written and never read. Jira, Figma, Firecrawl, Google Calendar and Tasks: stub adapters.

**The one claim that is not yet exercised at all.** [`LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) L20: `applyOutcome` has never written a row in production, `agent_memory where kind='outcome'` is 0 against 957 memories. **Layer 03 is the only layer the canon claims is defensible ([`README.md`](../../README.md) §"the moat"), and it is the one whose write path has never completed on live data.** This matters more for a brownfield pitch than a greenfield one, because a brownfield buyer already has history and will ask what the system learned from it.

**Net.** A team with an existing product can run the loop today on GitHub plus manual and pasted input. They cannot yet run it on their support inbox, their CRM or their billing system without the founder registering an OAuth client first.

---

## 4. Does it change ICP, pricing, onboarding, or the demo path?

**ICP: no.** The canon is role-scoped, not maturity-scoped, and the roles already imply an existing product. The seeds, the demo protagonist and the 2026-08-01 route ruling all describe someone who ships already. There is no ICP edit to make.

**Pricing: no change to the model, one label to fix.** Four tiers, Free $0, Pro $20, Business $50 per seat, Enterprise committed ([`pricing-architecture.md`](./pricing/pricing-architecture.md) L29-52, verified against `billing-tier.ts` and `entitlements.ts`). The direction-then-breadth axis is already the correct shape for brownfield: read-only in, write-back at Business. Brownfield strengthens the Business upgrade story rather than changing it, because a team with an existing Jira is exactly who wants write-back. **The only change needed is making `catalog.ts` stop labelling Free-eligible connectors as Pro+.**

**Onboarding: no restructure, one honest default.** The five-screen path already puts "one connection" at step 3 and the seeds are already brownfield. Two things are worth doing regardless of this question: make the connect step lead with GitHub, the one provider that will visibly work, and make the skip path obvious so nobody stalls on a connector the founder has not registered.

**Demo path: no change.** `demo-story.md` is already a brownfield story with a live app, an existing funnel and a measured outcome. Changing it to serve this question would make it worse.

---

## 5. GTM implications: does launch week messaging change?

**No, and changing it now would be actively harmful.** Launch is 2026-08-10, three days out. The critical path runs 2026-08-07 to 2026-08-12 ([`LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) L7).

Four reasons to hold.

1. **The message already covers brownfield.** Adding "and existing products too" tells a reader the previous sentence excluded them. Nobody thought it did.
2. **It reopens a settled decision inside the launch window.** The tracker already carries a rival stale row at L164 recommending the narrow option. Reopening this gives an agent licence to rewrite locked copy against a ruling.
3. **The tracker's own risk register scores it.** L353: "Positioning expansion (new + brownfield) causes confusion, Probability Medium, Impact High, muddled messaging, lower PH rank."
4. **The reposition would create a claim we cannot yet support.** "Connect your existing data sources and workflows" as a headline invites the first Product Hunt commenter to ask which ones. Today the honest answer is GitHub plus ten that need a key. That question in a public comment thread on launch day is a worse outcome than never raising it.

**What SHOULD change in launch week is not the positioning, it is four labelling defects**, each of which is a launch-day credibility risk on its own terms:

| Fix | Where | Effort |
| --- | --- | --- |
| Free connector catalogue says Pro+ on connectors Free is entitled to | `catalog.ts:147-148` | ~1 line |
| The stale "not yet implemented" note contradicts shipped code | [`README.md`](../../README.md) L218 | 1 paragraph |
| KI-39 says the ambient cron is unscheduled; it is scheduled and active | [`known-issues.md`](../planning/known-issues.md) L54 | close the row |
| The stale rival positioning row invites an agent to reopen the ruling | [`LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) L164, L353 | mark ruled |

Also note the standing hazard recorded at L31 of the tracker: corrected source, stale artifact. Every one of the four above is that pattern.

---

## 6. Honest sequencing: what to say at launch, what to defer

Written for the actual situation: one founder, zero external users, zero revenue, zero waitlist signups against 1,427 landing visits, and eight internal accounts.

**Say at launch (all true today):**

- The current message, unchanged. The homepage already opens on the choosing problem.
- GitHub as the named, demonstrable connector. One provider that visibly works beats a catalogue of twenty that mostly do not.
- "Connect your sources, read-only" as a capability, without enumerating providers on the launch surface.
- The no-signup Critic at `/p/teardown` as the wedge. It needs no connector, no account and no existing product, and it is the only asset that converts a stranger in twenty seconds.
- Seeded proof labelled visibly as examples, per the 2026-08-07 ruling at L28.

**Defer past launch:**

- Any "connect your whole stack" campaign. Ship the OAuth client registrations first, then say it.
- Any brownfield-specific landing page, ICP page or case study. There is no customer to base one on.
- Enumerating the connector catalogue in launch copy. It invites the one question we cannot answer well.
- Fixing Linear, Notion and Google Docs per-user auth. Real, worth doing, and not a launch blocker.

**Do this week, before launch, in this order:**

1. The four labelling fixes in §5. Hours, not days, and each removes a way to be caught out in public.
2. Settle one outcome so `applyOutcome` completes once in production. The tracker already names this at L431 as one action with three unblocks. **The compounding claim is the moat claim, and it is currently the only layer whose write path has never run.**
3. Register OAuth clients for two or three inflow providers, ideally Intercom, Slack and Stripe. The adapters and ingests already exist. This converts shipped code into a demonstrable claim for roughly the cost of filling in developer console forms.

---

## 7. Recommendation

**Hold the positioning. Do not announce brownfield. Spend the three days before launch converting the brownfield claims we already make from advertised to demonstrable, starting with the Free connector mislabel and one completed outcome write.**

Brownfield is not an expansion, it is the shipped position, and the strategy canon, the homepage, the onboarding seeds, the demo story and the investor materials all already say so. The gap the founder senses is real, but it points the other way: not "we should serve existing products", rather "we advertise more connectors than a stranger can reach". That is a labelling and credential-registration problem with a three-day fix, not a positioning problem with a three-week one.

### The strongest counter-argument, stated fairly

**It runs like this, and it is not weak.**

*Positioning is not what the docs say, it is what the market hears. Nobody reads `v11-guiding-star.md`. A visitor lands on a page whose headline is "Supaprod tells you what to build. then builds it. ships it. grades it. gets sharper.", whose audience line is "For product managers who ship with agents", and whose primary CTA is "Start free". Nothing in that sequence says "bring your existing product and your existing data". The brownfield evidence in this document is real but it is all one scroll down, in the second beat, in a layer-01 description, in a trust card, in seed data the visitor never sees, and in an investor deck they will never read. So the internal claim "brownfield is already the position" can be true of the corpus and false of the impression. And the impression is what converts.*

*There is a sharper version. The strongest brownfield asset we own is not a connector, it is the 2026-08-01 route ruling: work enters at any station, and an existing product getting one feature starts at Plan and never sees discovery. That is a genuinely differentiated promise against every "describe your app and we build it" competitor, and it is currently invisible outside `README.md`. Zero waitlist signups against 1,427 visits is evidence that the current message is not landing on somebody. Declining to sharpen it on the grounds that the docs already cover it may be defending a corpus rather than a customer.*

**Why I still recommend holding, and what would change my mind.**

The counter-argument is right that impression beats corpus. It is wrong about the timing and the instrument. Three days before a one-shot Product Hunt launch is the worst possible moment to rewrite a hero line, because the failure mode is not a weaker message, it is an inconsistent one across a homepage, an og card, `llms.txt`, a PH tagline, an X thread and an HN post that are all mid-production. The tracker already records that stale generated artifacts have escaped three times in one session.

And the zero-signup number does not isolate positioning as the cause. The hero CTA pointed at a waitlist rather than signup until 2026-08-05, and the waitlist rate limiter would have rejected a launch spike until it was raised on 2026-08-07. Both were real conversion defects, both are now fixed, and neither has been measured under traffic. **Attributing zero signups to positioning before the fixed funnel has ever seen a visitor is diagnosing without evidence, which is the exact failure the Critic exists to catch.**

**What would change my mind, concretely.** If launch week produces traffic with a poor signup rate on the repaired funnel, and PH or HN comments show readers asking whether Supaprod works with an existing product, then the impression gap is demonstrated rather than assumed, and sharpening the hero toward the route ruling becomes the highest-value copy change available. That is a post-launch decision with data, taken in one week, not a pre-launch decision without data, taken in three days.

---

## Related

- [`README.md`](../../README.md) L94, L146-156, L209-218: the route ruling, the three layers, the connector tiers
- [`docs/planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) L25-31: the 2026-08-07 rulings and the standing stale-artifact hazard
- [`docs/pitch/repositioning-2026-07-22.md`](../pitch/repositioning-2026-07-22.md) L12: the Transform and Create motions
- [`docs/features/signal-fabric.md`](../features/signal-fabric.md): the outside-in and inside-out lanes
- [`moat.md`](./moat.md): why layer 03 is the only defensible one
- `src/lib/connectors/providers/index.server.ts`, `pull-ingestors.server.ts`, `src/lib/connectors/catalog.ts`, `src/lib/entitlements.ts`: the three gates in §2
