# The coherence cluster — cold-build specs for PC-28..PC-32

> _Created: 2026-07-10 (the founder's evening directive run). **Purpose: a Sonnet-class lane picks any of these five rows cold and builds it without the authoring session's context.** Each spec states the strategy, exactly what to build, how it should look and behave, the UNDERLYING ASSUMPTIONS made explicit (founder ruling: nothing unwritten), the step order, acceptance, and the founder taste gates. A Fable lane may improve on these — but may not silently skip what's written. Board rows: G17 sprint additions in [`feature-dashboard.md`](./feature-dashboard.md); summary table: [`v13-proof-campaign-plan.md`](./v13-proof-campaign-plan.md) §2._

**Shared doctrine for all five (binding):** BUILD-ONLY gates (tsc/build/tests green, row flip + one-line note); the Love Gate (fresh production account walkthrough, enterprise-credible AND consumer-grade); claim-never-outruns-wiring; humanized output (zero AI-tells in UI strings); LOOM v4 is the design law (these specs change STRUCTURE and LANGUAGE, never tokens/colors); collision rule — Lane A produces the maps/designs (judgment), Lane B applies (build); within Lane B, apply passes serialize per surface (PC-32 structure first, then PC-28 labels, then PC-29 presence — one surface fully coherent before the next).

**Shared sequencing:** Lane A: PC-32 structure map → PC-28 naming map → PC-29 cast design → PC-30 capability IA → PC-31 prototype/kit design (each ~half a day; founder ratifies the first three async — lanes never block on the ratify, they proceed to the next map). Lane B applies in the same order behind Lane A. Lane C keeps the pitch room current with each landing.

---

## PC-32 — "Super light, engine underneath": the experience-structure pass

**Strategy.** The founder's honest read: good product, not great — overwhelming. The market's #1 death pattern for our category is exactly this (Productboard "too much"; Aha! <20% used). The fix is structural, not visual: every surface must answer ONE question instantly, and depth must be *available*, never *ambient*.

**The per-surface question map (the spine of the whole pass):**
| Surface | The ONE question it answers | The ≤3 things above the fold |
| --- | --- | --- |
| Today | "What needs ME right now?" | 1) The judgment lane: at most 3 calls needing the human (consequence-ranked), 2) the narrated brief (one paragraph, agent-bylined), 3) the "while you slept" receipts strip (one line per agent act, capped 5 + door) |
| Discover | "What's new that matters?" | Top 3 themes/signals by consequence · one insight card · door to the full feed |
| Decide | "Which bet is next, and why?" | The top ranked bet with its evidence + memory citation · the next 2 · door to the full queue |
| Plan/Define | "What are we shaping now?" | Active spec(s) in flight, their contract state · door to the library |
| Build | "What's moving, what's blocked?" | Running missions with agent bylines · anything waiting on a human · door to history |
| Brain | "What do we know (and what changed)?" | What changed since you last looked · ask box · door to the graph/library |
| Ledger (Trust) | "What can we prove?" | Latest receipts · calibration line ("called N of last M") · door to the full ledger |

**Build (Lane B, after Lane A's map is ratified):**
1. A shared `DensityBudget` layout primitive: a surface region that renders at most N items (default 3 primary / 5 list-preview) + an honest "N more" door (slide-over or sub-route). No `overflow: scroll` lists at page level anywhere.
2. Refit Today first (the named worst offender): judgment lane (consequence-ranked: needs-human > irreversible-soon > highest-stakes > newest; the ranking inputs already exist — approval queue, ICE scores, outcome windows), the brief, the receipts strip. Everything else currently on Today moves behind doors or to its home surface.
3. Sweep the other six surfaces to the question map. Reuse existing components (SpotlightCard, slide-overs, MonoLabel) — zero new visual language.

**Assumptions made explicit:** consequence-ranking needs no new scoring engine — compose existing fields (approval pending? reversible? ICE band? age). "One viewport" is measured at 1440×900 desktop (the LOOM canvas). Heavy-account test data comes from the demo seed. Lists inside doors may scroll; pages may not. If a surface has no content for its ≤3 slots, show the honest empty state with the agent's next scheduled run — never filler.

**Accept:** the 5-second "what do I look at?" test passes on fresh AND heavy accounts for all seven surfaces; no page-level unbounded list remains; Love-Gate walkthrough green. **Founder gate:** ratify the question map (async, one read).

---

## PC-28 — The naming & voice pass

**Strategy (the ruling, decided):** plain human outcome-language everywhere a user reads; industry terms demoted to quiet sublines/tooltips for recognition; warmth from honesty and delight, never jokey names. One grammar, applied everywhere: **surface = outcome noun · subline = what-it-does-for-you in one plain sentence · empty state = honest + next step · tagline = consistent with the v13 one-liner family** (see `docs/pitch/one-pager.md`).

**The starting map (Lane A refines, founder ratifies — these are the authoring session's working proposals, not final):**
| Current | Proposed | Subline (the whisper) |
| --- | --- | --- |
| Today | Today | "What needs you — everything else is handled" |
| Discover | Signals | "What your users and market are telling you" |
| Decide | Decide | "The next bet, with the evidence and the record" |
| Plan / PRDs | Shape | "From bet to buildable spec" (industry whisper: "PRDs · specs") |
| Design (in Define) | Prototype | "Feel it before you build it" (per PC-31) |
| Build | Build | "Missions running on your behalf" |
| Brain | Brain | "Everything Cadence knows about your product" |
| Trust Ledger | Ledger | "Every call, every receipt, every outcome" |
| Engine Room | Engine Room | "The machinery, when you want to look" |
| Settings→agents roster | Team | "Your agents, their skills, their track records" (per PC-29/30) |
| Guardrails/Evals/Drift (in Engine Room) | Checks · Quality · Watch (bands) | industry whisper: "guardrails · evals · drift" |

**Assumptions made explicit:** labels change; **route slugs do NOT move in this pass** (renames are presentation; URL moves ride the existing redirect machinery later — avoids breaking deep links during the sprint). The map covers: nav labels, page headers, sublines, empty states, button copy on those surfaces, the landing/onboarding vocabulary, and doc-facing names in `agent-vocabulary.ts`. Mechanism words (mission, station, arc) survive ONLY inside Engine Room. The voice reference: NotebookLM's grounded warmth + Linear's restraint; ui-voice.md still governs microcopy mechanics.

**Build:** Lane A: full current→proposed→why map as a PR to this file's table (audit every user-facing string via the routes + `agent-vocabulary.ts`). Founder ratifies. Lane B: apply in one pass + update DESIGN-LOOM examples, onboarding copy, the landing page vocabulary, and the docs that quote surface names (grep-driven); note on the dashboard row.

**Accept:** zero mechanism-first names user-facing outside Engine Room; a stranger reads every nav label and knows what it does for them; docs match product.

---

## PC-29 — The felt agent layer (the honest "agentic platform" gate)

**Strategy.** The engine is provably agentic; the EXPERIENCE is not — agents live in a settings list while the surfaces feel like dashboards. The market punishes hollow-agentic claims, and our accountability thesis REQUIRES visible actors ("you answer for it" implies you can see who did it). Industry basis: Linear's agent-as-assignee, Devin's named engineer, 11x's named workers — ours adds receipts. The claim "agentic platform" unlocks for homepage/listing copy only when this ships.

**The cast (working proposal — names are the founder's taste gate; the STRUCTURE is not):** ~7 visible cast members mapped to stations — **Scout** (Signals: sweeps sources, clusters themes), **Critic** (Decide: red-teams bets with precedent), **Scribe** (Shape: drafts specs/contracts from evidence), **Builder** (Build: runs missions to PR), **Herald** (Ship: release notes, launch kits, digests), **Historian** (Learn: outcome windows, learnings, calibration), **Steward** (the orchestrator: routes work, runs the morning brief). Everything else (sub-agents, tick workers) is invisible **crew** whose acts roll up under the responsible cast member. The existing `agents` table + `agent_slug` attribution carries this — the cast is a presentation grouping, not a schema change.

**The primitive (build once, wire everywhere):** `AgentByline` — [cast avatar/mark] + name + state ("working now" / "last acted 2h ago" / "next run 7am") + the one-line act + a receipt link (trace/ledger). Variants: chip (headers), byline (on artifacts: "Drafted by Scribe · reviewed by you"), strip row (the while-you-slept feed). Data: `agent_runs`, `missions`, `traces`, `artifact_lineage` — all existing.

**Assumptions made explicit:** no new agent runtime — this is presentation over existing attribution. Cast avatars are typographic marks in LOOM style (no illustration project). Where attribution is missing today (some crons write without an agent_slug), map each tick to its cast owner in one config (`cast-map.ts`) rather than migrating data. The Team page replaces the settings roster tab (redirect stays). Honest empty states are mandatory ("Scout hasn't run yet — first sweep tonight at 2am").

**Build order:** Lane A: cast design + per-surface presence spec (which byline/chip goes where on the seven surfaces). Founder ratifies names. Lane B: the primitive → Today (pairs with PC-32's receipts strip) → the other surfaces → Team page.

**Accept:** a fresh account sees, on every station, WHO works there, WHAT they last did, and the receipt; the Team page shows the cast with track records (approved X/Y · validated N/M — data exists from the trust ramp); the "agentic platform" claim ships in PC-03/PC-14 copy.

---

## PC-30 — The agent capability layer: skills with receipts

**Strategy.** The founder's question "where do skills/instructions live?" has today's honest answer: scattered and invisible — `house_rules` (+ weekly distill tick), `prompt_templates/versions/assignments` (+ optimize tick), playbooks (`playbook_runs` ranking exists), `agent_memory`, tool modes, the Strategic Brief injection. The industry: Replit rewrites its agent nightly but opaquely ("couldn't pinpoint what changed"); Hermes writes its own skills with no track record; Claude Code's skills are static files. **Ours: every capability is visible, versioned, outcome-tracked, and every change is a receipted ledger entry — skills with changelogs and win-rates.** This is the accountability thesis applied to the agents themselves, and the disruptive move nobody has.

**The IA (per-agent page on Team, from PC-29):** five panels — **Instructions** (house rules scoped to this agent + the Brief injection preview: "what this agent is told every run"), **Skills** (playbooks it can run, each with uses + validated-outcome rate), **Memory highlights** (top precedents it recalls, importance-ranked), **Autonomy** (tool modes + arc + graduation history — exists), **History** (every capability change as a receipt: who/what/when/why + the outcome window after it).

**The three learning inlets (wire, don't invent):** (1) human edit — editing an instruction/skill writes a supersedable decision + ledger receipt (reuse the decisions/supersession machinery — capability changes ARE decisions); (2) mission distillation — PC-18's Hermes move lands its drafted playbooks here for review; (3) the nightly self-improvement loop — RPT-50 routes prompt/policy change proposals as build-spine changesets that, when approved, land as receipts here. **Layer-2 public claims stay claim-on-wiring until RPT-50 runs.**

**Assumptions made explicit:** NO new learning engine and no new storage — this is a unification VIEW + edit paths over existing tables, plus the receipt-on-change rule (one new lightweight `capability_events` table only if `artifact_lineage` can't carry it cleanly; prefer lineage). Editing guardrail-class instructions keeps the existing safety floors (a human can tighten always; loosening follows the trust-ramp rules). The Brief injection preview is read-only (its edit home stays the Brief).

**Accept:** one instruction edited by a human and one skill distilled from a mission both visible with version + receipt + outcome window; the founder can answer "what does this agent know and who last changed it?" in one screen.

---

## PC-31 — The Prototype station + the Brand Kit

**Strategy.** Mockups are dead in the corpus ("prototypes over PRDs" — Claude Code's own origin; "the modern PRD is an eval"). The design stage renames to **Prototype** (PC-28's map) and its deliverable is something you can FEEL: a clickable prototype scaffold derived from the spec's flow + Outcome Contract. And nothing generated may be off-brand: **the Brand Kit** productizes `design_memory` (DSN-01 already stores workspace design language as supersedable decisions with URL-import) into a visible, versioned kit that every generated prototype, scaffold, and launch asset renders through — the Claude-style "inject your brand once" pattern, plus our receipts (kit changes are supersedable decisions).

**Build:** Lane A design: the Prototype surface anatomy (spec → flow graph → generated clickable scaffold in a sandboxed preview → feedback loop back to the contract) + the Brand Kit surface (import via URL / tokens / pasted guidelines → the kit card: colors, type, voice, components → version history via supersession). Lane B: 1) Brand Kit = a presentation + edit layer over `design_memory` (import path EXISTS from DSN-01 — surface it); 2) prototype generation = extend `prd_scaffolds`/`generateDesignScaffold` to emit a self-contained HTML/React scaffold rendered in a sandboxed iframe, with kit tokens injected as CSS variables + into the generation prompt; 3) wire the DEF-04 drafted-mockup half behind this (its gated sandbox-provider half stays gated); 4) the prototype links back onto the PRD (lineage edge exists from DSN-03/AGT-03 patterns).

**Assumptions made explicit:** prototypes are throwaway artifacts (projections of the spec — the artifact-dead doctrine applies: regenerate over edit); the sandboxed iframe uses `sandbox` attrs + no external fetches (CSP-safe); Brand Kit v1 covers tokens + voice + component preferences, NOT logo asset management; if no kit exists, generation uses LOOM-neutral defaults and says so ("using Cadence neutral — import your brand to make this yours"); the existing `prototypes`/`prototype_files` tables are the storage (currently unexercised — this row exercises them).

**Accept:** a workspace imports a kit (URL import proves it), generates a prototype from a real spec, and the result visibly honors the kit; the surface reads "Prototype"; a second generation after a kit change shows the difference + both versions' receipts.
