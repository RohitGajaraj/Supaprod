# Design craft references study: dark-first monotone, motion craft, AI presence, and the Supaprod color proposal

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining (Phase R). Created 2026-07-19.
> Sources verified live this session: vercel.com/geist (colors, introduction), rauno.me/craft (incl. "Invisible Details of Interaction Design"), devouringdetails.com (Rauno Freiberg's interactive course, 3 units / 8 principle chapters), interfacecraft.dev (Josh Puckett), shapeof.ai/patterns/color, plus 2026 market chatter on AI working-state UI (Cursor vs Devin visibility models) and the "AI purple" saturation problem.
> Local inputs: `src/styles/ink.css` (Ink v6 tokens), the landing applied record `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`, the charter's visual-direction section.

---

## 1. What the references actually teach

### 1.1 Vercel Geist: color is a role system, not a paint box

- Geist is "a high contrast, accessible color system" with 10 scales (backgrounds, gray, gray-alpha, blue, red, amber, green, teal, purple, pink). Backgrounds get only two values; every other scale has 10 steps, and **each step maps to a usage, not a mood**: 100-300 component backgrounds (default / hover / active), 400-600 borders (default / hover / active), 700-800 high-contrast backgrounds, 900-1000 text and icons.
- The lesson for Supaprod: our voices (ember, machine, memory) are currently single hexes plus one or two ad-hoc alphas. Geist would give each voice a small ramp with named roles (soft background, border, solid, text) so a voice can appear at four intensities without anyone inventing an rgba inline.
- Grid is "a core part of the Vercel aesthetic": structure carries identity, color carries meaning. Our ink grid tokens (`--ink-grid-fine/coarse`) already follow this; the reimagined app should keep structure-first depth and never let a hue do a hairline's job.

### 1.2 rauno.me/craft: the frequency rule and the novelty budget

Key rules extracted from "Invisible Details of Interaction Design" and the craft index (Novelty, Designing Depth, Contrasting Aesthetics):

- **Frequency over novelty.** Interactions executed hundreds of times a day should carry minimal or zero animation. "When so commonly executed, the interaction novelty is also diminished." macOS context menus and app switchers animate nothing. For Supaprod: the Composer, the Approvals tray open/close, drawer peeks, and Spine stage-switching are high-frequency; they get instant or near-instant transitions. The gate-approval moment is low-frequency and high-stakes; it earns the signature animation.
- **Peripheral input rule.** Mouse and keyboard input is "less visceral, and more mechanical than touching the screen," so desktop warrants less motion than touch. Supaprod is a desktop product; default to less motion than a mobile-derived instinct suggests.
- **Immediate response, then animate.** Apply state change in real time, animate only past the trigger point. Never make a click wait for an entrance animation to acknowledge it.
- **Spatial consistency.** Motion should teach structure: things open from where they live (Dynamic Island logic). Drawers should slide from the edge they belong to; a gate card expanding into the Canvas should grow from the card, telling the user the Canvas IS the card's depth.
- Already adopted on the landing and to be kept in-app: never animate box-shadow (pre-render, toggle opacity), mask-fade grids at edges, double-ring focus, transform/opacity only, reduced-motion resolves to the finished visible frame, and a **novelty budget** (the two high-novelty moments never stack in consecutive beats).

### 1.3 Devouring Details: choreography, delay, and the courage not to move

Rauno's course (Principles unit: inferring intent, interaction metaphors, ergonomic interactions, simulating physics, motion choreography, responsive interfaces, contained gestures, drawing inspiration) makes two points load-bearing for us:

- "Some animation sequences can be improved with just a touch of delay" and "some interactions just feel better without any motion at all." Premium feel comes from intentional timing and selective absence, not from more motion. A 60-120ms stagger across Thread items arriving reads as orchestration; simultaneous arrival reads as a dump; animating every arrival forever reads as noise.
- Motion choreography is a sequencing discipline: when the machine finishes a stage and the Spine advances, ONE choreographed sequence (stage node fills, ember gate pip lights, tray badge increments) beats three independent animations firing at once.

### 1.4 Interface Craft: uncommon care as the brand

Josh Puckett's thesis: software should feel "like it was made by someone who took the time to apply an almost unreasonable level of consideration." The practical reading: premium feel is cumulative micro-correctness (optical alignment, consistent radii, believable timestamps, no orphaned states), not any single flourish. The founder's landing rulings (believable trace times, layout-stable typing effects) are already this school; the app must hold the same bar in empty states, error states, and loading order.

### 1.5 Restraint creates premium feel: the distilled mechanism

Across all four references the mechanism is the same:

1. Monotone base makes every chromatic pixel a signal. When 98% of the screen is ink/zinc, one ember pip outshouts a competitor's whole dashboard.
2. High contrast is the accessibility floor AND the aesthetic: silver-on-ink hairlines, not colored dividers.
3. Motion is spent, not sprinkled: a novelty budget, the frequency rule, choreography over simultaneity.
4. Depth from structure and light (layering, grids, masks, edge-light), never from hue or heavy shadow.
5. The absence of decoration is only premium when correctness is total; restraint plus sloppiness reads as unfinished (the exact failure verdict of the rejected rebuild: "depth behind the palette read as empty").

## 2. AI-presence patterns: how great products show "the machine is working" (mid-2026 state)

- **Two visibility philosophies dominate.** Cursor-school: continuous visibility, reasoning close to the artifact, changes forming live, intermediate steps visible, easy to intervene. Devin-school: delegated execution, plan up front, progress in summarized chunks. Supaprod's charter (ambient clickable depth, Canvas auto-follows the work, Working strip always on) is deliberately Cursor-school at the surface with Devin-school delegation underneath: show the stream, summarize in the Thread, keep the receipts one click deep. The references confirm this hybrid is the strongest position.
- **The working-state vocabulary that reads as craft in 2026:** streaming text with a caret (we have `ink-caret`), skeletons shaped like the arriving content (we have `ink-skeleton`), a soft periodic pulse on the active element (we have `ink-working`), progress that names the current action in plain verbs, and believable timestamps. What reads as cheap: indeterminate spinners, fake percentage bars, shimmer applied to everything, and working states that never change their language.
- **The purple problem.** Purple/violet gradients are the single loudest "AI slop" tell of 2026: Tailwind indigo defaults plus training-data feedback loops made purple the statistical default for AI features (Notion purple, Intercom Fin purple gradient, Canva green/purple). shapeof.ai documents the saturation and the resulting brand confusion, and highlights products (e.g. ReWord) that deliberately keep their own brand color for AI features instead. Verdict for any AI product wanting to feel crafted in 2026: **do not be purple**.
- **Color alone is not attribution.** shapeof.ai's directive: "Do not rely on color alone. Pair color with icons and clear signifiers." Agent-attributed content needs a shape signifier (chip, avatar mark, mono label) alongside the machine color, for accessibility and for print/screenshot legibility.

GAP: Supaprod attributes agent work by color alone in several surfaces (blue text or blue numerals with no accompanying icon/mono signifier). The reimagined shell needs a standard agent-attribution atom (mono agent-name chip plus the machine color) used everywhere machine output appears, so attribution survives grayscale, colorblindness, and screenshots.

## 3. THE COLOR PROPOSAL

Fixed and not revisited: ink black surfaces (`#0a0a0a` / `#0d0d0e` / `#18181b`), the zinc text ramp, silver hairlines, **ember `#FF6B2C` as the brand and the human's move**.

### 3.1 The machine color: CONFIRM blue `#6CB0F5`, and promote it to a ramp

Blue was challenged against teal (`#2DD4BF`), cyan (`#67E8F9`), violet (`#A78BFA`), and desaturated silver. Blue wins on every axis that matters:

| Criterion | Finding |
| --- | --- |
| Contrast on `#0a0a0a` | 8.64:1 (AAA for normal text). Ember is 6.97:1, gold 10.43:1. All pass. |
| Distance from ember | Orange vs blue is the maximum-separation hue pair and the classic colorblind-safe opposition (survives deuteranopia and protanopia, which red/green and orange/gold pairs do not). The human-vs-machine distinction is the most load-bearing signal in the product; it must be the most robust pair on screen. |
| 2026 semantics | Purple/violet is disqualified: it is the saturated "AI slop" tell and would erase the crafted register. Teal and cyan drift toward terminal-hacker aesthetics and sit perceptually too close to success green `#4AC26B`, contaminating the verdict layer. Blue reads calm, technical, informational (Geist uses blue for info), which is exactly the agent's register: competent, not magical. |
| Continuity | Blue is already the landing's agent voice and the PixelStat data-numeral ruling. The landing is the loved baseline; changing the machine hue would break the one visual grammar users have already approved. |

Refinement, not replacement: `#6CB0F5` at full strength is a statement color; an always-on Working strip and an ambient Spine would over-emit it. Give the machine voice a Geist-style role ramp so ambient presence whispers and events speak:

```
--voice-machine:        #6cb0f5   /* text, icons, active stage node, caret */
--voice-machine-dim:    #4d7fb3   /* ambient always-on: Working strip idle, inactive traces */
--voice-machine-border: rgba(108,176,245,0.35)
--voice-machine-soft:   rgba(108,176,245,0.14)  /* fills, pulse halo (exists) */
--voice-machine-faint:  rgba(108,176,245,0.07)  /* row tint for machine-authored rows */
```

Rule of use: the full hue marks WHERE the machine is acting right now (one live locus per screen where possible); dim/faint tiers carry "the machine exists here" ambience. Same five-tier pattern for ember (human) so gates can whisper before they shout.

GAP: `ink.css` has no dim/faint/border tiers for either voice; components will otherwise invent inline rgba values and the ambient surfaces (Working strip, Spine) will over-saturate. Tokenize the ramps before any Mission Control component is built.

### 3.2 Third accent: CONFIRM memory gold `#E8B44C`, ban intact

Gold has earned meaning (the Brain, memory moments, the mark's core bead) and the founder's gold ban gives it its power: it appears ONLY in the memory grammar, never on text, headings, or metrics. Keep exactly this. Gold at 10.43:1 contrast is the brightest voice on ink, which is correct: memory moments are rare, so the rarest voice may be the most luminous. Give it the same five-tier ramp, used almost entirely at soft/faint tiers (a gold left-edge tick on a Thread row that cites memory; full gold only inside Brain).

### 3.3 Fourth accent: NO new hue

Every candidate job for a fourth voice is already covered: verdicts have green/red, attention is ember's job, data numerals are machine blue. A fourth voice would spend the restraint budget that makes the first three legible. The verdict layer (`--verdict-pass/fail`) stays a state layer, not a voice: applied to badges and outcomes only, never to prose or chrome.

### 3.4 Token conflict to resolve: working amber vs memory gold

`--verdict-working: #d9a13c` is perceptually the same hue as memory gold `#E8B44C`. Two meanings, one hue, on the same screens (a building mission next to a memory citation) breaks the "color = who is speaking" law.

Recommendation: retire amber as the working color. "Working" IS the machine speaking, so working states use the machine ramp (the existing `ink-working` blue pulse already does this correctly). Reserve the amber/gold region exclusively for memory. If a queued/attention-needed state needs a color, that is ember's job (the human's move).

GAP: `--verdict-working #D9A13C` collides with `--voice-memory #E8B44C`; the working state is expressed in two different hues (amber token, blue pulse) in the same stylesheet. Fold working into the machine ramp and delete the amber token before the rebuild reuses it.

### 3.5 Light mode

The existing light overrides hold (`#F05A1A` ember, `#2E6ED6` machine, `#B8860B` gold: all deepened for white). Extend the new ramp tiers into `[data-theme="light"]` in the same commit that adds them; never ship a dark-only token.

## 4. Starfield in-app: VERDICT

**Working surfaces: no. Brand moments: yes, at reduced density, behind the mockup gate.**

Rationale from the references:

- Rauno's frequency rule: Mission Control is the highest-frequency surface in the product, viewed hours per day. Ambient novelty decays into noise or (worse) into perceived load; the landing starfield is felt precisely because visitors see it for ninety seconds. An always-on starfield behind the Thread and Canvas also competes with the one ambient signal that MUST be felt: the machine-blue working presence.
- Legibility: the Canvas renders dense evidence, specs, code, terminals. The landing needed `.cap-scrim` to protect mono text from the grid; an app that needs scrims everywhere has chosen the wrong backdrop.
- But a blanket ban wastes owned brand DNA. The starfield is the field the epitrochoid mark was drawn in; it belongs wherever the product is in a "brand moment" rather than a "work moment" (the exact Pixel-font rule from Tempo, applied to backdrop):
  - Workspace/product empty states ("no missions yet") at roughly half landing density, far layer only.
  - Onboarding and the guided tour frames.
  - The Brain's idle/overview state (the memory surface is the most celestial concept in the product; stars plus the gold grammar is a coherent room identity).
  - Optionally, one beat of the gate-approval signature moment (approval fires, agents set off, a brief far-layer drift acknowledges motion), reduced-motion safe.
- Implementation is cheap to gate: `LandingBackdrop` already takes density/layer parameters and is deterministic (no hydration mismatch). Expose a `variant="app-idle"` preset and let the mockup gate judge it on the actual Mission Control frames.

## 5. What Supaprod should steal

Concrete and implementable, in build order:

1. **Voice ramps (Geist role model).** Extend `ink.css` with the five-tier ramps for ember, machine, memory (3.1/3.2 above) plus role names matching Geist's step logic (soft background, faint row tint, border, solid, hover). One rule in the file header: components never write a voice rgba inline. This is the single highest-leverage change; it makes the always-visible machine presence (charter requirement 4) buildable without saturation.
2. **A motion budget table in the design contract.** Three classes: (a) high-frequency chrome (Composer, tray, drawers, Spine switching): 0-120ms, transform/opacity only, or no motion; (b) content arrival (Thread items, Canvas faces): 150-250ms with 60-90ms stagger, `--ink-ease`; (c) signature moments (gate approval, stage completion, first-run): up to 900ms choreographed sequences, max one per screen, never two in consecutive beats. Enforce Rauno's laws globally: instant acknowledgment before animation, no box-shadow animation, reduced-motion resolves to the finished frame.
3. **The gate-approval choreography as THE signature moment.** Approve in the tray: the gate card's ember resolves, the Spine's next stage node fills machine blue with the `ink-working` pulse, the Working strip's verb changes, optionally one far-layer star drift. One sequence, 700-900ms, spatially continuous (the energy visibly travels from the approved card to the stage node). This is charter requirement 11's "approving a gate visibly sets agents in motion" made concrete, and it is where the entire motion budget for that screen is spent.
4. **A working-verb deck bound to the machine color.** Rotating plain-verb working labels ("reading the interviews", "drafting acceptance criteria", "running the test suite") rendered in mono + machine blue in the Working strip, changing with real loop steps, never generic ("Thinking..."). Continuous-visibility school at the strip, chunked summaries in the Thread, receipts in the drawer: the Cursor/Devin hybrid.
5. **The agent-attribution atom.** One component: mono agent-name chip (Scout, Critic, Builder...) + machine-color treatment + consistent placement, used on every machine-authored row, message, and Canvas face header. Color never carries attribution alone (shapeof.ai directive); grayscale test must still show who did what via the chip.
6. **Anti-purple discipline as a written rule.** Add to the color section of the contract: no purple/violet/indigo anywhere in the product, including charts and third-party embeds where controllable. It is the 2026 generic-AI tell, and Supaprod's differentiation ("felt generic" was a rejection verdict) partly lives in refusing it.
7. **Starfield presets, not starfield decisions.** Implement `variant="landing" | "app-idle" | "brand-moment"` on the existing backdrop component (density, layers, drift factors) so the mockup gate reviews real frames instead of debating a principle.
8. **Believability as a QA gate.** Port the landing's believable-timestamps ruling into the app: demo seeds and working states must show plausible durations and clock times (the Love-Gate check inherits Interface Craft's "unreasonable consideration" bar).

## 6. GAP lines (collected)

GAP: Supaprod attributes agent work by color alone in several surfaces; needs a standard agent-attribution atom (mono chip + machine color) so attribution survives grayscale, colorblindness, and screenshots.

GAP: `ink.css` has no dim/faint/border tiers for the voice colors; ambient always-on surfaces (Working strip, Spine) cannot be built without over-saturating machine blue or inventing inline rgba values.

GAP: `--verdict-working #D9A13C` collides with memory gold `#E8B44C` and contradicts the blue `ink-working` pulse; the working state currently speaks in two hues. Fold working into the machine ramp, delete the amber token.

GAP: no codified motion budget exists for the app (the landing has per-element rulings, the app has only `--ink-fast/slow`); without the three-class frequency table, the rebuild will re-create the over-animated or under-animated extremes.

GAP: the starfield backdrop has no parameterized app presets; the mockup gate cannot evaluate starfield-in-app without frames built from real reduced-density variants.

---

### Source list

- https://vercel.com/geist/introduction and https://vercel.com/geist/colors (10-scale role model, step-usage mapping)
- https://rauno.me/craft and https://rauno.me/craft/interaction-design (frequency rule, peripheral input, immediate response, spatial consistency)
- https://devouringdetails.com (principles unit: motion choreography, selective delay, motion absence)
- https://interfacecraft.dev (Josh Puckett, "uncommon care" thesis)
- https://www.shapeof.ai/patterns/color (AI color conventions, purple saturation, color-plus-icon directive)
- 2026 AI-agent UI visibility comparisons: builder.io/blog/devin-vs-cursor, marktechpost.com 2026-06-10 agent platform comparison, levelop.dev agent ranking
- AI-purple critiques: dev.to "AI Purple Problem", braingrid.ai "Design Systems for AI Coding", prg.sh on Tailwind-indigo feedback loops
- Local: `src/styles/ink.css`, `design-reference/tempo-v5/applied/2026-07-15-landing-v2-ink-and-starfield.md`
