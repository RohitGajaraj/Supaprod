# FS-01 / FS-04 — Foresight generators + risk in the brief

> Status · Shipped 2026-07-02 (FS-01) / 2026-07-03 (FS-04) · Route(s): `/today` · Owner agent(s): the intelligence analyst (Haiku, `sense` surface)

## What it does

Cadence's `derive-tick` cron watches emerging product themes and derives falsifiable foresight insights (`prediction`, `risk`, `cost_of_inaction`, `hidden_connection`) every two hours. FS-01 made those claims honest: every prediction and risk insight carries a checkable claim and a 30-90 day horizon, and a `calibrate-tick` cron scores expired ones (hit/miss/inconclusive, Brier-style) and throttles a generator whose rolling hit rate falls below 34%. FS-04 puts that credibility to work: the single highest-scored open risk, plus its calibration hit rate ("Cadence called 7 of the last 9"), now leads the Today brief and appears on the matching InsightRail card — foresight lands where the operator already looks, not a new panel.

## Why it exists

v12 sec 4: Today is not a dashboard. Foresight that only lives in a background `insights` table changes nothing; it has to reach the operator's attention, and it has to earn trust rather than assert it. Full reasoning: [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) sec 4. Build log: [`../../plan.md`](../../plan.md) §4 (search "FS-04").

## Where to find it

- `/today` — the AI daily brief (generated once per day, on first load) folds the top open risk into its stakes lead, right after the pending-approval callout.
- `/today` — the Signal insights rail (`InsightRail`) shows a small calibration line under any `prediction`/`risk` card once at least one call of that kind has resolved.

## Demo script (≤ 90s)

1. Open `/today` on a workspace with an open `risk`-kind insight and at least one resolved calibration call. Read the brief: after the approvals lead, it names the risk and cites "Cadence called N of the last M."
2. Point at the matching card in the Signal insights rail below — the same hit-rate line sits under its detail text.
3. Contrast: on a fresh workspace with zero resolved calls, the same risk shows with no hit-rate clause — no invented credibility, no "not enough data yet" filler either.

## How it works

- `deriveRisk` (`src/lib/brain/derive-insights.server.ts`) writes a `kind: "risk"` row into `insights`, workspace-scoped, with a falsifiable `claim` and a 30-90 day `horizon_date` (FS-01).
- `summarizeCalibration` / `summarizeResolutions` (`src/lib/brain/calibrate-insights.server.ts`) compute the rolling hit rate over the last 10 decided calls of a kind (FS-01); `recentLabel` is the quotable "Cadence called N of the last M" primitive, built specifically for FS-04 to compose.
- `describeRisk` (`src/lib/copilot-brief.ts`, pure, unit-tested) composes the top open risk + its calibration summary into one deterministic line, honest when there is no open risk or no resolved history yet — never fabricates a hit rate.
- `ensureTodayBrief` (`src/lib/copilot.functions.ts`) resolves the caller's `workspace_id`, fetches the top open risk + calls `summarizeCalibration` alongside its existing queries, and folds `describeRisk`'s line into the brief's AI prompt as an `OPEN RISK:` section, right after `PENDING CALLS`.
- `getInsightRail` (`src/lib/brain/insights.functions.ts`) computes at most two calibration lookups per rail load (one per `prediction`/`risk` kind actually present, deduped), attaches `calibrationLabel: string | null` to each `InsightRailItem`, and only sets it once `resolved > 0` for that kind.
- `InsightRail.tsx` renders `calibrationLabel` as a small muted mono line under the card's detail text.

## Governance & guardrails

- Read-only composition: FS-04 adds zero new writes, zero new AI calls, and touches no chokepoint file. It only reads `insights` (already RLS/workspace-scoped) and calls the existing pure calibration summarizer.
- Both the brief query and the rail's calibration lookups are scoped to the caller's own `workspace_id` (resolved via `workspace_members`), so a risk or hit rate from one workspace can never surface in another's brief or rail.
- Calibration throttling (FS-01, `shouldThrottle`) already stops a systematically-wrong generator from producing new insights; FS-04 inherits that guardrail for free since it reads the same `insights` rows.

## Verification checklist

- [ ] `bun test src/lib/copilot-brief.test.ts` — `describeRisk` unit tests pass (honest-when-empty, no-invented-hit-rate, punctuation).
- [ ] A workspace with an open `risk` insight and ≥1 resolved calibration call shows the hit-rate line in both the brief and the matching InsightRail card.
- [ ] A workspace with an open `risk` insight and 0 resolved calls shows the risk with no hit-rate clause.
- [ ] A workspace with no open `risk` insight shows no risk callout in the brief at all (never a "no risk" filler line).

## Known limits / out of scope

- Only the single highest-scored open risk is folded into the brief; `prediction`/`cost_of_inaction`/`hidden_connection` insights still only surface on the InsightRail, unchanged.
- No UI to browse resolved/throttled history from Today; that lives implicitly in the calibration hit rate only.

## Related

- [`../../plan.md`](../../plan.md) §4 — FS-01 and FS-04 build log entries.
- [`../strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) sec 4 — the foresight-in-the-brief reasoning.
- [`outcome-contract.md`](./outcome-contract.md) — the sibling v12 CONVENTIONS arc (a different composition of already-shipped primitives into an existing surface).
