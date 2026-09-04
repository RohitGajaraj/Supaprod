# S4-028 · Standing question 3 — the theatre audit, and what it found in the shop window

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, on `lane/proof`, merged tree. Standing question 3: **is anything on screen
> theatre — a state not derived from a row that exists?** Static; no database and no browser were
> needed for anything below, and every claim is a file and a line you can open._

## Method, so the result can be weighed

Eight surface regions, one reader each, told the repo's own definition of theatre and required to
quote the source line with its number. Every candidate then went to an independent adversary whose
instruction was to **refute** it — default to "not theatre" unless the defect could be positively
confirmed, and treat unreachable code as refuted rather than as a finding.

**32 candidates raised, 16 refuted, 16 confirmed.** The adversary killed exactly half, which is the
number I would want to see: a pass that confirms everything is a pass that is not checking.

**Then I drove the three below myself, with my own greps**, because an audit I did not verify is a
claim like any other and this session's whole value is that it does not pass those along. The
remaining thirteen are listed at the end **labelled as audit-reported and not personally driven** —
that label is the point, not a disclaimer.

---

## 1 · The landing page tells a stranger the product does the one thing it has never once done

**And it does it in the vocabulary the canon bans, over an animation with no data behind it.**

`src/routes/index.tsx:34` → `Hero.tsx:670` → `<HeroLoopDemo />`.

`src/components/landing/HeroLoopDemo.tsx:98-100`, verbatim:

```
AUTONOMOUS EXECUTION
One sentence. Seven stations. Fully automatic.
No clicks mid-run. No human intervention. Agent decides, builds, ships.
```

Directly above a seven-station progress bar whose entire state is a clock —
`HeroLoopDemo.tsx:51-57`:

```ts
const interval = setInterval(() => {
  setCycleTime((t) => (t + 50) % TOTAL_CYCLE);
}, 50);
```

with each station's state computed as `stationStart = index * (STATION_DURATION + INTER_STATION_DELAY)`.
No query, no row, no run. **A step label advanced by a timer** — the operating model's own worked
example of theatre, and the one it says *"this repo has already failed a branch for."*

**To be fair to the surface, and this matters:** an illustrative animation on a landing page is
ordinary and not dishonest. Every product ships one. **The animation is not the finding.** Three
things stacked on top of it are:

1. **It states a capability as fact.** *"No clicks mid-run. No human intervention."* R-18's
   acceptance is exactly that sentence, and the honest query for it has returned **0 for three
   months**. The nearest attempt, `d1168015`, is disqualified precisely because a person answered a
   boundary call mid-run (F-79) — the very clause the headline denies.
2. **"AUTONOMOUS EXECUTION" is banned copy.** CLAUDE.md: *"never write agentic · autonomous ·
   AI-native · orchestration · intelligence in product copy — show the behaviour and let the person
   name it."* It is here as a header, in capitals, on the first screen. And the 5.9M-word audit that
   set that rule *"found we drifted worst in the shop window, not in the product."* **This is that
   finding, still live in the shop window.**
3. **It is the claim the whole company is organised around not overstating.** The same canon insists
   the honest form is *"the loop is wired and proven, and it begins accruing on first real use."*

## 2 · The same page reports a run that never happened, in the past tense, with numbers

`src/routes/index.tsx:38` → `LoopWalkthrough.tsx:5` → `replay/Replay.tsx`.

`src/components/landing/replay/Replay.tsx:1121-1125`:

```ts
const TAB_CONFIG: Record<ReplayTab, { log: LogEntry[]; caption: string }> = {
  full: {
    log: FULL_LOG,
    caption:
      "Agents ran twelve steps in nineteen minutes. You made two calls. Every one is on the record.",
```

`FULL_LOG` is a hardcoded array beginning at `Replay.tsx:85`. So: **a past-tense factual claim with a
specific step count, a specific duration, and the assertion "Every one is on the record" — driven by
a fixture.** The record is the thing this company sells, and the record being shown is invented.

The audit also confirmed two more of the same class on this surface: a trace row tagged **MEMORY**
attributed to an actor named **"Brain"**, reporting a precedent with a hit rate (3 of 4) and a
measured outcome (D+14 +9%) — while `learnings` is 133 of 133 seed and the four brain tools have
zero calls across 2,652 runs (`Replay.tsx:138`); and a `MockDecisionCard` whose body advances
"Signal detected → Decision proposed → You approved → Design drafted → Agents dispatched" on step
index (`Replay.tsx:830`).

The irony is eleven lines above the caption, at `Replay.tsx:1118-1119`, where someone deleted a
config key with this reason: *"a config key nothing reads is a claim about behaviour that no longer
holds."* Right instinct, one line away.

**Both of §1 and §2 are outward-facing, and `docs/pitch/` says nothing outward ships without the
founder's approval. These are already shipped. That makes it his call, not S3's and not mine.**

## 3 · In the product: a named teammate is credited with an endorsement it never gave

`src/components/discover/format.ts:175-183`:

```ts
export function verdictFor(opp: OpportunityVerdictInput): VerdictWord {
  const critic = opp.critic_review?.verdict;
  if (critic === "ship") return "SHIP";
  …
  if (opp.status === "shipped" || opp.status === "now") return "SHIP";   // ← no critic_review at all
```

`src/components/discover/ranking.ts:208-209`:

```ts
const reviewer = agentDisplayName("critic");
if (verdict === "SHIP") clauses.push(`${reviewer} endorsed`);
```

So a bet that is merely `shipped` or `now` gets the sentence **"Challenge endorsed"** under the
heading *"Why it ranks here"* — an endorsement attributed by name to a teammate that never opened
it. **An invented attribution is worse than an invented number**, because a person can act on the
name.

**The repo already built the guard and this path skips it.** `criticGaveTheVerdict` exists at
`_authenticated.decide.tsx:458` and is used at `:1343` and `:1419`; `VerdictBadge.tsx:38` carries the
comment *"`criticGaveTheVerdict(...)`, never `Boolean(review?.verdict)`: the two ask [different
questions]."* `rationaleFor` in `ranking.ts` never calls it. The audit further reports that the same
context column prints *"Nobody has reviewed it."* nine lines above the rationale — I have not driven
that pairing myself and flag it as reported.

---

## 4 · The other thirteen — reported by the audit, **not personally driven by me**

Listed with the evidence given so an owner can check them directly. **Treat these as leads with
file:line, not as my verdicts.** Each was confirmed by an adversary instructed to refute it, which
is worth something and is not worth as much as my own hands on it.

| Severity | Location | The claim on screen |
| --- | --- | --- |
| ends-the-feature | `engine-room/TestStationPanel.tsx:158` | every CI-expectation clause stamped PASSED/FAILED from the plan's **overall** verdict, because per-clause results do not exist |
| misleads | `track/TrackConsent.tsx:226` | *"Answered. Picking the work back up."* on gate counts alone — an `approved` gate lands in `settled` yet `releasesRun` (`:72`) explicitly does **not** resume, and `attach.ts:469-470` keeps it in `stillPending`, so `driver.ts:1040` is holding the run with `waiting-on-a-person` while the card says it resumed |
| misleads | `runs/RunBoard.tsx:361` · `runs/RunsGrid.tsx:395,423` | *"step 6 of 8"* read as six of eight planned steps carried out |
| misleads | `agents/AgentRelay.tsx:112` | a static verb rendered as live activity — `relay.ts:123` sets `latestLine` to `agentRelayVerb(slug) ?? "working"` |
| misleads | `missions/MissionOrchestratorDetail.tsx:549` | a settled hop with no `last_checkpoint_at` renders a duration of **"0ms"** via a `?? h.created_at` fallback |
| misleads | `meridian/Receipt.tsx:103` | a **settled** receipt draws the agent mark in the machine-is-working azure, animating indefinitely, and tells a screen reader *"&lt;agent&gt;, running"* |
| misleads | `engine-room/rooms/VerifyCockpit.tsx:502` | *"Nothing is waiting on you…"* all-clear, where the honest-failure guard requires **both** reads to fail |
| misleads | `settings/DiagnosticsSection.tsx:59` | *"Everything looks healthy."* when the runaway-mission scan failed and only the SLO read landed — same `bothFailed` shape |
| cosmetic | `engine-room/rooms/QualityRoom.tsx:125` | pass rate painted PASS-green when `getEvalHealth` returned `"no-data"` |

**A pattern across four of them** — `VerifyCockpit`, `DiagnosticsSection`, and the two `bothFailed`
guards — is the same seam I filed independently this morning as `S4-024`: **a partial failure
rendered as a clean result, because the "did this fail" test requires every read to fail.** Four
sites, one rule: *an all-clear must require that everything was read, not that something was.*

## 5 · What is NOT theatre, because a clean region is a real answer

Sixteen candidates were refuted, and several surfaces came back clean. `presence/**` and the
`spine/decisions/learn` region were nearly so. `overlaps.ts`'s check line, which I attacked
separately in `S4-024`, is honest by construction and says out loud what it could not check.
Refutations that landed included unreachable components, values that looked defaulted but were
gated on a real loaded state above them, and timers that turn out to drive a **poll of real rows**
rather than a state — which is not theatre and was correctly thrown out.

---

## Verdict

**Standing question 3 is answered, and the worst of it is not inside the product — it is on the
first screen a stranger sees.** The landing page states, as accomplished fact and in banned
vocabulary, the one thing R-18 says has never happened, over an animation driven by
`setInterval(…, 50)`; and it reports a specific run, in the past tense, from a fixture, under the
words *"Every one is on the record."*

Three findings I drove myself: **CONFIRMED.** Thirteen more with file:line evidence, **reported, not
personally driven, labelled as such.**

**§1 and §2 are the founder's call because they are outward-facing and already shipped.** §3 and the
thirteen belong to the lanes that own those paths. **I write no `src/` and have fixed none of it.**
