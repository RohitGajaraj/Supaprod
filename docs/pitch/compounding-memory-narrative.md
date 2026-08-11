# The compounding memory layer, the commercial narrative

> _Created: 2026-08-02. Updated the same evening against what actually shipped. **This file is the commercial argument for the memory layer**: why it is worth money, why the price ladder is shaped the way it is, why it survives a frontier launch, and what a sceptic actually asks. Use it in startup applications, investor conversations, and as the source text for pricing-page copy as the company scales._
>
> **It ADDS a layer under the standing canon; it replaces nothing.** Positioning canon stays [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md) (the triple-RFS intersection, told door then body then brain). Story and claim inventory stay [`one-pager.md`](./one-pager.md). Objection style follows [`qa-bank.md`](./qa-bank.md). The packaging table that a pricing page is built from is the companion file [`../strategy/pricing/memory-tier-ladder.md`](../strategy/pricing/memory-tier-ladder.md); this file is the narrative, that file is the spec. One topic, two roles, no duplication.
>
> **Claim tags, used on every line that could be challenged:** **[PROVEN]** live in production and verifiable now · **[WIRING]** built and applied, not yet exercised at scale, so it is never asserted as a customer outcome · **[ROADMAP]** honest future, say so out loud.

---

## 1. The spine (founder-ratified, 2026-08-02)

**The USP, unchanged and canonical:**

> Supaprod is where product decisions live when agents do the work. It tells you what to build, builds it, ships it, checks what actually happened, and learns from it, so next time it guides the call instead of waiting to be asked. Wired end to end, from signal to learning and back again.

**The one sentence under it, and the sharpest thing in this file:**

> The record is not something we store for you. It is produced by running the loop, so it is unique to you, it grows every time you use the product, and nobody can hand it to you.

That distinction is the whole commercial argument. A product that stores your decisions is a database with opinions, and any well-funded entrant can ship one. A product that generates the record as a byproduct of doing the work owns an asset that did not exist before the customer started, and **cannot be bought or scraped**. _(Corrected 2026-08-10: this previously also said "cannot be backfilled by a better model." The record can be — causes survive in chat logs, email and call recordings and have been reconstructed with an agent built in two days. **The part that cannot be backfilled is the forecast**: what the team believed would happen, recorded before the outcome landed. See [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §2.)_ Section 5 argues it properly.

**The two tier lines that carry the commercial argument:**

- **Team:** _"Your team stops re-deciding things it already decided."_
- **Enterprise:** _"When someone leaves, you can prove what they knew and why they chose it."_

Those are the ratified words. Say them as written. Two tightened variants exist for tight-space surfaces, and they are variants, not replacements: "Stop re-deciding what you already decided" (Team) and "When someone leaves, the reasoning stays" (Enterprise).

**Why those two lines and not a feature list.** Both name a loss the buyer already feels and can date. Re-deciding is a cost a team can count in meetings. A departure is an event with a calendar entry. Neither line describes the mechanism, and neither has to; the mechanism is the proof you show second, after the buyer has agreed the loss is real.

## 2. Why memory is the price ladder rather than a feature row

The value metric question for any product is: what does the customer buy more of as they get more value? Seats are the lazy answer and they price the wrong thing, because a seat measures headcount, not judgment.

The honest metric here is **how many people a decision has to survive**.

- One person deciding alone needs their own recall. That is worth something, and it is the base product.
- Five people deciding together need each other's recall, or four of them repeat the fifth's work. The value is not five times one seat; it is the elimination of the repeats, which grows with the square of the team, not with headcount.
- An org needs the record to survive the people who made it. That is a different product with a different buyer (legal, security, the person who signs), and it is priced against a risk, not against usage.

So the ladder is not free, better, best. It is **own memory, then shared memory, then durable memory**. Each step is a genuinely different promise, and the step-up is triggered by a change in the customer's situation (a second person, then a departure), not by a paywall we placed in front of a capability they already had.

**The line that matters commercially:** a team seat is worth more than N solo seats, because judgment compounds across people rather than per person. The product is worth more to the fifth member than to the first, which is exactly the property you want in a value metric and exactly the property seat pricing throws away.

## 3. The ladder, with claim tags

Tiers are credit-priced. Slugs are `free`, `pro`, `max`, `team`, `enterprise` (`src/lib/billing-tier.ts`, `src/lib/entitlements.ts`); the public display names are Free, Pro, Business, Enterprise, and `team` is the slug behind Business. Build against the slugs; the display names are a skin.

| Tier | The memory promise | Status |
| --- | --- | --- |
| `free` / `pro` / `max` | **Your own memory, whole.** Single seat. Every recall is yours, and the core promise (it remembers, and the next call is sharper) is fully true for a solo product manager. Free keeps the recall cache on a rolling 30 day window; paid keeps it. Nothing about the base product is hollowed out to create an upgrade. | **[PROVEN]** seat limits and retention are enforced in code and in SQL |
| `team` (Business) | **Workspace-shared memory, with authorship attached.** A teammate's recorded judgment is recallable by the whole workspace, on both recall paths, and it stays attributed to the person who made the call. Nobody can edit or delete somebody else's record. Business is also the lowest plan that can accept a claimed workspace, so it is the tier a departure lands on. This is the upgrade trigger: the second person. | **[WIRING]** the mechanism is applied in production and enforced in SQL; no multi-person team has exercised it yet |
| `enterprise` | **An org brain that outlives the org chart.** Recall across workspaces under org policy, retention rules, legal hold, audit export, data residency, SSO and SCIM, and admin visibility into what the brain knows and who contributed. | **[ROADMAP]** none of the governance layer ships today. Say "we are building it", never "it does this". The departure workflow it was going to depend on is the one piece that did ship; see 4.5 |

**The no-paywall rule, stated so it never drifts.** On the single-seat tiers, sharing is a no-op, not a withheld feature. There is one person in the workspace, so workspace-shared visibility has no one to share with. That is a structural fact, not a marketing position, and it is why the base product is honest: a solo product manager gets the complete promise, and the paid step buys a situation they did not have before, not a switch we turned off.

## 4. What shipped on 2026-08-02, stated at the level a technical buyer can check

Six things went to production on this date. Each is one migration or one module a reviewer can open, and several of them close limits an earlier draft of this same file had to soften a few hours before.

### 4.1 Memory is workspace-shared by default, and authorship cannot be edited. **[PROVEN]**

Migration `20260802190000_agent_memory_workspace_visibility.sql`:

1. `agent_memory` gained a `visibility` column, constrained to `workspace` or `private`, **defaulting to workspace-shared**, with private available as the exception. The default is deliberate: a memory nobody else can reach cannot make the team sharper.
2. The single read-and-write RLS policy was **split**. You may READ a teammate's shared memory in a workspace you belong to. You may only WRITE, EDIT or DELETE your own. A shared memory is not a communal document that anyone can revise; it is one person's recorded judgment that others can learn from, so **authorship is immutable and attributable** by construction rather than by convention.
3. The migration added `user_in_workspace(workspace_id, user_id)`, a membership check for a **named** user. The usual membership function resolves the caller from `auth.uid()`, which is null on the service-role path the agent loop and the crons run on. Without a named-user check, relaxing the author filter would have exposed every workspace's shared memory to every service-role call. That trap is documented in the migration itself.

### 4.2 Both recall paths are workspace-aware. **[PROVEN]** This closes a limit this file carried earlier the same day.

Migration `20260802191000_reflections_workspace_visibility.sql`. `recallMemoryRefs` reads two functions, not one: `match_agent_memory` for semantic recall and `recent_agent_reflections` for an agent's recent notes. The first migration corrected only the first, which left a silent half-fix: a teammate's outcomes were recallable by meaning while their reflections stayed invisible, and recall still returned something, so nothing looked broken. The second migration applies the identical shared branch, including the service-role membership check, to the reflections path.

**Promote this claim.** The earlier wording, "one of the two recall paths is still author-scoped", is no longer true and must not be repeated. The honest sentence now is: **both recall paths are workspace-scoped, and both are subject to the same `visibility` column.**

### 4.3 The knowledge graph renders why, not just what. **[PROVEN]**

The graph was a picture of what connects to what. It now carries the reasoning, which is the only version of it that is worth showing a buyer.

- Every edge carries **its rationale and the agent that authored it** (`GraphEdge.rationale`, `GraphEdge.createdByAgent`).
- A recorded outcome carries **its verdict**, read from the row rather than assumed. An unread verdict stays null instead of defaulting to "validated", because a guess in the direction of good news is the one guess this product may never make.
- A belief revision is **dated** (`validFrom` is the edge's own `created_at`, the honest time axis) and carries a **confidence tier** written by the supersession engine, so a tentative revision is visibly tentative rather than silently equal to a strong one.
- A revision that a later outcome itself reversed **stays on the canvas as faded history** rather than being deleted. Invalidate, do not delete. The record of having been wrong twice is worth more than a tidy graph.
- `learning` became a focusable node kind. It had 146 rows, second only to `decision`, and until this change you could not open the graph on a recorded outcome. For a product that sells "we remember how it turned out", the outcome was the one thing you could not start from.

Files a reviewer can open: `src/lib/knowledge-graph-view.ts`, `src/lib/ai/supersession.server.ts`.

### 4.4 A correctness fix worth citing as evidence of rigour rather than hiding. **[PROVEN]**

**35 of 51 revision edges were being read backwards.** Two writers stored the same fact from opposite ends: the application writes the active voice (`supersedes`, new points at old) and the demo seed wrote the passive voice (`superseded_by`, old points at new). The read layer only understood the active spelling, so the majority case was not counted as a revision at all. In plain terms, **the product could not see roughly two thirds of the times it had changed its mind**, which is the exact capability the brain is sold on.

Two fixes, at two levels, because the founder ruling is to fix the platform so new users are correct by construction **and** backfill so existing ones get the same benefit:

- **At read time**, relations normalise into a family plus an `inverted` flag. The stored string is never rewritten and the edge is never flipped in memory: the record is evidence, and a read surface that quietly corrects its own source has stopped being a record.
- **At rest**, migration `20260802260000_artifact_lineage_canonicalise.sql` brought the stored rows into line. The relation vocabulary had forked into **sixteen distinct strings for about thirteen meanings**. The seed now writes canonical vocabulary, the readers accept both voices so nothing depends on the migration having run, and the stored rows were renamed, with endpoints flipped for the five passive spellings where the child was the actor. Verified live: 404 edges before, 404 after, zero duplicate tuples, zero old spellings left.

**The restraint is part of the evidence.** A `CHECK` constraint on `relation` was the obvious next step and was deliberately not added: an audit found thirty distinct relation strings written across the codebase, and a constraint carrying only the thirteen canonical families would have started rejecting live inserts from features unrelated to the fork. That is the shape of the argument to make to a technical buyer. We found a defect in our own moat, we fixed it in two places, we measured the result, and we wrote down the fix we refused to make.

### 4.5 The workspace claim. A person can bring their history into an organisation, deliberately. **[PROVEN]** as a mechanism and a product surface · **[WIRING]** as an outcome, since no organisation outside our own accounts has run it

This is the one that changes the departure story from a promise into a mechanism.

The failure mode it closes is specific and it is ours. Pro is a single seat, correctly. So a product manager expenses it on a work email, builds a year of decisions and outcomes in a workspace that sits in their **own** account, and when they leave, the thing we sell walks out with them. The employer never had it. That is shadow AI with the institutional memory attached.

Migration `20260802270000_workspace_claim.sql`, with the policy in `src/lib/workspace-claim.ts` (pure and unit tested), the plumbing in `src/lib/workspace-claim.functions.ts`, and the surface mounted in Settings:

- **Two-sided consent.** The workspace **owner** offers, and an owner or admin of the destination organisation accepts. Nobody can claim a workspace for someone else, and nobody can push one onto an organisation that did not accept it.
- **An inventory is shown before consent.** Signals, themes, opportunities, specs, decisions, learnings, lineage links, shared memories, and private memories counted separately and labelled "kept private". Zero rows are shown too, because "0 decisions" is a fact the person should see before agreeing. Consent to an unspecified thing is not consent.
- **An offer expires in 14 days.** An offer that hangs around forever is a standing invitation to absorb someone's work months after they agreed to it, which is not the same consent.
- **The claimant keeps a 7 day release window** in which they can pull the workspace back on their own. After that the workspace is the organisation's, and only the organisation can divest it. Both halves are the honest reading of what a claim is.
- **The organisation can divest at any time.** An owner or admin of the holding account can release without limit, because an organisation must always be able to let go of data it does not want.
- **Full admin visibility.** An owner or admin can see every claim touching their organisation: what was offered, what was accepted, by whom, and when, including offers they declined and workspaces they later released. This is the half that makes it a procurement answer rather than a personal convenience.
- **The state is the fold of the audit events, not a status column**, so a claim cannot be in a state that nothing recorded.
- **The destination must be Business or Enterprise.** The single-seat plans cannot hold a second person's workspace, which is why this is an upgrade motion rather than a paywall bolted onto a feature. Ownership is deliberately not transferred by the claim: the person who built the workspace keeps it, and transferring ownership stays a separate, explicit act.
- **The unit is the whole workspace.** Every table carrying the record is workspace-scoped, and since 4.1 so is `agent_memory`, so re-parenting one column moves all of it with no row copying and no half state. The finer-grained product move was rejected for this on purpose: it does not carry memory, so it would have handed the organisation the record without the recall.

### 4.6 A live tenancy hole was closed on the way. **[PROVEN]**

Found while building the claim, verified against the live schema. The workspaces policy granted owners and admins full access with no constraint on `account_id`, the account-setting trigger was insert-only, and the billing-column guard pinned the plan and the Stripe columns but not `account_id`. So **any workspace owner could move their workspace into any account by uuid, straight from the API: no offer, no acceptance, no audit row, no seat check.** `account_id` is what account-scoped memory pooling reads, so that was a tenancy boundary being guarded like a billing field.

A `BEFORE UPDATE` trigger now refuses any change to `account_id` that does not come through one of the two claim RPCs, which set and clear a transaction-local flag around their own write. The claim RPCs additionally compare-and-swap on the source account, so two admins racing to accept cannot both succeed, and they require a live, unexpired, unanswered offer naming that destination.

### What is still not true, said as plainly as the shipped list

- **Enterprise governance is not built. [ROADMAP]** Retention policy, legal hold, audit export, data residency, SSO and SCIM: none of it exists. Not partially, not behind a flag.
- **The claim's audit trail does not survive deleting the workspace, and this is a real limit on the headline claim. [ROADMAP]** The trail rides on `workspace_audit_log`, whose `workspace_id` is `on delete cascade`. Delete a claimed workspace and the organisation's proof of how it came to hold that work goes with it. So "you can prove what they knew" is true while the workspace exists and not after. State this in the room. A security reviewer will find it in one query, and it is a much better sentence coming from us.
- **There is still no product control for private. [WIRING]** The column defaults correctly, and a product surface now **reads** it (the claim inventory shows shared and private counts before consent), but nothing in the application **writes** it. A user cannot mark a memory private from any screen. The honest sentence stays "private is supported in the data model", never "you choose what stays private".
- **Memory attribution is enforced but not displayed. [WIRING]** The author is on the row and the write rules enforce it, but `match_agent_memory` returns id, content, kind, importance, agent slug and similarity, and no author column. Say "authorship is immutable and attributable", never "you can see who contributed what". Note the one place attribution IS displayed: the claim trail names who offered, who accepted, and when. That is a different fact and may be claimed.
- **`decisions`, `opportunities`, `prds` and `learnings` have no embeddings of their own. [WIRING]** Semantic recall proxies through `agent_memory`, which is the only embedded layer. The work to embed the artifact tables is in flight and is not shipped. Do not describe recall as spanning the whole record.
- **None of it has run with a real team or a real organisation. [WIRING]** Supaprod has single-digit users, all founder or internal. Every mechanism above is live; every effect is unmeasured.

**The internal numbers, flagged so they are never misread as traction.** Our own database held 404 lineage edges and roughly 460 memories across 16 workspaces under 12 author identities on 2026-08-02. Every one of those identities is internal or a test account. Those numbers are evidence that the fragmentation and the reversed-edge defect were real; they are **not** usage and must never be cited as users, customers, or activity.

## 5. Why this is defensible when the model layer commoditizes

This is the sharpest argument we have, and it is the one that should close an investor conversation. It is the direct application of the **six-month-forward doctrine** (canonical: `AGENTS.md`, "THE SIX-MONTH-FORWARD DOCTRINE"), whose first two tests are: assume the model layer commoditizes, and assume a large vendor ships our vertical next quarter. A design that fails either gets redone. The memory layer is the part of the product that was designed to pass both, and it is why the doctrine and this file are the same argument told at two altitudes.

**The claim, in one line:** a frontier release can absorb a feature. It cannot absorb a specific company's decision-and-outcome record, **because that record is not knowledge in the world. It is a byproduct of running the loop, and it does not exist until the customer runs it.**

Five supports, in the order they should be argued.

1. **The asset is generated, not gathered.** Nothing in the record can be scraped, licensed, or pre-trained, because it did not exist until this company made these calls on this evidence and shipped these things and found out. A better model makes the record better used. It does not make the record. This is the difference between a data moat you have to go and acquire and one that accrues as a side effect of the customer getting value, which is the only kind that survives contact with a better-funded competitor.
2. **The forecast cannot be backfilled.** _(Corrected 2026-08-10. The earlier form of this support — "hand a frontier model every artifact and it still cannot reconstruct which option was chosen" — is falsified: Vercel's COO reconstructed a lost deal's true cause from Slack, email and call recordings with an agent built in two days for about $1,000 a year. Causes are recoverable. Evidence: [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §2.)_ What survives the correction is stronger and narrower. Hand a frontier model every artifact a company owns and it can tell you what happened and why. It cannot tell you what the team **believed would happen at the moment they committed**, because a forecast is not an artifact — it exists only if something recorded it before the outcome was known. That structure is created at decision time and nowhere else. Time is an ingredient, and no release shortcuts it.
3. **It compounds because the loop closes, not because we keep writing to a table.** The reason to own the whole lifecycle is that the same system produces the decision, the thing shipped against it, and the outcome. A memory layer bolted onto a chat product can only remember what was said. Ours can hold a verdict against a call, keep a revision that was itself later reversed, and show the rationale and the agent behind every link. That structure is only producible by a product that runs all three steps, which is why the loop is the moat and the memory is what the moat is made of.
4. **There is no fast oracle, so this layer does not commoditize on the codegen curve.** Code compiles in seconds, which is why code assistance commoditized quickly: the feedback loop is short enough that model quality alone closes it. Product judgment settles in weeks. A layer whose feedback arrives in weeks is a layer that compounds instead of collapsing, and the same slowness that makes the problem hard makes the asset durable.
5. **The moat curve tracks usage, not model quality.** This is the structural point. Our defensibility improves every time a customer runs the loop, and it is indifferent to whose model is behind it. That is the opposite exposure to a wrapper, whose defensibility is a function of a model advantage it does not own and cannot renew.

**Test 1, a frontier lab ships a product-management agent.** They take the capability. They do not take the record, and structurally they will not want the accountability surface: it is cross-tool, it is permissioned, it requires publishing misses, and it is the surface labs have repeatedly retired. A better model is a same-day drop-in for us, because the engine is ours and models plug into it per job. A frontier launch upgrades our product on the day it ships.

**Test 2, a large vendor launches this vertical.** They take the workflow. They cannot be the neutral judge across their competitors' tools, they will not publish their own misses, and their existing customers' decision records still start on day one of their product, at zero, the same as ours did. The record is the one asset that a well-funded entrant cannot buy their way past, because the only way to acquire it is to have already been running.

**The one place the argument has a seam, and how to hold it.** The record accrues per customer, so on day one a new customer's moat is zero, exactly like a competitor's. What we can argue is that the accrual starts on the first loop rather than on a migration project, that the workspace claim means an individual's year of accrued judgment can be carried into the organisation on the day they upgrade rather than being restarted, and that the switching cost is a record the customer would have to spend another two years living through. Do not claim the moat protects a new logo. Claim that it starts the day they start.

**The compact version, for a room:** "Every model release makes our product better and our position stronger, because what we own is not a capability, it is a customer's own record of what they decided and what happened. A lab can ship the capability tomorrow. Nobody can ship you your own history."

## 6. How to say it, by surface

**Startup application (YC and similar), one paragraph.** Tell it in canon order: the door, the loop, then the brain as the crescendo. The memory layer belongs in the last third, never the first line.

> Supaprod runs product work with agents: it tells you what to build from what you already know, builds and ships it once you approve, and records every decision with its evidence and its outcome. The record is the part that compounds, and it exists only because the loop ran. On the single-seat tiers it is your own recall. When a second person joins, the workspace shares one memory with authorship attached, so the team stops re-deciding what it already decided. When someone brings a year of solo work into a company, they can hand the whole workspace over deliberately, with consent on both sides and a trail of who claimed what and when. A frontier model release makes every one of those agents better on the day it ships, and it does not touch our position, because what compounds is the customer's own decision-and-outcome record, and that only exists because they ran the loop.

**Investor conversation, the shape of the argument.** Lead with the value metric, not the feature. "Our upgrade trigger is the second person, and our expansion metric is how many people a decision has to survive. That is why a team seat is worth more than N solo seats." Then the defensibility argument in section 5, in order, ending on support 5. Then the honest state, unprompted: the mechanism is live as of 2026-08-02, the enterprise governance layer is roadmap, the claim's audit trail does not yet survive deleting the workspace, and there are no customer outcomes because there are no customers.

**Technical due diligence, the two things to show.** First, the read-and-write RLS split, because it makes authorship immutable at the database layer rather than in application code, so it holds for the agent loop and the cron jobs as well as for a logged-in user. Second, the reversed-edge fix in 4.4, because it is the best available evidence of how this team treats its own record: we found that two thirds of our belief revisions were being read backwards, we fixed it at the read layer and at rest, we measured it, and we documented the constraint we deliberately did not add.

**Pricing page, as the company scales.** Three lines, one per rung, and no adjectives:

- Solo tiers: "Your product memory, kept. Every call you make sharpens the next one."
- Business: "One shared memory for the whole team. Your team stops re-deciding things it already decided."
- Enterprise: "When someone leaves, you can prove what they knew and why they chose it."

The Enterprise line stays off the pricing page until the governance layer ships, or it is carried with an explicit "in development" marker. A pricing page is a promise with a payment attached; the standing rule that a claim never outruns the wiring is strictest there. The claim workflow may be described on the Business line, because it ships and it is enforced.

## 7. Objections, with the honest answer

Written in the style of [`qa-bank.md`](./qa-bank.md): where the honest answer contains a weakness, the weakness comes first and the mechanism comes second.

**"Is this surveillance? Am I buying a tool that reads what my team writes?"** No, and the boundary is in the schema rather than in a policy document. What is stored is work product: recorded decisions, outcomes, and an agent's reflections on the work. It is not people-metrics and it is not correspondence. The unit of sharing is the individual memory, it defaults to workspace-shared because a memory nobody can reach cannot help anyone, and private is available as the exception. Honest limit today: the private setting exists in the data model and one surface reads it, but nothing writes it, so at this moment the practical answer is "everything an agent records in a shared workspace is shared", and we say that rather than implying a control we have not built.

**"Who can edit my record?"** Nobody but you. Read and write were deliberately split: a workspace member can read a colleague's shared memory, and only the author can write, edit or delete it. A shared memory is one person's recorded judgment that others learn from, not a wiki page anyone can revise. That is enforced at the database policy layer, not in application code, so it holds for the agent loop and the cron jobs as well as for a logged-in user.

**"What about tenancy? How do you know my workspace's memory never reaches another customer?"** Every recall is filtered by workspace membership on both paths, the logged-in path and the service-role path that our agents and scheduled jobs run on. The second path is the one that matters and it is the one most systems get wrong, because membership functions usually resolve the caller from the session, and there is no session on a background job. Our recall functions verify membership for a named user on that path specifically. Worth adding unprompted, because it is the more convincing answer: while building the workspace claim we found that a workspace owner could move their own workspace into any account by uuid with no offer, no acceptance and no audit, and since `account_id` is what account-scoped recall reads, that was a tenancy boundary. It is closed by a database trigger that refuses any account move outside the claim path. We looked for that hole in our own code and we are telling you about it.

**"Someone is leaving next month. What actually happens?"** If their work is in a workspace the organisation already holds, nothing needs to happen: the record and both recall paths are workspace-scoped, so the next person inherits them. If they ran a personal plan on a work email, which is the common and awkward case, they can offer the whole workspace to the organisation. The organisation sees an inventory of exactly what would change hands before anyone consents, an owner or admin accepts, the offer expires in 14 days if nobody does, the person has 7 days to undo a mistake, and the organisation can release it at any time afterwards. Every step lands in an audit trail an admin can read. Honest limits, stated in the same breath: that trail is deleted along with the workspace if the workspace is ever deleted, and no organisation outside our own accounts has run this yet.

**"You say I can prove what they knew. Can I really?"** Partly, and here is the line. You can show the decision, the alternatives weighed against it, the evidence cited, the author, the outcome and its verdict, and whether a later call revised it, including revisions that were themselves later reversed. You can show how a claimed workspace came into your organisation, on whose offer, on whose acceptance, and on what date. What you cannot do today is anything a compliance function would call governance: no retention policy, no legal hold, no audit export, no data residency. And the claim's audit trail cascades on workspace deletion, so deleting the workspace destroys the proof of how you acquired it. We would rather lose a deal on that paragraph than win one and fail the security review.

**"What happens to the memory if we churn?"** You export it, in open formats, on every tier including free, and we do not hold it hostage. The honest strategic answer, said out loud rather than hidden: we know the record is the reason customers stay, and we deliberately refuse to make that a wall. Lock-in that comes from an export button being missing is a support ticket. Lock-in that comes from a record you would have to rebuild by living through another two years of decisions is a moat. We want only the second one.

**"Why is this not just a wiki, or Notion, or a Confluence page?"** Because a wiki records what someone remembered to write down, and this records what actually happened. Three differences a buyer feels. First, it is written as a byproduct of doing the work rather than as a separate documentation chore, so it exists on the days nobody had time. Second, it carries the outcome, so it can tell you that a past decision was wrong, which a wiki page never does because nobody goes back to edit it. Third, it is read by the agent at the moment of the next similar decision, without anyone remembering to search for it. The failure mode of a wiki is not that the page is missing; it is that the page is there and nobody looked. The whole point here is that looking is not a human step.

**"Your graph is a diagram. Every tool has one."** Ours answers why, which is the only version worth having. Every link carries the rationale it was drawn for and the agent that drew it. Every recorded outcome carries its verdict, and an unread verdict stays blank rather than defaulting to the good news. Every belief revision is dated and carries a confidence tier, so a tentative revision does not read like a settled one. And a revision that a later outcome reversed stays visible as history instead of being deleted, because the record of having been wrong twice is worth more than a tidy picture. A diagram of what connects to what is a feature. A record of why the company changed its mind, and when, and how sure it was, is the asset.

**"What if the model already remembers? Every assistant is shipping memory."** Model memory is per-user, per-vendor, and unstructured, and that is the right design for a chat assistant. Three things it does not do. It is not tenanted to a company, so it cannot be an org's record. It has no outcome attached, so it remembers what you said, not whether you were right. And it is not portable across the model you happen to use this quarter, so it evaporates on a vendor switch. Ours is scoped to a workspace, carries authorship and outcome, and belongs to the customer. If a lab ships better memory primitives tomorrow, we use them; the asset is the record and its structure, not the storage.

**"Your enterprise story is retention, legal hold and audit. Do you have those?"** No, not today, and we will not imply otherwise. Retention policy, legal hold, audit export, data residency, SSO and SCIM are all in development. What exists today is the layer they are built on: a workspace-scoped, author-attributed, membership-enforced record with immutable authorship, plus a consented, audited workflow for bringing an individual's accumulated work into the organisation. Procurement should treat the governance layer as a roadmap commitment with dates, not as a shipped capability.

**"How do you keep this from becoming a landfill of stale memories?"** Honest answer first: this is the real long-term risk of any memory product, and volume is not the goal. Recall is ranked, not dumped: it is scored by semantic relevance, weighted by the recorded outcome so that a validated call outranks a missed one, and decayed by how long it has been since anything used it. On the free tier the recall cache rolls on a window and then fades, while the decision record itself never expires and always exports. The design position is that memory should be judged on what it surfaces at the right moment, not on how much it stores.

**"There is a memory feature in every product now. Why does yours matter?"** Because ours is generated by a loop that also produces the outcome. A memory feature bolted onto a chat product remembers what was said. Ours remembers what was decided, what was shipped against it, and what happened afterwards, because the same system did all three. That is not a better implementation of the same feature; it is a different asset that only a product owning the whole loop can produce.

**"You have no customers. How can you claim any of this?"** We do not claim any of it as a customer outcome, and every claim in this file carries its status for exactly that reason. The mechanism is live and inspectable as of 2026-08-02. The team effect is unmeasured because no team has run it yet. The enterprise governance layer is unbuilt. What we are asking an investor to underwrite is the structural argument in section 5, and the fact that the record starts accruing on day one for every customer we sign, including the ones a better-funded entrant signs later.

## 8. Never say these (the standing never-list for this layer)

- Never say the enterprise governance layer ships today. Retention, legal hold, audit export, data residency, SSO, SCIM and cross-workspace org policy are all roadmap.
- Never say the claim's audit trail is durable. `workspace_audit_log.workspace_id` cascades on delete, so deleting a claimed workspace erases the organisation's proof. Volunteer this before a reviewer finds it.
- Never say "you control what stays private" until the product has a private control. Today the honest phrasing is "private is supported in the data model".
- Never say "see who contributed what" about memory recall until attribution is surfaced. Today the honest phrasing is "authorship is immutable and attributable". The claim trail is the exception: it does show who offered, who accepted, and when.
- Never say semantic recall spans the whole record. `decisions`, `opportunities`, `prds` and `learnings` have no embeddings of their own yet; recall proxies through `agent_memory`.
- Never say a recall path is still author-scoped. That was true this morning and is not true now; both paths are workspace-aware.
- Never present the Team line, or the claim, as a measured result. They are mechanisms that are live, with no team and no organisation behind them yet.
- Never cite the 404 lineage edges, the roughly 460 memories, or the 12 author identities as users or usage. They are internal and test identities, and they exist in this file only as evidence that two defects were real.
- Never invent a customer, a logo, a quote, or a metric. There are none.
- Never call the brain storage, and never say "where the record lives". It compounds, it guides the next call, and it warns before a repeat. That framing is investor canon.

---

## Related

- [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md), the standing positioning canon (door, body, brain), which this file sits under and does not modify.
- [`one-pager.md`](./one-pager.md), the story and the claim inventory with the same tag vocabulary.
- [`qa-bank.md`](./qa-bank.md), the parent objection bank; section 7 above extends it for memory-specific questions.
- [`../strategy/pricing/memory-tier-ladder.md`](../strategy/pricing/memory-tier-ladder.md), the packaging spec: per-tier capability, enforcement status, and the open founder calls.
- [`../strategy/pricing/pricing-architecture.md`](../strategy/pricing/pricing-architecture.md), the end-to-end pricing system this ladder plugs into.
- [`../strategy/moat.md`](../strategy/moat.md), the moat canon that section 5 applies to the memory layer specifically.
- [`features/agent-memory-and-reflection.md`](../features/agent-memory-and-reflection.md), the operator-facing account of the memory and reflection feature.
- [`../decisions/lineage-relation-vocabulary.md`](../decisions/lineage-relation-vocabulary.md), the ADR behind the relation-vocabulary fork described in 4.4.
