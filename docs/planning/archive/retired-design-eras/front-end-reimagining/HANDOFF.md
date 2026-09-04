# Reimagining HANDOFF — live state + continuation spec (updated 2026-07-19 night)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> For ANY tool continuing this work (Amazon Kiro, Claude Code, anything else). Branch: `sandbox/mission-control-v2` (pushed to origin). Production, main, and the public landing are untouched and MUST stay untouched. NO merge to main without the founder's explicit approval in his own words. Commit + push after every verified chunk, with a one-line WHY in the message.

## Read order (before any work)
1. This file, fully.
2. [problem-statement.md](./problem-statement.md) — the founder-approved charter.
3. [design-language-spec.md](./design-language-spec.md) — the governing design doc. **Addenda 1.1, 1.2, 1.3 at the bottom override the body.**
4. [execution-plan.md](./execution-plan.md) — the phase plan. [journey-catalog.md](./journey-catalog.md) — the journeys. [gap-register.md](./gap-register.md) — 64 tracked gaps with dispositions.
5. [mockups/GATE-1-DECISIONS.md](./mockups/GATE-1-DECISIONS.md) + [mockups/GATE-1B-REVIEW.md](./mockups/GATE-1B-REVIEW.md) — what the founder decided, verbatim record.
6. [build-engine-strategy.md](./build-engine-strategy.md) — before touching the Build face.

## Founder decisions: LOCKED (do not reopen)
- Mission Control IA (room: TopBar / Spine / Thread / Canvas / Composer; nav 4: Mission Control, Approvals, Brain, Settings). Journey-first.
- Settings five-group recluster. Standalone Ask panel retired (returns only on his ask). Retirements: weather widget, focus dock, liquid glass.
- Color system: ember stays the V1 tone (dark #ff6b2c, light #f05a1a) · machine voice BLUE (#6cb0f5 / #2e6ed6) · memory speaks VELLUM (applied in ink.css both themes) · Pick 1 tier retune applied · **chips wear slate silver** (`--chip-*` tokens; ember NEVER on chips, only on primary actions).
- **Starfield: the scoped app-idle variant is APPROVED** (2026-07-19 night): roughly half landing density, far layer only, ONLY on workspace/product empty states, onboarding/tour frames, and Brain at idle; removed (not dimmed) the moment a surface holds content; never on working surfaces; reduced-motion gated. Implement in Phase 3/4 where those surfaces get built.
- Cost-quiet everywhere: no per-action figures inline; credits behind a details/kebab click only.
- Cards: NO colored edge strips ever. Craft grid: chip row (label left, mono timestamp right), body, evidence chips, action row.

## Founder items still OPEN (present, do not decide for him)
## Founder items RULED (2026-07-19 night, his words) + what is left
1. **Card source-recognition treatment**: his ONLY red-line was the colored edge strip ("big NO"); it is already gone everywhere. He will pick a treatment if shown options. **Options rendered** in `mockups/card-source-recognition-options.html` (Option A chip-only, B faint voice wash, C corner source mark; memory = Vellum in all, both themes). **AWAITING his pick (A/B/C).** Until he picks, cards stay chip-only (no strip, no interim wash claim).
2. **Threads home**: **APPROVED** ("green with it"). Build the surface per `mockups/screen-9-threads-home.html`. Backend (folders, search, threads view = gap register K1-K5) is migration work; he authorized building it (writes on sandbox, applies at his Gate-2 merge).
3. **Artifacts**: name is **"Artifacts"** (not Library/Shelf); placement = the recommendation (a per-product Artifacts tab on the Canvas rest face, extended to `/artifacts` for the workspace view). Backend = gap register K6-K9 migrations, authorized, applies at Gate-2 merge.
4. **Tray verbs**: **option (a) AUTHORIZED - build the send-back + snooze backend.** Snooze needs an `approval_snoozes` add + a tolerant queue filter; send-back needs a return-with-notes path per revisable family. Migrations apply at his Gate-2 merge; the queue read must degrade gracefully until then.
5. Gate #2 itself: the live dev-server review; merge only on his words.

## DONE and pushed (verify with git log --oneline on the branch)
- Charter, research dossier (research/), 15 swept mockups + exhibits, gate sheets, gap register (64), agent-roster canon.
- `src/styles/ink.css`: voice ramps + all color locks above + `--chip-*` slate ramp.
- `src/lib/surface-registry.ts` (+CI test): every server-fn domain registered {kind, home, opensFrom, status}; the no-orphan gate. 'threads' and 'artifacts' entries planned.
- `src/lib/loop-state.functions.ts`: getLoopState per-stage spine states. `src/lib/mission-vocabulary.ts`: working-state decks + drawWorkingLine.
- `src/components/mission/`: Spine.tsx; primitives/ (SurfaceHeader, PulseLine, GateChip [chip=slate, card actions=ember], ReceiptLine [no inline cost], NextLine, WarmSlot [no empty render path]); MissionShell + MissionShellView; tests.
- Routes `/m` + `/m/$productId` (?stage= drives the canvas; existing surfaces render as temp faces; keys 1-7; one-source needs-you pill). Verified live: build-evidence/*.png.
- Breadcrumb dedupe across 9 surfaces (one wayfinding source). Two crash fixes (DiscoverSurface useSearch strict:false; AutoClustered hooks order).

## CONTINUATION — do this, in order

### Phase 2: CLOSED (2026-07-19 night, commit `5b26cfc4`, HEAD = origin). tsc clean, 3536/3536 tests, live smoke verified (Briefing renders, a typed question streams a real answer, the "Just write the PRD" journey chip lights only the Plan slice on the spine, both shortcut keys open the same one ComposerOverlay on old and new surfaces, mic works). Evidence: `build-evidence/phase2-*.png`. Nothing left to check or finish here. **Start at Phase 3.**

### Per-phase discipline (binding for every phase below, not optional)
Before moving from one phase to the next: `bunx tsc --noEmit` clean, the relevant `bun test` scopes green, a live smoke check where the phase touches a rendered surface, then commit with a one-line WHY and `git push origin sandbox/mission-control-v2:sandbox/mission-control-v2`, then confirm `git rev-parse HEAD` equals `git rev-parse origin/sandbox/mission-control-v2` before starting the next phase. Never begin Phase N+1 with Phase N's work still uncommitted or unpushed. If a phase runs long, checkpoint-commit partial verified progress rather than holding it all until the end.

### Phase 3: DONE (2026-07-19 night). tsc clean; 13 new phase3 tests green; full `bun test` = 5282 pass with the SAME 16 fail / 10 errors as the clean committed HEAD (proven by `git stash -u`), so ZERO new failures. Live-verified logged in on `/m` (demo@redcadence.app): all seven faces render real data with zero console errors (Discover shows real signals, Plan shows real approved specs with Design-it/Build-it doors, Design renders the live scaffold, Build lists real missions, Ship + Learn show honest empty states); the ApprovalsTray opens via the `?panel=approvals` deep link AND the Working strip's "N waiting on you"; two real gate cards render with the honest verbs; the signature moment fired (approving dropped the count 2->1 on the nav pill and the strip, the card left the tray, the Decide node's ember cleared, Discover's receipt refreshed). Files: `CanvasFace.tsx` (the contract), `ApprovalsTray.tsx`, `WorkingStrip.tsx`, `AppIdleBackdrop.tsx`, `faces.tsx` (seven faces + `StageCanvasFace` router), `__tests__/phase3.test.tsx`; edited `MissionShellView.tsx` (face owns its header now; `workingStrip` + `canvasBackdrop` slots), `MissionShell.tsx` (real faces + tray + strip + the optimistic signature moment), `GateChip.tsx` (`onSendBack` optional), the `/m/$productId` route (`?panel=approvals`).

**FLAGS FOR THE FOUNDER (decisions/deviations, none silent):**
1. **Tray verbs (honesty vs the mockup).** The backend `decideApprovalItem` performs exactly two verdicts, approve and reject; there is no send-back-with-notes resolver and no snooze. The tray ships the two wired verbs, **Approve and run (1)** and **Decline (3)**, with the queue item's own honest per-family consequence copy. It does NOT render "Send back" (needs a distinct resolver) or "Snooze" (needs a `snoozed_until` column, gap register D1, and migrations are barred on this branch). So the keys are 1/3, not the mockup's 1/2/3/H. **Decision needed: build the send-back + snooze backend, or keep the two honest verbs.**
2. **Starfield.** Built as a dedicated `AppIdleBackdrop` component, NOT a `LandingBackdrop` variant, to keep zero risk of a regression on any public page (hard rule). Same approved visual (18 far stars, 0.24 opacity cap, CSS breathe + 120s drift, reduced-motion gated). Scoped to a genuinely idle room (every stage quiet/inferred).
3. **Design face.** The `/p/$slug` share viewer sets a frame-blocking header, so it cannot be iframed; the face renders the live scaffold via same-origin `srcDoc` (the `DesignScaffoldPanel`/`getPersistedScaffold` idiom) and "Open full-screen" links out. Works.
4. **Build face.** Per gap E8 it ships as the missions list + status + step count + an "Open the build" door into the workbench for the diff/CI/preview depth; no terminal is shown or faked. Wiring the inline diff/CI/preview to the native driver is Phase 4 (after the B3 driver-rename honesty fix).
5. **`/approvals` route.** Not yet redirected into the room + tray; the legacy surface keeps serving (strangler rule), and redirect retargeting is Phase 5 per the plan. In the room the tray is reached via the strip, the `?panel=approvals` deep link, and clicking a gate node on the Spine.

### Phase 3 (original spec, as built above)
1. Seven CanvasFace implementations on the CanvasFace contract (state-sentence header + ONE primary action + designed empty/loading/error; WarmSlot for empties). Strangler rule per stage: the legacy route keeps serving until its face passes review; then it redirects. Known debt: the Discover temp face still renders its old in-page chrome inside the canvas; faces shed legacy PageHeader/TopBar chrome.
2. ApprovalsTray: right slide-over; GateChip cards; keys J/K traverse, 1 approve, 2 send back, 3 decline, H snooze, Enter opens evidence; `/approvals` deep-links to room + tray open; deciding visibly advances the room.
3. WorkingStrip: always-on agent activity line (actor + drawWorkingLine verb + object + time), receipts/trace one click in, NO cost figures; reuse useLiveActivity (src/components/supaprod/LivePulse.tsx).
4. The signature moment: approve → gate resolves, receipt lands, spine node flips to machine blue within 1s, strip verb changes; 700-900ms total, optimistic, reduced-motion gated. This is the ONE big motion.
5. Starfield app-idle variant lands on the surfaces it is scoped to (see LOCKED).
6. Cost-quiet pass over everything Phase 3 touches.

### Phase 4
Drawers (Under-the-hood: tabs reuse src/components/engine-room/rooms/* verbatim; Crew drawer: the 13-agent roster in-context); Brain canvas (knows + runs); Settings rebuilt to the five approved groups (all 17 legacy sections' functionality mapped via surface-registry, nothing orphaned; brand/design config relocated as a one-time feed); agent management (roster rows with plain-words approval modes reusing resolveApprovalMode/updateToolMode wiring, tool/MCP grants, workspace + per-product knowledge/instructions per research/threads-and-artifacts.md and ia-reclustering.md; anything needing new backend is a flagged gap, never silent); analytics homes; tooltip layer + opt-in skippable guided tour; Build face wired per build-engine-strategy.md (FIRST the B3 naming-honesty fix: the driver id claims claude-sdk but is a single-shot patch driver; receipt must name what actually ran; B5 dry run is authorized: test repo, small real-credit budget); Design face interactive prototypes (prototypes/design-scaffold/PreviewPanel seams); Threads + Artifacts surfaces ONLY after the founder signs their concepts (open items above).

### Phase 5
Parameterize the Helio Labs seed into a per-account `seed_sample_workspace(p_owner)` (SAMPLE badged, never mixed into real counts); fill seed gaps (all 10 approval kinds, orchestrator runs, one failed-then-recovered run, stage_events receipts, credible credit numbers); clean stale demo data LAST; one-question onboarding ("What are you building?") replacing the five-screen flow; retarget legacy redirects (no chains); copy pass (humanized, sharp-PM); generate the coverage matrix from surface-registry for the founder; demo script for his video covering EVERY journey; then the Love-Gate walkthrough on a fresh account, timer running, any FAIL blocks:
- 10-second test: a cold viewer states "you tell it what to build, agents do it, you approve" from screen 1; ember in exactly one zone; no empty panel anywhere.
- 5-minute test: signup → one question → first run streaming < 60s; first real gate < 3 min; approving visibly starts the next pass; 3 or fewer human decisions to first felt value; sample always badged.
- Every surface: purpose line present; what's-happening answerable without clicking; needs-me is a GateChip or an honest who-acts-next line; NextLine wherever work is in flight; no unbounded lists.
- Depth/honesty: every count/receipt opens a peek; every peek offers one door; traces/evals/rooms reachable without shortcut keys; no string claims unwired behavior; zero em dashes; buttons verb+object.
- Enterprise scan: receipt → immutable trace in 2 clicks; approvals purpose line states the governance guarantee; memory view shows correct/delete controls.
- Mechanical: dark + light + system live-switch on every touched route; keyboard path through queue and gates; reduced motion; AA contrast.
Then STOP: present the live dev server to the founder for Gate #2. He approves merges in his own words only.

## Environment + verification
`bunx tsc --noEmit` (must stay clean) · `bun test <scopes>` (5 pre-existing SignalCard failures in src/components/discover are known, not yours) · dev server `bun run dev` needs default Node 26 (predev guard) · production build `bun run build` needs Node 20.20.2 · demo login: docs/operations/demo-credentials.md · never edit src/routeTree.gen.ts by hand (regenerate via dev/tsr) · never commit .claude-flow/* churn · Supabase facts via the Lovable/Supabase MCPs where available, never guessed.

## Visual references (build to these)
The mockups/ folder is the visual target per surface: _shell-template.html (shell contract) · screen-2 (room at rest, Phase 2/3) · screen-4 (tray + gate cards, Phase 3) · screen-3 (Build face, Phase 3/4) · screen-5 (journey start/done, Phase 2/3) · screen-6 (Design face, Phase 4) · screen-7 (Settings + Agents, Phase 4) · screen-9 (Threads home, Phase 4 after founder sign-off) · screen-1 + landing-when-you-login (first-run/post-login, Phase 5) · card-spec (card anatomy, everywhere) · starfield-variant (the approved app-idle treatment). index.html is the gallery with per-screen notes. CONFLICT RULE: spec Addenda 1.1-1.3 and committed code beat the mockups where they disagree (chips are slate now, memory is Vellum, the card wash is interim).
