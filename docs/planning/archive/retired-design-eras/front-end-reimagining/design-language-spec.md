# The Supaprod Design Language (Mission Control edition)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Phase R synthesis, 2026-07-19. Charter: [problem-statement.md](./problem-statement.md).
> Distilled from the research streams in [research/](./research/) (design systems study, four teardowns, IA reclustering, vocabulary and voice) so a mockup builder needs no other document.
> Inherits and extends `docs/design/archive/tempo-v5.md` and the landing's Ink v6 tokens (`src/styles/ink.css`). Where this spec and an older design doc disagree on the authenticated app, this spec wins; the landing stays governed by its own applied record.

---

## 0. The one-sentence law

Black monotone carries the interface; three voices carry all meaning: **ember is the human's move, machine blue is the agents at work, gold is memory speaking**. Everything else in this document exists to protect that sentence.

---

## 1. Foundations (fixed, from Ink v6)

These are settled and not revisited. Dark is primary; light is a token flip under `[data-theme="light"]`, never a redesign. Never ship a dark-only token.

```
Surfaces        --ink-bg #0a0a0a   --ink-panel #0d0d0e   --ink-raised #18181b
Text ramp       --ink-text #f4f4f5   --ink-body #a1a1aa   --ink-subtle #71717a   --ink-faint #52525b
Hairlines       --ink-hairline rgba(255,255,255,.09)   --ink-hairline-soft rgba(255,255,255,.05)
Grid            --ink-grid-fine .038 alpha   --ink-grid-coarse .06 alpha
Radii           control 8px   panel 12px   hero 14px
Controls        32 / 36 / 40px heights
Ease            --ink-ease cubic-bezier(0.23, 1, 0.3, 1)   --ink-fast 150ms   --ink-slow 250ms
```

Structural rules that survive from the references:

- **Structure carries identity, color carries meaning.** Depth comes from layering, hairlines, grids, and edge light. A hue never does a hairline's job. No heavy card shadows; never animate box-shadow (pre-render, toggle opacity).
- **Chrome recedes, content advances** (Linear's 2026 refresh, adopted). The nav rail and any sidebar sit one step dimmer than the Canvas: chrome on `--ink-bg`, working surfaces on `--ink-panel` and `--ink-raised`. Borders are 1px, low contrast.
- **Restraint only reads as premium when correctness is total.** The rejected rebuild failed as "depth behind the palette read as empty". Empty states, loading order, error states, and timestamps get the same craft budget as the hero path. Believable timestamps and durations are a QA gate, including in demo seeds.

---

## 2. The color system

### 2.1 The three voices, each as a five-tier ramp

Single hexes are retired as an interface grammar; each voice becomes a Geist-style role ramp so a voice can whisper (ambient presence) or speak (the live locus) without anyone inventing an inline rgba. **Components never write a voice rgba inline; they use ramp tokens.** These tokens land in `ink.css` before any Mission Control component is built, with light-mode siblings in the same commit.

```
/* Ember: the human's move. Brand color. */
--voice-human:         #ff6b2c    /* solid: gate text, approve action, entry caps, focus ring */
--voice-human-hover:   #ff8344
--voice-human-dim:     #c25a2b    /* ambient: snoozed gates, pending-but-not-urgent */
--voice-human-border:  rgba(255,107,44,.40)
--voice-human-soft:    rgba(255,107,44,.12)   /* fills, gate card wash */
--voice-human-faint:   rgba(255,107,44,.06)   /* row tint for needs-you rows */

/* Machine blue: the agents at work. CONFIRMED #6CB0F5 (8.64:1 on ink, AAA). */
--voice-machine:        #6cb0f5   /* solid: text, icons, active stage node, caret, data numerals */
--voice-machine-dim:    #4d7fb3   /* ambient always-on: Working strip idle, inactive traces */
--voice-machine-border: rgba(108,176,245,.35)
--voice-machine-soft:   rgba(108,176,245,.14) /* fills, working pulse halo */
--voice-machine-faint:  rgba(108,176,245,.07) /* row tint for machine-authored rows */

/* Memory gold: the Brain speaking. Gold ban intact everywhere else. */
--voice-memory:         #e8b44c   /* solid: inside Brain only */
--voice-memory-dim:     #a8842f
--voice-memory-border:  rgba(232,180,76,.35)
--voice-memory-soft:    rgba(232,180,76,.12)
--voice-memory-faint:   rgba(232,180,76,.06)  /* the gold left-edge tick on a memory-citing row */
```

**Rule of use:** the full hue marks WHERE that voice acts right now, one live locus per screen where possible. Dim and faint tiers carry "this voice exists here" ambience. The Working strip and Spine, being always on, live almost entirely in dim/faint and only escalate to solid at the active step.

**Why blue for the machine (settled, from the design systems study):** 8.64:1 contrast on ink; orange versus blue is the maximum-separation, colorblind-safe pair for the most load-bearing distinction in the product (human versus machine); purple is disqualified as the 2026 "AI slop" tell; teal and cyan contaminate success green; blue is already the landing's approved agent voice and the PixelStat numeral ruling.

### 2.2 The verdict layer (state, never a voice)

```
--verdict-pass #4ac26b   --verdict-fail #e5534b
```

Applied to badges, checks, and outcomes only. Never to prose, chrome, or backgrounds. **`--verdict-working` (amber) is retired**: working IS the machine speaking, so working states use the machine ramp (the blue `ink-working` pulse is already correct). The amber token is deleted so it can never collide with memory gold again. Queued or attention-needed states are ember's job.

### 2.3 The bans

- **No purple, violet, or indigo anywhere**, including charts and controllable embeds. It is the generic-AI tell of 2026 and Supaprod's differentiation partly lives in refusing it.
- **No fourth voice.** Every candidate job is covered: verdicts have green and red, attention is ember, data numerals are machine blue.
- **Gold ban intact:** gold appears only in the memory grammar (Brain, memory citations, the mark's core bead), never on text, headings, or metrics.
- **Ember is a copy contract, not just a color** (see GateChip, section 6.3). Any ember string that does not say what approving sets in motion is a bug.

### 2.4 Attribution never rides color alone

Every machine-authored row, message, and face header carries the **agent attribution atom**: a mono agent-name chip (Watch, Draft, Engineer, Chief of Staff, per `agentDisplayName()`) plus the machine-color treatment, consistent placement (leading the line). The grayscale test must still show who did what via the chip. This is a single shared component, not a per-surface convention.

### 2.5 The grayscale test (unchanged, now mechanical)

Screenshot any screen, desaturate it. The hierarchy, the attribution, and "what needs me" must survive via structure, chips, and glyphs. If a meaning dies in grayscale, it was carried by color alone and fails review.

---

## 3. Starfield in the app: the verdict

**Working surfaces: no. Brand moments: yes, at reduced density, judged at the mockup gate on real frames.**

- Mission Control, the Thread, the Canvas, Approvals: never. Highest-frequency surfaces; ambient novelty decays into noise and competes with the one ambient signal that must be felt, the machine-blue working presence. Dense content would need scrims everywhere, which means the backdrop is wrong.
- Allowed at roughly half landing density, far layer only: workspace/product empty states ("no missions yet"), onboarding and guided-tour frames, the Brain's idle state (stars plus gold is a coherent room identity), and optionally one beat of the gate-approval signature moment.
- Implementation: `LandingBackdrop` gains `variant="landing" | "app-idle" | "brand-moment"` presets (density, layers, drift). The mockup gate reviews frames, not principles.

---

## 4. Type roles

| Font | Role | Rules |
| --- | --- | --- |
| **Geist Sans** | All UI: headings, body, buttons, cards | Dark-surface legibility: body at weight 500 (not 400) with +0.2 to 0.4px letter-spacing in dense lists; 12 to 13px body in dense rows; sentence case everywhere |
| **Geist Mono** | Technical truth: agent chips, artifact ids (SPEC-14), timestamps, durations, working verbs in the strip, code, diffs, terminal, receipts' counts | Tabular numerals for anything countable; mono is the "this is a fact" register |
| **Geist Pixel** | Brand moments only: first-run hero, the signature approval caption, milestone receipts, Brain idle | Never body copy, never dense UI, never error paths. One Pixel moment per surface max |

Prose is the exception, not the rule: a Linear-style row is glyph, mono id, one prose title, right-aligned glyph cluster. Nothing wraps. Density comes from replacing words with a learnable 14px glyph grammar, not from shrinking words.

---

## 5. Motion

### 5.1 The three-class budget (binding table)

| Class | Surfaces | Budget | Notes |
| --- | --- | --- | --- |
| **A. High-frequency chrome** | Composer, Approvals tray open/close, drawer peeks, Spine stage switching, menus, hover | 0 to 120ms, transform/opacity only, or no motion at all | Frequency kills novelty; macOS menus animate nothing and feel best |
| **B. Content arrival** | Thread items, Canvas face swaps, list loads | 150 to 250ms with 60 to 90ms stagger, `--ink-ease` | Stagger reads as orchestration; simultaneous arrival reads as a dump |
| **C. Signature moments** | Gate approval, stage completion, first-run | Up to 900ms choreographed sequence, max one per screen, never two in consecutive beats | The whole motion budget of a screen is spent here |

### 5.2 The laws (Rauno, adopted globally)

1. **Immediate response, then animate.** State changes apply optimistically in real time; animation happens past the trigger point. A click never waits for an entrance.
2. **Spatial consistency.** Things open from where they live: drawers slide from their edge; a gate card expanding into the Canvas grows from the card, teaching that the Canvas is the card's depth.
3. **Desktop restraint.** Mouse and keyboard input is mechanical, not visceral; default to less motion than a touch-derived instinct suggests.
4. **Reduced motion resolves to the finished visible frame**, never a blank or a stuck midstate.
5. **Speed is the first design token.** Sub-100ms perceived response for local interactions, optimistic updates on every verdict, all motion interruptible.

### 5.3 The signature moment: approval releases work

The one choreographed sequence in the product, 700 to 900ms, spent on the low-frequency, high-stakes beat:

1. The gate card's ember resolves (the wash settles, the chip flips to a receipt).
2. The energy visibly travels: the Spine's unblocked stage node fills machine blue and picks up the `ink-working` pulse, within 1 second of the decide mutation (optimistic).
3. The Working strip's verb changes to the new stage's deck line.
4. Optionally one far-layer star drift acknowledges motion (mockup-gate decision).

First approval ever, once per user, adds the Pixel caption: "That approval just set three agents in motion." The 07 to 01 return-arrow glint on outcome recording is the only other choreographed beat, and the two never fire on the same screen in consecutive beats.

### 5.4 The delight budget (five, enterprise-fit, from the vocabulary study)

First-approval caption; the Monday "week in receipts" briefing card; "this call held up" on a confirmed outcome; the first-ship provenance line ("Decided by you. Built by Engineer. Shipped 4:12pm."); dry milestone receipts ("That's 100 calls made here. 84 held up."). Each fires from real state, never a timer; each is dismissable; no decorative emoji; nothing new joins without retiring something.

---

## 6. The comprehension primitives

Seven shared components teach the product by existing. Every surface is assembled from them; none of them may be re-implemented locally. Copy shapes are binding (they fold in the vocabulary deck, `research/vocabulary-and-voice.md`, which remains the full word list).

### 6.1 SurfaceHeader

One identical header anatomy across every Canvas face, room, and drawer. Consistency here is worth more than any individual visual idea (Linear's refresh proved users experience consistency as calm).

**Anatomy, left to right:** stage marker (mono, "04 Design"), title (prose, the artifact or face name), agent attribution atom when machine-authored, typed state chip, then a right-aligned cluster: deep-link copy action, kebab menu (Details lives here, including cost, per section 7).

**States:** static (no chip), working (machine chip + pulse), needs-you (ember chip), done (check + receipt tone), blocked (plain reason chip).

**Copy shape:** the state chip uses the typed mission-state vocabulary, never a generic "active": `Plan ready`, `Awaiting your decision`, `Blocked on access`, `Building`, `Shipped`. One TS union renders everywhere (Spine, tray, headers) so the same state never has two names.

### 6.2 PulseLine

The live working line: the single way "the machine is working" is written anywhere (Working strip, Thread live items, Spine hover, drawer).

**Anatomy:** `[agent chip, mono] [verb phrase from the stage deck] [object] [honest time]`, machine ramp, `ink-working` pulse on the active locus only, `ink-caret` on streaming text.

**Copy shape (machine working):** actor + present-progressive + object + honest time. "Draft is writing the spec for checkout autofill. About 4 minutes." Time slot: estimate when the engine has one, elapsed otherwise ("Started 2 minutes ago"), "Nearly done" only when genuinely in the last phase, never a fake countdown, never a percentage bar.

**Rotation contract:** lines draw from the per-stage decks (12 lines each) plus 3 per-agent signature lines via `drawWorkingLine(stage, slug, sessionSeed)`, session-seeded no-repeat shuffle; specific beats generic (real nouns when the engine knows them); never two identical lines on screen; lowercase predicates in the strip, full sentences in the Thread.

**States:** working (solid + pulse), queued (dim tier, no pulse), bridging ("handing the work to the next agent"), idle strip ("3 agents working, 1 waiting on you", clickable).

### 6.3 GateChip

The ember element: the only thing ember ever marks. A gate renders as a chip (on the Spine, in a row), a card (in the Thread or tray), and a face (evidence open); all three are the same object with one count from one source. Approving from any of them clears all of them.

**Anatomy (card):** ember wash (`-soft`), what-waits headline, the agent's recommendation with receipts (evidence links, the agent's track record), the consequence pair as button subtext, four verbs, keyboard hints inline.

**The four verbs, fixed:** `Approve and run` (1), `Send back` (2, continues the same thread with your notes, never spawns a new task), `Decline` (3, recorded), `Open the evidence` (Enter/space, expands into the Canvas). Snooze (H) defers with a resurface condition. J/K traverses the tray.

**Copy contract (binding):** every ember string answers three things: what waits, why it is your call, what approving sets in motion. "The spec is ready for you. Approve it and Plan breaks it into work." A soft-gate variant shows a visible countdown ("Runs in 30s unless you pause") where the engine supports it; hard gates show none.

**Verdict toasts** come from the ActionSpec registry: "Approved. Draft is on the spec now." / "Sent back. Draft is revising with your notes." / "Declined. Logged with your reason."

### 6.4 ReceiptLine

The done state: past-tense proof, Linear's receipt tone. Kills every "Success!" and every silent completion.

**Anatomy:** check glyph, past-tense sentence with mono counts, one NextLine (6.5), kebab to Details (cost, driver, trace links, per section 7). Where a restore point is wired (Build revisions), the receipt carries "Revert" behind a dry confirm.

**Copy shape:** artifact + what is in it + the one next step. "Spec drafted. 9 requirements, 2 open questions. Review it." / "Shipped to production at 4:12pm. Rollback is one click for 24 hours." Counts in mono, believable timestamps always.

**Blocked variant (the only error shape outside the Engine Room):** plain reason + recovery verb, no apology theater. "GitHub token expired. Reconnect to resume."

### 6.5 NextLine

The forward door: every artifact card renders its next-step journey chip(s) inline, so nothing dead-ends, ever. An approved spec shows "Design it" / "Build it"; an applied changeset shows "Ship it"; a shipped PRD shows "Check how it landed".

**Anatomy:** one or two journey chips, plain-words labels from the journey catalog, rendered in the card's footer. Hovering a chip pre-lights the Spine slice it would run (the cheapest possible answer to "what will this do"). Enforced mechanically: a CI check over the surface registry asserts every artifact type declares at least one forward door.

### 6.6 Spine

The full-width 01 Discover to 07 Learn strip plus the drawn 07-to-01 return edge: the loop identity, the wayfinding, and the demo in one element. Full rendering spec is journey-catalog Part C; the binding points:

- **Always whole.** A journey lights its slice; untouched stages stay dim but present, so a slice never pretends to be the product.
- **Entry and exit caps** in plain words on the slice ("Starts from: your idea" / "Ends with: an approved spec"). This is the literal answer to "where do I start and how do I end".
- **Per-stage state:** machine solid + pulse = working now (with the strip's current verb on hover), ember = your move (clicking opens that gate card, never a dashboard), check = done with its artifact chip, dim = queued. Skipped stages (design off) render as slim labeled pass-throughs, never hidden.
- **The gate is ON the spine**: the ember node and the tray card are the same object, one count, one source.
- **Concurrent journeys** stack as thin lanes under the strip; one lane owns the Canvas; clicking swaps focus.
- **The return arrow animates once** when an outcome writes a learning or challenges an assumption upstream; the affected stage briefly glints. The compounding loop is something you see happen.

### 6.7 WarmSlot

The empty/first-run state as a standard component, never a bare "No results". Empty states are journey entries.

**Anatomy:** one honest sentence naming who acts next and when, plus the one action that would create the data. Optional `app-idle` starfield behind workspace-level emptiness only.

**Copy shape (from the vocabulary table, binding examples):** "Nothing needs you. The Chief of Staff will bring the next call here." / "Nothing to read yet. Connect a source and Watch starts on the next sweep." / "Engineer is waiting on an approved spec. That's your gate to open." / "Not enough data yet" states carry the action that creates the data ("Connect analytics").

---

## 7. Costs are quiet: the rendering rule

The Lovable pattern, confirmed independently by Replit, adopted verbatim:

1. **Zero cost figures inline.** No credits, tokens, or dollars on any mission, run, gate card, chat response, receipt, or toast. At most a small neutral usage glyph on a receipt.
2. **One deliberate gesture deeper:** the kebab on any agent response or mission card opens **Details**: exact credit cost, task-shaped and rounded (0.5, 1.2, 2.0, never raw tokens), plus plain-language drivers (files touched, tools used, verification runs) and the quiet driver line ("Driver: Supaprod native").
3. **Balance and history live only in Settings** (Plan & Usage): Breakdown tab (grants with expiries, expiring-first spend), History tab, threshold alerts and a hard budget cap.
4. **Honesty rules:** never debit credits without an artifact in the Thread that names the work; any expensive toggle states a relative multiplier ("up to 2x"), never a live meter and never silence. Model economics stay invisible.

---

## 8. Tooltips and the guided tour

**Structure first; the anatomy teaches; copy confirms.** The product's primary tutorial is watching the plan decompose and the artifact form (Codex and Lovable both proved the working state IS the onboarding).

- **Tooltips** are earned, not sprayed: only where a feature genuinely needs one sentence (a glyph without an established convention, a scoped permission ask, a skipped-stage node). One sentence, sharp-PM register, no "simply".
- **Shortcuts teach themselves:** every menu item and tray verb shows its key inline; `?` overlays a context-filtered shortcut map. Navigation is two-key Go mnemonics (`G 1..7` walks the Spine, `G A` Approvals, `G B` Brain); tray verbs are `1/2/3/H` with `J/K`, matching Linear so PMs arrive pre-trained.
- **The guided tour** is opt-in, skippable at any step, about five stops, and covers only the room anatomy (Spine, Thread, Canvas, Composer, tray). It replays a completed loop on seeded demo data so every face has real content. First-run's real onboarding is one seeded journey ("What should we build next?") ending in one approved gate: the signature moment is the confetti.
- **Progressive permission asks:** danger is disclosed at the moment of need, inline and scoped ("allow for this run" / "always for this workspace"), never front-loaded in a settings page. The Agents settings pages are the ledger of grants, not where they are made.

---

## 9. The CanvasFace contract

The Canvas (60% or more of Mission Control) renders the stage's actual work through one component contract. The artifact is the progress bar: while agents run, the face shows the work forming, Lovable-preview style, auto-following the work until the user takes scroll control.

**Every face implements:**

1. **SurfaceHeader** (6.1), identical anatomy.
2. **The working triple** whenever its stage is running: the decomposed plan with the current step highlighted, what the agent is reading (sources), and outputs appearing live. This is also the re-entry view after a break; returning to a room lands on the triple, never on chat scrollback.
3. **Three-fidelity rendering** of its core objects: glyph row, peek card (hover or space, list stays put), full face. One object, three resolutions.
4. **ReceiptLine + NextLine** on every finished artifact.
5. **WarmSlot** for its empty state.
6. **A deep link** (stable URL per face, stage, and artifact; the surface-registry CI asserts it).
7. **Honest capability edges:** a face never renders chrome for unwired capability (no empty spend buckets, no fake terminals; "record how it landed" not "we measured", until the metric feed exists).

**The seven faces:** 01 evidence (signals, clusters, ranked bets), 02 decision (the case, teardown verdicts), 03 spec (document + assumptions + task graph), 04 interactive prototype (live scaffold in an iframe, side by side with what it replaces; consumes brand from Settings, never configures it), 05 code (aggregated multi-file diff with expand/collapse, hunk accept/reject, CI state, sandbox badge on any streamed commands, preview link), 06 ship state (release, rollout gates, launch kit drafts with copy-out), 07 growth digest (outcome versus contract, honest when sparse).

**Drawer depth:** peek is one level (the thread-as-container: conversation, live plan, sources, artifacts, diff in one object), room is two. Infrastructure (branch names, worktrees, model routing, RAG retrievals) stays behind the receipt, one click deep.

---

## 10. Review gates this spec adds

Any Mission Control mockup or PR is checked against: the grayscale test (2.5), the ember copy contract (6.3), the motion budget table (5.1), the one-live-locus rule (2.1), the forward-door rule (6.5), the cost-quiet rule (7), and the believable-timestamps rule (1). These are review items, not aspirations; several get CI enforcement (ActionSpec labels, forward doors, deep links) per the gap register.

---

## Addendum 1.1 (founder red-lines, 2026-07-19 evening)

These override anything above on conflict.

1. **Cards: edge strips banned.** No colored left/right/top edge strips or highlighter bars on any card, anywhere ("looks AI-designed"). Voice and attribution come from the agent chip and the content; gates from the ember chip and the action row. Cards are plain ink surfaces: hairline border, token radius, nothing decorative.
2. **Craft bar (binding, all surfaces).** Timestamps: right-aligned, mono, in the card header row, never floating mid-content or inline mid-sentence. Numbers emphasized inline must not break line flow or wrap oddly. Every card follows one internal grid: chip row (label left, time right), body, optional evidence chips, action row. Baseline alignment throughout. Text never distorted, truncated mid-word, or spaced irregularly.
3. **Color revision pending (token-only change).** The soft and faint tiers of the human (ember) and machine ramps get retuned; memory GOLD is retired and will be replaced by a modern, elegant, non-generic hue; the machine hue may also change if a candidate beats blue. Light mode gets an explicit strategy (one dual-mode accent set, or per-mode accents). Components must consume token variables only, so the revision lands entirely in ink.css.
4. **Ask affordances.** The docked per-screen composer stays AND the shell carries one always-visible Ask button in the TopBar with its shortcut key, opening the same composer. Never two input boxes on one screen.
5. **Threads home (new requirement).** Every conversation must land somewhere revisitable: a Threads surface with per-product and workspace-wide views, search, rename, grouping/folders, and promote-to-memory. Registry entry required; concept in design.
6. **Artifacts home (new requirement).** Generated resources (interactive prototypes, HTML files, docs, launch kits) need a named, revisitable home. Naming and placement in design; registry entry required.
7. **Post-login landing.** Returning users land on Mission Control at rest (the /m index resolves the last active product): the needs-you pill answers "what waits on me," the Briefing answers "what happened," the spine answers "where do I jump." Brand-new accounts get the first-run LoopFrame instead. Every exhibit states which state it shows.
8. **Standalone Ask panel stays retired** (founder confirmed 2026-07-19; may return later only on his explicit ask).
9. **Starfield decision deferred** until a rendered, subtle app-idle variant is reviewed on real frames.

## Addendum 1.2 (founder refinement, 2026-07-19 late)

Clarifies Addendum 1.1 item 1. Deleting the edge strip is NOT the solution; the strip did a real job (instant source recognition) and that job must be REPLACED by a deliberate, visible treatment:

1. **Every card must answer "who is this from" at a glance** without an edge strip. Design a replacement treatment and present options for the founder's pick: candidates to explore include a voice-tinted chip row band, a low-alpha background wash in the voice's faint tier, a corner source mark, an inset icon keyline, or a distinct surface material. Whatever wins must be visible in one glance, calm at scale (20 cards on screen), work in both themes, and never read as a decorative stripe.
2. **Memory/Brain cards get their OWN distinct tone treatment**, stronger than ordinary voice attribution: when content comes from memory (the product remembering: past decisions, house rules, evidence lines), the user must recognize it instantly as memory. This pairs with the memory-hue replacement (Addendum 1.1 item 3): the new memory color and the memory card treatment are one decision, presented together on the color v2 board.
3. The card-spec exhibit must show the chosen treatment on all card types (thread, gate, receipt, briefing, memory/evidence) side by side, in both themes, so the founder judges the system, not one card.

## Addendum 1.3 (founder ruling, 2026-07-19 late: chips wear slate silver)

The ember chip reads red to the founder and is retired FOR CHIPS ONLY. The slate silver ramp from the color board (the machine challenger's values) becomes the chip ramp: dark fg #b9c4d4 / dim #79828f / soft #171b21 / faint #101317, light fg #3f4c60 / dim #77839a / soft #edf0f4 / faint #f5f7fa, tokens --chip-*. Applies to every pill/chip mechanism (gate chips, the needs-you pill, stage/source/label chips). Ember remains on primary actions (the Approve button), never on chips. This does NOT decide Pick 3 (the machine voice hue): chips are a separate neutral mechanism now.
