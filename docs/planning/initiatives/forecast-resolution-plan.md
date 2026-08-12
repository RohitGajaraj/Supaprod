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

1. **No confidence, therefore no Brier score.** `insights` carries `confidence` and `brier_score`; `decisions` carries `forecast_how_we_will_know` in that slot and captures no confidence at all. `computeBrierScore` defaults a missing confidence to 0.5, so every decision forecast would score a constant 0.25 and measure nothing. The honest metric is a plain hit rate over resolved, non-inconclusive forecasts, which `summarizeResolutions` already computes and which this design reuses directly.

2. **The sibling conflates "inconclusive" with "too early".** `judgeOutcome` returns `inconclusive` whenever evidence does not clearly confirm or deny, and `calibrateExpiredInsights` then writes `resolution: 'inconclusive'` with `status: 'expired'`, permanently. Migration `20260806100000_a_bet_can_be_too_early_to_judge.sql` already ruled against exactly this for specs: a future check date is how the product says too early to tell "WITHOUT writing a verdict, because a deferral is the absence of an outcome rather than a kind of one." Porting the sibling's behaviour would stamp a permanent verdict on forecasts that were merely looked at too soon, and `inconclusive` is reserved for the case where the evidence arrived and genuinely did not settle the claim.

What is reused: `summarizeResolutions` and `shouldThrottle`'s shape, the judge prompt's rules (signal first, short rationale, say inconclusive rather than guessing), the tick's authentication and `withJobRun` wrapper, and the `hit / miss / inconclusive` vocabulary that the database constraint already enforces.

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
