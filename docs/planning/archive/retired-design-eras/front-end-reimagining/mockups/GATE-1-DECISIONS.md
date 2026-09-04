# Gate 1: the founder's decision sheet

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> 2026-07-19. Companion to the mockup gallery ([index.html](./index.html)) and the [Build Engine Strategy memo](../build-engine-strategy.md).
> Mark every box in your own words or with a check. Anything left unmarked stays open and blocks its section, not the whole gate.

---

## A. Visual decisions (from screen 8, the decision board)

The full exhibits, with-and-without frames, and swatches are on [screen-8-decision-board.html](./screen-8-decision-board.html). The calls, as a checklist:

### A1. Starfield in the app

- [ ] **No stars anywhere in the app** (plain ink on every surface)
- [ ] **App-idle variant, scoped** (recommended): roughly half landing density, far layer only, on workspace and product empty states, onboarding and tour frames, and the Brain at idle. Removed, not dimmed, the moment a surface holds content. Working surfaces (Mission Control mid-loop, Thread, Canvas, Approvals) never carry stars under either option.

Notes: ____________________

### A2. The color law

- [ ] **Adopt** the three five-tier voice ramps (ember, machine blue, memory gold), the verdict layer (pass green, fail red, amber deleted), and the four bans (no purple anywhere, no fourth voice, no gold outside memory, no ember copy that skips the consequence)
- [ ] **Change something first**: ____________________

### A3. The approval choreography

- [ ] **Approve** the four-beat signature moment as storyboarded (gate resolves, receipt and toast, spine node fills machine blue within 1 second, strip verb changes; 700 to 900ms total, optimistic state first)
- [ ] **Rework the sequence**: ____________________

Optional beat 3b, the one far-layer star drift on approval (only on surfaces already carrying the app-idle backdrop):

- [ ] Yes, keep the beat
- [ ] No, cut it

### A4. The sanctioned retirements (no silent scope cuts; marking a box makes the cut yours)

| Piece | Recommendation | Your call |
| --- | --- | --- |
| Weather widget | Retire. Decoration that answers no journey question; the Briefing opens the day. | [ ] Retire / [ ] Keep |
| Focus dock | Retire. Its job is the Approvals tray plus the Working strip; a second home splits the one count. | [ ] Retire / [ ] Keep |
| Liquid glass | Retire. Blur-driven depth fights the hairline-and-layering system and reads borrowed. | [ ] Retire / [ ] Keep |
| Standalone Ask panel | Retire. The Composer is the one input; a surviving second box rebuilds the three-input problem. | [ ] Retire / [ ] Keep |

---

## B. The five build-engine decisions (memo section 10)

Full grounding: [build-engine-strategy.md](../build-engine-strategy.md).

### B1. The two-rung owned ladder

Supaprod builds with its own drivers: the already-built single-shot patch driver is the launch rung, and a true Claude Agent SDK agentic driver is the premium rung that lands in the PC-35 lane, not this sprint. The rebuilt front end is designed around this native story, so no journey ever detours a user to an external codegen platform. **Memo recommends: approve.**

- [ ] Approve / [ ] Adjust: ____________________

### B2. Capability-class model routing

Product code stops naming vendor models: drivers request a capability class (codegen.economy, codegen.standard, codegen.frontier) and one config table resolves the concrete model, per-workspace overridable for BYOK. A better model shipping anywhere becomes a one-row config change with zero product-code change, and it removes the current vendor hard-coding violations. **Memo recommends: approve as in-sprint scope (small).**

- [ ] Approve / [ ] Adjust: ____________________

### B3. The driver rename (naming honesty)

The shipped driver carries the id `claude-sdk` but does not use the Claude Agent SDK, which is a claim outrunning wiring inside our own codebase. Rename it to something engine-honest (for example `patch`) and reserve `claude-sdk` for the real Agent SDK driver, or keep the id and fix every header and surface string to "single-shot patch driver"; either way the mission receipt must name what actually ran, and the fix lands before any UI string names the driver. **Memo recommends: approve (either option) before UI strings.**

- [ ] Approve rename to `patch` / [ ] Approve keep-id-fix-strings / [ ] Adjust: ____________________

### B4. BYO engines live in Settings only

Devin, Codex, Cursor, and self-hosted OpenHands live in Settings, Build engines, as an explicitly enterprise-labeled section: never in onboarding, never in any journey, never a modal interrupting a build. Every workspace builds on the owned ladder by default, and a misconfigured BYO engine falls back silently to the native floor so it can never dead-end a journey. **Memo recommends: confirm.**

- [ ] Confirm / [ ] Adjust: ____________________

### B5. The patch-driver dry run

Authorize one real dry run of the dormant patch driver on a test repo, with real credits and a small budget. This is the step that lets the flag flip inside the sprint window instead of shipping a Build stage that has never built. **Memo recommends: authorize.**

- [ ] Authorize / [ ] Hold: ____________________

---

## C. The Settings regrouping

Screen 7 replaces the 17-section Settings with five named groups: You, Workspace, Agents, Connections & Data, Plan & Usage (twenty doors, no Advanced fold, Memory moved out to Brain with a pointer, Admin behind Workspace, People).

- [ ] Approve the five-group recluster as shown / [ ] Adjust (name the group or door to move): ____________________

---

## D. Sign-off

**Gate 1 approval means app code starts.**

Signed (in your own words): ____________________  Date: ____________

---

## Provisional record (2026-07-19)

The founder replied "pls continue" after reviewing the package. The build proceeds on the RECOMMENDED option for every item above: A1 app-idle starfield scoped as described, A2 color law adopted, A3 choreography approved with the star-drift beat kept only on backdrop surfaces, A4 all four retirements (matching the founder's earlier F3 pre-approval in the archived ledger), B1 two-rung owned ladder, B2 capability-class routing in sprint, B3 naming honesty fixed before any UI string names the driver (implementation picks the less invasive of the two options), B4 BYO in Settings only, C the five-group recluster. B5 (the real-credit dry run) is deferred until Build-face integration and runs on a test repo with a small budget. Every choice here is provisional and overridable at the founder's live review; none of this constitutes his sign-off on specifics he did not mark.

**LOCKED by the founder (2026-07-19 late): Pick 1 tier retune** from the color v2 board. "Please go ahead with your recommended tier one retune, whatever you have, and lock it." Applied to src/styles/ink.css (human + machine soft/faint tiers, dark and light). Picks 2 (memory hue), 3 (machine hue), 4 (light-mode strategy) remain open on GATE-1B-REVIEW.
