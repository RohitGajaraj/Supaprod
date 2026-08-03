# The Command Canvas

> _Created: 2026-06-20 · Last updated: 2026-07-03 (CMD-1 shipped)_

> **Status: UN-PARKED 2026-07-03 (founder), CMD-0 + CMD-1 shipped.** The founder approved this doc's own recommended path: option A (evolve Ask in place, not a second NL box) and CMD-0 before CMD-1/CMD-2 ("the valuable half first"). Strategic home: [`../strategy/horizon-bets.md`](../strategy/horizon-bets.md) (bet H2). Interface law: [`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md). Dashboard row: [`../planning/feature-dashboard.md`](../planning/feature-dashboard.md) row 46, CMD (H2), `◐ [~70%]`.
>
> **A load-bearing correction before reading the rest of this doc as written 2026-06-20: its premise about Ask has gone stale.** Ask is no longer the full-page `/chat` route this doc assumes throughout (§27 "rail 'Brain'", the "left conversation / right canvas" framing). OBS-12 (2026-07-02) retired that route and rebuilt Ask as `AskPanel.tsx`, a 420px right-docked ⌘J slide-over over any screen, and that same spec explicitly scoped out a second pane. CMD-0 was built inside that reality: blocks render inside the existing panel's single-column thread (stacked, not a side-by-side canvas), through a new polling data channel, with zero change to `/api/chat`'s locked SSE contract and zero change to the panel's 420px shape. The rest of this document's vision (below) is preserved as the original strategic thinking; treat "the canvas" as "blocks inside Ask's thread" wherever it says "the right pane" until CMD-1/CMD-2 revisit the layout question directly.
>
> **CMD-0 build note (2026-07-03):** shipped as `getAskMissionCanvas` (`src/lib/ask-canvas.functions.ts`, read-only) + three blocks (`src/components/obsidian/ask-canvas.tsx`) rendering inside `AskPanel.tsx`'s thread while a dispatched mission runs, replacing the old dead-end "Track the mission" link: **loop progress** (last 5 steps, reusing `stepDotState`/`stepDescription` unchanged), **memory-recall citations** (`memory_recall_log` joined to `agent_memory`, the first live use of the previously-unused `Citation` primitive), and the **Critic verdict** (`studio_changesets.prd_id` → `prds.critic_review`, reusing `VerdictChip`). All three degrade to nothing when the mission has no data yet. Open question #3 below ("how do the preview components obey the Ember system") turned out to be real and live: the Ask panel's own rule reserves its one ember slot for a proposed CTA, so a gated step or a Critic REVISE verdict could read as a second, misleading "you have something to do" signal. Resolved conservatively: the gate-state step dot keeps its ember (a genuine "needs a human" signal, matching `StatusDot`'s canonical behavior everywhere else), while the advisory Critic REVISE tone alone gets a neutral treatment inside this one context. Full ship note: the dashboard row.
>
> **CMD-1 build note (2026-07-03):** triggered by the founder asking why Ask was hard to find as a consumer, and shipped as the fix rather than a new visible-trigger affordance, because the actual root cause was two latent bugs sitting in the exact code CMD-1's own roadmap line names. (1) Selecting the palette's "Ask about this screen" row dispatched the open-ask event **and then unconditionally navigated to `/today`**, stamped with a stale comment claiming the Ask panel "not mounted yet" (false since OBS-12); this silently overwrote whatever screen the user actually wanted to ask about. (2) The palette's typed text was wired to the event's `seed` field, which `ask-context.tsx` only ever used to set a fake `About: <text>` context-chip label; free text typed into the palette was never actually sent as a question. Fixed both in `src/lib/ask-context.tsx` (dropped the dead `explicitContext` override; context is now always the route-derived label; added `pendingIntent` + `runIntent()` + `clearPendingIntent()`), `src/components/obsidian/AskPanel.tsx` (a one-shot effect auto-runs a queued intent through the existing `send()` / `/api/chat` pipeline unchanged), and `src/components/supaprod/CommandPalette.tsx` (the ACT "Ask about this screen" row no longer navigates when its event is the ask-open one, and, this **is** the CMD-1 roadmap item, when a typed query matches nothing in JUMP/ACT/CATALOG, the palette now falls through to a single `Ask Supaprod: "<query>"` row instead of a dead-end "Nothing by that name," dispatching the whole query as a real intent that auto-runs in Ask and renders through the CMD-0 canvas blocks exactly like any other mission). All existing JUMP/ACT/CATALOG matching is untouched (checked by an independent adversarial review pass, plus `tsc`/`bun test` clean). Deliberately did **not** add a persistent visible Ask trigger/button/coach-mark to fix discoverability. The design contract bans new nav items, badges, and banners, and this product's own convention is exactly one coach mark, ever ("there is no tour and no second mark," `TodayCoachMark.tsx`). Verified against `docs/design/archive/obsidian-v3.md` by an independent design-compliance pass: no new chrome, no touched color/style values, the new `Ask Supaprod: "..."` label follows the humanized-output law, and the `⌘J` hint added to the Ask-opening rows reuses the existing mono-hint rendering rather than a new pattern. **CMD-2 status (2026-07-04): blocked on a design decision, not picked up as a straight continuation.** Investigated before writing any code: all three CMD-0 blocks (progress, memory citations, Critic verdict) are read-only telemetry, none is an artifact a person would click-to-target or highlight-to-edit. The original vision's actual editable artifacts (a decision card, a tradeoff matrix, a roadmap diff, per "What it is" above) were never built - CMD-0 deliberately built something narrower instead. So CMD-2 has no substrate to attach to; shipping it now would mean inventing a new artifact type and editing surface with no founder input, exactly the open IA question #2 below. Founder call (2026-07-04): leave it open and flag for a dedicated design session rather than have an agent guess the artifact/surface choice. Do not re-pick this as a mechanical "next slice" - it needs a design pass first.

---

## In one line

You tell Supaprod what you want in plain language on the left; the right side shows the result coming to life. A command bar that feels like a power tool, a preview that keeps it calm, and never any syntax you have to memorize.

---

## The instinct, and the tension it raises

The founder's cue: "the interface should be command-line-like (not a literal terminal), everything is a command-line interface, and the right side is a preview." The instinct is right; it just needs one reading to be safe.

Supaprod's first design law (the Engine-Room Doctrine) says: _name the outcome, not the mechanism; the default surface never makes the user reason about how the machine works._ A literal syntax CLI breaks that law (it forces command recall and exposes mechanism). So the resolution is:

> "Command-line" means a **natural-language intent bar**, not a syntax CLI. You type what you want ("decide whether to cut feature X," "what changed in the roadmap this week"), not how the machine does it.

Read that way, the tension is largely false. **Linear is the proof**: it is at once the most command-driven and the calmest tool, because its command layer is an _optional accelerator over an opinionated, minimal GUI_, every action also reachable by mouse. The preview pane is what makes a command bar calm: the user _watches_ the outcome instead of _reasoning about_ the mechanism. ([Inside Linear](https://www.lennysnewsletter.com/p/inside-linear-building-with-taste), [NN/g accelerators](https://www.nngroup.com/articles/ui-accelerators/))

---

## What it is (the layout)

- **Left: the intent bar.** Natural language in. It autosuggests outcome-named actions, fuzzy-matches forgivingly, never opens to a blank prompt (it shows frecency-ranked recents and suggestions), and shows a context chip so you know what it will act on.
- **Right: the canvas / preview.** The durable artifact you are building, rendered from a small set of polished, outcome-named components (a decision card, a tradeoff matrix, a roadmap diff, the Critic's verdict), in the spirit of Warp's "blocks", structured, reviewable units, not a raw log scroll.
- **The conversation is ephemeral; the canvas is the product.** The left is the disposable history of how you got there; the right is the thing that persists.

This is the same shape the market has already validated (Claude Artifacts, ChatGPT Canvas, Cursor, v0, bolt), applied to product decisions instead of code.

---

## Relationship to today's Ask (resolving the overlap)

The founder flagged this directly: Supaprod already has **Ask** (route `/chat`, rail label "Brain"), which is _already_ a natural-language box, it researches the web and the workspace and can dispatch missions ("run a mission to..."). A new command bar would mean **two natural-language entry points**, which is redundant and breaks the calm-front "one door" instinct.

**Resolution: the Command Canvas is the evolution of Ask, not a second box.** We keep one natural-language surface and give it the half it is missing, a persistent **preview/canvas** on the right, and we let it both _answer_ (research, now with Decision Brain graph citations) and _act_ (dispatch and steer work, rendered live in the canvas). Today's Ask thread becomes the ephemeral left rail; the canvas becomes the durable right pane.

This is also what unifies the two bets: the canvas is the **face of the Decision Brain**. A question renders as a graph-cited answer; an intent renders as an artifact or a running mission, both in the same preview. Graph in (H1), canvas out (H2).

What changes from today's Ask: today it is conversation-only (answers land in the thread; missions are dispatched off to the mission view). The Command Canvas adds the persistent preview/canvas, richer command execution with live progress, and graph-cited answers. The three live options for the enrichment session (the founder's call):

- **(A, recommended) Evolve Ask in place** into the Command Canvas (one surface gains the canvas + command execution).
- **(B) Two altitudes:** keep Ask as the research/conversation surface and add a global `⌘K` command bar for quick intents that render into the current context. Risk: two NL boxes.
- **(C) Full merge** under the Brain: one surface for research _and_ command, the canvas showing either the cited answer or the artifact/mission. (A and C converge.)

## The 10 rules that keep a command interface calm

1. Plain-language intent, not syntax (the biggest calm lever; it is literally "name the outcome, not the mechanism").
2. Outcome-named commands that show the user's word and the canonical word together (Superhuman's `Mark Done (Archive)`).
3. Forgiving, fast, fuzzy search, never exact-match.
4. The preview as periphery-to-center confirmation (the result confirms itself visually).
5. Context-scoped command sets (only what is relevant to the active object).
6. Shortcuts taught inline, never required.
7. Show what matters first; defer the rest.
8. A visible trigger and onboarding hint, never a secret shortcut.
9. Capability hints for the NL bar (tone of a helpful colleague, not a manual).
10. Graceful failure and a minimal resting surface.

([NN/g AI paradigm](https://www.nngroup.com/articles/ai-paradigm/), [Wattenberger](https://wattenberger.com/thoughts/boo-chatbots/), [Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/))

## The interaction model

- **Large intent goes through the bar** ("draft the spec for this opportunity and run the Critic on it").
- **Small edits happen by direct manipulation in the canvas:** click-to-target and highlight-to-edit, so refining one thing never requires a paragraph of prose and never triggers a full regenerate. (v0's prose-only editing is the cited negative example; bolt's Visual Inspector and Canvas's highlight-to-edit are the positive ones.)
- **The engine proposes, acts, and surfaces for approval** (review-not-drive). This keeps it inside the claim-never-outruns-wiring posture and the human-in-the-loop trust model.

## The value principle: useful at every step, even unexpected

The canvas should make the machine's work _legible and trustworthy_ at every step, surfacing value the user did not explicitly ask for:

- When the loop recalls a past decision mid-task, the canvas shows the citation chain, so you see _why_ it answered the way it did.
- When an agent hands off to the next, the canvas shows what context is being threaded forward.
- When a result lands, the canvas collapses the process to a one-line summary and puts the artifact front and center (LukeW's collapse-to-summary), so attention returns to the work.

The preview is not chrome; it is the trust surface for autonomy.

## What to borrow

Linear `⌘K` (one calm door); Raycast AI Extensions (NL intent maps to a tool and runs); Slack Quick Switcher (never blank, frecency-ranked, speed as a feature); Warp blocks (structured reviewable output); Claude Artifacts / ChatGPT Canvas (persistent artifact, highlight-to-edit); bolt.new Visual Inspector (click-to-target). 2026 direction (NN/g, Wattenberger, LukeW, a16z, LangChain, Vercel): hybrid UIs off the bare text box, generative UI from constrained components, review-not-drive autonomy.

## Scope ruling (the decision to keep)

Command-plus-preview is the **primary layout and a power-user altitude, never a primary-only path**. Every action stays reachable in the GUI, so a non-technical PM who never touches the bar still gets everything done by clicking. The CLI feel is a layer, not the floor. The **preview is the more valuable half**; build it first.

## Build roadmap (sequenced behind the Decision Brain; gated)

- **CMD-0 (✅ shipped 2026-07-03):** a live preview/canvas pane that renders loop progress, memory-recall citations, and Critic verdicts as outcome-named, Warp-style blocks. Fits the cockpit lane and the existing inline mission cockpit.
- **CMD-1 (✅ shipped 2026-07-03):** elevate the existing `⌘K` `CommandPalette.tsx` from navigation-only to a natural-language intent bar (Raycast pattern) that dispatches the loop into the canvas; preserve the full GUI fallback.
- **CMD-2 (blocked on design, see the 2026-07-04 status note above):** direct manipulation in the canvas (click-to-target, highlight-to-edit) and the full set of 10 calm-command rules. Not autonomously pickable until open question #2 below is answered.

## Risks / anti-patterns

Syntax-recall burden; mechanism-forward jargon; blank-prompt or hidden-trigger discoverability failure; prose-only editing of a visual artifact; over-rewriting (regenerate the whole when one change was asked); reporting "done" while the preview silently diverges; an autonomy dial set to approval-fatigue or unreviewable auto-accept; alienating the non-technical-PM majority by leading with a CLI. Each has a known mitigation (NL-first, GUI fallback, scoped edits, accurate diffs, a tuned approval gate).

## Open questions for enrichment

1. Ship CMD-0 (the preview) standalone and pause, or commit to the full intent bar up front?
2. Which surfaces get the canvas first (Build, Today, Ask), and does it become a new top-level surface or a mode inside existing ones?
3. How do the preview components obey the Ember design system and the motion-as-craft rules?

## FAQ (for sharing / posting)

- **Isn't a CLI the opposite of "calm and simple"?** Only if it needs memorized syntax. A natural-language intent bar with a live preview is calmer than a maze of menus, because you say what you want and watch it happen. Linear proves command-driven and calm are the same thing done well.
- **Will non-technical PMs be lost?** No. Every action is also a click. The command bar is a fast lane for people who want it, never the only road.
- **Why build the preview before the command bar?** The preview is what makes autonomous work trustworthy and legible. That value stands on its own, even before the intent bar exists.
