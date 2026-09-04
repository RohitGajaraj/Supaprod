# The coherence cluster — cold-build specs v2 (PC-28..PC-33)

> _Created: 2026-08-04 · Last updated: 2026-08-04_

> _v2, 2026-07-10 late. **Rewritten after the founder's pressure-test directive** ("nothing is gated on me; think it through; bind to reality") **and a three-agent code audit** (Today's composition, the agent-roster reality, the design/prototype machinery — file:line pointers throughout). Every decision here is MADE, not deferred. A Sonnet lane builds any section cold; a Fable lane may deepen but not silently skip. Board: G17 sprint rows; summaries: [`v13-proof-campaign-plan.md`](./v13-proof-campaign-plan.md) §2; lane prompts: [`reports/research-sprint-lane-briefs.md`](./reports/research-sprint-lane-briefs.md)._

**The cluster's single goal:** the founder's bar — _super light on the surface, an immense engine underneath, and unmistakably agentic-first._ Seven rows, one re-experience, built in this order: **PC-32 structure → PC-33 context → PC-34 the Brain restructure → PC-28 naming → PC-29 agency → PC-30 capability → PC-31 design station.** (PC-34 before 30/33's Brain-homed pieces so they land INTO its structure, not beside it as more tabs.) (Structure first because everything else needs the decluttered canvas; context before naming because the masthead is a naming surface; agency after both because bylines land in the new layout.)

**Shared laws (binding):** BUILD-ONLY gates (tsc/build/tests, row flip + note) · the Love Gate (fresh prod account walkthrough; the 5-second test) · claim-never-outruns-wiring · humanized output · LOOM v4 tokens/visuals UNTOUCHED (this cluster changes structure, language, and presence — never the visual system) · one surface fully coherent before the next.

---

## PC-32 — "Super light, engine underneath": the structure pass

**The audit's verdict (reality, not assumption):** Today is not a naive list dump — most lanes are bounded. The felt overwhelm is **~12 competing blocks in a two-column grid** (Hero, Spotlight, LoopStrip, TriageQueue+PushedInsights, SwarmActivityLane, ShippedLane, WatchLane, LoopHealthCard, DeskRail(6 sub-cards), StrategicBriefCard — `_authenticated.today.tsx` L1025-1307), eight sections answering eight different questions. Two genuinely unbounded data paths: **SwarmActivityLane's mission-group card count** (120 stage-events/24h, groups uncapped — `today-lanes.functions.ts` L384/L203) and **StrategicBriefCard's bets query** (`briefs.functions.ts` L138, no limit).

**Today v2 — the exact anatomy (ONE column, one 1440×900 viewport):**

1. **Hero** (keep as-is — its dynamic line already answers the surface's one question: "N calls need your judgment today." / "All clear. The loop is running itself." `Hero.tsx` L37-76).
2. **The product masthead line** (NEW, from PC-33): one quiet line — _"{Product} — {one-liner} · this quarter: {top bet}"_ → click opens the Brief in Brain.
3. **The judgment lane** = TodaySpotlight EVOLVED: the featured call + up to 2 more calls (TriageQueue's top items fold in; **PushedInsights merges INTO this lane** — it's the same job, "calls needing judgment"; today it renders as a parallel list and never shows its `agent_slug` even though the payload carries it, `TodayLanes.tsx` L101-174). Cap: 3 visible + the existing "N more" fold. The collapsible brief stays inside the Spotlight.
4. **The receipts strip** ("While you slept" — NEW, replaces SwarmActivityLane's card grid): **max 5 rows**, one line each — `[AgentBadge] verb + object + time → receipt link` (e.g. "Maker · merged PR #18 · 2h — receipt"). Fold: "12 more acts → Activity". Fix the unbounded group query with a hard cap + server-side "top N missions by recency".
5. **The doors row** (one quiet row of 4 text doors): **Desk** (DeskRail's 6 cards move into a slide-over — personal tools ≠ judgment) · **Activity** (full swarm history; lives on Build) · **Shipped** (ShippedLane → Brain, it's the record) · **Watch** (WatchLane; its CONSEQUENTIAL items already surface as judgment calls — the lane itself is reference).
6. LoopStrip: fold into the Hero row as small pills (keep, shrink). LoopHealthCard: **remove from Today** (Engine Room already owns loop health). StrategicBriefCard: **replaced by the masthead** (full brief lives in Brain per PC-33); fix its unbounded query anyway.

**The relocation rule for every other surface** (apply after Today): each surface keeps its H1's one question (the sublines shipped by LOOM are already good — audit §3), enforces first-viewport = answer + ≤3 primary items + doors, page-level lists get caps + doors (lists inside doors/slide-overs may scroll). **Consequence ranking everywhere** (one shared helper): needs-human-now (open approval/gate) > irreversible-window-closing (outcome window, expiry) > stakes (ICE band/spend) > recency. All inputs exist on the queried rows.

**Accept:** Today renders ONE column ≤1 viewport with exactly blocks 1–5; the two unbounded queries are capped; the 5-second test passes on fresh + heavy accounts on all 7 surfaces; nothing removed is lost (every relocation has a door). Files: `_authenticated.today.tsx`, `today-lanes.functions.ts`, `today.functions.ts`, `briefs.functions.ts`, the lane components; then per-surface sweeps.

---

## PC-33 — The product context layer ("what is this all about")

**Why:** a PM running 3–5 products must be re-grounded in each product's story at every switch; today the identity (vision/ICP/positioning/top bets — the Brief, `workspace_briefs`/`brief_items`, versioned, ALREADY injected into every agent prompt) is buried as a Settings tab + one Today card. The human should see what their agents see.

**Build:** (1) **The identity object** = a `getProductContext(workspaceId)` read composing: product name, the Brief's positioning one-liner, north-star/top bet, stage — no new tables. (2) **The masthead line** on Today (PC-32 block 2) and as the eyebrow on Discover/Decide/Define/Design/Build (one shared `ProductMasthead` component, one quiet line, never a banner). (3) **The switcher becomes a portfolio**: the workspace/product switcher (AppShell header) renders identity cards — name · one-liner · current focus · "N calls waiting" (the existing badge count per workspace) — so switching = choosing which story to enter. (4) **The Brief's home moves to Brain** (a "Brief" lens beside the Design tab): read + edit-in-place; every edit = the existing versioned/supersedable machinery (JNY-02); Settings keeps a pointer row only. (5) **Onboarding captures it at birth**: PC-02's "What are you building?" gains north-star + one-liner fields writing the initial Brief (extend `ProductNamePreGate`, `ObsidianOnboarding.tsx` L111).

**Accept:** on a two-product account, switching products visibly changes the masthead + portfolio card everywhere; the Brief edits from Brain with a receipt; a fresh onboarding writes it. **Pitch hook:** the portfolio switcher is a demo beat (one PM, five products — the force-multiplier claim rendered); add to `docs/pitch/demo-script.md` audience variants when shipped.

---

## PC-34 — The Brain restructured: the moat made felt (not a filing cabinet)

**The founder's read (correct):** 6–7 parallel tabs = storage buckets shown as navigation — high cognitive load, low insight. And unfixed, PC-30 (Capabilities) + PC-33 (Brief) would make it 8–9. **The principle: the Brain's IA mirrors the memory MODEL, not the storage tables.** This is the moat's home — the surface where "your Supaprod knows your product" must be FELT — so it opens as an analyst, never as an archive.

**The anatomy (one front door + four kinds of knowing + one recessed door):**

1. **The front door (what you see first, the whole first viewport):** the ask box ("Ask your product's memory anything — why did we decide X?") + **"What changed since you last looked"** (3–5 lines, agent-bylined: new learnings, moved rankings, a superseded decision, a contradiction found) + up to 2 **volunteered insights** (the v11 §7 open ceiling: predictions, contradictions, cost-of-inaction — each with receipts and an act-on-it verb). The Brain GREETS you with intelligence; you never start by choosing a bucket.
2. **Four lenses beneath (quiet cards, one row):**
   - **Identity** — what we're building and why: the Brief (vision · ICP · positioning · top bets — PC-33's home, edit-in-place, versioned) + the product's learned taste summary (Brand Kit pointer → `/design`).
   - **Judgment** — the moat record: decisions → evidence → outcome → superseded-by, as a narrative timeline ("how belief moved"), with the **calibration line** ("Supaprod called N of the last M") and the **Learning thread** (what the RF loop learned this week, which rankings moved and why). Supersession renders as story ("replaced by X after the March outcome"), never graph jargon.
   - **Knowledge** — the evidence corpus: themes/signals digests, docs, meetings, research briefs — grouped by what they're ABOUT (product areas), not by source table.
   - **Capability** — PC-30's content (what Supaprod knows how to do: instructions, skills with win-rates, autonomy, receipted change history).
3. **The flagship visual stays:** the living knowledge graph is the marquee _within_ Judgment/Knowledge (a "see it as a graph" toggle), not a peer tab.
4. **Under the hood (one recessed door, or Engine Room):** raw memory rows, importance/decay mechanics, RAG chunks/indexer state, embeddings — the user NEVER needs these; agents do. Anything currently a tab that is machinery moves here.

**What we hide (the founder's question, answered):** hide mechanisms (vectors, chunks, importance scores, decay, supersession edges as edges); NEVER hide outcomes, receipts, or what was learned — the moat is felt through derived intelligence, and trust dies if the record itself is obscured. Rule: **hide how it thinks, show what it knows and how sure it is.**

**Build (Lane B, after PC-32/33):** verify-first: list Brain's current tabs + their components (`_authenticated.brain.tsx` Tab union). Then: the front-door section (compose existing: ask/chat fn, learnings + ice_adjustments for "what changed", the insight generators for volunteered items); regroup existing panels under the four lenses (mostly re-parenting, components exist); build the Judgment timeline view (decisions + lineage + outcomes joined — the supersession chain query exists in `governing-decision`); recess machinery tabs. PC-30/PC-33 specs land their content INTO Identity/Capability (their specs' placement lines defer to this section).
**Accept:** Brain's first viewport = door #1 only (no tab bar as the opener); the four lenses + one recessed door replace the flat tabs; the 5-second test ("what do we know / what changed?") passes; the stranger finds "why did we decide X" in one action; nothing previously reachable is lost (doors, not deletions).

---

## PC-28 — The naming & voice pass

**The ruling (final):** the **D-family is the brand spine** — the audit shows it half-real already (THE LOOP: Today · Discover · Decide · Define · Build · Brain, `nav-model.ts` L38-45). Complete it: **insert `05 Design` between Define and Build** (route `/design`, PC-31's station) so the loop reads _Today · Discover · Decide · Define · Design · Build · Brain_. No invented nouns anywhere (the v1 "Signals/Shape" proposals are dead). Industry terms live only as subline whispers and inside Engine Room.

**What actually changes (the audit shows LOOM already fixed most headers — this pass is surgical):**

1. Nav: add Design (numbering shifts 05 Build→06, 06 Brain→07); THE ENGINE group: "Trust Ledger" → **"Ledger"** with subline "every call, every receipt, every outcome" (drop the mechanism word "Trust" from the label — the ledger IS the trust).
2. Mechanism-word sweep in user-facing copy (grep-driven, the audit's finds): "What the **swarm** did" → "While you slept" (PC-32's strip); `gateHeadline` copy audit; any surviving "mission/station/arc/eval/guardrail/drift" outside Engine Room becomes plain ("run", "step", "checks", "watch") — Engine Room keeps the technical names as its whispers.
3. **The voice grammar** (documented at the top of `agent-vocabulary.ts` as code comment + in DESIGN-LOOM addendum): surfaces = outcome nouns (the D-family + Today/Build/Brain/Ledger); sublines = what-it-does-for-you (the shipped ones stand); buttons = verb + object, sentence case; empty states = honest + who acts next + when ("Nothing needs you. Supaprod's next sweep is at 2am."); taglines derive from the one-liner family (`docs/pitch/one-pager.md` §one-liners) — never invent new slogans per surface.
4. Docs sync: the naming map table (below) is the single reference; update DESIGN-LOOM's addendum + the pitch one-pager vocabulary if any label shifts.

**The map (current → final):** Today→Today · Discover→Discover · Decide→Decide · Define(Plan route)→Define · _(new)_ Design · Build→Build · Brain→Brain · Trust Ledger→**Ledger** · Engine Room→Engine Room · Settings roster view→(PC-30's Capabilities home supersedes; roster stays in Engine Room Safety as the technical view). Route slugs do NOT move (labels only; `/plan` keeps serving Define; `/design` is the one new route).

**Accept:** the loop nav reads the D-family; zero mechanism words user-facing outside Engine Room (grep proves it); empty states follow the grammar on all 7 surfaces; docs match.

---

## PC-29 — The felt agent layer (the honest "agentic platform" gate)

**The audit changed this row from invention to repair-and-complete.** The canon exists (`docs/features/agent-experience.md`): 19 specialists → **6 stations as the spine ("phases, not personnel")** → a cast shown **only in motion** via the relay; components SHIPPED (`AgentMark`/`AgentBadge` in `src/components/agents/AgentMark.tsx`, `AgentRelay.tsx`) but wired into exactly one surface (mission detail). And **the roster seed was broken by two later migrations** (`20260709070000_...` is current): duplicate display names (engineer/builder, stakeholder/release, copilot/orchestrator collide via `agentDisplayName`, `agent-vocabulary.ts` L648-657) and three canon cast (`customer-insights`, `ux-architect`, `data-analyst`) never seeded.

**The identity model (final — supersedes v1's character parade):** three voices, zero new vocabulary:

- **The accountable voice = Supaprod** ("Supaprod found 14 signals overnight") — the brief, digests, notifications, marketing.
- **The working voice = the cast in motion** — the relay's own law: a named specialist appears WHILE acting and ON receipts ("Maker · merged PR #18"), never as a static character page. The canon's verb-style names stand (they're already in the shipped catalog).
- **The spine = stations** — users navigate phases, never personnel.

**Build (the 7-layer agentic-experience stack, each layer concrete):**

1. **Repair the seed** (one migration): restore the canon roster from `20260618200000_agentexp_roster.sql` semantics — dedupe the colliding six (fold `engineer`→`builder`, `stakeholder`→`release`, `copilot`→`orchestrator` for NEW seeds; existing accounts get a data-fix that retags runs), seed the three missing cast. `agentDisplayName` gets a collision test.
2. **Presence** — `PresenceChip` (extend `AgentBadge`): state from `agent_runs` (working now / last acted / next run from the cron map). One chip per station header on all 7 surfaces ("Supaprod · discover — last swept 22:00").
3. **Attribution** — render the fields that already exist and are never shown: `PushedInsight.action.agent_slug` (TodayLanes), `decisions.decided_by_agent_slug` (Decide cards), `artifact_lineage.created_by_agent` (specs/scaffolds: "Drafted by Scribe from 14 signals — receipt"), `learnings.recorded_by_agent_slug` (Brain).
4. **Live narration** — generalize `AgentRelay` from mission-detail to a compact inline variant: any surface whose station has an active run shows the one-line relay ("Scribe · drafting the spec…" streaming from the run's latest step), expandable to the trace.
5. **The proactive channel** — the brief + receipts strip (PC-32 block 4) speak in the two voices (Supaprod narrates; cast bylines the acts). Every pushed insight carries who + why + evidence link.
6. **Delegation verbs in context** — the biggest felt gap: one `AskInContext` menu component (verb set per station) on every primary card: signal → "Investigate" · theme → "Frame the bet" · bet → "Red-team this" (the Critic) · spec → "Build this" · shipped → "Explain what happened". Each dispatches the existing mission/loop machinery with the target as context (the dispatch fns exist — this is a UI affordance + intent mapping, not new engine).
7. **The trust plane in place** — approvals render inline on the card they block (Build card shows its gate; the queue remains the aggregate view); the autonomy dial + track record live on PC-30's capability view; every byline links its receipt.

**Accept (the stranger test, per station):** on every surface a stranger answers "who works here, what did they just do, what can I hand them, how do I check it" without leaving the screen. The duplicate-name bug is dead. The claim "agentic platform" unlocks for PC-03/PC-14 copy when all 7 stations pass.

---

## PC-30 — The capability layer: skills with receipts

**Relocation (supersedes v1's Team page):** capabilities live in **Brain** — a "Capabilities" lens beside Brief and Design. Rationale: Brain is "everything Supaprod knows about your product," and how-to knowledge IS knowledge; the 5-destinations law stays intact; Engine Room keeps the deep machinery (prompt templates, raw tool modes) as today.

**The Brain > Capabilities anatomy (per cast member, one card each):** what I do (purpose) · **Instructions** (house_rules scoped to the agent + the Brief injection preview, read-only preview of "what this agent is told every run") · **Skills** (playbooks it can run: uses + validated-outcome rate from `playbook_runs`) · **Autonomy** (arc + tool modes + graduation history — the trust-ramp data, read view) · **History** (capability changes as receipts). Edits: instructions and skill enable/disable edit in place; **every change writes the existing supersedable-decision machinery + a lineage receipt** (capability changes ARE decisions — reuse, don't invent; only add a thin `capability` artifact kind if lineage needs it).

**The three learning inlets (wiring, all to existing tables):** human edit (above) · mission distillation (PC-18's playbook drafts land here for review) · the nightly self-improvement proposals (RPT-50's build-spine changesets, receipted on approve). Safety floors unchanged: tightening is always allowed; loosening follows the trust ramp; merge/revert/delegate stay pinned.

**Accept:** the founder answers "what does this agent know, who last changed it, did the change work" in one screen; one human edit + one distilled skill both carry version + receipt + outcome window; Layer-2 self-improvement claims stay claim-on-wiring until RPT-50 runs.

---

## PC-31 — Design: the station (Prototype + Brand Kit inside)

**Naming (founder correction, folded):** the surface is **Design** — completing the D-family — with **Prototype** and **Brand Kit** as what it contains.

**The audit's gift: this is mostly assembly.** design_memory IS the Brand Kit engine (4 source kinds incl. url_import + pasted + learned-from-feedback; SSRF-guarded import; supersession via lineage; a Brain tab UI exists — `design-memory.functions.ts`, `DesignMemoryPanel.tsx`). Scaffolds are kit-bound self-contained HTML in sandboxed iframes with a Design Gate blocking Build and a taste write-back loop (`design-scaffold.functions.ts` L117-137, L538). The `prototypes` family (prototypes/files/messages/attachments + a LIVE public share viewer at `/p/$slug`) is orphaned — perfect storage for real prototypes, needs `workspace_id` (named in `workspace-scope.ts` L26 as the known gap).

**Build:**

1. **The `/design` route** (nav 05): two panes — **Brand Kit** (the DesignMemoryPanel content, re-presented as a kit: grouped tokens/type/voice/principles cards, source + status, version history via lineage, the import actions front and center: "Import from your site" / "Paste your guidelines" / "Start neutral") and **Prototypes** (per-spec: the scaffold preview + its flow + the Design Gate verdict + share link). Brain's Design tab becomes a pointer into `/design` (one home).
2. **Prototype = clickable, multi-screen** (evolve, don't replace): `buildDesignScaffoldHtml` extends to render one screen per `prd_flows` step with **CSS-only `:target` navigation** between screens (no scripts — keeps the sandbox/CSP posture; the flow's edges become the clickable paths). Cap ~5 screens; single self-contained HTML stays the format.
3. **Persist to the prototype family**: migration adds `workspace_id` (+ RLS) to the four tables; generation writes `prototypes` + `prototype_files`; the existing `/p/$slug` share viewer lights up as the **shareable prototype link** (a growth hook: every shared prototype is Supaprod marketing — footer credit, per the citation-safe pattern).
4. **Receipts:** kit changes already supersede via lineage; prototype generations write the flow→scaffold lineage (exists) + prototype row; the Design Gate verdict stays the gate to Build.

**Accept:** a workspace imports a kit from its site URL, generates a prototype from a real spec, clicks through its screens (flow-driven), shares `/p/$slug` publicly, and a second generation after a kit edit visibly differs — with both kit versions' receipts on the Ledger. DEF-04's Cloudflare-sandbox half stays gated (spend) and is NOT needed for this.

---

## The build order & lanes (see `research-sprint-lane-briefs.md` for the paste-ready prompts)

**Lane A (Fable) owns this cluster end-to-end** in the order at the top (32→33→28→29→30→31) — maps and applies together, one surface fully coherent before the next, because splitting judgment from application across sessions is how products end up incoherent. Lane B (Fable): the chokepoint spine (PC-05, PC-07, PC-12, PC-16, PC-27). Lane C (Sonnet): launch-critical build (PC-03, PC-04, PC-06, PC-08, PC-10, PC-11, PC-15, PC-22). Lane D (Sonnet): GTM + the G18 sweep (PC-13, PC-14, PC-26, then RPT rows by rank). Collision law: A owns the seven surface route files + nav-model + agent-vocabulary while its rows are In-Dev; C's rows touch functions/backends and non-cluster UI; B owns the pinned chokepoints; D touches docs/pitch/GTM only.
