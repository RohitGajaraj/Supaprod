# Supaprod Front-End Reimagining — The Charter

> Created: 2026-07-19 · Founder-approved v3 (cumulative) · Owner: the reimagining lane
> Working branch: `sandbox/mission-control-v2` (production and the public landing untouched; no merge without the founder's explicit approval in his own words)

## Why this exists

Two front-end shapes have been rejected:

1. **The current app** (10-destination loop rail: Today + Discover/Decide/Plan/Design/Build/Ship/Learn + Brain + Pulse): overwhelming, real learning curve, never states what the platform is for. The engine underneath is deep and tested; the face is the bottleneck.
2. **The 2026-07-18 rebuild** (Home/Project/Approvals "Ink" shell, archived at `archive/final-sweep-2026-07-18`): rejected on all five counts — wrong structure (fragmented one flow into three doors), felt generic (any-AI-chat-app), half-cooked (internal inconsistencies), hid the features (depth behind the palette read as empty), not self-explanatory.

**The founder's core test (2026-07-19, his own words):** "As the founder who designed this, I myself do not understand where to start, what to do, why to do, how to end — and if I want to do only certain journeys instead of the entire lifecycle, I don't know how. Everything is broken and not connecting." The rebuild is judged first on whether an outsider (and the founder) always knows **where to start, what happens next, and how to run just a slice** of the lifecycle.

## The problem statement

Supaprod's engine is finished; its face is the last thing between the product and customers. Rebuild the authenticated front end so that:

1. **10-second comprehension.** A product person instantly gets what Supaprod is (the agentic product OS that tells you what to build, builds it, learns your product), what the agents will do, and what THEY are expected to do (decide at gates). The screen anatomy teaches; copy confirms.
2. **Journey-first, not surface-first.** Named journeys with explicit start → progress → done: the full loop AND partial slices ("What should we build next?", "Just write the PRD", "Tear this idea down", "Build this feature", "Launch what we shipped", "How did it land?"). Enter at any stage, exit at any stage, always shown the next step. Nothing dead-ends.
3. **One natural-language input model**, replacing today's three (⌘J Ask panel, ⌘K palette, sentence chip).
4. **The machine's work always visible.** Ambient, clickable depth — live activity, receipts, traces — never 10 dashboards, never buried behind a command palette.
5. **Costs are quiet.** No per-action cost figures inline anywhere (missions, runs, chats). Cost detail lives one click deeper (details view, credits language) — the Lovable pattern, and the standing pricing canon (`docs/strategy/pricing/pricing-architecture.md`).
6. **Every capability accessible, sensibly placed.** ~140 server-function domains, Settings, analytics, admin, sync, integrations — deliberate homes, full liberty to recluster/club/rename. Not everything on the home screen; nothing reachable only by invisible routes. Enforced by a surface registry with a CI test.
7. **Native Build.** The build stage runs inside Supaprod on frontier-model APIs (the owned BuildDriver: Claude-Agent-SDK BD-1 / owned OpenHands per `docs/strategy/build-driver-and-dispatch.md`). Users are never sent to sign up at an external codegen platform to finish part of their journey; BYO engines are an enterprise setting, not onboarding friction.
8. **Design stage does design.** Brand guidelines/config become a one-time feed in Settings; the Design surface shows interactive prototypes and mockups of what is being designed right now.
9. **Agents are manageable.** A deliberate home for agent skills, MCP/tool access grants, approval modes, and workspace + per-product knowledge/instruction sections.
10. **Explain where explanation is needed.** Structure first; contextual tooltips where a feature genuinely needs a sentence; an opt-in, skippable guided tour.
11. **Delight and stickiness are requirements.** Varied working-state language (rotating verb deck, sharp-PM register, zero AI clichés), signature moments (approving a gate visibly sets agents in motion), reasons to come back. Enterprise-grade is not dry.
12. **Multi-lens validation.** The design must deliver visible value through the power user's, working PM's, principal product leader's, product designer's, investor's, and brand-new user's eyes.
13. **Decade-proof.** Human steps are gates, not workflows; nothing encodes today's model limits; navigation ≤ 4 global destinations; one primary action per screen; Approvals stays the single pull point.

## Hard invariants

Supaprod naming · sandbox-only, production untouched · public landing untouched (approval-gated) · claim never outruns wiring · humanized output in all UI strings · no silent scope cuts (weather/focus-dock/liquid-glass/standalone-Ask retirements re-confirmed at the mockup gate) · no merge without explicit founder approval. Master Brief v2.2 (`docs/planning/Supaprod Final Sweep/Supaprod Front-End Rebuild.md`) remains the meet-or-beat baseline underneath this charter.

## Visual direction

Black is the primary mode; monotone grays/silver/white carry the interface; **ember (#FF6B2C) is the brand color** (the human's move). The agent/machine color is open — blue is the incumbent, research may propose better; third/fourth accents allowed if they earn meaning. Landing DNA (ink tokens, Geist Sans/Mono/Pixel) is the preferred anchor, not a straitjacket. Starfield in-app is a mockup-gate decision, not a ban.

## The approach in one paragraph

**Mission Control**: one persistent room per product. A full-width live **Spine** (01 Discover … 07 Learn ⟳) carries the loop identity and shows where agents work (machine color) and where the human is needed (ember); a capped **Thread** carries the conversation, daily Briefing, and gate cards; a **Canvas** (≥60%) renders the stage's actual work on one `CanvasFace` contract (evidence → decision → spec → interactive prototype → code+terminal → ship state → growth digest), auto-following the work; a **Composer** at the bottom is the one input (ask/act/navigate/create + journey chips); an **Approvals tray**, an always-on **Working strip**, and **drawers** (peek one level, room two levels) complete it. Nav: Mission Control · Approvals · Brain · Settings.

## Process

Phase R research fan-out → **Gate #1** (founder approves mockups + Build Engine Strategy memo before any app code) → phased build on the sandbox branch (registry → room → conversation/journeys → faces/tray/strip → depth/settings/agents) → demo seed for every journey + Love-Gate verification + demo script → **Gate #2** (founder live review; merge only on his explicit words).

Full execution detail: the session plan (v3) and this folder's research outputs, indexed in [README.md](./README.md).
