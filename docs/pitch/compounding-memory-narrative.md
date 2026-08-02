# The compounding memory layer, the commercial narrative

> _Created: 2026-08-02. **This file is the commercial argument for the memory layer**: why it is worth money, why the price ladder is shaped the way it is, why it survives a frontier launch, and what a sceptic actually asks. Use it in startup applications, investor conversations, and as the source text for pricing-page copy as the company scales._
>
> **It ADDS a layer under the standing canon; it replaces nothing.** Positioning canon stays [`repositioning-2026-07-22.md`](./repositioning-2026-07-22.md) (the triple-RFS intersection, told door then body then brain). Story and claim inventory stay [`one-pager.md`](./one-pager.md). Objection style follows [`qa-bank.md`](./qa-bank.md). The packaging table that a pricing page is built from is the companion file [`../strategy/pricing/memory-tier-ladder.md`](../strategy/pricing/memory-tier-ladder.md); this file is the narrative, that file is the spec. One topic, two roles, no duplication.
>
> **Claim tags, used on every line that could be challenged:** **[PROVEN]** live in production and verifiable now · **[WIRING]** built and applied, not yet exercised at scale, so it is never asserted as a customer outcome · **[ROADMAP]** honest future, say so out loud.

---

## 1. The spine (founder-ratified, 2026-08-02)

**The USP, unchanged and canonical:**

> Supaprod is the agent-first operating system for product teams. It tells you what to build, builds it, ships it, checks the outcome, and remembers. Wired end to end, from signal to learning and back again.

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
|---|---|---|
| `free` / `pro` / `max` | **Your own memory, whole.** Single seat. Every recall is yours, and the core promise (it remembers, and the next call is sharper) is fully true for a solo product manager. Free keeps the recall cache on a rolling 30 day window; paid keeps it. Nothing about the base product is hollowed out to create an upgrade. | **[PROVEN]** seat limits and retention are enforced in code and in SQL |
| `team` (Business) | **Workspace-shared memory, with authorship attached.** A teammate's recorded judgment is recallable by the whole workspace, and it stays attributed to the person who made the call. Nobody can edit or delete somebody else's record. This is the upgrade trigger: the second person. | **[WIRING]** the mechanism is applied in production; no multi-person team has exercised it yet |
| `enterprise` | **An org brain that outlives the org chart.** Recall across workspaces under org policy, retention rules, legal hold, audit export, admin visibility into what the brain knows and who contributed, and a departure workflow that turns a leaver's record into a handover. | **[ROADMAP]** none of the governance layer ships today. Say "we are building it", never "it does this" |

**The no-paywall rule, stated so it never drifts.** On the single-seat tiers, sharing is a no-op, not a withheld feature. There is one person in the workspace, so workspace-shared visibility has no one to share with. That is a structural fact, not a marketing position, and it is why the base product is honest: a solo product manager gets the complete promise, and the paid step buys a situation they did not have before, not a switch we turned off.

## 4. What shipped on 2026-08-02, stated at the level a technical buyer can check

**[PROVEN]** Migration `20260802190000_agent_memory_workspace_visibility.sql`, applied in production on 2026-08-02:

1. `agent_memory` gained a `visibility` column, constrained to `workspace` or `private`, **defaulting to workspace-shared**, with private available as the exception. The default is deliberate: a memory nobody else can reach cannot make the team sharper.
2. The single read-and-write RLS policy was **split**. You may READ a teammate's shared memory in a workspace you belong to. You may only WRITE, EDIT or DELETE your own. A shared memory is not a communal document that anyone can revise; it is one person's recorded judgment that others can learn from, so **authorship is immutable and attributable** by construction rather than by convention.
3. Recall was made workspace-aware on **both** paths, the authenticated path and the service-role path the agent loop and the crons run on. The service-role path needed a membership check that works when there is no logged-in caller, which is why the migration also added `user_in_workspace(workspace_id, user_id)`. Without it, relaxing the author filter would have exposed every workspace's shared memory to every service-role call. That trap is documented in the migration itself.

**What that buys, said plainly:** an agent working for one member of a workspace can now recall what a different member decided, and the record still says who decided it. That is the mechanism behind the Team line.

**What it does not yet buy, said just as plainly (these are the limits, not a roadmap teaser):**

- **No private toggle in the product yet.** The column and its constraint exist and default correctly, but nothing in the application writes or reads `visibility` yet, so a user cannot currently mark a memory private from a surface. Until that lands, the honest sentence is "private is supported in the data model", never "you choose what stays private". **[WIRING]**
- **Attribution is a guarantee, not yet a display.** The author is on the row and the write rules enforce it, but the recall function does not return the author column and no surface shows it. Say "authorship is immutable and attributable", never "you can see who contributed what". **[WIRING]**
- **One of the two recall paths is still author-scoped.** Semantic recall (`match_agent_memory`) is workspace-aware as of this migration. The reflections stream (`recent_agent_reflections`) still filters on the author, so an agent's reflections do not yet cross between people. **[WIRING]**
- **It has not run with a real team.** Supaprod has single-digit users, all founder or internal. The mechanism is live; the effect on a real team is unmeasured. Never present the Team line as a measured outcome. **[WIRING]**

**The internal observation that motivated the change, flagged so it is never misread as traction:** our own database held 423 memories across 16 workspaces under 12 author identities when the migration was written, and the recall was already fragmenting across them. Every one of those identities is internal or a test account. That number is evidence the fragmentation is real; it is **not** a user count and must never be cited as one.

## 5. Why this is defensible when the model layer commoditizes

This is the sharpest argument we have, and it is the one that should close an investor conversation. It is the direct application of the **six-month-forward doctrine** (canonical: `AGENTS.md`, "THE SIX-MONTH-FORWARD DOCTRINE"), whose first two tests are: assume the model layer commoditizes, and assume a large vendor ships our vertical next quarter. A design that fails either gets redone.

**The claim:** a frontier release can absorb a feature. It cannot absorb a specific company's decision-and-outcome record, because that record is not knowledge in the world, it is a byproduct of running the loop, and it is unique to the customer.

Four supports, in the order they should be argued:

1. **The asset is generated, not gathered.** Nothing in the record can be scraped, licensed, or pre-trained, because it did not exist until this company made these calls on this evidence and shipped these things and found out. A better model makes the record better used. It does not make the record.
2. **It cannot be backfilled.** Hand a frontier model every artifact a company owns, every ticket, doc and thread, and it still cannot reconstruct which option was chosen over which alternative, on what evidence, by whom, and whether the outcome vindicated the call. That structure is created at decision time and at outcome time. Time is an ingredient, and no release shortcuts it.
3. **There is no fast oracle, so this layer does not commoditize on the codegen curve.** Code compiles in seconds, which is why code assistance commoditized quickly: the feedback loop is short enough that model quality alone closes it. Product judgment settles in weeks. A layer whose feedback arrives in weeks is a layer that compounds instead of collapsing, and the same slowness that makes the problem hard makes the asset durable.
4. **The moat curve tracks usage, not model quality.** This is the structural point. Our defensibility improves every time a customer runs the loop, and it is indifferent to whose model is behind it. That is the opposite exposure to a wrapper, whose defensibility is a function of a model advantage it does not own and cannot renew.

**Test 1, a frontier lab ships a product-management agent.** They take the capability. They do not take the record, and structurally they will not want the accountability surface: it is cross-tool, it is permissioned, it requires publishing misses, and it is the surface labs have repeatedly retired. A better model is a same-day drop-in for us, because the engine is ours and models plug into it per job. A frontier launch upgrades our product on the day it ships.

**Test 2, a large vendor launches this vertical.** They take the workflow. They cannot be the neutral judge across their competitors' tools, they will not publish their own misses, and their existing customers' decision records still start on day one of their product, at zero, the same as ours did. The record is the one asset that a well-funded entrant cannot buy their way past, because the only way to acquire it is to have already been running.

**The compact version, for a room:** "Every model release makes our product better and our position stronger, because what we own is not a capability, it is a customer's own record of what they decided and what happened. A lab can ship the capability tomorrow. Nobody can ship you your own history."

## 6. How to say it, by surface

**Startup application (YC and similar), one paragraph.** Tell it in canon order: the door, the loop, then the brain as the crescendo. The memory layer belongs in the last third, never the first line.

> Supaprod runs product work with agents: it tells you what to build from what you already know, builds and ships it once you approve, and records every decision with its evidence and its outcome. The record is the part that compounds. On the single-seat tiers it is your own recall. When a second person joins, the workspace shares one memory with authorship attached, so the team stops re-deciding what it already decided. For an org, the point is continuity: when someone leaves, the reasoning stays, and you can show what they knew and why they chose it. A frontier model release makes every one of those agents better on the day it ships, and it does not touch our position, because what compounds is the customer's own decision-and-outcome record, and that only exists because they ran the loop.

**Investor conversation, the shape of the argument.** Lead with the value metric, not the feature. "Our upgrade trigger is the second person, and our expansion metric is how many people a decision has to survive. That is why a team seat is worth more than N solo seats." Then the defensibility argument in section 5, in order. Then the honest state: the mechanism is live as of 2026-08-02, the governance layer is roadmap, and there are no customer outcomes yet because there are no customers yet.

**Pricing page, as the company scales.** Three lines, one per rung, and no adjectives:

- Solo tiers: "Your product memory, kept. Every call you make sharpens the next one."
- Business: "One shared memory for the whole team. Your team stops re-deciding things it already decided."
- Enterprise: "When someone leaves, you can prove what they knew and why they chose it."

The Enterprise line stays off the pricing page until the governance layer ships, or it is carried with an explicit "in development" marker. A pricing page is a promise with a payment attached; the standing rule that a claim never outruns the wiring is strictest there.

## 7. Objections, with the honest answer

Written in the style of [`qa-bank.md`](./qa-bank.md): where the honest answer contains a weakness, the weakness comes first and the mechanism comes second.

**"Is this surveillance? Am I buying a tool that reads what my team writes?"** No, and the boundary is in the schema rather than in a policy document. What is stored is work product: recorded decisions, outcomes, and an agent's reflections on the work. It is not people-metrics and it is not correspondence. The unit of sharing is the individual memory, it defaults to workspace-shared because a memory nobody can reach cannot help anyone, and private is available as the exception. Honest limit today: the private setting exists in the data model but has no product control yet, so at this moment the practical answer is "everything an agent records in a shared workspace is shared", and we say that rather than implying a control we have not built.

**"Who can edit my record?"** Nobody but you. Read and write were deliberately split: a workspace member can read a colleague's shared memory, and only the author can write, edit or delete it. A shared memory is one person's recorded judgment that others learn from, not a wiki page anyone can revise. That is enforced at the database policy layer, not in application code, so it holds for the agent loop and the cron jobs as well as for a logged-in user.

**"What about tenancy? How do you know my workspace's memory never reaches another customer?"** Every recall is filtered by workspace membership on both paths, the logged-in path and the service-role path that our agents and scheduled jobs run on. The second path is the one that matters and it is the one most systems get wrong, because membership functions usually resolve the caller from the session, and there is no session on a background job. Our recall function verifies membership for a named user on that path specifically. We can walk a technical reviewer through the exact policy and function text; it is one migration file.

**"What happens to the memory if we churn?"** You export it, in open formats, on every tier including free, and we do not hold it hostage. The honest strategic answer, said out loud rather than hidden: we know the record is the reason customers stay, and we deliberately refuse to make that a wall. Lock-in that comes from an export button being missing is a support ticket. Lock-in that comes from a record you would have to rebuild by living through another two years of decisions is a moat. We want only the second one.

**"Why is this not just a wiki, or Notion, or a Confluence page?"** Because a wiki records what someone remembered to write down, and this records what actually happened. Three differences a buyer feels. First, it is written as a byproduct of doing the work rather than as a separate documentation chore, so it exists on the days nobody had time. Second, it carries the outcome, so it can tell you that a past decision was wrong, which a wiki page never does because nobody goes back to edit it. Third, it is read by the agent at the moment of the next similar decision, without anyone remembering to search for it. The failure mode of a wiki is not that the page is missing; it is that the page is there and nobody looked. The whole point here is that looking is not a human step.

**"What if the model already remembers? Every assistant is shipping memory."** Model memory is per-user, per-vendor, and unstructured, and that is the right design for a chat assistant. Three things it does not do. It is not tenanted to a company, so it cannot be an org's record. It has no outcome attached, so it remembers what you said, not whether you were right. And it is not portable across the model you happen to use this quarter, so it evaporates on a vendor switch. Ours is scoped to a workspace, carries authorship and outcome, and belongs to the customer. If a lab ships better memory primitives tomorrow, we use them; the asset is the record and its structure, not the storage.

**"Your enterprise story is retention, legal hold and audit. Do you have those?"** No, not today, and we will not imply otherwise. Retention policy, legal hold, audit export, admin visibility and the departure workflow are all in development. What exists today is the layer they are built on: a workspace-scoped, author-attributed, membership-enforced record with immutable authorship. Procurement should treat the governance layer as a roadmap commitment with dates, not as a shipped capability, and we would rather lose a deal on that sentence than win one and fail the security review.

**"How do you keep this from becoming a landfill of stale memories?"** Honest answer first: this is the real long-term risk of any memory product, and volume is not the goal. Recall is ranked, not dumped: it is scored by semantic relevance, weighted by the recorded outcome so that a validated call outranks a missed one, and decayed by how long it has been since anything used it. On the free tier the recall cache rolls on a window and then fades, while the decision record itself never expires and always exports. The design position is that memory should be judged on what it surfaces at the right moment, not on how much it stores.

**"There is a memory feature in every product now. Why does yours matter?"** Because ours is generated by a loop that also produces the outcome. A memory feature bolted onto a chat product remembers what was said. Ours remembers what was decided, what was shipped against it, and what happened afterwards, because the same system did all three. That is not a better implementation of the same feature; it is a different asset that only a product owning the whole loop can produce.

**"You have no customers. How can you claim any of this?"** We do not claim any of it as a customer outcome, and every claim in this file carries its status for exactly that reason. The mechanism is live and inspectable as of 2026-08-02. The team effect is unmeasured because no team has run it yet. The enterprise governance layer is unbuilt. What we are asking an investor to underwrite is the structural argument in section 5, and the fact that the record starts accruing on day one for every customer we sign, including the ones a better-funded entrant signs later.

## 8. Never say these (the standing never-list for this layer)

- Never say the enterprise governance layer ships today. Cross-workspace org policy, retention, legal hold, audit export, admin visibility and the departure workflow are all roadmap.
- Never say "you control what stays private" until the product has a private control. Today the honest phrasing is "private is supported in the data model".
- Never say "see who contributed what" until attribution is surfaced. Today the honest phrasing is "authorship is immutable and attributable".
- Never present the Team line as a measured result. It is a mechanism that is live, with no team behind it yet.
- Never cite the 423 memories or the 12 author identities as users. They are internal and test identities.
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
- [`../features/f-agent-2-memory-reflection.md`](../features/f-agent-2-memory-reflection.md), the operator-facing account of the memory and reflection feature.
