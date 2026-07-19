# Reimagining HANDOFF — live state (2026-07-19, updated at session-limit cutoff)

> For ANY tool or session continuing this work (Claude Code, Kiro, anything else). Branch: `sandbox/mission-control-v2` (pushed to origin). Production, main, and the public landing are untouched and must stay untouched. NO merge to main without the founder's explicit approval in his own words.

## Read order
1. [problem-statement.md](./problem-statement.md) — the founder-approved charter (v3).
2. [design-language-spec.md](./design-language-spec.md) — the governing design doc. **Addendum 1.1 at the bottom overrides the body** (founder red-lines: edge-strip ban, craft bar, color revision pending, Threads + Artifacts homes, top Ask affordance, landing clarity).
3. [execution-plan.md](./execution-plan.md) — the full phased plan (R, M, 0-5, two founder gates).
4. [journey-catalog.md](./journey-catalog.md) · [build-engine-strategy.md](./build-engine-strategy.md) · [gap-register.md](./gap-register.md) · [research/](./research/) · [mockups/](./mockups/) with [GATE-1-DECISIONS.md](./mockups/GATE-1-DECISIONS.md).

## Founder decision state
- Gate #1: opened with "pls continue" — build proceeds on the RECOMMENDED option for every open item (see the Provisional record inside GATE-1-DECISIONS.md). All overridable at his live review.
- In his own words: Settings five-group recluster approved; standalone Ask panel stays retired (may return only on his ask); ember stays.
- PENDING his picks (Gate 1b, exhibits partly built): color v2 (retuned soft/faint tiers; memory gold REPLACED by a new hue; machine blue vs one challenger; light-mode strategy), starfield app-idle yes/no after seeing a rendered variant, Threads home concept, Artifacts naming + placement.
- B5 dry run (real credits, patch driver, test repo, small budget): authorized-by-continue, deferred until Build-face integration.

## DONE on this branch (verified: `bunx tsc --noEmit` clean, 78/78 new tests pass)
- Charter + research dossier + 8 swept mockups + gate sheets (commits 490f7909, 97c64d64, 2a98094b, 8f7e48a1, 6b4e0a62).
- `src/styles/ink.css`: five-tier voice ramps (ember/machine/memory), amber `--verdict-working` deleted and usages migrated.
- `src/lib/surface-registry.ts` + `src/lib/__tests__/surface-registry.test.ts`: every server-fn domain registered {kind, home, opensFrom, status}; the CI no-orphan gate.
- `src/lib/loop-state.functions.ts` + test: getLoopState per-stage spine states (done/active/gate/quiet/inferred) composing existing approvals/loop-health/stage-events/today-lanes modules; pure mapper unit-tested.
- `src/components/mission/Spine.tsx` + tests: the live 7-node spine (states, slice highlight, start/end annotations, onStageSelect).
- `src/components/mission/primitives/`: SurfaceHeader, PulseLine, GateChip, ReceiptLine (cost NEVER inline; kebab details only), NextLine, WarmSlot (no empty render path) + barrel.
- `src/lib/mission-vocabulary.ts` + test: working-state decks as data, drawWorkingLine(stage, slug, seed), no-repeat shuffle.
- Breadcrumb dedupe (founder bug): PageHeader eyebrow now optional/omitted where the TopBar crumb already names the surface; 9 surfaces edited.
- `research/threads-and-artifacts.md`: the Threads + Artifacts concept research (landed before the session limit).

## NEXT, in order (exact specs)
1. **Integrate (Phase 1 finish)**: `src/routes/_authenticated.m.$productId.tsx` + `_authenticated.m.index.tsx` (index resolves last-active product; empty workspace = prospect state via WarmSlot, never blank). `src/components/mission/MissionShell.tsx`: five regions per mockups (_shell-template.html): mission TopBar (mark, product switcher reusing AppShell workspace data, 4-door nav Mission Control/Approvals/Brain/Settings, needs-you ember pill on the SAME `["approvals","queue",workspaceId]` query key: ONE COUNT ONE SOURCE, plus the always-visible Ask button with its shortcut), Spine fed by getLoopState, Thread column (honest placeholder: day label + ReceiptLine receipts; real Composer is Phase 2), Canvas rendering the EXISTING stage surface component per `?stage=` param (temp faces; where not extractable, an honest "Open the full workbench" card linking to the old route), docked composer strip that dispatches `supaprod:open-ask` (no second input box). Keys 1-7 shell-local. Regenerate routeTree the repo way (never hand-edit). Old app untouched.
2. **Verify**: tsc, scoped tests, logged-in Playwright smoke of /m (demo creds in docs/operations/demo-credentials.md; dev server needs default Node 26; `bun run build` needs Node 20.20.2), adversarial diff review (five failure verdicts, one-count-one-source, cost-quiet, no purple, no strips).
3. **Gate 1b exhibits** (design round): color-v2-board.html (options on dark AND light, token diffs in details blocks), starfield-variant.html (3 stacked frames), card-craft sweep (_shared.css edge strips removed + propagate to ALL mockups' inline copies + card-spec.html), screen-9-threads-home.html (from the research doc), landing-when-you-login.html (annotated returning-user + first-run), then GATE-1B-REVIEW.md decision sheet + gap-register additions.
4. **Phases 2-5** per execution-plan.md (conversation+journeys; faces+tray+strip; depth+settings+agents; seed+verify+Gate #2).

## Binding rules (grep-able summary; full text in the spec + addendum)
Supaprod naming · sandbox only · claim never outruns wiring · humanized strings (no em dashes in code/UI; docs tolerated) · cards: NO colored edge strips, craft grid (chip left / mono timestamp right / body / actions) · costs never inline (credits behind a details click) · one ember locus per screen · machine blue full-hue only on the single live locus · no purple · components consume token vars only · registry entry required for every domain (CI-enforced) · Today's jobs live in the room (pill/Briefing/spine) · keys 1-7 = stages.

## Session/orchestration notes (Claude Code specific; ignore in other tools)
- Workflow scripts + run IDs for cache resume live under the session dir; see git history of this file for IDs. Fresh runs are equally fine: the specs above are self-sufficient.
- This branch's work was produced by parallel agent workflows; commits are chunked by phase with WHY messages. Continue that discipline.
