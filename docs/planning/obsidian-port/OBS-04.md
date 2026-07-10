# OBS-04 · Today ported (the ritual screen)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

> Self-contained build + implementation spec. Read [`README.md`](./README.md) (the hub) once for the shared canon, then build from here. Where a value below is quoted, it is copied verbatim from the hub or the frozen prototype `design-reference/obsidian-v3/design-reference/cadence-app.html`. The prototype is the floor.

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-04                                                                                                                                                                                                                                                                                                                                                                                       |
| Rank          | #5                                                                                                                                                                                                                                                                                                                                                                                           |
| Tier          | 1 (foundation surface)                                                                                                                                                                                                                                                                                                                                                                       |
| Status        | pending                                                                                                                                                                                                                                                                                                                                                                                      |
| Category      | Cockpit                                                                                                                                                                                                                                                                                                                                                                                      |
| Depends on    | OBS-03 (primitives: Button, StatusDot, MonoLabel, Toast, CallCard, MissionRow, AuroraCard, Citation)                                                                                                                                                                                                                                                                                         |
| Blocks        | OBS-14 (onboarding golden path lands the user on Today)                                                                                                                                                                                                                                                                                                                                      |
| One-line what | Today ported to Obsidian: the hero (Newsreader 34px, one ember italic count word that rewrites as calls clear), the Call queue (canonical CallCard, cross-object sync to missions), What changed with causes, the loop strip (SENSE · DECIDE · DEFINE · BUILD · LEARN with live counts, DECIDE ember when calls pend), the ONE Loop Health aurora card, and the machine-right-now mini-list. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-04                                                                                                                                                                                                                                                                                                                   |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                                                                                                                                                       |

## 2. Why we are doing it

Today is the ritual screen: the first thing the PM opens, the place the loop reports in, and the single home of every decision that needs a human. It is where the product's whole thesis has to be felt in ten seconds: warm asks, cool works. Right now it renders in the parchment Ember Editorial system with lucide icons and a per-page shell. This item ports it 1:1 to Obsidian so the working machine finally looks calm and legible.

**Which of the three laws it serves.** All three, at once. **Law 2 (one queue for attention):** the Call queue is the spine of the screen and ember is spent only on it. **Law 1 (one object, one anatomy):** the Call renders as the canonical CallCard, identical to how it appears inside the Build slide-over; answering it syncs the linked mission row so the Call, the row, and the slide-over are visibly one object. **Law 3 (depth on demand):** layer one shows only what needs a decision; the loop strip and the machine-right-now list are quiet jump-off points, never full detail.

**The felt user outcome.** The PM lands, reads one sentence in serif that names exactly how many calls need judgment, answers them, and watches the screen rewrite itself to "All clear." No dashboard of gauges, no nagging, no color that is not carrying a real status. The restraint is the reassurance.

**The v11 / engine-room tie.** Today is the decision-and-outcome layer made physical (v11 guiding star): trust is built at the point of decision, and the outcome of a past call reappears under "What changed." The engine-room doctrine says the machinery lives behind one door; Today shows outcomes, never mechanism, and routes any depth request to Build or the Engine Room. The loop strip teaches the architecture just by existing.

## 3. What we are building

**Scope IN**

- The hero band: mono eyebrow greeting, Newsreader 34px headline with the single ember italic count word, rewriting live as calls are answered (`Two calls` to `One call` to `All clear.`).
- The loop strip: five mono-caps pills SENSE · DECIDE · DEFINE · BUILD · LEARN joined by faint `→`, each with a live count, each a jump to its surface; DECIDE goes ember when calls pend, BUILD carries a pulsing glacier dot.
- The Call queue rendered with the canonical OBS-03 `CallCard`; the all-clear empty state as a moss-hairline card.
- The "calls answered" progress affordance (ember fill), advancing on each decision.
- "What changed overnight": causal one-liners with a status dot and a mono cause tag.
- The ONE Loop Health aurora card (this screen's single aurora, per the restraint budget).
- The "machine right now" mini-list: up to four live/queued mission rows, each opening Build.
- Cross-object sync on answering a call: queue, hero, badge, progress, "machine right now" step label, and the linked mission all update with no reload.

**Scope OUT (no feature work rides along)**

- No server functions are written or changed. Today consumes these read-only: `getGreeting` (`["greeting", localHour]`), `getNeedsYou` (`["needs-you"]`, the Call queue source: `{approvals, prdCalls, oppCalls}`), `getLoopPulse` (`["loop-pulse"]`, the strip counts: signals / opportunities / specs / runs / memories), `listLearnings` (`["learnings"]`, What changed), `listAgentRuns` (`["runs"]`, machine-right-now), `getAcceptanceRate` + `getAutonomyRatio` (Loop Health inputs), `listProjects` (`["projects"]`, shell). The only mutation is the existing `resolveApproval` (answering a call) via `decideApproval`.
- No new columns, no schema, no new Call kinds. The nav-model reshape and route folds are OBS-02 / OBS-10, not here.
- The Build mission slide-over is OBS-05. Today opens Build and hands off; it does not render the slide-over itself.
- Legacy panels with no clean Obsidian home in the prototype (cold-start onramp, insight rail, wedge teardown, getting-started checklist, tasks widget) are dropped from the ported Today, not re-skinned. They live behind other surfaces or are retired by OBS-10. Do not port parchment panels the prototype does not show.

## 4. Current state

Real files as of 2026-07-02:

- **Route:** `src/routes/_authenticated.today.tsx` (~52KB, component `Dashboard`). It is the parchment Today: `import { AppShell } from "@/components/cadence/AppShell"` + `TopBar`, `CadenceMark`/`MonoLabel` from `@/components/cadence/Primitives`, and a wall of lucide icons (`Sparkles, Plus, RefreshCw, Rocket, ShieldAlert, Check, AlertTriangle, Target, Activity, ArrowUpRight, ArrowDownRight, Minus`). It wraps everything in `<AppShell projects={...}>` per-page (line ~325 to ~1032).
- **Data flow already wired (keep all of it):** `useQuery` hooks at lines 87 to 137 for `["dashboard"]`, `["tasks"]`, `["projects"]`, `["runs"]`, `["needs-you"]`, `["focus-next"]`, `["insight-rail"]`, `["cold-start"]`, `["loop-pulse"]`, `["learnings"]`, `["opportunities"]`, `["acceptance", 14]`, `["autonomy", 14]`, `["greeting", localHour]`. The `decideApproval` mutation (line ~191) calls `resolveApproval` and today only `invalidate("needs-you")` + a `setClearedSession` counter + a parchment toast.
- **Call queue source:** `getNeedsYou` in `src/lib/today.functions.ts` (line 61) returns `{ approvals, prdCalls, oppCalls }`. `callCount = approvals.length + prdCalls.length + oppCalls.length` (line ~217). A session-local `deferred` Set hides "Not now" calls (lines ~227-235) while the hero still counts the true workload.
- **Loop strip source:** `getLoopPulse` (`src/lib/today.functions.ts` line 215) returns 24h counts `{ signals, opportunities, specs, runsCount, memories, windowHours }`. The parchment strip is `LoopStations` from `@/components/product/LoopStations`.
- **What is parchment / lucide / per-page shell:** the entire file. Every surface is Ember Editorial oklch tokens, lucide icons throughout, and the shell is imported per-page (not hoisted). This whole route is rewritten.

**Assumptions that must hold before starting.** OBS-01 (tokens + fonts + `[data-obsidian]`), OBS-02 (the shell / rail hoisted, mono index, keyboard map), and OBS-03 (the primitive set) are landed. If OBS-03 has not shipped `CallCard`, `MissionRow`, `AuroraCard`, `StatusDot`, `Button`, `Toast`, `MonoLabel`, stop and finish OBS-03 first; OBS-04 consumes them, it does not rebuild them.

## 5. How, step by step

1. **Confirm the primitives.** Verify `src/components/obsidian/` (the OBS-03 home) exports `CallCard`, `MissionRow`, `AuroraCard`, `StatusDot`, `Button`, `Toast`, `MonoLabel`. Read their prop shapes; do not re-implement them here.
2. **Create `src/components/obsidian/today/LoopStrip.tsx`.** The five-pill strip (anatomy in §7). Props: `{ counts: { sense, decide, define, build, learn }, pendingCalls: number, workingCount: number, onGo: (surface) => void }`. DECIDE tone is `ember` when `pendingCalls > 0` else `quiet`; BUILD carries the pulsing glacier dot. Pure presentational.
3. **Create `src/components/obsidian/today/Hero.tsx`.** Props `{ greeting: string, userName: string, pendingCalls: number }`. Compute `heroA`/`heroB` exactly as the prototype (§9). The count word is the one ember Newsreader italic per screen.
4. **Create `src/components/obsidian/today/WhatChanged.tsx`.** Props `{ items: {dot, text, cause}[] }`. Map `listLearnings` (and outcome deltas) into the `{dot,text,cause}` shape; if the live source is thin, render the empty instruction from §9. Dot color comes from the item semantics (moss = outcome, glacier = sense, blossom = signal), never invented.
5. **Create `src/components/obsidian/today/MachineNow.tsx`.** Props `{ rows: {title, status, step, cost, onOpen}[] }` built from `listAgentRuns` (up to four non-queued). Each row is a compressed `MissionRow` that calls `onOpen` to switch to Build with `?mission=<id>`.
6. **Create `src/components/obsidian/today/LoopHealthCard.tsx`.** A thin wrapper over the OBS-03 `AuroraCard` bound to `getAcceptanceRate` / `getAutonomyRatio` to produce the score (0-100) and the note line. This is the screen's ONE aurora.
7. **Rewrite `src/routes/_authenticated.today.tsx`.** Keep the `createFileRoute` head. Keep every `useQuery` that the ported surface consumes (greeting, needs-you, loop-pulse, learnings, runs, acceptance, autonomy, projects); delete the queries + JSX for the dropped parchment panels (cold-start, insight-rail, focus-next, wedge, checklist, tasks widget) unless a later item re-homes them. Remove ALL lucide imports. Render: shell (from OBS-02, now hoisted so the route body is just the surface content) → Hero → LoopStrip → the two-column grid (left 1.7fr: all-clear-or-CallCards, progress, WhatChanged; right 1fr: LoopHealthCard, MachineNow).
8. **Wire the CallCards.** Map `visibleApprovals` + `visiblePrd` + `visibleOpp` into the CallCard object shape `{ id, kind, expiry, title, body, ev:[{src,text}], okLabel, noLabel, consequence }`. `ok` calls `decide(id, true)`, `no` calls `decide(id, false)`.
9. **Wire `decide` (the cross-object sync).** `decide(id, ok)` calls `decideApproval.mutate({ approvalId, decision: ok ? "approved" : "rejected" })`. In `onSuccess`, invalidate the full linked set so the whole screen rewrites with no reload: `["needs-you"]`, `["runs"]`, `["loop-pulse"]`, `["learnings"]`, `["dashboard"]`, and `["studio-sessions"]` (the Build/mission queue, so the linked mission row flips). Show the call's `okToast` / `noToast` via the OBS-03 `Toast` (singleton, 3.6s). Advance the progress affordance (`clearedPct`).
10. **Wire the progress + badge.** The nav badge (OBS-02 rail) reads unanswered `callCount`, hidden at zero. The "calls answered" bar width binds to `clearedPct = round(answered / totalCalls * 100)`; transition width 280ms `--ease`, animate on change only, never from zero on mount.
11. **Keyboard.** `A` answers the current Call ok, `S` sends it back; ignore when a modifier is held or focus is in an input/textarea (the 1-5 / g / Esc map is owned by OBS-02).
12. **Reduced motion.** All pulses, drift, and the width transition gate on `prefers-reduced-motion` (already zeroed globally by OBS-01; verify the aurora and pulse dot inherit it).
13. **Tests.** Add `src/components/obsidian/today/today-hero.test.ts` (heroA/heroB mapping for 0/1/2/3/N) and `src/components/obsidian/today/loop-strip.test.ts` (DECIDE tone flips ember at `pendingCalls>0`, BUILD pulse present). If a `decide` reducer is extracted, unit-test the cross-object step-label flip (`gateId` match to `MERGING`). Run `bun test` and `tsc --noEmit`.
14. **Parity pass.** Open the prototype and the built Today side by side at 1440px; walk §11; capture screenshots for the ship report.

## 6. Structure

Component tree (Today route body, shell provided by OBS-02):

```
_authenticated.today.tsx  (Dashboard, rewritten · consumes server fns, mutates only via resolveApproval)
└─ <SurfaceContainer>                      (from OBS-02/03; max-width ~1060, padding 36/32/64, cadRise entrance)
   ├─ <Hero greeting userName pendingCalls/>          NEW  obsidian/today/Hero.tsx
   ├─ <LoopStrip counts pendingCalls workingCount onGo/>  NEW  obsidian/today/LoopStrip.tsx
   └─ <div grid 1.7fr / 1fr>
      ├─ left column (gap 14)
      │  ├─ noCalls ? <AllClearCard/> : map <CallCard .../>   (CallCard from OBS-03)
      │  ├─ <CallsAnsweredBar pct/>                    (ember fill; inline or small NEW)
      │  └─ <WhatChanged items/>                       NEW  obsidian/today/WhatChanged.tsx
      └─ right column
         ├─ <LoopHealthCard score note/>               NEW  obsidian/today/LoopHealthCard.tsx (wraps OBS-03 AuroraCard)
         └─ <MachineNow rows onOpen/>                  NEW  obsidian/today/MachineNow.tsx (rows = compressed MissionRow)
```

**New files:** `src/components/obsidian/today/Hero.tsx`, `LoopStrip.tsx`, `WhatChanged.tsx`, `MachineNow.tsx`, `LoopHealthCard.tsx`, plus tests `today-hero.test.ts`, `loop-strip.test.ts`.

**Moves / renames:** none of the OBS-03 primitives move. The parchment `src/components/today/*` (DecisionCard, PendingApprovalsBar, ColdStartOnramp, FocusNext, InsightRail, WedgeTeardown, CostPerOutcomeChip, StatusUpdateDialog, AutonomyCard, ExecutedCard) are no longer imported by Today; leave the files in place (other routes may still reference them until OBS-10) but drop the imports here. `LoopStations` is superseded by `LoopStrip` for Today.

**Data flow (consumed read-only, not modified):** `getGreeting`, `getNeedsYou`, `getLoopPulse`, `listLearnings`, `listAgentRuns`, `getAcceptanceRate`, `getAutonomyRatio`, `listProjects`. The single mutation is the existing `resolveApproval`. This item writes no server function. If a mapping helper is needed (needs-you rows to CallCard shape, loop-pulse to strip counts), put it in a local `mapToday.ts` next to the route or inline; it is presentation glue, not a server fn.

## 7. Design elements (exact values, embedded)

All colors from the `[data-obsidian]` token layer. Never invent a hex.

**Hero band** (prototype-exact):

- Eyebrow: `--font-mono` 9.5px, letter-spacing 0.14em, color `--text-subtle #7D786F`, uppercase, margin-bottom 10px. Copy: `Good morning, {userName}` (time-adaptive from `getGreeting`).
- Headline: `--font-serif` (Newsreader), weight 430, font-size 34px (`--text-hero`), line-height 1.15, letter-spacing -0.015em, color `--text-primary #F2F0ED`, margin `0 0 24px`, `text-wrap: balance`. Structure: `<em style="font-style:italic;color:#FF6B2C">{heroA}</em>{heroB}`. The italic ember word is the ONE emotional serif word per screen.
- All-clear variant swaps the italic color to moss (see all-clear card).

**Loop strip** (container: flex, align center, gap 8, flex-wrap, margin-bottom 28):

- Arrow between pills: span color `--text-faint #55524C`, font-size 11px, glyph `→` (U+2192); the first pill has no leading arrow.
- Pill button: inline-flex, align center, gap 7, border `1px {bc}`, `--radius-pill 99`, padding `6px 13px`, background transparent, color `{c}`, `--font-mono` 9.5px, letter-spacing 0.10em, box-shadow `{sh}`, transition background 140ms; hover background `#141416`.
- Tones: **ember** → bc `rgba(255,107,44,0.5)`, c `--ember #FF6B2C`, sh `0 0 14px rgba(255,107,44,0.15)`. **glacier** → bc `rgba(127,209,220,0.35)`, c `--glacier #7FD1DC`, sh `none`. **quiet** → bc `rgba(255,255,255,0.12)`, c `--text-muted #9C978F`, sh `none`.
- BUILD pulse dot: 5px, radius 99, background `#7FD1DC`, `animation: cadPulse 2s ease-in-out infinite`.
- Pill definitions: `SENSE · {signals}` (discover, quiet) · `DECIDE · {n} CALL(S)` (today, ember when n>0 else quiet) · `DEFINE · {specs}` (plan, quiet) · `BUILD · {workingCount}` (build, glacier, pulse) · `LEARN · {learnCount}` (brain, quiet).

**Main grid:** `grid-template-columns: 1.7fr 1fr`, gap 20, align-items start.

**All-clear card** (empty state, only when zero pending): background `--card #111113`, border `1px rgba(127,191,142,0.3)` (moss hairline), `--radius-card 12`, padding `28px 26px`. Title Newsreader 21px weight 450 `#F2F0ED`, margin-bottom 6: `All clear. ` + `<em italic color:#7FBF8E>Enjoy the quiet roadmap.</em>`. Sub 13px `--text-muted #9C978F`: `The loop is running itself. New calls will find you here first.`

**CallCard** (from OBS-03, quoted so you can verify parity): container `--surface-card-deep #0E0E10`, border `1px rgba(255,107,44,0.25)`, radius 12, padding 20/22. Kind chip mono 9px caps ember in an ember-hairline pill + expiry in faint mono caps; title Newsreader 20px/460 lh 1.3; body 13px/1.65 muted; evidence rows (blossom source pill 8.5px + verbatim quote 12.5px body); actions = ember primary Button + secondary + consequence helper 11.5px `--text-subtle`.

**Calls-answered bar:** track height 3px, background `--hairline`, radius 99; fill background `--ember #FF6B2C`, width = `clearedPct`, transition width 280ms `--ease cubic-bezier(0.23,1,0.32,1)`. Label mono 9px caps `--text-subtle`, e.g. `2 OF 3 ANSWERED`.

**What changed** block: header mono 9px caps `--text-subtle` `What changed overnight`; rows grid gap 11; each row flex gap 10 align baseline: dot 5px radius 99 background `{ch.dot}` (position top -2px), text 13px lh 1.55 `--text-body #B5AFA6`, cause mono 9px letter-spacing 0.06em `--text-faint #55524C`.

**Loop Health aurora card** (the ONE aurora): `--radius-aurora 16`, background `#0F1B12` (healthy hue), two drifting radial blobs (`marigold 0.34` on `cadDriftA 9s`, `moss 0.4` on `cadDriftB 12s`), outer glow `0 0 55px` moss 9%. Content: label mono 8.5px letter-spacing 0.14em `rgba(242,240,237,0.75)` `LOOP HEALTH`; numeral `--font-dotted` (Codystar) 52px `#F2F0ED` letter-spacing 0.04em; note mono 8.5px letter-spacing 0.12em `ON TRACK · +3.2 THIS WEEK`. Hue encodes state: moss-forward healthy, ember-forward needs attention, madder-forward failing. Blobs `aria-hidden`.

**Machine right now card:** background `--card #111113`, border `1px --hairline rgba(255,255,255,0.07)`, radius 12, padding 16/18. Header row: mono 9px caps letter-spacing 0.12em `--text-subtle #7D786F` `The machine right now` (flex:1) + `OPEN →` quiet glacier button (mono 9px, color `--glacier`, hover `#EAF6FF`). Rows grid gap 9: each a full-width `<button>`, dot 6px radius 99 background = status color + its box-shadow glow + status animation, title 12.5px `--text-primary` (ellipsis), step label mono 9px right, cost mono 9px faint.

**Interaction states (design every one):**

- **Hover:** pills background to `#141416`; CallCard and MissionRow lift one surface step + brighter hairline, 140ms, tonal only (nothing translates); machine-now rows dim to opacity 0.85; quiet links brighten to `#EAF6FF`.
- **Focus:** 2px glacier outline offset 2 (`:focus-visible`) on every pill, CallCard action, machine-now row, and the OPEN link.
- **Active / press:** ember primary → `--ember-deep #C2571F`, transform scale(0.985) 140ms.
- **Empty:** zero calls → the moss all-clear card (above); thin What-changed → the §9 instruction; no machine activity → machine-now shows the §9 idle instruction.
- **Loading:** while `needs-you` / `runs` / `loop-pulse` are pending, render skeleton rows in `--surface-card-deep` (no spinner, no shimmer beyond the one sanctioned working line elsewhere); the hero shows the greeting immediately once `greeting` resolves.
- **Error:** if a query errors, show a single quiet line in `--text-muted` (`Could not reach the loop. Reload to retry.`), never a red banner (madder is outcome-only).
- **Answering choreography** (extensions §7): the answered CallCard rises out (`cadRise` reversed, 200ms) while the queue closes the gap at 280ms; the nav badge ticks down with one `cadPulse`; the hero count word crossfades 140ms; the linked machine-now step label hands off ember to glacier (ember glow fades 200ms, glacier pulse starts next beat).

## 8. Restructuring / renaming / modification

- **Lucide removal (required):** delete every `lucide-react` import from `_authenticated.today.tsx` (`Sparkles, Plus, RefreshCw, Rocket, ShieldAlert, Check, AlertTriangle, Target, Activity, ArrowUpRight, ArrowDownRight, Minus`). Status is a 6px glowing dot + mono word; affordances are unicode (`→`). "Done" requires zero lucide in the Today chrome.
- **Parchment component imports dropped from Today:** `AppShell`/`TopBar` (now hoisted by OBS-02, so the route stops wrapping them), `CadenceMark`/`MonoLabel` from parchment `Primitives` (use the OBS-03 `MonoLabel`), `LoopStations` (superseded by `LoopStrip`), and the dropped panels: `ColdStartOnramp`, `InsightRail`, `FocusNext`, `WedgeTeardown`, `CostPerOutcomeChip`, `GettingStartedChecklist`, `MemoryExpiryBanner`, `StatusUpdateDialog` (ShareStatusButton), `DecisionCard`, `PendingApprovalsBar`. Remove their imports and the queries that fed only them (`focus-next`, `insight-rail`, `cold-start`, and the tasks CRUD if the tasks widget is dropped).
- **Query deletions:** drop `["focus-next"]`, `["insight-rail"]`, `["cold-start"]` and, if the tasks widget is not ported, `["tasks"]` + its `createTask`/`updateTask`/`deleteTask` mutations. Keep `["greeting"]`, `["needs-you"]`, `["loop-pulse"]`, `["learnings"]`, `["runs"]`, `["acceptance",14]`, `["autonomy",14]`, `["projects"]`, `["dashboard"]`.
- **Mutation change:** `decideApproval.onSuccess` widens its invalidation from `["needs-you"]` only to the full linked set (§5 step 9) so cross-object sync happens with no reload.
- **No route rename, no redirect here.** The `/today` path is unchanged (route folding is OBS-10). No nav-model edit here (that is OBS-02 render + OBS-10 fold). No deletions of the parchment `src/components/today/*` files (other routes may reference them until OBS-10); only the imports leave this route.

## 9. Copy / voice (humanized, exact strings)

- **Eyebrow:** `Good morning, {userName}` (time-adaptive: Good morning / Good afternoon / Good evening from `getGreeting`).
- **Hero heroA (ember italic word):** 0 → `All clear.` · 1 → `One call` · 2 → `Two calls` · 3 → `Three calls` · N → `{N} calls`.
- **Hero heroB (normal):** 0 → ` The loop is running itself.` · else → ` need your judgment today.`
- **Loop pills:** `SENSE · {n}` · `DECIDE · {n} CALL` / `DECIDE · {n} CALLS` (singular at 1) · `DEFINE · {n}` · `BUILD · {n}` · `LEARN · {n}`.
- **All-clear card:** title `All clear. Enjoy the quiet roadmap.` (the second half ember-to-moss italic); sub `The loop is running itself. New calls will find you here first.`
- **What changed header:** `What changed overnight`. Sample rows (from live learnings/outcomes, tone to match): `Checkout fix outcome landed: predicted -12% drop-off, actual -19%.` cause `LEARNING · RE-RANKED 2 BETS`; `Scout clustered 31 new signals overnight; mobile capture keeps climbing.` cause `SENSE · 12M AGO`; `Acme upgraded to the team plan after the usage-alerts demo.` cause `SIGNAL · EVIDENCE`.
- **Calls-answered bar label:** `{answered} OF {total} ANSWERED`.
- **Loop Health:** label `LOOP HEALTH`; note `ON TRACK · +{delta} THIS WEEK` (or `NEEDS ATTENTION` / `SLIPPING` per hue state).
- **Machine right now:** header `The machine right now`; link `OPEN →`.
- **Toasts (singleton, 3.6s):** approve → `Good call. The PR is open.` · send back → `Sent back. Builder is revising · nothing ships.`
- **CallCard consequence helper (example):** `Opens the pull request · nothing ships without you`.
- **Empty / instruction states (with time estimate, never a blank box, never an exclamation mark):**
  - Zero calls: the all-clear card above (the moss-hairline instruction).
  - What changed empty: `Nothing shifted overnight. The next outcome shows up here the moment a mission lands.`
  - Machine idle: `The cockpit is idle. Send something worth building from Discover · about two minutes.`
- Humanized law on every string: no em or en dashes (use `·` or a plain hyphen), no exclamation marks, no emoji, no AI-cliche words. Mono-caps metadata uses middots.

## 10. Acceptance criteria

- [ ] Today renders in Obsidian tokens under `[data-obsidian]`; zero lucide imports remain in `_authenticated.today.tsx`.
- [ ] Hero shows the mono eyebrow, Newsreader 34px headline, and exactly one ember italic count word; the word rewrites live (`Two calls` to `One call` to `All clear.`) as calls are answered, with no reload.
- [ ] The loop strip shows five pills with live counts from `getLoopPulse`; DECIDE is ember only when calls pend; BUILD carries a pulsing glacier dot; each pill jumps to its surface.
- [ ] Calls render as the canonical OBS-03 `CallCard`; zero calls shows the moss-hairline all-clear card.
- [ ] Answering a call (A/S or buttons) updates, with no reload: the queue (card rises out, gap closes), the nav badge (ticks down, hidden at zero), the hero count word, the calls-answered bar, the linked machine-now step label (to MERGING/REVISING), and the linked mission in Build.
- [ ] Exactly ONE aurora on the screen (Loop Health); the restraint budget passes.
- [ ] The screen makes complete sense in grayscale; every status dot ships its mono word.
- [ ] Toasts are singleton, voice-correct, auto-dismiss 3.6s.
- [ ] All motion gates on `prefers-reduced-motion`; the progress bar animates on change only, never from zero on mount.
- [ ] `tsc --noEmit` is 0; `bun test` green including the new hero + loop-strip tests.

## 11. Prototype-parity checklist (last gate, tailored)

1. **Rail:** the OBS-02 rail is present with the single Today badge = unanswered call count, and the badge ticks to hidden at zero.
2. **Surface chrome:** container max-width ~1060, 36/32/64 padding, `cadRise` entrance; the two-column 1.7fr/1fr grid at 1440px matches.
3. **Type:** eyebrow mono 9.5px/0.14em; hero Newsreader 34px/430 with the one ember italic word; What-changed 13px body; mono labels 9-9.5px caps with middots; Loop Health Codystar 52px.
4. **Color:** zero hexes outside tokens; ember only on the Call queue, the DECIDE pill when pending, and the one CTA; moss on the all-clear border and positive outcomes; glacier on BUILD pulse and links; Loop Health glow `0 0 55px` moss 9%.
5. **Motion:** pill hover 140ms one-step; BUILD dot `cadPulse` 2s; aurora `cadDriftA` 9s / `cadDriftB` 12s; answered card `cadRise` reversed 200ms + gap 280ms; progress width 280ms; reduced-motion kills all.
6. **Behavior:** A/S answer the current Call; answering rewrites hero + badge + progress + machine-now step + linked mission; jumping surface closes any slide-over; badge hidden at zero.
7. **Copy:** plain-words buttons (Approve / Send back), consequence helpers, mono-caps metadata with middots, no em dashes, no exclamation marks; the hero and all-clear copy match the prototype register.
8. **Grayscale** screenshot still reads; restraint budget audited (one aurora, one ember CTA, one machine voice).

## 12. Verification + gates

- `tsc --noEmit` = 0.
- `bun test` green, including the NEW `src/components/obsidian/today/today-hero.test.ts` (heroA/heroB for pending 0/1/2/3/N) and `loop-strip.test.ts` (DECIDE ember at pending>0, BUILD pulse present); if a `decide` reducer is extracted, a test for the `gateId`-match step-label flip to MERGING.
- `bun run build`: RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error (hub §11). In a worktree treat `tsc` + `bun test` as the real gates; run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot Today with color removed; it must still read (every dot has its mono word).
- **Restraint budget audit (§4):** confirm one aurora (Loop Health), at most one ember CTA, one machine voice (glacier), status color only on real status, ≥ 90% neutral.
- **`impeccable` / humanized scan:** grep every new UI string for `-`, `-`, `!`, and the banned-word list (`seamlessly, leverage, empower, robust, unlock, delve`).
- **Manual checks:** answer both a SHIP-IT call and a WORTH-BUILDING call; watch the hero, badge, progress, machine-now row, and (with Build open) the mission row flip live. Toggle `prefers-reduced-motion` and confirm all animation stops. Resize to 1440px and compare to the prototype.
- **Side-by-side screenshots** of prototype vs. built Today (full screen, hover state, all-clear state) in the ship report, with any prototype-delta noted so the contract can absorb it.

## 13. Risks · gotchas · founder-gates

- **Cross-object sync is the whole point; getting it half-done is the top risk.** Answering a call MUST update the queue, badge, hero, progress, machine-now step, and the linked mission with no reload. The wiring is the widened invalidation set (§5 step 9); verify the Build queue (`["studio-sessions"]`) is actually the key the mission surface reads, and add `["dashboard"]`/`["runs"]` so Today itself rewrites.
- **Aurora count creep.** Loop Health is the ONLY aurora on this screen. Do not let a second score moment (an outcome card, a teardown confidence) render an aurora on Today; if one appears, it is a restraint-budget fail.
- **Dropped panels re-homing.** Cold-start, insight rail, wedge teardown, getting-started checklist, and the tasks widget are dropped from the ported Today. Confirm nothing critical dead-ends because of the drop; if a panel has real value with no Obsidian home yet, flag it for OBS-10 rather than smuggling parchment back onto Today.
- **`getNeedsYou` shape mapping.** The three sub-arrays (`approvals`, `prdCalls`, `oppCalls`) map to three CallCard kinds. Preserve the session-local `deferred` "Not now" behavior (hero counts true workload, queue hides deferred) or explicitly retire it; do not silently change the count semantics.
- **Loop Health score source.** `getAcceptanceRate` + `getAutonomyRatio` produce the 0-100 score and hue; if the live values are sparse for a new workspace, cap the note to the honest sparse-state voice rather than a fake `+3.2`.
- **Founder-gates:** none unique to OBS-04. It changes no routes and no data. The onboarding item (OBS-14) depends on this landing on Today; keep the surface deep-linkable and stable.

## 14. Interlinks

- **Hub:** [`README.md`](./README.md) (shared canon: tokens §5, restraint budget §4, parity checklist §5.9, state model + core behaviors §5.10, keyboard §5.11, a11y §5.12).
- **Depends on:** [`OBS-03.md`](./OBS-03.md) (primitives: CallCard, MissionRow, AuroraCard, StatusDot, Button, Toast, MonoLabel). **Build-order neighbors:** [`OBS-05.md`](./OBS-05.md) (Build: the mission slide-over Today hands off to, and the shared gate-sync target), [`OBS-14.md`](./OBS-14.md) (onboarding golden path lands here).
- **Canon anchors:** `DESIGN-OBSIDIAN.md` §8 (IA · Today), §9 (Components: Call card, Mission row, Status dots, Verdict chips), §10 (Voice); `design-reference/obsidian-v3/components.md` anatomies "CallCard", "Aurora score card (Loop Health)", "Mission row (Build)", "Loop pills (Today)", "Toast"; `design-reference/obsidian-v3/implementation-notes.md` §"Core behaviors" (Answering a call · cross-object sync); `design-reference/obsidian-extensions.md` §7 (micro-interactions: a Call clearing, a gate opening, toast, progress) + §9 (all-clear empty state).
- **Prototype (the floor):** `design-reference/obsidian-v3/design-reference/cadence-app.html` (the `today` surface render: hero heroA/heroB, `pillDefs`, `CALLS`, `CHANGED`, Loop Health, machine-right-now).
- **Board:** [`../feature-dashboard.md`](../feature-dashboard.md) (G14, OBS-04) · **summary bible:** [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · **strategy tie:** [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) · **doctrine:** [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md), [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
