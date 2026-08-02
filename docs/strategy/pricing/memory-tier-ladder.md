# The memory tier ladder, the packaging spec

> _Created: 2026-08-02. **The single packaging source for how the compounding memory layer is sold across the tier ladder**: what each tier gets, what is enforced in code today, what is not, and the open calls the founder still has to make. A pricing page or a plan comparison table is built from this file._
>
> **Role split, so nothing is duplicated.** The commercial narrative (why it is worth money, why it survives a frontier launch, the objection answers, the per-surface copy) is [`../../pitch/compounding-memory-narrative.md`](../../pitch/compounding-memory-narrative.md) in the Pitch Room. This file is the spec behind it. The end-to-end pricing system it plugs into is [`pricing-architecture.md`](./pricing-architecture.md); the per-tier value matrix and upgrade narrative are [`pricing-strategy.md`](./pricing-strategy.md). When this file and either of those disagree on a memory line, this file is the newer call and should be reconciled into them rather than copied.
>
> **Status tags:** **[PROVEN]** enforced in code or SQL today · **[WIRING]** applied but not exercised at scale, or applied with no product surface yet · **[ROADMAP]** not built.

---

## 1. The value metric, in one paragraph

Tiers are credit-priced, so credits meter consumption. Memory is what makes the ladder mean something, because it is the only dimension where the product is worth more to the fifth person in a workspace than to the first. The step-ups are triggered by a change in the customer's situation, not by a capability withheld from the tier below: **the second person** triggers Business, and **a departure or an audit** triggers Enterprise. The commercial consequence, which is the line to argue: a team seat is worth more than N solo seats, because judgment compounds across people rather than per person.

## 2. The ladder

Slugs are canonical (`src/lib/entitlements.ts`); display names are a skin. `max` is a legacy internal slug, not a public tier.

| Slug | Display | The memory promise on the page | Status |
|---|---|---|---|
| `free` | Free | Your own memory. The recall cache rolls on a 30 day window and then fades. The decision record itself never expires and exports forever. | **[PROVEN]** `FREE_MEMORY_RETENTION_DAYS`, single expiry cron on `agent_memory` only |
| `pro` | Pro | Your own memory, kept. No expiry. Recall pools across all of your workspaces. | **[PROVEN]** `memoryPersists`, `crossWorkspaceMemory` resolved per account tier at recall time |
| `max` | Pro (legacy) | Same as Pro. Not on the public page. | **[PROVEN]** |
| `team` | Business | One shared memory for the whole workspace, with authorship attached to every entry. | **[WIRING]** mechanism applied 2026-08-02, never run by a real team |
| `enterprise` | Enterprise | Cross-workspace org brain under policy: retention rules, legal hold, audit export, admin visibility into what the brain knows and who contributed, and a departure workflow. | **[ROADMAP]** none of it built |

**Single-seat tiers are single seat, and that is enforced, not assumed.** `entitlements.seats` is 1 for free, pro and max, and null (many) for team and enterprise, with a drift guard pinning the SQL seat limit to the same source. This is what makes the packaging honest: on a single-seat tier, workspace sharing is a **no-op rather than a withheld feature**, because there is no second person in the workspace. The base product carries the whole promise for a solo product manager, and nothing is hollowed out to manufacture an upgrade.

## 3. What the 2026-08-02 change actually moved

Migration `20260802190000_agent_memory_workspace_visibility.sql`, applied in production:

- `agent_memory.visibility`, constrained to `workspace` or `private`, **defaulting to workspace-shared**. **[PROVEN]**
- RLS split into read and write. Read reaches a teammate's shared memory within a workspace you belong to; write, update and delete stay restricted to the author, so authorship is immutable. **[PROVEN]**
- Semantic recall (`match_agent_memory`) made workspace-aware on both the authenticated path and the service-role path the agent loop and crons run on, via a new `user_in_workspace(workspace_id, user_id)` membership check that works with no session. **[PROVEN]**

Packaging consequence: the Business promise now has a mechanism behind it. It does not yet have an interface or a customer.

## 4. The gaps that constrain what the page may say

Each of these is a specific reason a pricing line must be softened until it closes.

| Gap | Effect on the page | Status |
|---|---|---|
| No product control for `visibility`. Nothing in `src/` writes or reads the column, and the generated Supabase types do not carry it yet. | Do not write "choose what stays private". Write "private is supported in the data model" or say nothing. | **[WIRING]** |
| Recall does not return the author. The row carries `user_id` and the write rules enforce it, but `match_agent_memory` returns no author column and no surface displays one. | Do not write "see who contributed what". Write "authorship is immutable and attributable". | **[WIRING]** |
| `recent_agent_reflections` is still author-scoped. It filters on `m.user_id`, untouched by the 2026-08-02 migration, so reflections do not cross between people. | Do not write "everything an agent learns is shared". Semantic recall crosses authors; reflections do not. | **[WIRING]** |
| No team has run it. Single-digit users, all founder or internal. | No measured outcome may appear beside the Business line. The line names the loss, not a result. | **[WIRING]** |
| The entire enterprise governance layer. | The Enterprise memory line stays off the page, or carries an explicit "in development" marker. | **[ROADMAP]** |

## 5. Open founder calls

**a. The Enterprise line conflicts with what already ships, and this needs a decision before any pricing page is built.** The ratified ladder puts a "cross-workspace org brain" at Enterprise. In code today, `crossWorkspaceMemory` is true for **every paid tier**, and recall already pools across all of an account's workspaces for pro, max and team accounts. So cross-workspace recall is not an Enterprise capability, it is a paid capability. Three ways out, in the order they should be considered:

1. **Redefine the Enterprise line around governance rather than reach**, which is the honest reading of the founder's own list: retention, legal hold, audit export, admin visibility, departure workflow. Cross-workspace recall stays a paid-tier capability and Enterprise sells policy over it. This requires no code change and no removal of anything a paying customer already has.
2. **Distinguish account-scoped pooling from org-scoped pooling.** Today's pooling is keyed to a billing account. An org brain that spans accounts, business units or acquired teams is a genuinely different object and could sit at Enterprise without taking anything away.
3. **Move `crossWorkspaceMemory` up the ladder.** Not recommended. It would remove a capability from tiers that already have it, which breaks the no-paywall rule that makes the rest of this ladder credible.

Recommendation: option 1, with option 2 as the expansion path. Either way, "cross-workspace" must stop being the Enterprise headline, because it is already true one rung down.

**b. Is the Business memory line the primary upgrade trigger on the page, or the second one?** Business also carries write-back connectors, shared credits, roles and approval lanes. The argument for leading with memory is that it is the only one a competitor cannot match by shipping a feature. The argument against is that connectors are the concrete thing a buyer clicks. Founder call.

**c. Does the Enterprise line appear before its wiring lands?** The standing rule says a claim never outruns the wiring, and a pricing page is the strictest surface for that rule. Default is off the page until it ships. If it goes on early, it carries a visible "in development" marker and a date.

**d. Does memory get its own metered dimension later?** Today credits meter consumption and memory is a tier capability. If retention windows, org-wide recall or export volume ever become metered, that is a pricing-architecture change and belongs in [`pricing-architecture.md`](./pricing-architecture.md), not here.

---

## Related

- [`../../pitch/compounding-memory-narrative.md`](../../pitch/compounding-memory-narrative.md), the commercial narrative, the defensibility argument, and the objection answers built on this spec.
- [`pricing-architecture.md`](./pricing-architecture.md), the finalized end-to-end pricing system (credits, BYOK, model access, 4 tier packaging).
- [`pricing-strategy.md`](./pricing-strategy.md), the per-tier value matrix and upgrade narrative this ladder must be reconciled into.
- [`../../features/credits.md`](../../features/credits.md) and [`../../features/billing.md`](../../features/billing.md), the credit and billing rails.
- [`../../features/f-agent-2-memory-reflection.md`](../../features/f-agent-2-memory-reflection.md), the operator-facing memory and reflection feature doc.
