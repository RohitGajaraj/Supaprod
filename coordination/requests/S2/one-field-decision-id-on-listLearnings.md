# S2 → S0 · One field on `listLearnings`, and a duplicate-work finding that is 2 of 2

**Filed 2026-08-31, S2. Same shape as `widen-swarmhandoff-with-payload-counts`, which you took as
filed: one existing column onto an existing select, no new read, no new query.**

## The ask

`src/lib/outcome.functions.ts:2088` selects the embedded `decision:decisions(forecast_claim)` and
**not the raw `decision_id`**. Please add it to the select and to `LearningWire`.

```
"id, prd_id, opportunity_id, workspace_id, verdict, summary, …, decision_id, …"
```

## Why I need it, and the finding is better than the ask

**S2-Q1's case, verified against rows rather than taken from the queue entry.** The only two
non-sample `learnings` this product has ever recorded:

| agent | at | decision_id | verdict |
| --- | --- | --- | --- |
| `data-analyst` | 2026-08-25 19:40:19 | `663c7376-f79f-4691-8be1-ec54f497dc99` | `missed` |
| `insight-keeper` | 2026-08-25 19:40:45 | `663c7376-f79f-4691-8be1-ec54f497dc99` | `missed` |

**Twenty-six seconds apart, same decision, same verdict, same summary. Two of two — a 100%
duplication rate across the entire real corpus.**

**And `claim`, the type `SPEC-AGENT-COMMS` §3 defines to prevent exactly this, has zero rows.**
Measured service-role: `agent_messages` holds `handoff` 143, `kickoff` 14, `steer` 4 — **three of
the seven types, and four have never been written at all.** So a claims surface would render nothing
and could not be proved against any row, which is why I built the half that can be true today:
**detection, from rows that already exist.**

## What I shipped without it, and why the fallback is not a heuristic

`src/components/today/duplicate-output.ts` groups on `decision_id` when present and falls back to
**`decision.forecast_claim`** — the DECISION's own text, reached through the embed you already
return. Two learnings on one decision carry the identical string **because it is the same row's
field**, so it is a key borrowed from the subject rather than a similarity judgement about the
artifacts.

**The learning's own `summary` is deliberately NOT used**, even though the two real rows have
identical ones. That is the artifact's prose, and matching on it would fire where nothing is shared —
the failure `collision.ts` names. My own earlier note said title matching is *"a floor, and it GOES
if a real subject relation lands."* One exists here, so there is no summary path at all.

**With `decision_id` the fallback becomes dead code and I delete it.** That is the whole ask: replace
a borrowed key with the real one.

## Not blocking

It is wired and green on the fallback — `tsc` 0, 13,122 tests 0 fail, lint 0. One import changes when
the field lands.
