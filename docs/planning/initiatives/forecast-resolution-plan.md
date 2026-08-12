# Forecast Resolution (FC-01, the grading half)

> _Created: 2026-08-12 · Last updated: 2026-08-12_

> **Status: SPEC (2026-08-12).** The design for the half of FC-01 that grades a captured forecast. Capture shipped 2026-08-10 (schema) and 2026-08-11 (server plus UI). Board row: [`SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) row 1 (FC-01). Schema and its reasoning: [`supabase/migrations/20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt.sql`](../../../supabase/migrations/20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt.sql). Positioning: [`../../strategy/positioning-locked-2026-08.md`](../../strategy/positioning-locked-2026-08.md) §5E.

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development or superpowers:executing-plans to build this task by task, once the build plan section exists.

**Goal:** make a captured forecast resolvable, so that a horizon passing produces either a verdict or an explicit deferral, and a workspace can read how often its own calls were right.

---

## What exists, and what is missing

Verified on 2026-08-12 against the working tree, not from the board.

**Built:** `decisions.forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`, `forecast_resolution`, `forecast_resolved_at`. The `enforce_forecast_immutable` trigger, which freezes the first three once set and deliberately leaves the resolution fields writable. `forecastRefusal` in `src/lib/decisions.functions.ts`, which refuses a partial forecast and refuses a horizon at or before now. The capture form in `src/components/knowledge/DecisionsPanel.tsx`. The partial index `idx_decisions_forecast_due`, predicated `where forecast_claim is not null and forecast_resolution is null`.

**Missing:** anything that writes `forecast_resolution`. Its only occurrence in application code is a comment at `src/lib/decisions.functions.ts:421` stating that `attachForecast` deliberately does not touch it. So the index describes a work queue that no query reads, and a forecast horizon passes with nothing on the other side of it.

**Consequence for the claim we make.** Capture alone records a belief; only resolution turns beliefs into calibration. Until this ships, the honest form permitted by the vocabulary canon ("the loop is wired and proven, and it begins accruing on first real use") still overstates the forecast case, because the loop has a missing segment rather than an empty one.

---

## The one invariant

**The tick enriches. It never gates.**

The due-forecast queue is derived in SQL from the frozen columns on `decisions`. It does not read anything the agent wrote. With the tick failing, throttled, or `auto_derive_enabled` switched off, a workspace still sees its due forecasts on the Learn desk; they simply arrive without a drafted verdict.

```
decisions  (forecast_claim, how_we_will_know, horizon: all frozen once set)
   |
   +-- QUEUE (pure SQL: horizon passed, resolution null,
   |          next_check_at null or passed)
   |     |
   |     +-- Learn desk, settle    -> forecast_resolution
   |     |                            + rationale + resolved_by
   |     +-- Learn desk, too early -> forecast_next_check_at
   |                                  (NO verdict written)
   |
   +-- TICK (enrichment only)
         +-- forecast_resolution_suggestion {verdict, rationale, confidence}
               +-- promote to a verdict ONLY IF the linked spec outcome is
                   already settled by a person AND confidence clears the tier
```

This inverts the sibling. `calibrateExpiredInsights` finds due rows and writes the verdict in a single pass, which is why insights have no human path at all. Separating discovery from judgment is what makes a gate possible, and it is the difference between reusing that function and reusing its shape.

---

## Why the insight calibrator is a pattern and not a dependency

`src/lib/brain/calibrate-insights.server.ts` plus its tick at `src/routes/api/public/hooks/calibrate-tick.ts` is the proven sibling, and migration `20260810180000` predicted direct reuse: "the same five fields land on `decisions` with the same names ... so the auditor that scores an insight can score a decision without a second implementation or a second vocabulary."

Two of those five diverged, and the divergence matters.

1. **No confidence, therefore no Brier score.** `insights` carries `confidence` and `brier_score`; `decisions` carries `forecast_how_we_will_know` in that slot and captures no confidence at all. `computeBrierScore` defaults a missing confidence to 0.5, so every decision forecast would score a constant 0.25 and measure nothing. The honest metric is a plain hit rate over resolved, non-inconclusive forecasts, which is what `summarizeResolutions` computes. **The four lines of counting are reimplemented rather than imported**, for a reason found while writing the build plan: `calibrate-insights.server.ts` is a `.server.ts` module, and the module holding the forecast predicates is reached from a client component through the `ForecastResolution` type. Importing it would put `callModel` and the whole AI runtime one accidental value-import away from the client bundle. The zero-state wording is pinned to the shared string by a test, so the two cannot drift apart unnoticed.

2. **The sibling conflates "inconclusive" with "too early".** `judgeOutcome` returns `inconclusive` whenever evidence does not clearly confirm or deny, and `calibrateExpiredInsights` then writes `resolution: 'inconclusive'` with `status: 'expired'`, permanently. Migration `20260806100000_a_bet_can_be_too_early_to_judge.sql` already ruled against exactly this for specs: a future check date is how the product says too early to tell "WITHOUT writing a verdict, because a deferral is the absence of an outcome rather than a kind of one." Porting the sibling's behaviour would stamp a permanent verdict on forecasts that were merely looked at too soon, and `inconclusive` is reserved for the case where the evidence arrived and genuinely did not settle the claim.

What is genuinely reused: the judge prompt's rules (signal first, short rationale, say inconclusive rather than guessing), the tick itself including its authentication and `withJobRun` wrapper and its per-workspace `try/catch`, the counting shape, and the `hit / miss / inconclusive` vocabulary the database constraint already enforces. `shouldThrottle` is not reused, because throttling is out of scope. What is reused as a warning rather than as code is the sibling's conflation above.

---

## Schema

One migration on `decisions`. Every column mirrors an existing precedent rather than inventing a shape.

| Column | Mirrors | Why |
| --- | --- | --- |
| `forecast_resolution_suggestion jsonb` | `prds.outcome_suggestion` ("RF-01: auto-drafted, confidence-tiered outcome suggestion") | the agent's draft, structurally separate from the verdict, so a draft can never be mistaken for a decision |
| `forecast_resolution_rationale text` | none | `forecast_resolution` is a constrained text column, so the reason a verdict was reached needs its own home |
| `forecast_resolved_by_agent_slug text` | `decisions.decided_by_agent_slug` | NULL means a person settled it. Every agent-settled row is identifiable, so the whole set stays filterable and reversible |
| `forecast_next_check_at timestamptz` | `prds.outcome_check_by` | NULL means due now. A future value says too early to tell without writing a verdict |
| `forecast_deferred_at timestamptz` | `prds.outcome_deferred_at` | when a person last pushed it out |
| `forecast_deferred_count integer not null default 0` | `prds.outcome_deferred_count` | founder ruling, carried over verbatim: no cap, keep the count, surface it, because "a bet deferred four times is a bet whose metric never moves, and that is worth surfacing rather than hiding" |

`idx_decisions_forecast_due` is replaced by an index whose predicate matches the queue query, including `forecast_next_check_at`. The current index is the artifact of a consumer that was never built, and leaving its predicate half-matched would repeat that.

None of these columns are touched by `enforce_forecast_immutable`, which guards only the three belief columns.

**No backfill.** Every existing forecast keeps `forecast_resolution` NULL and simply becomes due when its horizon passes.

---

## The two paths

### Human settle, at the Learn desk

Due forecasts appear at `/learn` as their own group beside spec outcomes, because the Learn desk is already where the product brings work back to be judged and already carries a settle control and a too-early control. Settling writes `forecast_resolution`, `forecast_resolution_rationale` and `forecast_resolved_at`, and leaves `forecast_resolved_by_agent_slug` NULL.

### Agent settle, gated

Promotion of a suggestion into a verdict requires **both** conditions:

1. The decision links to a spec whose `prds.outcome` is non-null. That column is written only by the human settle path, since agent drafts live in `prds.outcome_suggestion`. So the agent applies a stated observable to judgment a person already made, and never originates the judgment.
2. The drafted confidence clears the tier, following PC-11's confidence-gated execution, whose playbook leg is already live.

Anything failing either condition keeps its suggestion and waits for a person.

**Why this is safe rather than merely cautious.** Every promoted verdict carries `forecast_resolved_by_agent_slug`, so if the gate turns out to be wrong, the affected set is one query, and `forecast_resolution` is writable by design ("re-scoring a claim as better evidence arrives is legitimate"). The off switch is the existing `auto_derive_enabled`, which already gates the tick, so this adds no new flag.

### Deferral

A deferral writes `forecast_next_check_at`, `forecast_deferred_at` and an incremented `forecast_deferred_count`, and writes **no verdict, ever**. That is the integrity pin of this design and it gets a test that fails if `forecast_resolution` is non-null on any deferral path.

Deferral is uncapped and cannot hide a slipped call, because the horizon is frozen: `forecast_resolved_at` minus `forecast_horizon_date` stays computable for the life of the row. Specs had no frozen original date to compare against, so forecasts are strictly better instrumented for this than the precedent that set the rule.

---

## Vocabulary: two enums that stay apart

`src/components/learn/verdict-words.ts` defines `validated | mixed | missed` for a spec outcome and states that the three words are load bearing across `/learn` and `/runs` so the desk and the record never call one thing two things. `forecast_resolution` is constrained to `hit | miss | inconclusive`. Putting due forecasts on the Learn desk puts both on one screen.

**They must not be merged, and no mapping function may be written between them.** They answer different questions, and a single event can legitimately take different values in each. Forecast "this will not move activation", and it does not move: the forecast is a **hit** and the spec outcome is **missed**, both correct at once. A mapping function cannot express that, so writing one would silently pick a winner and corrupt both records. `mixed` ("the signal was mixed") is a result; `inconclusive` ("the evidence did not settle it") is the absence of one.

A new `src/components/learn/forecast-words.ts` mirrors the shape of `verdict-words.ts`, for the same reason that file exists:

```ts
export type ForecastResolution = "hit" | "miss" | "inconclusive";

export const FORECAST_SAYS: Record<ForecastResolution, string> = {
  hit: "you called it",
  miss: "it went the other way",
  inconclusive: "the evidence did not settle it",
};
```

The desk labels the two groups distinctly so neither reads as a synonym of the other.

**The hit rate reads "You called 4 of the last 6", not the sibling's "Supaprod called 7 of the last 9".** The forecast is the team's belief, so attributing it to the product would take credit for a person's judgment, which claims more than the product delivers. The zero state is `summarizeResolutions`' existing "Not enough resolved calls yet", which is also the honest present-tense form while nothing has resolved.

---

## Decisions taken

Recorded so they are not re-asked. The founder delegated both on 2026-08-12.

| Decision | Ruling | Why |
| --- | --- | --- |
| Who writes the verdict | Confidence-gated hybrid: agent drafts always, promotes only behind the two-condition gate, person settles everything else | PC-11 is the ruled direction for agent-drafted artifacts; the narrow gate means the agent never originates judgment |
| Does agent settle ship in v1 | Yes | it rides `auto_derive_enabled` so the off switch exists, and `forecast_resolved_by_agent_slug` makes every auto verdict identifiable and reversible in one query |
| Deferral cap | None, keep the count | carried from the `prds` ruling; the frozen horizon makes lateness permanently visible, so an uncapped deferral hides nothing |
| Brier score | Out | no confidence is captured, so it would report a constant and measure nothing |
| Throttle parity | Out | throttling suits agent-generated insights; a team's own forecasts missing is a signal to show, not to suppress |
| Readout in this pass | In, with the honest zero state | the 2026-08-06 design audit found the product consistently under-renders its own work |

---

## Testing

- **Pure and table driven:** the gate predicate and the queue predicate are extracted as pure functions and tested without a database.
- **Red then green by planting the defect**, for the two pins: a deferral writes no verdict, and the queue does not depend on the suggestion. This follows the convention the `agent_memory` workspace pin set on 2026-08-06.
- **Stubs match the real call chain, including `.select()`.** The previous pin's test was silently unreachable because an `update().eq()` stub answered no `.select()`, so the real chain threw into its own catch and every assertion about it was dead. A mock too loose to match the shape it mocks cannot fail when that shape breaks.
- **One test locks the two vocabularies apart:** a decision resolves `hit` while its linked spec outcome is `missed`, and both persist.
- **One test proves the queue survives the tick:** with `auto_derive_enabled` false, a due forecast still appears, carrying no suggestion.

---

## Out of scope

No Brier score. No throttle. No backfill of existing rows. No change to the capture form, which shipped and is frozen by design. No new scheduled job: the forecast pass joins the existing `calibrate-tick`.

---

## References

- Board row: [`SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) row 1, FC-01
- Capture schema and reasoning: `supabase/migrations/20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt.sql`
- Deferral precedent: `supabase/migrations/20260806100000_a_bet_can_be_too_early_to_judge.sql`
- Sibling calibrator: `src/lib/brain/calibrate-insights.server.ts`, `src/routes/api/public/hooks/calibrate-tick.ts`
- Verdict vocabulary: `src/components/learn/verdict-words.ts`
- Settle surface: `src/components/learn/SettlePanel.tsx`, `src/routes/_authenticated.learn.tsx`
- Deferral implementation to mirror: `deferOutcomeCheck` in `src/lib/outcome.functions.ts`
- Agent-settled oversight precedent: `listAgentSettledOutcomes` in `src/lib/outcome.functions.ts`

---

# Build plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Progress (2026-08-12).** Tasks 2 and 3 are BUILT and green: `src/lib/brain/forecast-resolution.ts` and `src/components/learn/forecast-words.ts`, 23 tests, all four pins proven red then green by planting the defect. Gate at that point: tsc 0, 8,755 pass, 0 fail, eslint clean on the new files. **Task 1, the migration, is not applied yet**, and Tasks 4 to 7 read columns it adds, so they wait on it. Applying it goes through the Lovable MCP. Nothing built so far touches the database, which is why it could land first.

**Goal:** a forecast horizon passing produces either a verdict or an explicit deferral, and a workspace can read how often its own calls were right.

**Architecture:** a pure predicate module holds the queue rule and the auto-settle gate so both are testable without a database. A `.server.ts` module drafts suggestions and promotes only the gated subset, called from the existing `calibrate-tick`. Server functions expose the queue, the settle, the deferral and the rate to the Learn desk, which gains its own forecast panel rather than growing `SettlePanel` further.

**Tech Stack:** TanStack Start server functions, Supabase via `supabase-js`, `callModel` for the draft, React 19 with the Ember system, `bun test`.

## Global Constraints

- **Bun** is the runner. `bun test`, `bunx tsc --noEmit`, `bun run build`. All three green before any commit.
- **No em dashes and no en dashes**, in code comments or in any user-facing copy. The pre-commit `check-humanized` hook scans additions and fails on them.
- **Banned vocabulary, every surface:** receipts, ledger, company brain, decision layer, unattended, first run, provenance. Never "remembers", "stores" or "logs" as verbs of the brain. "Audit trail" and "shared brain" are allowed. Never claim accumulated learning in the present tense.
- **Never a bare `.lte()` on a nullable column.** Use `.or("col.is.null,col.lte.<iso>")`. A bare comparison drops NULLs in SQL, which would narrow the queue to previously-deferred rows only and still look like it works. This trap is documented twice inside `listPendingOutcomes` because it shipped twice.
- **Do not add to `src/components/learn/SettlePanel.tsx`.** It is 1132 lines already. New surface goes in a new component.
- **Local row types, not generated types.** `listPendingOutcomes` declares its own `type PrdRow`. Follow that, so no task waits on a types regeneration.
- **`.server.ts` runs only in the Worker** and must never be imported by a client component.
- **Repo jsonb filter convention:** `col->>key`, as in `listAgentSettledOutcomes`.
- **Commit with `git commit -F <file>`.** zsh evaluates backticks inside `-m` and silently deletes the word.
- **Migration naming:** `supabase/migrations/<UTC timestamp>_<snake_case_reason>.sql`, carrying a comment that explains why it exists.
- **Query key convention on `/learn`:** existing keys are `["outcome"]`, `["outcome-pending"]`, `["outcome-agent-settled"]`. New keys follow the same shape.

---

### Task 1: The migration

**Files:**
- Create: `supabase/migrations/20260812210000_a_forecast_horizon_passed_and_nothing_was_on_the_other_side.sql`

**Interfaces:**
- Produces: columns `forecast_resolution_suggestion jsonb`, `forecast_resolution_rationale text`, `forecast_resolved_by_agent_slug text`, `forecast_next_check_at timestamptz`, `forecast_deferred_at timestamptz`, `forecast_deferred_count integer not null default 0` on `public.decisions`, plus the replacement index `idx_decisions_forecast_due`.

**Applying it needs the founder.** Database access is through the Lovable MCP, and migrations applied that way are live immediately. Every later task uses local row types, so nothing here blocks the rest of the plan.

- [ ] **Step 1: Write the migration**

```sql
-- A forecast horizon passed and nothing was on the other side.
--
-- FC-01 shipped capture on 2026-08-10 and 2026-08-11: claim, observable and
-- horizon, frozen once set. It shipped no way to settle one. The only mention
-- of forecast_resolution in application code is a comment saying attachForecast
-- deliberately does not touch it, so idx_decisions_forecast_due described a work
-- queue that no query read.
--
-- WHY A DEFERRAL COLUMN AND NOT A REUSED ENUM VALUE. Migration 20260806100000
-- ruled this for specs: a future check date says "too early to tell" WITHOUT
-- writing a verdict, "because a deferral is the absence of an outcome rather
-- than a kind of one". inconclusive is reserved for the case where the evidence
-- arrived and did not settle the claim. The sibling insight calibrator conflates
-- the two and writes inconclusive permanently whenever evidence is unclear;
-- copying that here would stamp verdicts on forecasts looked at too soon.
--
-- WHY AN AGENT SLUG COLUMN. prds marks an agent verdict inside a jsonb key
-- (outcome->>settled_by) and listAgentSettledOutcomes filters on it, so a person
-- can reconsider what an agent decided. forecast_resolution is a constrained
-- text column and cannot carry a key, so the marker gets its own column,
-- mirroring decisions.decided_by_agent_slug. NULL means a person settled it.
-- This is what makes an agent verdict identifiable, and therefore reversible in
-- one query, which is the property the auto-settle gate rests on.
--
-- NO CAP ON DEFERRALS, and the count is kept, carried from the prds ruling: a
-- bet deferred four times is a bet whose metric never moves, and that is worth
-- surfacing rather than hiding. A forecast hides less than a spec did, because
-- the horizon is frozen, so forecast_resolved_at minus forecast_horizon_date
-- stays computable for the life of the row.

alter table public.decisions
  add column if not exists forecast_resolution_suggestion jsonb,
  add column if not exists forecast_resolution_rationale text,
  add column if not exists forecast_resolved_by_agent_slug text,
  add column if not exists forecast_next_check_at timestamptz,
  add column if not exists forecast_deferred_at timestamptz,
  add column if not exists forecast_deferred_count integer not null default 0;

comment on column public.decisions.forecast_resolution_suggestion is
  'Auto-drafted, confidence-tiered resolution suggestion. Mirrors '
  'prds.outcome_suggestion. A draft, never a verdict: the tick writes here and '
  'promotes into forecast_resolution only behind the gate.';
comment on column public.decisions.forecast_resolution_rationale is
  'Why this forecast resolved the way it did. forecast_resolution is a '
  'constrained text column, so the reason needs its own home.';
comment on column public.decisions.forecast_resolved_by_agent_slug is
  'Which agent settled this forecast. NULL means a person did. Every agent '
  'verdict stays identifiable so the set is reversible in one query.';
comment on column public.decisions.forecast_next_check_at is
  'When this forecast should come back to the Learn desk. NULL means due now. A '
  'future value is how the product says "too early to tell" WITHOUT writing a '
  'verdict, because a deferral is the absence of an outcome rather than a kind '
  'of one. The frozen horizon is never moved by this.';
comment on column public.decisions.forecast_deferred_count is
  'How many times a person pushed this forecast out. Kept because it is signal: '
  'a forecast deferred four times is one whose observable never resolved.';

-- The old index predicate matched no query. This one matches the queue exactly,
-- so the deferral clause rides the same scan instead of filtering after it.
drop index if exists idx_decisions_forecast_due;
create index if not exists idx_decisions_forecast_due
  on public.decisions (forecast_horizon_date, forecast_next_check_at)
  where forecast_claim is not null and forecast_resolution is null;
```

- [ ] **Step 2: Confirm the immutability trigger is untouched**

Run: `grep -n "forecast_claim\|forecast_how_we_will_know\|forecast_horizon_date" supabase/migrations/20260810180000_the_forecast_is_the_part_that_cannot_be_rebuilt.sql`
Expected: `enforce_forecast_immutable` guards only those three columns. None of the six new columns appear, so no new column is frozen.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260812210000_a_forecast_horizon_passed_and_nothing_was_on_the_other_side.sql
git commit -F /tmp/msg-task1.txt
```

---

### Task 2: The pure predicates

Both rules that decide behaviour live in a pure module, so they are table-testable with no database and no model call.

**Files:**
- Create: `src/lib/brain/forecast-resolution.ts`
- Test: `src/lib/brain/forecast-resolution.test.ts`

**Interfaces:**
- Consumes: nothing. **This module imports nothing, deliberately.** `forecast-words.ts` (Task 3) is reached from a client component and imports the `ForecastResolution` type from here. A `.server.ts` import anywhere in this file's graph would put the AI runtime one accidental value-import away from the client bundle, which the global constraints forbid. See the note on the duplicated zero-state string in Step 3.
- Produces: `type ForecastResolution = "hit" | "miss" | "inconclusive"`; `isForecastDue(row, nowIso): boolean`; `canAutoSettle(input): boolean`; `dueCheckFilter(nowIso): string`; `summarizeForecastCalls(rows): ForecastCallSummary` where `ForecastCallSummary = { resolved: number; hits: number; hitRate: number | null; label: string }`; `buildDeferPatch(input)`; `buildSettlePatch(input)`; `NO_CALLS_YET`; `AUTO_SETTLE_CONFIDENCE_FLOOR`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import {
  isForecastDue,
  canAutoSettle,
  summarizeForecastCalls,
} from "./forecast-resolution";

const NOW = "2026-08-12T12:00:00.000Z";
const PAST = "2026-08-10T12:00:00.000Z";
const FUTURE = "2026-08-20T12:00:00.000Z";

describe("isForecastDue (FC-01)", () => {
  test("a passed horizon with no resolution is due", () => {
    expect(
      isForecastDue(
        { forecast_claim: "x", forecast_horizon_date: PAST, forecast_resolution: null, forecast_next_check_at: null },
        NOW,
      ),
    ).toBe(true);
  });

  test("a future horizon is not due", () => {
    expect(
      isForecastDue(
        { forecast_claim: "x", forecast_horizon_date: FUTURE, forecast_resolution: null, forecast_next_check_at: null },
        NOW,
      ),
    ).toBe(false);
  });

  test("an already resolved forecast is never due", () => {
    expect(
      isForecastDue(
        { forecast_claim: "x", forecast_horizon_date: PAST, forecast_resolution: "hit", forecast_next_check_at: null },
        NOW,
      ),
    ).toBe(false);
  });

  test("a deferral into the future suppresses it without a verdict", () => {
    expect(
      isForecastDue(
        { forecast_claim: "x", forecast_horizon_date: PAST, forecast_resolution: null, forecast_next_check_at: FUTURE },
        NOW,
      ),
    ).toBe(false);
  });

  test("a deferral that has itself come due is due again", () => {
    expect(
      isForecastDue(
        { forecast_claim: "x", forecast_horizon_date: PAST, forecast_resolution: null, forecast_next_check_at: PAST },
        NOW,
      ),
    ).toBe(true);
  });

  test("a decision carrying no forecast is never due", () => {
    expect(
      isForecastDue(
        { forecast_claim: null, forecast_horizon_date: null, forecast_resolution: null, forecast_next_check_at: null },
        NOW,
      ),
    ).toBe(false);
  });
});

describe("canAutoSettle (FC-01)", () => {
  test("settles when a person already settled the linked spec and confidence clears", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: 0.9 })).toBe(true);
  });

  test("refuses when the linked spec outcome is not settled, however confident", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: false, confidence: 0.99 })).toBe(false);
  });

  test("refuses on low confidence even with a settled linked outcome", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: 0.4 })).toBe(false);
  });

  test("refuses when confidence is missing", () => {
    expect(canAutoSettle({ linkedOutcomeSettled: true, confidence: null })).toBe(false);
  });
});

describe("summarizeForecastCalls (FC-01)", () => {
  test("attributes the calls to the team, not to the product", () => {
    const s = summarizeForecastCalls([{ resolution: "hit" }, { resolution: "hit" }, { resolution: "miss" }]);
    expect(s.resolved).toBe(3);
    expect(s.hits).toBe(2);
    expect(s.label).toBe("You called 2 of the last 3");
    expect(s.label).not.toContain("Supaprod");
  });

  test("keeps the shared honest zero state", () => {
    const s = summarizeForecastCalls([]);
    expect(s.hitRate).toBeNull();
    expect(s.label).toBe("Not enough resolved calls yet");
  });

  /**
   * The counting is duplicated rather than imported, so that this module can
   * import nothing and stay safe for the client bundle. This pins the one thing
   * that could then drift silently: the wording of the zero state.
   */
  test("the zero state still matches the insight calibrator's wording", () => {
    const shared = summarizeResolutions([], "prediction");
    expect(summarizeForecastCalls([]).label).toBe(shared.recentLabel);
  });
});

describe("a deferral writes no verdict (FC-01 integrity pin)", () => {
  test("the defer patch touches the check date and never the resolution", () => {
    const patch = buildDeferPatch({
      days: 14,
      priorCount: 2,
      nowMs: Date.parse("2026-08-12T12:00:00.000Z"),
    });
    expect(patch.forecast_next_check_at).toBe("2026-08-26T12:00:00.000Z");
    expect(patch.forecast_deferred_count).toBe(3);
    expect("forecast_resolution" in patch).toBe(false);
    expect("forecast_resolved_at" in patch).toBe(false);
    expect("forecast_resolution_rationale" in patch).toBe(false);
  });

  test("a first deferral counts from zero", () => {
    const patch = buildDeferPatch({
      days: 7,
      priorCount: 0,
      nowMs: Date.parse("2026-08-12T12:00:00.000Z"),
    });
    expect(patch.forecast_deferred_count).toBe(1);
  });
});

describe("a human settle leaves no agent fingerprint (FC-01)", () => {
  test("settling by hand records a NULL agent slug", () => {
    const patch = buildSettlePatch({
      resolution: "miss",
      rationale: "Activation sat at 11 percent through the window.",
      nowIso: NOW,
      agentSlug: null,
    });
    expect(patch.forecast_resolution).toBe("miss");
    expect(patch.forecast_resolved_by_agent_slug).toBeNull();
    expect(patch.forecast_resolved_at).toBe(NOW);
  });

  test("an agent settle is stamped, so the set stays reversible in one query", () => {
    const patch = buildSettlePatch({
      resolution: "hit",
      rationale: "The linked spec outcome was settled by a person.",
      nowIso: NOW,
      agentSlug: "forecast-auditor",
    });
    expect(patch.forecast_resolved_by_agent_slug).toBe("forecast-auditor");
  });
});
```

The test file's imports, given the moves above:

```ts
import { describe, expect, test } from "bun:test";
import {
  isForecastDue,
  canAutoSettle,
  summarizeForecastCalls,
  buildDeferPatch,
  buildSettlePatch,
} from "./forecast-resolution";
// Imported by the TEST only, never by the module under test, which is what
// keeps the AI runtime out of the client bundle while still pinning the string.
import { summarizeResolutions } from "./calibrate-insights.server";
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test src/lib/brain/forecast-resolution.test.ts`
Expected: FAIL, cannot resolve module `./forecast-resolution`.

- [ ] **Step 3: Implement**

```ts
// FC-01, the grading half. Every rule that decides behaviour lives here, pure,
// so all of it is table-testable without a database and without a model call.
//
// THIS FILE IMPORTS NOTHING, AND THAT IS LOAD BEARING. forecast-words.ts is
// reached from a client component and takes the ForecastResolution type from
// here. summarizeResolutions in calibrate-insights.server.ts computes the same
// counts, and importing it would put callModel and the whole AI runtime one
// accidental value-import away from the client bundle. The four lines of
// counting below are duplicated on purpose; the zero-state STRING is pinned to
// the shared one by a test, so the two cannot drift apart unnoticed.

export type ForecastResolution = "hit" | "miss" | "inconclusive";

/** The confidence a drafted verdict must clear before it may settle itself. */
export const AUTO_SETTLE_CONFIDENCE_FLOOR = 0.75;

export type DueForecastRow = {
  forecast_claim: string | null;
  forecast_horizon_date: string | null;
  forecast_resolution: string | null;
  forecast_next_check_at: string | null;
};

/**
 * The queue rule, in one place, so the SQL and the surface cannot disagree.
 *
 * A deferral suppresses without a verdict: forecast_next_check_at in the future
 * means a person looked and said the evidence is not in yet. The frozen horizon
 * is never consulted for suppression, only for whether the claim came due at
 * all, which is why deferring can never hide a slipped call.
 */
export function isForecastDue(row: DueForecastRow, nowIso: string): boolean {
  if (!row.forecast_claim) return false;
  if (row.forecast_resolution) return false;
  if (!row.forecast_horizon_date) return false;
  if (row.forecast_horizon_date > nowIso) return false;
  if (row.forecast_next_check_at && row.forecast_next_check_at > nowIso) return false;
  return true;
}

/**
 * The gate. Both conditions, never one.
 *
 * `linkedOutcomeSettled` is true only when the decision links to a spec whose
 * prds.outcome is non-null, and that column is written by the human settle path
 * alone (agent drafts live in prds.outcome_suggestion). So in the auto case the
 * agent applies a stated observable to judgment a person already made, and
 * never originates the judgment.
 */
export function canAutoSettle(input: {
  linkedOutcomeSettled: boolean;
  confidence: number | null | undefined;
}): boolean {
  if (!input.linkedOutcomeSettled) return false;
  if (typeof input.confidence !== "number" || !Number.isFinite(input.confidence)) return false;
  return input.confidence >= AUTO_SETTLE_CONFIDENCE_FLOOR;
}

export type ForecastCallSummary = {
  resolved: number;
  hits: number;
  hitRate: number | null;
  label: string;
};

/**
 * The NULL-safe deferral clause, in one place, because writing it twice is how
 * the spec queue got it wrong in exactly one of its two halves. Both the desk
 * query and the tick query take it from here, so they cannot disagree about what
 * is due. Exported as a string so a test can assert it without reaching through
 * a stubbed query chain.
 */
export function dueCheckFilter(nowIso: string): string {
  return `forecast_next_check_at.is.null,forecast_next_check_at.lte.${nowIso}`;
}

/** The zero state, pinned to the shared wording by a test in Task 2. */
export const NO_CALLS_YET = "Not enough resolved calls yet";

/**
 * The counting matches the insight calibrator; the sentence deliberately does
 * not.
 *
 * summarizeResolutions says "Supaprod called 2 of the last 3", which is right
 * for a claim the product generated and wrong for a forecast a person recorded.
 * Letting the product take credit for a person's judgment claims more than it
 * delivers. The zero state keeps the shared wording, because "Not enough
 * resolved calls yet" is also the honest form while nothing has resolved.
 */
export function summarizeForecastCalls(
  rows: Array<{ resolution: string | null }>,
): ForecastCallSummary {
  const resolved = rows.length;
  const hits = rows.filter((r) => r.resolution === "hit").length;
  return {
    resolved,
    hits,
    hitRate: resolved > 0 ? hits / resolved : null,
    label: resolved > 0 ? `You called ${hits} of the last ${resolved}` : NO_CALLS_YET,
  };
}

/**
 * PURE, AND HERE RATHER THAN BESIDE THE SERVER FUNCTIONS, BECAUSE THE PIN IS
 * THE ABSENCE OF A KEY.
 *
 * The thing that must never happen is a deferral writing a verdict. Asserting
 * an absence through a stubbed query chain is fragile; asserting it on the
 * patch object is exact. Keeping both builders in this import-free module also
 * means the auditor in Task 5 does not have to import a module full of
 * createServerFn definitions to reach one helper.
 */
export function buildDeferPatch(input: { days: number; priorCount: number; nowMs: number }): {
  forecast_next_check_at: string;
  forecast_deferred_at: string;
  forecast_deferred_count: number;
} {
  return {
    forecast_next_check_at: new Date(input.nowMs + input.days * 86_400_000).toISOString(),
    forecast_deferred_at: new Date(input.nowMs).toISOString(),
    forecast_deferred_count: input.priorCount + 1,
  };
}

export function buildSettlePatch(input: {
  resolution: ForecastResolution;
  rationale: string;
  nowIso: string;
  agentSlug: string | null;
}): {
  forecast_resolution: ForecastResolution;
  forecast_resolution_rationale: string;
  forecast_resolved_at: string;
  forecast_resolved_by_agent_slug: string | null;
} {
  return {
    forecast_resolution: input.resolution,
    forecast_resolution_rationale: input.rationale,
    forecast_resolved_at: input.nowIso,
    forecast_resolved_by_agent_slug: input.agentSlug,
  };
}
```

- [ ] **Step 4: Run the tests and the typecheck**

Run: `bun test src/lib/brain/forecast-resolution.test.ts && bunx tsc --noEmit`
Expected: all PASS, tsc silent.

- [ ] **Step 5: Prove the gate pin red then green**

Temporarily change `canAutoSettle` to `return input.confidence >= AUTO_SETTLE_CONFIDENCE_FLOOR;`, dropping the `linkedOutcomeSettled` check. Run the tests.
Expected: FAIL on "refuses when the linked spec outcome is not settled, however confident". Restore the line and confirm green. A pin that cannot fail is not a pin.

- [ ] **Step 6: Commit**

```bash
git add src/lib/brain/forecast-resolution.ts src/lib/brain/forecast-resolution.test.ts
git commit -F /tmp/msg-task2.txt
```

---

### Task 3: The forecast words

**Files:**
- Create: `src/components/learn/forecast-words.ts`
- Test: `src/components/learn/forecast-words.test.ts`

**Interfaces:**
- Produces: `FORECAST_SAYS: Record<ForecastResolution, string>`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { FORECAST_SAYS } from "./forecast-words";
import { VERDICT_SAYS } from "./verdict-words";

describe("forecast words stay apart from verdict words (FC-01)", () => {
  test("every resolution has a plain phrase", () => {
    expect(FORECAST_SAYS.hit).toBe("you called it");
    expect(FORECAST_SAYS.miss).toBe("it went the other way");
    expect(FORECAST_SAYS.inconclusive).toBe("the evidence did not settle it");
  });

  /**
   * The two vocabularies answer different questions and a single event can take
   * different values in each: forecast "this will not move activation", it does
   * not move, and the forecast is a hit while the spec outcome is missed. A
   * shared key set would invite a mapping function, and a mapping function
   * cannot express that, so it would silently pick a winner.
   */
  test("the key sets are disjoint, so no mapping can be written", () => {
    const forecastKeys = Object.keys(FORECAST_SAYS);
    const verdictKeys = Object.keys(VERDICT_SAYS);
    expect(forecastKeys.filter((k) => verdictKeys.includes(k))).toEqual([]);
  });

  test("no phrase claims the product made the call", () => {
    for (const phrase of Object.values(FORECAST_SAYS)) {
      expect(phrase).not.toContain("Supaprod");
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test src/components/learn/forecast-words.test.ts`
Expected: FAIL, cannot resolve `./forecast-words`.

- [ ] **Step 3: Implement**

```ts
import type { ForecastResolution } from "@/lib/brain/forecast-resolution";

/**
 * The product's three words for a forecast, in one place, for the same reason
 * verdict-words.ts exists: two surfaces must never call one thing two things.
 *
 * These are NOT the spec-outcome verdicts and must never be mapped onto them.
 * A spec outcome answers "did shipping this pay off" (validated, mixed,
 * missed). A forecast answers "was the belief correct" (hit, miss,
 * inconclusive). Those are orthogonal: a forecast can be a hit on a spec that
 * missed, and both readings are correct. mixed is a result; inconclusive is the
 * absence of one, and "too early" is neither, it is a check date.
 *
 * A .ts module and not an export from a component, because a component file
 * that also exports constants breaks Fast Refresh for every component in it.
 */
export const FORECAST_SAYS: Record<ForecastResolution, string> = {
  hit: "you called it",
  miss: "it went the other way",
  inconclusive: "the evidence did not settle it",
};
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test src/components/learn/forecast-words.test.ts && bunx tsc --noEmit`
Expected: PASS, tsc silent.

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/forecast-words.ts src/components/learn/forecast-words.test.ts
git commit -F /tmp/msg-task3.txt
```

---

### Task 4: The server functions

**Files:**
- Create: `src/lib/forecast.functions.ts`
- Test: `src/lib/forecast.functions.test.ts`

`decisions.functions.ts` is 636 lines and owns capture. Resolution is a separate responsibility with its own consumers, so it gets its own module.

**Interfaces:**
- Consumes: `isForecastDue`, `summarizeForecastCalls`, `buildDeferPatch`, `buildSettlePatch` from Task 2; `requireSupabaseAuth` middleware and the `createServerFn` pattern from `src/lib/outcome.functions.ts`.
- Produces: `listDueForecasts` returning `{ due: DueForecast[] }` where `DueForecast = { id: string; title: string; claim: string; howWeWillKnow: string; horizonDate: string; daysLate: number; deferredCount: number; suggestion: { verdict: ForecastResolution; rationale: string; confidence: number } | null }`; `settleForecast({ decisionId, resolution, rationale })`; `deferForecastCheck({ decisionId, days })` returning `{ checkBy: string; deferredCount: number }`; `listAgentSettledForecasts` returning `{ settled: AgentSettledForecast[] }`; `getForecastCallRate` returning `ForecastCallSummary`.

- [ ] **Step 1: Write the failing test for the NULL-safe filter**

The patch-builder pins moved into Task 2 with the builders. What is left to pin here is the other documented trap: a bare comparison on a nullable column. Extract the filter string into a pure exported helper so it can be asserted without a database, which is also how the query and the test stay in step.

```ts
import { describe, expect, test } from "bun:test";
import { FORECAST_COLS } from "./forecast.functions";
import { dueCheckFilter } from "./brain/forecast-resolution";

const NOW = "2026-08-12T12:00:00.000Z";

describe("the due filter never drops NULLs (FC-01)", () => {
  /**
   * forecast_next_check_at is NULL for every forecast nobody deferred, which is
   * the overwhelming majority. A bare .lte() drops NULLs in SQL, which would
   * narrow the desk to previously-deferred forecasts only and still look like it
   * works. The same mistake shipped twice on the spec queue; see the two
   * comments inside listPendingOutcomes.
   */
  test("admits both an unset check date and one that has come due", () => {
    expect(dueCheckFilter(NOW)).toBe(
      `forecast_next_check_at.is.null,forecast_next_check_at.lte.${NOW}`,
    );
  });

  test("the null branch comes first and is never omitted", () => {
    expect(dueCheckFilter(NOW).startsWith("forecast_next_check_at.is.null")).toBe(true);
  });
});

describe("the selected columns carry what the desk renders (FC-01)", () => {
  test("every field the surface reads is requested", () => {
    for (const col of [
      "forecast_claim",
      "forecast_how_we_will_know",
      "forecast_horizon_date",
      "forecast_next_check_at",
      "forecast_deferred_count",
      "forecast_resolution_suggestion",
    ]) {
      expect(FORECAST_COLS).toContain(col);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test src/lib/forecast.functions.test.ts`
Expected: FAIL, cannot resolve module.

- [ ] **Step 3: Implement the server functions**

The patch builders and both predicates come from the import-free module in Task 2. This file is the thin layer that applies them.

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "./auth.middleware";
import {
  isForecastDue,
  summarizeForecastCalls,
  buildDeferPatch,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
  type ForecastCallSummary,
} from "./brain/forecast-resolution";

export const FORECAST_COLS =
  "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
  "forecast_resolution,forecast_next_check_at,forecast_deferred_count," +
  "forecast_resolution_suggestion,workspace_id";

export const listDueForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const nowIso = new Date().toISOString();

    /**
     * `.or` and never a bare `.lte` on forecast_next_check_at. NULL is the
     * overwhelming majority, every forecast never deferred, and a bare
     * comparison drops NULLs in SQL. That would empty the desk of everything
     * except previously-deferred forecasts, which is the loudest way to get
     * this wrong and still look like it works. The same mistake shipped twice
     * on the spec queue; see listPendingOutcomes.
     *
     * No workspace filter, deliberately: RLS admits every workspace the caller
     * belongs to, so the desk is "every call anywhere that needs settling",
     * matching listPendingOutcomes beside it.
     */
    const { data, error } = await db
      .from("decisions")
      .select(FORECAST_COLS)
      .not("forecast_claim", "is", null)
      .is("forecast_resolution", null)
      .lte("forecast_horizon_date", nowIso)
      .or(dueCheckFilter(nowIso))
      .order("forecast_horizon_date", { ascending: true })
      .limit(12);
    if (error) throw new Error(error.message);

    const nowMs = Date.parse(nowIso);
    const due = (data ?? [])
      // The SQL and the predicate agree by construction, but the predicate is
      // the authority: one rule, one place.
      .filter((r) => isForecastDue(r as never, nowIso))
      .map((r) => {
        const row = r as Record<string, unknown>;
        const horizon = String(row.forecast_horizon_date);
        const s = row.forecast_resolution_suggestion as
          | { verdict?: string; rationale?: string; confidence?: number }
          | null;
        return {
          id: String(row.id),
          title: String(row.title ?? ""),
          claim: String(row.forecast_claim ?? ""),
          howWeWillKnow: String(row.forecast_how_we_will_know ?? ""),
          horizonDate: horizon,
          daysLate: Math.floor((nowMs - Date.parse(horizon)) / 86_400_000),
          deferredCount: Number(row.forecast_deferred_count ?? 0),
          suggestion:
            s && s.verdict
              ? {
                  verdict: s.verdict as ForecastResolution,
                  rationale: String(s.rationale ?? ""),
                  confidence: Number(s.confidence ?? 0),
                }
              : null,
        };
      });
    return { due };
  });

export const settleForecast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        resolution: z.enum(["hit", "miss", "inconclusive"]),
        rationale: z.string().min(1).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const db = context.supabase as unknown as SupabaseClient;
    const patch = buildSettlePatch({
      resolution: data.resolution,
      rationale: data.rationale,
      nowIso: new Date().toISOString(),
      agentSlug: null,
    });
    /**
     * CHECKED, BECAUSE supabase-js RESOLVES A REFUSED WRITE. An RLS refusal
     * comes back as success with zero rows, so without `.select()` and an empty
     * check this would report a settled forecast that is still sitting on the
     * desk. This is the exact shape whose absence made an earlier pin's test
     * unreachable, so the stub in the test file mocks `.select()` too.
     */
    const { data: rows, error } = await db
      .from("decisions")
      .update(patch)
      .eq("id", data.decisionId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("The verdict did not land. You may not have rights on this decision.");
    }
    return { ok: true as const };
  });

export const deferForecastCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        decisionId: z.string().uuid(),
        days: z.number().int().min(1).max(365).default(14),
      })
      .parse(d),
  )
  .handler(async ({ context, data }): Promise<{ checkBy: string; deferredCount: number }> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data: before } = await db
      .from("decisions")
      .select("forecast_deferred_count")
      .eq("id", data.decisionId)
      .maybeSingle();
    const priorCount =
      ((before as { forecast_deferred_count?: number | null } | null)?.forecast_deferred_count ??
        0) as number;
    const patch = buildDeferPatch({ days: data.days, priorCount, nowMs: Date.now() });
    const { data: rows, error } = await db
      .from("decisions")
      .update(patch)
      .eq("id", data.decisionId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) {
      throw new Error("The check date did not move. You may not have rights on this decision.");
    }
    return { checkBy: patch.forecast_next_check_at, deferredCount: patch.forecast_deferred_count };
  });

export const listAgentSettledForecasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase as unknown as SupabaseClient;
    /**
     * The oversight half of the gate, mirroring listAgentSettledOutcomes. An
     * agent verdict is only reversible if somebody can see it, so the slug
     * column that makes the set filterable gets a surface here.
     */
    const { data, error } = await db
      .from("decisions")
      .select(
        "id,title,forecast_claim,forecast_resolution,forecast_resolution_rationale," +
          "forecast_resolved_at,forecast_resolved_by_agent_slug",
      )
      .not("forecast_resolved_by_agent_slug", "is", null)
      .order("forecast_resolved_at", { ascending: false })
      .limit(8);
    if (error) throw new Error(error.message);
    return { settled: data ?? [] };
  });

export const getForecastCallRate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ForecastCallSummary> => {
    const db = context.supabase as unknown as SupabaseClient;
    const { data } = await db
      .from("decisions")
      .select("forecast_resolution")
      .not("forecast_resolution", "is", null)
      .neq("forecast_resolution", "inconclusive")
      .order("forecast_resolved_at", { ascending: false })
      .limit(10);
    return summarizeForecastCalls(
      ((data ?? []) as Array<{ forecast_resolution: string | null }>).map((r) => ({
        resolution: r.forecast_resolution,
      })),
    );
  });
```

- [ ] **Step 4: Run tests and typecheck**

Run: `bun test src/lib/forecast.functions.test.ts && bunx tsc --noEmit`
Expected: PASS, tsc silent.

- [ ] **Step 5: Prove the NULL-safe filter pin red then green**

Change `dueCheckFilter` in `src/lib/brain/forecast-resolution.ts` to return only `forecast_next_check_at.lte.${nowIso}`, dropping the null branch. Run the tests.
Expected: FAIL on both tests in "the due filter never drops NULLs". Restore it and confirm green. This is the trap that empties the desk while looking like it works, so it must be shown to be able to fail.

The deferral pin itself was proven in Task 2, where the builders live.

- [ ] **Step 6: Confirm the middleware import path**

Run: `grep -rn "requireSupabaseAuth" src/lib/outcome.functions.ts | head -2`
Expected: the import path used there. Match it exactly rather than guessing; correct the import in `forecast.functions.ts` if it differs.

- [ ] **Step 7: Commit**

```bash
git add src/lib/forecast.functions.ts src/lib/forecast.functions.test.ts
git commit -F /tmp/msg-task4.txt
```

---

### Task 5: The drafting pass and the gate

**Files:**
- Create: `src/lib/brain/forecast-audit.server.ts`
- Test: `src/lib/brain/forecast-audit.test.ts`
- Modify: `src/routes/api/public/hooks/calibrate-tick.ts`

**Interfaces:**
- Consumes: `canAutoSettle`, `isForecastDue` from Task 2; `buildSettlePatch` from Task 4; `callModel` from `src/lib/ai/runtime.server`.
- Produces: `auditDueForecasts(supabase, userId, workspaceId): Promise<{ drafted: number; autoSettled: number }>`; `linkedOutcomeIsSettled(supabase, decision): Promise<boolean>`.

- [ ] **Step 1: Write the failing test with a stub that matches the real chain**

```ts
import { describe, expect, test } from "bun:test";
import { forecastAuditPrompt, parseAuditReply } from "./forecast-audit.server";

describe("parseAuditReply (FC-01)", () => {
  test("keeps a well formed verdict and its confidence", () => {
    const r = parseAuditReply({ outcome: "hit", rationale: "Activation cleared 22 percent.", confidence: 0.82 });
    expect(r.verdict).toBe("hit");
    expect(r.confidence).toBeCloseTo(0.82, 5);
  });

  test("an unrecognised verdict falls back to inconclusive with zero confidence", () => {
    const r = parseAuditReply({ outcome: "probably", rationale: "", confidence: 0.9 });
    expect(r.verdict).toBe("inconclusive");
    expect(r.confidence).toBe(0);
  });

  test("a missing confidence cannot clear the auto-settle floor", () => {
    const r = parseAuditReply({ outcome: "hit", rationale: "x" });
    expect(r.confidence).toBe(0);
  });
});

describe("forecastAuditPrompt (FC-01)", () => {
  test("puts the stated observable in front of the judge", () => {
    const p = forecastAuditPrompt({
      claim: "Activation clears 20 percent in week one",
      howWeWillKnow: "The activation panel for the cohort",
      horizonDate: "2026-08-10T00:00:00.000Z",
      evidence: "The linked spec outcome was settled validated on 2026-08-11.",
    });
    expect(p).toContain("The activation panel for the cohort");
    expect(p).toContain("Activation clears 20 percent in week one");
  });

  test("never invites a guess", () => {
    const p = forecastAuditPrompt({
      claim: "c", howWeWillKnow: "o", horizonDate: "2026-08-10T00:00:00.000Z", evidence: "",
    });
    expect(p.toLowerCase()).toContain("inconclusive");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test src/lib/brain/forecast-audit.test.ts`
Expected: FAIL, cannot resolve module.

- [ ] **Step 3: Implement the auditor**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { callModel } from "@/lib/ai/runtime.server";
import {
  canAutoSettle,
  buildSettlePatch,
  dueCheckFilter,
  type ForecastResolution,
} from "./forecast-resolution";

// FC-01, the grading half. This drafts a verdict for every due forecast and
// promotes only the gated subset. It never decides a forecast the gate refuses.

const MODEL = "google/gemini-2.5-flash" as const;
const AUDIT_BATCH = 10;
export const AUDITOR_SLUG = "forecast-auditor" as const;

const AUDIT_SYSTEM = `You judge whether a forecast came true. You are given what a team expected, the observable they chose to settle it, and what is known now.
Rules:
- Signal first: the verdict, then the one fact that decided it.
- Rationale max 2 sentences.
- Judge against the stated observable only. If it does not settle the claim, answer inconclusive rather than guessing.
- Report your own confidence as a number from 0 to 1.
- No em dashes, no en dashes, no AI cliches.
- Output ONLY valid JSON matching the requested schema.`;

/** Pure, so the prompt's guarantees are testable without a model call. */
export function forecastAuditPrompt(input: {
  claim: string;
  howWeWillKnow: string;
  horizonDate: string;
  evidence: string;
}): string {
  return `THE TEAM EXPECTED: ${input.claim}
HOW THEY SAID THEY WOULD KNOW: ${input.howWeWillKnow}
THE HORIZON WAS: ${input.horizonDate}

WHAT IS KNOWN NOW: ${input.evidence || "No linked outcome has been settled."}

Did the forecast come true, judged only against the stated observable? Output JSON:
{"outcome":"hit|miss|inconclusive","rationale":"...","confidence":0.0}`;
}

/** Pure. An unparseable or unrecognised reply must not be able to auto-settle. */
export function parseAuditReply(j: {
  outcome?: string;
  rationale?: string;
  confidence?: number;
}): { verdict: ForecastResolution; rationale: string; confidence: number } {
  const ok = j.outcome === "hit" || j.outcome === "miss" || j.outcome === "inconclusive";
  const verdict: ForecastResolution = ok ? (j.outcome as ForecastResolution) : "inconclusive";
  const raw = typeof j.confidence === "number" && Number.isFinite(j.confidence) ? j.confidence : 0;
  return {
    verdict,
    rationale: j.rationale ?? "",
    // A verdict we had to correct carries no confidence, so it can never clear
    // the floor and settle itself.
    confidence: ok ? Math.min(1, Math.max(0, raw)) : 0,
  };
}

type DueRow = {
  id: string;
  title: string | null;
  forecast_claim: string | null;
  forecast_how_we_will_know: string | null;
  forecast_horizon_date: string | null;
  forecast_resolution: string | null;
  forecast_next_check_at: string | null;
  prd_id: string | null;
};

/**
 * The first half of the gate, and the reason it is safe: prds.outcome is
 * written by the human settle path alone, since agent drafts live in
 * prds.outcome_suggestion. A true here means a person already judged the thing
 * this forecast was about.
 */
export async function linkedOutcomeIsSettled(
  supabase: SupabaseClient,
  prdId: string | null,
): Promise<{ settled: boolean; evidence: string }> {
  if (!prdId) return { settled: false, evidence: "" };
  const { data } = await supabase
    .from("prds")
    .select("outcome,title")
    .eq("id", prdId)
    .maybeSingle();
  const row = data as { outcome: unknown; title: string | null } | null;
  if (!row || row.outcome == null) return { settled: false, evidence: "" };
  return {
    settled: true,
    evidence: `The linked spec "${row.title ?? ""}" has a settled outcome: ${JSON.stringify(row.outcome)}`,
  };
}

export async function auditDueForecasts(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<{ drafted: number; autoSettled: number }> {
  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from("decisions")
    .select(
      "id,title,forecast_claim,forecast_how_we_will_know,forecast_horizon_date," +
        "forecast_resolution,forecast_next_check_at,prd_id",
    )
    .eq("workspace_id", workspaceId)
    .not("forecast_claim", "is", null)
    .is("forecast_resolution", null)
    .lte("forecast_horizon_date", nowIso)
    // The same NULL-safe clause as the desk, from one place, so the tick and the
    // surface can never disagree about what is due.
    .or(dueCheckFilter(nowIso))
    .limit(AUDIT_BATCH);

  let drafted = 0;
  let autoSettled = 0;

  for (const raw of (due ?? []) as DueRow[]) {
    const link = await linkedOutcomeIsSettled(supabase, raw.prd_id);
    const res = await callModel(supabase as never, userId, {
      surface: "decide",
      surface_ref: "audit_forecast",
      model: MODEL,
      workspaceId,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: AUDIT_SYSTEM },
        {
          role: "user",
          content: forecastAuditPrompt({
            claim: raw.forecast_claim ?? "",
            howWeWillKnow: raw.forecast_how_we_will_know ?? "",
            horizonDate: raw.forecast_horizon_date ?? "",
            evidence: link.evidence,
          }),
        },
      ],
    });
    const parsed = parseAuditReply((res.json ?? {}) as never);

    // The draft always lands. It is enrichment, and a person settling this
    // forecast by hand should be able to read what the agent thought.
    const patch: Record<string, unknown> = {
      forecast_resolution_suggestion: {
        verdict: parsed.verdict,
        rationale: parsed.rationale,
        confidence: parsed.confidence,
        drafted_at: nowIso,
        model: MODEL,
      },
    };

    if (canAutoSettle({ linkedOutcomeSettled: link.settled, confidence: parsed.confidence })) {
      Object.assign(
        patch,
        buildSettlePatch({
          resolution: parsed.verdict,
          rationale: parsed.rationale,
          nowIso,
          agentSlug: AUDITOR_SLUG,
        }),
      );
      autoSettled++;
    }

    await supabase.from("decisions").update(patch).eq("id", raw.id).select("id");
    drafted++;
  }

  return { drafted, autoSettled };
}
```

- [ ] **Step 4: Wire it into the existing tick**

Modify `src/routes/api/public/hooks/calibrate-tick.ts`. Inside the existing `for (const ws of workspaces ?? [])` loop, after the `calibrateExpiredInsights` call, add:

```ts
              const f = await auditDueForecasts(supabaseAdmin, ws.owner_id, ws.id);
              totalForecastsDrafted += f.drafted;
              totalForecastsAutoSettled += f.autoSettled;
```

Add the import, declare the two counters beside `totalScored`, and extend the response body to `{ ok: true, processed, scored: totalScored, forecastsDrafted: totalForecastsDrafted, forecastsAutoSettled: totalForecastsAutoSettled }`. The existing `try/catch` per workspace already contains a forecast failure to that workspace, and `withJobRun` already wraps the whole pass.

No new scheduled job: this rides the tick that already exists.

- [ ] **Step 5: Run tests, typecheck, build**

Run: `bun test && bunx tsc --noEmit`
Expected: full suite PASS (8,732 was the count before this work, so expect that plus the new tests), tsc silent.

- [ ] **Step 6: Commit**

```bash
git add src/lib/brain/forecast-audit.server.ts src/lib/brain/forecast-audit.test.ts src/routes/api/public/hooks/calibrate-tick.ts
git commit -F /tmp/msg-task5.txt
```

---

### Task 6: The Learn desk surface

**Files:**
- Create: `src/components/learn/ForecastDeskPanel.tsx`
- Modify: `src/routes/_authenticated.learn.tsx`
- Test: `src/components/learn/forecast-desk.test.ts`

**Interfaces:**
- Consumes: `listDueForecasts`, `settleForecast`, `deferForecastCheck`, `getForecastCallRate`, `listAgentSettledForecasts` from Task 4; `FORECAST_SAYS` from Task 3.
- Produces: `<ForecastDeskPanel />`, rendered on `/learn` above the existing `<SettlePanel />`.

**Design rule (founder, 2026-06-20):** any front-end build actively invokes the design skills and obeys the Ember system and `docs/conventions/design-context.md`. Reuse `.bento`, `.mono-label` and the verdict-chip patterns. Invent no colors.

- [ ] **Step 1: Write the failing test for the group labelling pin**

```ts
import { describe, expect, test } from "bun:test";
import { forecastGroupLabel, lateness } from "./ForecastDeskPanel";

describe("the two desk groups never read as synonyms (FC-01)", () => {
  test("the forecast group names the question it answers", () => {
    expect(forecastGroupLabel(2)).toBe("Forecasts due (2)");
    expect(forecastGroupLabel(2)).not.toContain("Outcome");
    expect(forecastGroupLabel(2)).not.toContain("Bet");
  });

  test("lateness reads off the frozen horizon", () => {
    expect(lateness(0)).toBe("due today");
    expect(lateness(1)).toBe("due 1 day ago");
    expect(lateness(3)).toBe("due 3 days ago");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bun test src/components/learn/forecast-desk.test.ts`
Expected: FAIL, cannot resolve module.

- [ ] **Step 3: Implement the panel**

Export the two pure helpers so the test above can reach them without rendering.

```tsx
export function forecastGroupLabel(n: number): string {
  return `Forecasts due (${n})`;
}

export function lateness(daysLate: number): string {
  if (daysLate <= 0) return "due today";
  return `due ${daysLate} day${daysLate === 1 ? "" : "s"} ago`;
}
```

The component itself:
- reads `listDueForecasts` under query key `["forecast-due"]` and `getForecastCallRate` under `["forecast-rate"]`, matching the `["outcome-pending"]` convention beside it;
- renders nothing at all when `due.length === 0` and the rate has `resolved === 0`, so an account with no forecasts sees no empty scaffolding;
- per due forecast shows the claim, the observable under a `.mono-label`, `lateness(daysLate)`, and `deferredCount` when above zero, because a forecast deferred four times is signal;
- shows the drafted verdict when present as `FORECAST_SAYS[suggestion.verdict]` plus its rationale, labelled as a draft and never as a verdict;
- offers four controls: three settle buttons keyed `hit`, `miss`, `inconclusive`, and one "Too early to tell" calling `deferForecastCheck` with `days: 14`;
- requires a rationale before a settle button enables, since `settleForecast` refuses an empty one;
- invalidates `["forecast-due"]`, `["forecast-rate"]` and `["forecast-agent-settled"]` after any write, by prefix, matching how `SettlePanel` invalidates;
- renders the rate as the `label` from `getForecastCallRate`, which is "Not enough resolved calls yet" until something resolves;
- **renders the agent-settled group from `listAgentSettledForecasts` under query key `["forecast-agent-settled"]`**, mirroring how the desk already surfaces `listAgentSettledOutcomes`. Each row shows the claim, `FORECAST_SAYS[resolution]`, the rationale, and a control to settle it again by hand. This is not optional polish: the gate's whole safety argument is that an agent verdict is identifiable and therefore reversible, and it is only reversible if somebody can see it. A slug column with no surface would be another index with no reader.

- [ ] **Step 4: Mount it on the desk**

In `src/routes/_authenticated.learn.tsx`, add the import and render `<ForecastDeskPanel />` immediately above the existing `<SettlePanel onDeskWorkspace={rememberDeskWorkspace} />` at line 487, so a due forecast is seen before a due spec outcome. Add nothing to `SettlePanel` itself.

- [ ] **Step 5: Verify in the running app**

Run: `bun run dev`
Check `/learn` renders, the panel is absent with no due forecasts, and the console is clean. Take a screenshot into `docs/screenshots/` only, which is gitignored, and never leave one at the repo root.

- [ ] **Step 6: Run everything**

Run: `bun test && bunx tsc --noEmit && bun run lint && bun run build`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/components/learn/ForecastDeskPanel.tsx src/components/learn/forecast-desk.test.ts src/routes/_authenticated.learn.tsx
git commit -F /tmp/msg-task6.txt
```

---

### Task 7: Close the loop in the record

**Files:**
- Modify: `docs/planning/SOURCE-OF-TRUTH.md`
- Modify: `docs/planning/initiatives/forecast-resolution-plan.md`

- [ ] **Step 1: Flip the board row**

Row 1 (FC-01) currently reads `resolution path still missing, so forecasts accrue and nothing grades them`. Replace that clause with what is now true, and per the board's own rule move the row to `archive/shipped-register.md` in the same commit that turns it green.

- [ ] **Step 2: State the claim honestly**

The permitted form is "the loop is wired and proven, and it begins accruing on first real use". Do not write that a forecast record exists or that calibration is accumulating: at ship time no forecast has resolved. Never claim accumulated learning in the present tense.

- [ ] **Step 3: Name what still needs a person**

Applying the Task 1 migration goes through the Lovable MCP. Add it to the "Needs the founder" table if it has not been applied by then, and note that pushing to main does not deploy: the app change is inert until publish is clicked in Lovable.

- [ ] **Step 4: Run the doc gate without hiding its exit code**

Run: `bun run docs:check`
Expected: `clean of hard rot`. Never pipe this into `tail` inside an `&&` chain: the pipe reports tail's status and a failing gate ships.

- [ ] **Step 5: Commit**

```bash
git add docs/planning/SOURCE-OF-TRUTH.md docs/planning/initiatives/forecast-resolution-plan.md docs/planning/archive/shipped-register.md
git commit -F /tmp/msg-task7.txt
```

---

## Acceptance

- A decision whose horizon has passed appears on `/learn` within one page load, with or without a drafted verdict.
- Settling writes `forecast_resolution`, `forecast_resolution_rationale`, `forecast_resolved_at`, and leaves `forecast_resolved_by_agent_slug` NULL.
- "Too early to tell" moves `forecast_next_check_at`, increments `forecast_deferred_count`, and leaves `forecast_resolution` NULL. Proven red then green.
- A forecast whose linked spec outcome is unsettled is never auto-settled, whatever the drafted confidence. Proven red then green.
- With `auto_derive_enabled` false the forecast still appears on the desk, carrying no suggestion.
- Every agent-settled forecast is retrievable by one filter on `forecast_resolved_by_agent_slug`.
- `FORECAST_SAYS` and `VERDICT_SAYS` share no key, and no mapping function exists between them.
- The rate reads "You called N of the last M", never "Supaprod called".
- `bunx tsc --noEmit` silent, `bun test` 0 fail, `bun run lint` clean, `bun run build` green, `bun run docs:check` clean of hard rot.

## How to verify the parts no test can reach

- **The migration applied.** Read back the six columns and the index through the Lovable MCP. A number without its query is not evidence, so record the SQL beside the result.
- **The auto-settle gate against real rows.** Until a decision exists that carries both a forecast and a `prd_id` whose outcome a person settled, the auto leg has never run. Do not report it as working on the strength of its unit tests; report it as wired and unexercised, which is the same distinction the `applyOutcome` probe drew on 2026-08-06.
- **Deployment.** Pushing to main does not deploy. The desk is not live until publish is clicked in Lovable, and `/learn` served from production is the only proof.
