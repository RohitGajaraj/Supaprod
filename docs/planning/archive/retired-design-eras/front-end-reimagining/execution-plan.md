# Supaprod Front-End Reimagining — Problem Statement + Rebuild Plan

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Date: 2026-07-19 · Founder: Rohit · Mode: sandbox rebuild, production untouched, no merge without explicit founder approval
> **v3 — CUMULATIVE.** This one document contains everything from v1 (problem statement, Mission Control IA, comprehension layer, no-orphan registry, phased execution) plus the v2 feedback round (journeys, cost-quiet, Settings reclustering, color liberty, tooltips/tours, breadcrumb bug, demo video) plus the v3 additions below (native Build engine strategy, Design-stage rework, agent management layer, gap register). Nothing from earlier versions was dropped.

## 1. Context

Two front-end shapes have been rejected:

1. **The current app** — 10-destination loop rail (Today + Discover/Decide/Plan/Design/Build/Ship/Learn + Brain + Pulse): overwhelming, real learning curve, never states what the platform is for. The engine underneath is deep and tested; the face is the bottleneck.
2. **The 2026-07-18 rebuild** (Home/Project/Approvals "Ink" shell, archived) — rejected on all five counts: wrong structure, felt generic, half-cooked, hid the features, not self-explanatory.

**The founder's core test (2026-07-19, his own words, the sharpest requirement):** "As the founder who designed this, I myself do not understand where to start, what to do, why to do, how to end — and if I want to do only certain journeys instead of the entire lifecycle, I don't know how. Everything is broken and not connecting." The rebuild is judged first on whether an outsider (and the founder) always knows **where to start, what happens next, and how to run just a slice** of the lifecycle.

## 2. The Problem Statement (the charter — committed to `docs/planning/front-end-reimagining/problem-statement.md` in Phase R)

**Supaprod's engine is finished; its face is the last thing between the product and customers.** Rebuild the authenticated front end so that:

- **10-second comprehension**: a product person instantly gets what Supaprod is (the agentic product OS that tells you what to build, builds it, learns your product), what agents do, and what THEY do (decide at gates).
- **Journey-first, not surface-first**: named journeys with explicit start → progress → done — the full loop AND partial slices ("What should we build next?", "Just write the PRD", "Tear this idea down", "Build this feature", "Launch what we shipped", "How did it land?"). Enter at any stage, exit at any stage, always shown the next step. Nothing dead-ends; everything connects.
- **One natural-language input model** (replacing today's three: ⌘J Ask, ⌘K palette, sentence chip).
- **The machine's work always visible** — ambient, clickable depth (live activity, receipts, traces), never 10 dashboards, never buried behind a palette.
- **Costs are quiet** (founder ruling + pricing canon): no explicit $/credit figures inline on missions, runs, or chats. Lovable pattern: cost lives one click deeper (details/three-dots → "credits consumed"). The option to dig in always exists; the anxiety never does. Credits language only, never dollars-per-action.
- **Every capability accessible, sensibly placed** — not everything on the home screen; nothing reachable only by invisible routes. ~140 server-fn domains, Settings, analytics, admin, sync, integrations all get deliberate homes chosen like a great product designer would — with full liberty to **recluster, club, rename, and rewrite descriptions** (the 17-section Settings bucket is explicitly flagged as overwhelming → regroup logically).
- Navigation ≤ 4 global destinations; one primary action per screen; Approvals stays the single pull point.
- **Explain where explanation is needed**: contextual tooltips and an optional guided tour are welcome where a feature genuinely needs teaching — the structure teaches first, tooltips fill the gaps, tours are opt-in and skippable.
- **Delight and stickiness are requirements**: varied, personality-rich working-state language (Claude Code-style rotating verbs — never repetitive, within humanized-output rules), signature moments (approving a gate visibly sets agents in motion), surprise elements that make users come back. Enterprise-grade does not mean dry.
- **Multi-lens validation**: the design must hold up from the power user's, working PM's, principal product leader's, product designer's, and investor's lens — each sees the value in their language.
- Zero learning curve, premium feel, beyond the Codex/Lovable/v0/Linear/Devin bar; decade-proof (human steps are gates, not workflows).

**Hard invariants**: Supaprod naming · sandbox-only, production untouched · public landing untouched · claim never outruns wiring · humanized copy (no em dashes, no AI-tell phrasing; creative verb variety is encouraged, clichés are not) · no silent scope cuts (weather/focus-dock/liquid-glass/standalone-Ask retirements re-confirmed at the mockup gate) · no merge without the founder's explicit approval in his own words.

**Visual direction (founder ruling, this round):** black is the primary mode; monotone grays/silver/white carry the interface; **ember is the brand color**. The agent/machine color is OPEN — blue is the incumbent, but research may propose a better companion; third/fourth accent colors allowed if they earn meaning. Landing DNA (ink tokens, Geist Sans/Mono/Pixel) is the preferred anchor, not a straitjacket. **Starfield in-app is a design decision, not a ban**: research + mockup gate decide whether it earns a place (e.g., a brand moment) or stays landing-only.

## 3. Chosen approach — "Mission Control", research-elevated, journey-first

One persistent room per product; the app *is* the loop diagram, populated with real work; journeys are how you move through it.

**Shell anatomy (5 permanent regions):**
1. **TopBar** — mark, product switcher, live ticker, the ember needs-you pill (single approvals count), theme, account (admin console entry lives here). **Wayfinding bug fix**: today breadcrumbs render twice on some surfaces (TopBar crumbs + PageHeader eyebrow, e.g. Discover) — the new shell has exactly ONE wayfinding source; the canvas header carries the state sentence, never a duplicate crumb.
2. **The Spine** — full-width live instrument: 01 Discover … 07 Learn ⟳, numbered, stateful nodes: done (receipt) / active (agent color, live verb) / gate (ember, count) / quiet / inferred. Clicking flips the canvas; keys 1-7 preserved. When a partial journey runs, the spine highlights the active slice (e.g. Plan→Design only) so "which part of the loop am I in" is always answered.
3. **Thread** (left, capped) — persistent per-product conversation: daily Briefing (machine-authored receipts prose replacing Today), gate cards inline, Brain evidence lines, sessions/runs list.
4. **Canvas** (right, ≥60%) — seven faces + rest face on one `CanvasFace` contract (state-sentence header + ONE primary action + designed empty/loading/error states): evidence → decision → spec → live design preview → code+terminal → ship state → growth digest. Auto-follows work; pinnable. Reuses existing surface trees (`discover/`, `plan/`, `studio/`, `build.$missionId` body, `engine-room/rooms/`).
5. **Composer** (bottom) — the one input: ask / act / navigate / create, plus **journey chips** (the named journeys above — each launches a scoped slice with explicit start and done states). Merges AskPanel SSE + palette catalog + promote chip; ⌘K/⌘J summon the same component.

**Plus:** **Approvals tray** (slide-over, `/approvals` deep-linkable, j/k/a/r; deciding visibly advances the room — the signature motion) · **Working strip** (always-on agent activity; each line = actor + varied present-progressive verb + object + time; receipts and traces one click in; **no inline cost figures** — cost appears inside the detail view behind the three-dots/receipt click, in credits) · **Drawers** (every count/receipt/strip-line opens an L1 peek in place; L2 rooms — traces, evals, guardrails, routing — keep routes, off nav).

**Nav (4):** Mission Control (`/m`, `/m/$productId?stage=&panel=&drawer=&thread=`) · Approvals · Brain (knows + runs) · Settings. Admin under the account menu. Every legacy URL redirects into the room; no redirect chains.

**Settings reclustered** (proposal finalized at mockup gate — current 17 flat sections are explicitly too much): tentative grouping — **You** (profile, notifications, preferences, focus) · **Workspace** (members, products, roles, workspace prefs) · **Connections & Data** (sources, integrations, sync, memory, data) · **Plan & Usage** (billing, plan, credits — the one place usage/allowance renders, as a generous monthly bar, never per-action) · **Advanced** (AI staff, keys/BYOK enterprise edge, agent access, diagnostics). Analytics gets a deliberate home (Learn face + its deeper room), not a settings orphan.

**Comprehension layer (binding):**
- First-screen anatomy IS the pitch: YOU SAY IT (composer + journey chips) / AGENTS MOVE (live or seeded runs) / YOU MAKE THE CALLS (ember gate strip).
- Six orientation primitives everywhere: `SurfaceHeader` (purpose line), `PulseLine` (varied-verb live status), `GateChip`, `ReceiptLine` (past tense + trace link; cost only inside the click-through), `NextLine` (who acts next — the anti-"broken and not connecting" primitive), `Spine`.
- `WarmSlot`: no empty render path (own work → badged SAMPLE preview → honest who-acts-next line).
- **Teaching stack**: structure first → contextual tooltips where a feature genuinely needs a sentence → an opt-in, skippable guided tour for the room's five regions and the first gate. (Amended per founder: tours/tooltips are welcome where they earn their place.)
- Enterprise credibility as texture: approval cards carry rationale/expiry/logging footer; every receipt → immutable trace in 2 clicks; Memory view = inspect/correct/delete. Cost/credits detail exists at depth for the buyer who looks.
- **Working-state vocabulary deck**: a curated rotating verb set per agent/stage (Claude Code-style personality, sharp-PM register, no AI clichés, never repetitive) — shipped as data (`agent-vocabulary.ts` extension) so both PulseLine and the ticker draw from it.

**No-orphan enforcement (clarified per founder):** `src/lib/surface-registry.ts` — every domain registered as `{kind: canvas-panel | drawer | settings | admin | composer-verb, opensFrom}` where `opensFrom` names a VISIBLE path (button, chip, receipt, settings row, tooltip link — home screen NOT required; invisible-only routes forbidden). Unregistered domain or invisible door fails CI. The generated coverage matrix goes to the founder in Phase 5.

## 3.5 v3 additions (founder feedback round 2)

**A. Native Build engine (the major unlock — "build happens HERE").**
Today the Build stage leans on external codegen engines and the founder cannot see outcomes from our end; users must never be sent to sign up at Cursor/Devin/Windsurf/any external platform to complete part of their journey. With frontier models (Anthropic, OpenAI, Kimi, and peers) now strong and cheap via API, Supaprod runs the build natively:
- **Research deliverable (Phase R): the Build Engine Strategy memo** — market scan of frontier coding models + agentic harnesses (mid-2026 state), cost per outcome, and a concrete recommendation for the owned driver: the Claude-Agent-SDK-based BuildDriver (BD-1, board row PC-35, already in dev) and/or owned OpenHands, per the existing canon `docs/strategy/build-driver-and-dispatch.md` (the `BuildDriver` seam: native floor + owned drivers + BYO engines demoted to an enterprise option, never a required detour). Memo goes to the founder with a proceed recommendation — this decides how deep the build lane goes during this sprint.
- **Front-end contract**: the Build canvas face (code + terminal + session timeline + PR state) is designed for the NATIVE driver as the primary path — model choice routed invisibly through our runtime (`runtime.server.ts`, routing console), BYO engines an enterprise setting, never onboarding friction. Honesty rule holds: the face renders only what the driver actually does today; capability that isn't wired yet is labeled, never faked.
- Driver implementation itself continues in its own lane (PC-35); this rebuild integrates and showcases it, and the strategy memo tells us whether to accelerate it inside this sprint.

**B. Design stage rework.**
- Brand guidelines / design-system config (what the design gate holds today) moves to **Settings → Connections & Data / Workspace** as a one-time feed that agents reference — not a recurring surface.
- The **Design face** becomes the actual design workspace: interactive prototypes and mockups rendered against what's being designed right now — live preview, clickable prototype states, wireframe→mockup progression, review/approve states. Research covers how v0/Lovable/Figma-adjacent tools present generated design work; reuse seams: `prototypes.functions.ts`, `design-scaffold`, `design-memory`, `PreviewPanel`.

**C. Agent management layer (designing for agents, not just humans).**
A deliberate home for operating the agent staff — currently scattered. Covers: per-agent **skills** (view/edit what an agent knows how to do), **MCP and tool access** (grants, tool-calling permissions, approval modes auto/confirm/review — the wiring exists in `loop.server.ts` + `TOOL_REGISTRY` + agent-access settings), and **knowledge/instructions**: workspace-level and per-product instruction + knowledge sections (a workspace holds multiple products; each product can carry its own conventions the agents must follow — the Lovable project-knowledge pattern). Placement: Settings → Advanced/AI staff for configuration + the crew drawer for in-context visibility; exact IA decided in research and shown at the mockup gate. All of it registered in the no-orphan registry.

**D. Gap register.** Research maintains a running list of genuine gaps discovered along the way (founder: "certain areas we need to modify and add if there is a genuine gap"); each gap gets a proposal in the dossier — added, clubbed, or consciously deferred, never silently ignored.

## 4. Execution plan (sandbox branch `sandbox/mission-control-v2`, feature-flagged; never pushed to main until approved since Lovable builds from main)

**Phase R — Research (~half day, parallel workflow fan-out).**
- Product teardowns: Codex, Lovable (incl. its cost-disclosure pattern), v0, Linear, Devin + beyond (Cursor, Raycast, Perplexity, Notion AI, Stripe/Vercel dashboards, agent-session UX).
- Design-system study: Geist/Vercel, devouringdetails.com, interfacecraft.dev, rauno.me — modern craft for humans AND agents.
- **Journey mapping from six lenses** (power user, working PM, principal product leader, product designer, investor, brand-new user): per lens, the value story + the journeys they'd run; produces the named-journey catalog with start/next/done definitions for full-loop and every partial slice.
- Color exploration (black+monotone+ember fixed; agent-color candidates incl. blue; third/fourth accent proposals; starfield yes/no with rationale).
- Settings/IA reclustering proposal; working-state vocabulary deck; naming/copy proposals (full renaming liberty).
- **Build Engine Strategy memo** (§3.5-A): frontier coding-model market scan (Anthropic/OpenAI/Kimi + peers, mid-2026), owned-driver recommendation (Claude Agent SDK BD-1 / OpenHands), cost model, and what ships in this sprint vs the PC-35 lane.
- **Design-stage concept** (§3.5-B): interactive-prototype presentation patterns; brand-config relocation plan.
- **Agent-management concept** (§3.5-C): skills/MCP/tool-grant/knowledge-instructions IA (workspace vs product scoping).
- Output: research dossier + design-language spec + journey catalog + Build Engine Strategy memo + gap register + problem statement → `docs/planning/front-end-reimagining/`.

**Phase M — Mockup gate (FOUNDER GATE #1).** Static HTML screens on real tokens: the room (rest / building / gated), the first-run screen, the approvals tray, one partial-journey flow (start → done), the **Build face (native driver)**, the **Design face (interactive prototype)**, the **agent-management surface**, plus the color/starfield decision board, the Settings regrouping, and the Build Engine Strategy memo for sign-off. Founder red-lines/picks. **No app code before this approval.**

**Phase 0 — Registry.** `surface-registry.ts` + CI coverage test; legacy redirect map retargeted.

**Phase 1 — The room.** MissionShell, Spine (evolve `src/components/ink/Spine.tsx`), `loop-state.functions.ts` aggregator, `/m/$productId` with search-param state, TopBar trim, **the breadcrumb-duplication fix** (one wayfinding source; audit every surface that renders both TopBar crumbs and a PageHeader eyebrow). Canvas hosts existing route components as temporary faces — app works end-to-end day one.

**Phase 2 — Conversation + journeys.** Extract `use-ask-stream.ts` from `AskPanel.tsx` (SSE contract intact); Composer + Thread + Briefing + journey chips (journey state machine: scoped slice, spine highlight, explicit done); per-product thread scoping; retire palette/panel mounts.

**Phase 3 — Faces + tray + strip.** Seven canvas faces; ApprovalsTray; WorkingStrip with the vocabulary deck; cost-quiet pass (strip all inline cost figures; wire the details/three-dots credits view); the ember→done signature moment. Strangler rule: legacy route redirects only when its face passes review.

**Phase 4 — Depth + auxiliaries.** Drawers (engine rooms, crew, meetings/calendar/docs); Brain canvas; Settings rebuilt to the reclustered groups (all current sections' functionality verified via registry) including the relocated brand/design config (§3.5-B) and the **agent-management surfaces** (§3.5-C: skills, MCP/tool grants, approval modes, workspace + per-product knowledge/instructions); analytics homes; admin untouched; tooltip layer + opt-in guided tour. Build face wired to the native driver per the approved strategy memo; Design face ships the interactive-prototype experience.

**Phase 5 — Seed + verify + gate (FOUNDER GATE #2).**
- Demo data: parameterize the Helio Labs seed into `seed_sample_workspace(p_owner)` (per-account SAMPLE workspace, badged, never mixed into real counts); fill gaps (all 10 approval kinds, orchestrator runs, one failed-then-recovered run, stage_events receipts, believable credit numbers); **clean up stale/bad old demo data as the last step**; seed content must let EVERY journey (full loop + each partial slice) be demonstrated — the founder records a demo video from it.
- One-question onboarding ("What are you building?") replacing the 5-screen flow; redirects + retirement flags; copy pass; generated coverage matrix.
- Love-Gate walkthrough (10-second test, 5-minute test, journey test — start/next/done answerable on every screen, orientation pass, cost-quiet check, depth/honesty, enterprise scan, both themes, keyboard, reduced motion) + tsc/build/tests/Playwright journey.
- **Demo script deliverable**: a written walkthrough of each journey for the founder's recording.
- Founder reviews live on the dev server. **Merge only on his explicit words.**

Estimated: research + mockups ~1 day; build 3-4 days with parallel agent lanes (ultracode workflows per phase).

## 5. Reuse ledger (headline)

Survive as-is: all seven stage component trees, `engine-room/rooms/`, approvals route+cards, admin routes, all 143 `*.functions.ts`, `palette-catalog.ts` (becomes composer catalog), `ink.css` tokens, shadcn `ui/`.
Recomposed: `nav-model.ts` (4 destinations, derivation law kept), `AppShell` → MissionShell, `AskPanel`+`CommandPalette` → Composer/Thread, `ink/Spine.tsx` → the live spine, Today's parts → Briefing/pill/spotlight line, `agent-vocabulary.ts` → vocabulary deck.
Retired (flagged, never silent): Today dashboard scaffolding, AskPanel shell, weather/focus-dock/liquid-glass (re-confirm at mockup gate).
Cleaned: stale demo data (last step of Phase 5).

## 6. Verification

- CI: registry coverage test (no orphan domains, no invisible-only doors), nav-model tests, redirect-resolution test, tsc 0, build green (Node 20.20.2), full suite.
- Love-Gate checklist on a fresh account (any FAIL blocks), including the journey test and the cost-quiet check.
- Playwright: signup → one question → first run streaming → first gate → approve → pass runs → receipt lands; plus each named journey; plus the Helio Labs demo path.
- Founder live review at both gates.

## 7. Deliverables

1. `docs/planning/front-end-reimagining/` — problem statement (the charter the founder asked for), research dossier, design-language spec, journey catalog, Build Engine Strategy memo, gap register — filed per repo placement policy.
2. Mockup set + decision boards for Gate #1.
3. The rebuilt front end on `sandbox/mission-control-v2`, demo-seeded for every journey, Love-Gate-verified, with the demo script — awaiting Gate #2.
