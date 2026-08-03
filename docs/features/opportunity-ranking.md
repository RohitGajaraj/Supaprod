# DEC-RANK — Deterministic opportunity ranking + best bet

> _Created: 2026-07-07 · Last updated: 2026-07-07_

> Status · Shipped 2026-07-07 · Decide (the opportunity queue + detail sheet, `/discover`) · Strategist (ranking) with the Critic's verdict as an input

## What it does

Turns the opportunity queue into a single, stable total order and names one clear top priority. Every bet gets a 1-based rank shown on its card, and the #1 bet is designated the "best bet" with a short rationale and a recommended next action. Two bets with the same ICE score are never left to chance: a fixed tie-break chain decides, ending in an absolute finalizer (the id) so the order is identical on every run, for a human and for an agent acting on the queue.

Beyond the #1 best bet, every ranked bet also carries a system-derived **designation** drawn from a self-explanatory PM vocabulary, so a human or an agent reads what each bet IS (not just its number) and knows which to pick: "best bet", "needs validation", "quick win", "heavy lift", "watch this week", or none. The best bet is the single loud pencil wink on the screen; the other designations are quiet tags in their own ink.

## Why it exists

An agent that acts on the queue needs a deterministic total order and one unambiguous top pick, not a coin-flip when scores tie. Sorting by `ice_score` alone (the previous behavior) left equal-score bets in an engine-dependent, unstable order, so "what is the single most important thing to do next" had no reliable answer. DEC-RANK makes the decision layer's ordering a real, testable contract: the same inputs always produce the same ranks and the same best bet. Build-log entry: [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4.

## Where to find it

The opportunity queue on Discover (`/discover`). Each `OpportunityRow` shows a plain-language `#{rank}` spotlight badge next to its ICE anchor (a filled glacier pill at #1, a lighter glacier tint at #2 to #3, a quiet outline deeper down); the single #1 bet carries the one lime pencil "best bet" wink, and any other bet that earns a designation carries a quiet designation tag in its own pencil ink. Opening a bet's detail sheet shows a calm glacier priority band with its queue position, the designation and its one-line meaning, the rationale, and the recommended next action, above a compact single-row ICE stat strip.

## Demo script

1. Open `/discover`. The queue is ordered by the deterministic ranking, strongest bet first.
2. Note the `#1`, `#2`, `#3` spotlight badge next to each ICE numeral: a filled glacier pill at #1, a lighter tint at #2 to #3, then a quiet outline, so priority reads in plain language, distinct from the colored ICE score.
3. The top card shows the single lime "best bet" pencil wink. Only the #1 bet gets the pencil; other bets that qualify show a quiet designation tag ("needs validation", "quick win", "heavy lift", or "watch this week") in their own ink.
4. Open the top bet. The detail sheet's "Ranking" block reads, for example, "Ranked #1: top ICE score, Critic endorsed, backed by 7 signals" and a recommended next action such as "Draft the spec".
5. If two bets share an ICE score, they still hold a fixed order (Critic verdict, then corroboration, then confidence, then impact, then oldest first, then id): reload and the order does not change.

## How it works

- `src/components/discover/ranking.ts` (pure, no React):
  - `verdictRankOf(verdict)` maps the `verdictFor` words to a strength number: `SHIP` (4) > `WATCH` (3) > `PENDING` (2) > `REVISE` (1) > `KILL` (0). SHIP is the endorsed/strong case, PENDING is the not-yet-reviewed middle, REVISE and KILL are the weak/reject floor (REVISE above KILL so a fixable bet outranks a dead one).
  - `compareOpportunities(a, b, corroborationOf)` is the deterministic comparator implementing the tie-break chain, in strict order: **ice_score desc, then verdict rank desc, then corroboration desc, then confidence desc, then impact desc, then created_at asc (older first), then id asc**. The id step is an absolute stable finalizer, so the order is never random.
  - `rankOpportunities(opps, corroborationOf)` returns `{ opp, rank (1-based), isBestBet (rank === 1), designation, rationale, nextAction }[]`, contiguous 1..N, with exactly one `isBestBet` for any non-empty list. It does not mutate the input.
  - `deriveDesignation({ rank, verdict, impact, ease, corroboration })` is the pure, deterministic designation. It is evaluated in strict order (first match wins), so rank 1 is always the single best bet even when a lower rule would also match it: **(1) rank === 1 -> "best bet"; (2) else NOT endorsed (verdict rank below SHIP's) AND impact >= 6 -> "needs validation"; (3) else ease >= 7 AND impact >= 5 -> "quick win"; (4) else ease <= 3 -> "heavy lift"; (5) else corroboration >= 3 -> "watch this week"; (6) else null**. "Not endorsed" means the Critic has not endorsed the bet (pending, watch, revise, or kill). `rankOpportunities` computes it with the same `verdictFor` verdict and `corroborationOf` count the comparator uses.
- `corroborationOf(opp)` is the backing signal count. In the queue it reads the promoting theme's `frequency` (`themeById.get(opp.theme_id)?.frequency ?? 0`).
- The rationale is built only from the clauses that are true or nonzero for that bet (top ICE / a Critic verdict / a signal count), so it never claims a fact it does not have.
- The recommended next action is derived from state: verdict `PENDING` -> "Challenge with the Critic first"; status `shipped` -> "Review the outcome"; otherwise "Draft the spec".
- `src/components/discover/OpportunityQueue.tsx` replaces the old `ice_score` sort with `rankOpportunities(rows, ...)` and renders the ranked list (respecting the existing show-more slice), threading `rank` + `designation` into each `OpportunityRow` and `rank` + `designation` + `rationale` + `nextAction` into the open `OpportunityDetailSheet`.
- `src/components/discover/OpportunityRow.tsx` shows the `#{rank}` as a plain-language spotlight badge (`RankBadge`: a filled glacier pill at #1 with dark canvas text, a lighter glacier tint at #2 to #3, a quiet hairline outline deeper down, never ember, carrying a "Priority rank {n} of the queue" title and aria-label) next to the tier-colored ICE numeral, and one designation marker driven by `designation`: for the "best bet" it renders the single lime `PencilNote` wink (the one loud pencil on the screen, per the one-wink law); for "needs validation" / "quick win" / "heavy lift" / "watch this week" it renders a quiet `DesignationTag` (small mono text on a rounded hairline chip) in that ink; a null designation renders nothing. The old separate amber "Best bet" system chip is removed, so the card never shows two best-bet markers.
- `DesignationTag`, `DESIGNATION_INK`, and `DESIGNATION_MEANING` are exported from `OpportunityRow.tsx`. The inks: "needs validation" -> `--pencil-blossom`, "quick win" -> `--moss`, "heavy lift" -> `--pencil-apricot`, "watch this week" -> `--text-muted` (a quiet, low-emphasis tone). The best bet is the lime pencil (`--pencil-lime`), not a tag.

## Bet designations (the PM pencil vocabulary)

Every ranked bet carries one system-derived designation so a human or an agent can read what it IS and which to pick, without opening it. The labels and their deterministic rules (evaluated top to bottom, first match wins). The vocabulary is self-explanatory PM language; more terms ("sure thing", "long shot", "table stakes") are held as spares for when the set grows:

| Designation | Rule (in order) | Ink | Meaning (shown in the detail sheet) |
| --- | --- | --- | --- |
| **best bet** | rank === 1 | `--pencil-lime` (the one pencil wink) | The single top-ranked bet. Its rank, rationale, and recommended next action lead the detail band. |
| **needs validation** | not endorsed by the Critic AND impact >= 6 | `--pencil-blossom` | High appeal, thin evidence. Let the Critic weigh in before you commit. |
| **quick win** | ease >= 7 AND impact >= 5 | `--moss` | Low effort for real impact. A fast, safe ship. |
| **heavy lift** | ease <= 3 | `--pencil-apricot` | Large effort for the expected return. Consider slicing it smaller. |
| **watch this week** | corroboration >= 3 | `--text-muted` | Gaining signals, not yet the top bet. Keep it in view. |
| (none) | otherwise | none | A plain ranked bet, no designation. |

- **One pencil per screen.** Only the best bet renders the loud lime `PencilNote` wink; every other designation is a quiet tag. This upholds the one-wink restraint law: exactly one hand-drawn pencil mark on the queue at a time.
- **Deterministic and pure.** `deriveDesignation` is a pure function of `{ rank, verdict, impact, ease, corroboration }`; the same bet always earns the same designation, on the server and the client, for a human and an agent.
- **The detail meanings** are one-line, action-oriented explanations so the reader knows what to DO about the bet, shown in the `OpportunityDetailSheet` priority band beneath the designation.
- **The detail band and card follow the Loom detail-view doctrine** (DESIGN-LOOM.md dim 17): the priority band uses a calm glacier tint (never amber or brown), the ICE stat strip is compact single-row tinted cells, every detail section heading carries a tiny quiet vertical-bar accent (monotone bodies, no rainbow), and the card rank is a plain-language spotlight badge (filled glacier at #1, a lighter tint at #2 to #3, a quiet outline deeper down, never ember) so a non-expert reads priority while the ICE score stays secondary.

## Governance & guardrails

- Pure, deterministic, side-effect-free ranking: no model call, no write, no external dependency. The order is a function of the row data only.
- It is a display and ordering layer over existing `opportunities` rows read under standard RLS (the caller's own workspace); it introduces no new data, table, or column.
- Semantic tokens only; ember stays reserved for the Capture CTA. The best bet is the single lime `PencilNote` wink (`--pencil-lime`); the other designation tags use their own inks (`--pencil-blossom`, `--moss`, `--pencil-apricot`) or a quiet `--text-muted`, and the rank spotlight badge and the glacier priority band use `--glacier`, never ember.

## Verification checklist

- [x] `npx tsc --noEmit` clean.
- [x] `bun run build` succeeds.
- [x] `bun test src/components/discover/ranking.test.ts` passes (tie-break fall-through, exactly one best bet, contiguous 1..N ranks, run-twice determinism, stable across input permutations, and the designation branches + evaluation order).
- [x] `bun test src/components/discover/OpportunityRow.test.tsx` passes (best bet renders the PencilNote and no tag; a non-best designation renders a tag and no PencilNote; no designation renders neither).
- [x] The full suite stays green except the 3 pre-existing `resolveEmbedRoute` failures.
- [ ] On `/discover`, each card shows `#{rank}`, only the top card shows the single lime pencil wink, and any other qualifying bet shows one quiet designation tag (live-verify on next publish).

## Known limits / out of scope

- The detail-sheet "Ranking" block is intentionally restrained; the full visual treatment of the rationale and next action is deferred to a later design pass.
- Corroboration is the promoting theme's signal frequency; bets promoted directly (no `theme_id`) contribute 0 corroboration and rely on the rest of the chain.
- The tie-break weights are fixed by design (not user-configurable), which is what makes the order a stable contract.

## Related

- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4, build log entry
- `src/components/discover/ranking.ts` and `ranking.test.ts`, the implementation and its lock tests
- [`critic-agent.md`](./critic-agent.md), the Critic verdict that feeds the second tie-break key
- [`continuous-discovery-feed.md`](./continuous-discovery-feed.md), the signal themes whose frequency is the corroboration input
- [`roadmap-provenance.md`](./roadmap-provenance.md), the lineage behind a ranked bet
