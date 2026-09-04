# S4-034 · The last five leads, and the `S4-028` list is closed

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, on `lane/proof`, merged tree. `S4-028` published thirteen findings labelled
> **audit-reported, not personally driven**. This drives the final five. **Every one of the thirteen
> has now been read by me at the source, and three were corrected downward on the way.**_

---

## 1 · `AgentRelay` shows a constant as a live activity report

**CONFIRMED.** `src/lib/relay.ts:123`:

```ts
let latestLine = agentRelayVerb(h.agent_slug) ?? "working";
```

The default is a verb looked up from the agent's **slug** — a constant, the same for every hop that
agent ever runs — or the literal string `"working"`. It is overwritten only in two branches:
`status === "done"` (uses the run's final message) and `status === "running"` **with a thought
already recorded**.

So for a hop that is queued, failed, or running-but-not-yet-thinking, the mission page renders
`sub={s.latestLine}` (`AgentRelay.tsx:112`) as a sentence about what that agent is doing, when
nothing about this hop was consulted. A constant is presented where a person reads a status.

## 2 · A finished hop with no checkpoint reports **"0ms"**

**CONFIRMED, and it breaks a rule this repo has already written down and enforced elsewhere.**

`src/components/missions/MissionOrchestratorDetail.tsx:198-202`:

```ts
const start  = new Date(h.created_at).getTime();
const isLive = h.status === "running" || h.status === "queued";
const end    = isLive ? Date.now() : new Date(h.last_checkpoint_at ?? h.created_at).getTime();
return Math.max(0, end - start);
```

For a **settled** hop whose `last_checkpoint_at` is NULL, `end` falls back to `created_at`, so
`end - start` is exactly `0`, and `:549` renders `fmtDuration(0)` as **"0ms"**.

The `?? h.created_at` is itself the admission that the column is often absent.

**This is F-86's rule, violated in a component.** S0 built `MetricReading` as a discriminated union
whose unreadable branch carries **no numeric field at all**, on the stated principle that *"a metric
that cannot be read is not zero"*, because a wrong number is worse than a missing one: a missing one
is visibly missing. Here an unmeasured duration is rendered as a precise measurement of zero, in
monospace tabular numerals, which is the typography of a real reading.

**The fix is the same shape:** a settled hop with no checkpoint has an unknown duration, and the cell
should say so rather than print a floor value.

## 3, 4, 5 · The landing page, completed

All three confirmed, and together with `S4-028` §1 and §2 they finish the picture of the shop window.

**`HeroLoopDemo.tsx:182-197` — a green tick that says the product deployed something.**

```tsx
{completedCount > 5 && (… <span>Deployed to production</span>)}
{completedCount === STATIONS.length && (… <span>→ Outcome being measured</span>)}
```

`completedCount` is derived from `cycleTime`, which is `setInterval(… , 50)`. **A checkpoint reading
"Deployed to production" illuminates because a clock passed a threshold.** This sits under the
headers verified in `S4-028`: *"AUTONOMOUS EXECUTION / No clicks mid-run. No human intervention."*

**`Replay.tsx:134-138` — the brain claim, which the canon bans outright.**

```ts
agentName: "Brain",
msg: "Precedent found: a similar call was right 3 of 4 times, D+14 +9%. Confidence 84%.",
```

A hardcoded fixture crediting the shared brain with a hit rate (3 of 4), a measured outcome
(D+14 +9%) and a confidence score (84%). Measured state of the actual brain, per the operating model
§3: **133 of 133 `learnings` rows are seed, the four brain tools have zero calls across 2,652 agent
runs, and `decisions.cited_by_count` is 0 on all 355.**

CLAUDE.md is explicit and this is the one line it repeats: **"Never claim accumulated learning in the
present tense; the honest form is *the loop is wired and proven, and it begins accruing on first real
use*."** This is that claim, with three fabricated numbers attached.

**`Replay.tsx:826-834` — a decision card whose body advances on an index.**

```tsx
{step === 1 && "Precedent: similar fix, D+14 activation +9%."}
{step === 4 && "3 commits. CI passing. Merge queued."}
```

Step-indexed strings rendered as a decision card's live content.

### The fairness point, stated once and meant

**An illustrative animation on a landing page is ordinary and honest.** Every product ships one, and
none of this would be a finding if the surface read as an illustration. Three things take it past
that line, and only these three:

1. **Capability asserted as fact** — *"No clicks mid-run. No human intervention."* is R-18's
   acceptance, and the honest query for it has returned **0 for three months**.
2. **Specific past-tense numbers presented as record** — *"Agents ran twelve steps in nineteen
   minutes… Every one is on the record."* The record is the product, and this one is a fixture.
3. **An accumulated-learning claim**, which the canon bans in the present tense, carrying invented
   statistics.

Fixing all three is copy, not engineering. The animation can stay.

---

## The list, closed

| # | Lead | Result |
| --- | --- | --- |
| 1 | `discover/ranking.ts:209` — "Challenge endorsed" with no review | CONFIRMED (`S4-028`) |
| 2 | `TestStationPanel.tsx:158` — CI clauses from the overall verdict | CONFIRMED (`S4-031`) |
| 3 | `HeroLoopDemo.tsx:54` — seven stations on a timer | CONFIRMED (`S4-028`) |
| 4 | `HeroLoopDemo.tsx:187` — "Deployed to production" on a timer | CONFIRMED (here) |
| 5 | `Replay.tsx:138` — "Brain" precedent with invented statistics | CONFIRMED (here) |
| 6 | `Replay.tsx:1124` — a past run reported from a fixture | CONFIRMED (`S4-028`) |
| 7 | `Replay.tsx:830` — decision card advancing on step index | CONFIRMED (here) |
| 8 | `TrackConsent.tsx:226` — "picking the work back up" while the driver holds | CONFIRMED (`S4-031`) |
| 9 | `RunBoard`/`RunsGrid` — "step 6 of 8" counts skipped | CONFIRMED, **narrowed** (`S4-033`) |
| 10 | `AgentRelay.tsx:112` — a constant as a live report | CONFIRMED (here) |
| 11 | `MissionOrchestratorDetail.tsx:549` — "0ms" for unmeasured | CONFIRMED (here) |
| 12 | `Receipt.tsx:103` — settled row announced as running | CONFIRMED, **animation claim withdrawn** (`S4-033`) |
| 13 | `VerifyCockpit.tsx:502` · `DiagnosticsSection.tsx:59` | CONFIRMED, **Diagnostics narrowed** (`S4-032`) |
| 14 | `QualityRoom.tsx:125` — pass-green on no-data | CONFIRMED, cosmetic (`S4-033`) |

**Thirteen raised, thirteen confirmed at the source, three corrected downward.** Nothing was invented
by the audit; three things were overstated by it, and the corrections are as much the point as the
confirmations.

**I have fixed none of them.** Every path belongs to another session. The founder's earlier override
covered the em dash sweep only, and I have not extended it.

## The one thing I would say if only one thing were read

**The most damaging findings are not in the product. They are on the first screen a stranger sees**,
and they claim precisely the thing this product has never once done. §0.6's *honesty* standard is the
one item on that list that **deletes a feature rather than sending it back**, and it applies to
marketing copy exactly as it applies to a status chip.
