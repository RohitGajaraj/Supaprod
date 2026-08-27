/**
 * THE ONE PROMPT THAT TURNS A WRITTEN SPEC INTO AN OUTCOME CONTRACT.
 *
 * ── WHY IT LIVES ALONE, LIKE `spec-sections.ts` ────────────────────────────
 * Two doors write specs and they must not import each other: `generatePrd`
 * (`discovery.functions.ts`, a `createServerFn` a PERSON clicks in
 * `DiscoverSurface`) and the `prd.draft` tool (`registry.server.ts`, which is
 * the door every AGENT comes through). `spec-sections.ts` already exists for
 * exactly this reason and says so: *"Kept in its own dependency-free module so
 * server files that must not import each other can still share it."*
 *
 * ── THE DEFECT THAT PUT IT HERE (F-136) ────────────────────────────────────
 * S1 measured it: **117 of 119 specs carry an empty `contract`.** Not null,
 * `{}`. Only 2 have `intent`, `success_metrics` and `non_goals`, and those 2
 * carry the whole designed shape, so nothing about the feature is unfinished.
 *
 * The cause is that only ONE of the two doors ever wrote one. `generatePrd`
 * extracts a contract from the body it just wrote; `prd.draft` inserted
 * `user_id, workspace_id, product_id, opportunity_id, title, body_md, status,
 * model` and **no contract at all**, so the column took its `{}` default on
 * every agent-written spec.
 *
 * ── WHY IT IS NOT COSMETIC ─────────────────────────────────────────────────
 * The contract is, in the spec pane's own words, *"the part Build is measured
 * against and Ship reads"*. Empty on 117 of 119 means Build was measured
 * against nothing on almost every spec this product has produced, and the
 * central claim is that a verdict is measured against a forecast.
 *
 * And the information was never missing, only unstructured: of those 117, **all
 * 117 have a body and 94 set out success metrics or acceptance criteria under a
 * heading**. Define was writing the contract in prose and nothing lifted it.
 *
 * ── AND IT CORRECTS MY OWN F-117 ───────────────────────────────────────────
 * F-117 added the oracle compile to `generatePrd`, saying that was *"the path
 * every agent-written spec comes down"*. **It is not.** `generatePrd` is called
 * from `DiscoverSurface.tsx` and nowhere else, so that fix went to the human
 * door. Third time in one night I asserted which path something takes without
 * tracing the callers, and the same mistake S1's measurement caught from the
 * other side.
 */

/**
 * Extraction rules, not generation rules.
 *
 * The load-bearing line is *"Extract only what the text supports. Never invent a
 * metric"*: this reads a spec back to itself and must not add promises nobody
 * made. That is also why F-117 had to fix `prd-writer`'s brief — if the brief
 * does not ask for a measure, this prompt correctly returns none.
 */
export const CONTRACT_FROM_SPEC_SYSTEM = `You are the Supaprod contract analyst. Given a spec's title and markdown body, extract a structured Outcome Contract from what it already says.
Rules:
- intent: one tight paragraph, the core bet in plain language.
- success_metrics: the acceptance criteria / success metrics as short, individually falsifiable statements (max 8, most load-bearing first).
- non_goals: what is explicitly out of scope, as short statements (max 6).
- budget_estimate and blast_radius: a rough cost/effort note and what breaks if this goes wrong, only if the text actually addresses them, else null.
- ambiguity_policy: one sentence on how to resolve ambiguity, only if the text states or clearly implies one, else null.
- Extract only what the text supports. Never invent a metric, non-goal, or policy it does not contain.
- Signal-first: state each item directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"intent": "...", "success_metrics": ["..."], "non_goals": ["..."], "budget_estimate": "..." or null, "blast_radius": "..." or null, "ambiguity_policy": "..." or null}`;

/** What the model is asked to read. One shape, so both doors send the same thing. */
export function contractFromSpecUserMessage(title: string, body: string): string {
  return `TITLE: ${title}\n\nBODY:\n${body.slice(0, 12000)}`;
}

/** The parsed reply, before either door turns it into its own row shape. */
export type ContractDraftJson = {
  intent?: unknown;
  success_metrics?: unknown;
  non_goals?: unknown;
  budget_estimate?: unknown;
  blast_radius?: unknown;
  ambiguity_policy?: unknown;
};

/**
 * Strings from an unknown array, trimmed, capped, empties dropped.
 *
 * Shared because both doors need the identical treatment and the cap is part of
 * the contract's own schema rather than a per-caller preference.
 */
export function contractStrings(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim().slice(0, 2000))
    .filter(Boolean)
    .slice(0, max);
}
