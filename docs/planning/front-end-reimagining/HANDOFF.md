# Reimagining HANDOFF — live state + continuation spec (updated 2026-07-19 night)

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
1. **Card source-recognition treatment** (Addendum 1.2): the current faint-wash is INTERIM (marked with code comments). Render 2-3 replacement options (incl. the distinct memory/Vellum tone) across all card types, both themes; he picks.
2. **Threads home**: concept + mockup exist (research/threads-and-artifacts.md, mockups/screen-9-threads-home.html); he has not signed it. Present before building the surface.
3. **Artifacts**: naming (Library / Shelf / Made here) + placement; his pick pending.
4. Gate #2 itself: the live dev-server review; merge only on his words.

## DONE and pushed (verify with git log --oneline on the branch)
- Charter, research dossier (research/), 15 swept mockups + exhibits, gate sheets, gap register (64), agent-roster canon.
- `src/styles/ink.css`: voice ramps + all color locks above + `--chip-*` slate ramp.
- `src/lib/surface-registry.ts` (+CI test): every server-fn domain registered {kind, home, opensFrom, status}; the no-orphan gate. 'threads' and 'artifacts' entries planned.
- `src/lib/loop-state.functions.ts`: getLoopState per-stage spine states. `src/lib/mission-vocabulary.ts`: working-state decks + drawWorkingLine.
- `src/components/mission/`: Spine.tsx; primitives/ (SurfaceHeader, PulseLine, GateChip [chip=slate, card actions=ember], ReceiptLine [no inline cost], NextLine, WarmSlot [no empty render path]); MissionShell + MissionShellView; tests.
- Routes `/m` + `/m/$productId` (?stage= drives the canvas; existing surfaces render as temp faces; keys 1-7; one-source needs-you pill). Verified live: build-evidence/*.png.
- Breadcrumb dedupe across 9 surfaces (one wayfinding source). Two crash fixes (DiscoverSurface useSearch strict:false; AutoClustered hooks order).

## CONTINUATION — do this, in order

### Step 0: state check (Phase 2 may or may not have finished)
Phase 2 (conversation + journeys) was running at cutoff. Check: does `git log --oneline -5` show a phase-2 commit? Do these exist and pass: `src/hooks/use-ask-stream.ts`, `src/lib/briefing.functions.ts`, `src/lib/journeys.ts`, `src/components/mission/composer/` (Composer, ComposerOverlay, SuggestionPopover, JourneyChips, Thread)? Run `bunx tsc --noEmit` and `bun test src/components/mission src/lib src/hooks`. If files exist uncommitted: verify, fix, commit. If absent or partial, FINISH Phase 2 per execution-plan.md Phase 2 + these binding details: extract (never rewrite) the SSE client from `src/components/obsidian/AskPanel.tsx` (the /api/chat protocol is contract-locked); keep dictation + read-aloud (use-voice.ts) alive in the Composer; per-product thread keying client-side (NO schema migrations); journey chips only for journeys whose `wiredVia` server functions actually exist; global shortcut keys summon the ONE ComposerOverlay everywhere (palette/AskPanel unmounted, files kept); Briefing = machine-authored receipts prose from existing today-lanes/receipts/greeting/approvals data, honest zero state, no costs.

### Phase 3 (was held by the founder; he releases it in the new session by giving you these instructions)
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
