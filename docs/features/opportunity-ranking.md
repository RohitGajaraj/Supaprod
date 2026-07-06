# DEC-RANK — Deterministic opportunity ranking + best bet

> _Created: 2026-07-07 · Last updated: 2026-07-07_

> Status · Shipped 2026-07-07 · Decide (the opportunity queue + detail sheet, `/discover`) · Strategist (ranking) with the Critic's verdict as an input

## What it does

Turns the opportunity queue into a single, stable total order and names one clear top priority. Every bet gets a 1-based rank shown on its card, and the #1 bet is designated the "best bet" with a short rationale and a recommended next action. Two bets with the same ICE score are never left to chance: a fixed tie-break chain decides, ending in an absolute finalizer (the id) so the order is identical on every run, for a human and for an agent acting on the queue.

## Why it exists

An agent that acts on the queue needs a deterministic total order and one unambiguous top pick, not a coin-flip when scores tie. Sorting by `ice_score` alone (the previous behavior) left equal-score bets in an engine-dependent, unstable order, so "what is the single most important thing to do next" had no reliable answer. DEC-RANK makes the decision layer's ordering a real, testable contract: the same inputs always produce the same ranks and the same best bet. Build-log entry: [`../../plan.md`](../../plan.md) §4.

## Where to find it

The opportunity queue on Discover (`/discover`). Each `OpportunityRow` shows a quiet mono `#{rank}` next to its ICE anchor; the top card carries a refined "Best bet" tag. Opening a bet's detail sheet shows a "Ranking" block with its queue position, the rationale, and the recommended next action.

## Demo script

1. Open `/discover`. The queue is ordered by the deterministic ranking, strongest bet first.
2. Note the small `#1`, `#2`, `#3` mono index next to each ICE numeral: the ordering position, distinct from the colored ICE score.
3. The top card shows a "Best bet" tag. Only the single #1 bet gets it.
4. Open the top bet. The detail sheet's "Ranking" block reads, for example, "Ranked #1: top ICE score, Critic endorsed, backed by 7 signals" and a recommended next action such as "Draft the spec".
5. If two bets share an ICE score, they still hold a fixed order (Critic verdict, then corroboration, then confidence, then impact, then oldest first, then id): reload and the order does not change.

## How it works

- `src/components/discover/ranking.ts` (pure, no React):
  - `verdictRankOf(verdict)` maps the `verdictFor` words to a strength number: `SHIP` (4) > `WATCH` (3) > `PENDING` (2) > `REVISE` (1) > `KILL` (0). SHIP is the endorsed/strong case, PENDING is the not-yet-reviewed middle, REVISE and KILL are the weak/reject floor (REVISE above KILL so a fixable bet outranks a dead one).
  - `compareOpportunities(a, b, corroborationOf)` is the deterministic comparator implementing the tie-break chain, in strict order: **ice_score desc, then verdict rank desc, then corroboration desc, then confidence desc, then impact desc, then created_at asc (older first), then id asc**. The id step is an absolute stable finalizer, so the order is never random.
  - `rankOpportunities(opps, corroborationOf)` returns `{ opp, rank (1-based), isBestBet (rank === 1), rationale, nextAction }[]`, contiguous 1..N, with exactly one `isBestBet` for any non-empty list. It does not mutate the input.
- `corroborationOf(opp)` is the backing signal count. In the queue it reads the promoting theme's `frequency` (`themeById.get(opp.theme_id)?.frequency ?? 0`).
- The rationale is built only from the clauses that are true or nonzero for that bet (top ICE / a Critic verdict / a signal count), so it never claims a fact it does not have.
- The recommended next action is derived from state: verdict `PENDING` -> "Challenge with the Critic first"; status `shipped` -> "Review the outcome"; otherwise "Draft the spec".
- `src/components/discover/OpportunityQueue.tsx` replaces the old `ice_score` sort with `rankOpportunities(rows, ...)` and renders the ranked list (respecting the existing show-more slice), threading `rank` + `isBestBet` into each `OpportunityRow` and `rank` + `rationale` + `nextAction` into the open `OpportunityDetailSheet`.
- `src/components/discover/OpportunityRow.tsx` shows the `#{rank}` mono index (quiet `--text-muted`, distinct from the tier-colored ICE numeral) and, for the best bet only, one small rounded `--amber` "Best bet" tag on a hairline chip.

## Governance & guardrails

- Pure, deterministic, side-effect-free ranking: no model call, no write, no external dependency. The order is a function of the row data only.
- It is a display and ordering layer over existing `opportunities` rows read under standard RLS (the caller's own workspace); it introduces no new data, table, or column.
- Semantic tokens only; ember stays reserved for the Capture CTA. The best-bet tag uses `--amber` on a hairline chip, not ember.

## Verification checklist

- [x] `npx tsc --noEmit` clean.
- [x] `bun run build` succeeds.
- [x] `bun test src/components/discover/ranking.test.ts` passes (tie-break fall-through, exactly one best bet, contiguous 1..N ranks, run-twice determinism, stable across input permutations).
- [x] The full suite stays green except the 3 pre-existing `resolveEmbedRoute` failures.
- [ ] On `/discover`, each card shows `#{rank}` and only the top card shows "Best bet" (live-verify on next publish).

## Known limits / out of scope

- The detail-sheet "Ranking" block is intentionally restrained; the full visual treatment of the rationale and next action is deferred to a later design pass.
- Corroboration is the promoting theme's signal frequency; bets promoted directly (no `theme_id`) contribute 0 corroboration and rely on the rest of the chain.
- The tie-break weights are fixed by design (not user-configurable), which is what makes the order a stable contract.

## Related

- [`../../plan.md`](../../plan.md) §4, build log entry
- `src/components/discover/ranking.ts` and `ranking.test.ts`, the implementation and its lock tests
- [`critic-agent.md`](./critic-agent.md), the Critic verdict that feeds the second tie-break key
- [`f3-continuous-discovery.md`](./f3-continuous-discovery.md), the signal themes whose frequency is the corroboration input
- [`o1-provenance.md`](./o1-provenance.md), the lineage behind a ranked bet
