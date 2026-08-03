---
version: 3.0 "Obsidian" (design-system lineage: v1 tokens, v2 Ember Editorial parchment, v3 Obsidian dark · distilled from the founder-approved Design Strategy DOCUMENT v4)
created: 2026-07-02
updated: 2026-07-02 (repo amendments, see the Amendments section at the end;
  each clarification is sourced from this package's own tokens and prototype)
name: supaprod-obsidian
status: RETIRED 2026-07-10 (founder ruling) -- superseded by v5 "Tempo"
  (/DESIGN-TEMPO.md + design-reference/tempo-v5/) for ALL surfaces. Kept as
  history only; never build new surfaces from this file.
  [Pre-retirement status: the BASE layer of the app contract under v4 Loom;
  superseded the Ember parchment system for authenticated surfaces.]
specimen: design-reference/obsidian-v3/design-reference/obsidian-specimen.html
  (the founder-approved visual specimen, committed in-repo; when in doubt about
  how something should look, open it. The full frozen handoff package incl.
  tokens, component anatomies, implementation notes, and the runnable
  six-surface prototype lives at design-reference/obsidian-v3/; agent entry
  point is the supaprod-design skill)
---

# Supaprod Design v3 · "Obsidian" · Source of truth

Every agent (Claude Code, Lovable, Gemini, or human) building or redesigning
ANY feature reads this file first. The strategy document (HTML specimen) shows
how it looks; this file states the law.

## 0. The design idea

A calm instrument: a jet-black cockpit where the machine's work glows softly,
and the only thing that ever asks for attention, in ember orange, is a decision
that genuinely needs a human. Three laws answer everything:

1. One object, one anatomy. Everything is one of seven objects: Signal,
   Opportunity, Spec, Mission, Call, Outcome, Learning. Each has exactly one
   card, one detail view, one status language, identical everywhere.
2. One queue for attention. Every gate, approval, and decision request is a
   Call in one queue with one badge. Ember is reserved exclusively for it.
3. Depth on demand. Three layers everywhere: quiet list, slide-over panel,
   full view. Layer one never shows more than one decision's worth of info.

## 1. Surfaces (canvas ramp)

- canvas #0A0A0B · rail #0D0D0F · card #111113 · raised #17171A · hover #1D1D21
- hairlines rgba(255,255,255,0.07) replace shadows; depth is surface tint
- text: primary #F2F0ED · body #B5AFA6 · muted #9C978F · subtle #7D786F ·
  faint #55524C
- glass (slide-overs, hover cards): blur 20, 8% white hairline

## 2. Role colors (each has exactly ONE job)

- Ember #FF6B2C (deep #C2571F, soft #FFA477): needs a human. Calls, gates,
  the one primary CTA. Never decoration, never a label color.
- Glacier #7FD1DC: THE machine voice. Live state, agent presence, mono-caps
  label accent, status pulses.
- Royal violet #C77DFF: exists ONLY inside the shimmer gradient and the
  working butterfly. Never a standalone accent.
- Blossom #E5BDDF (depth Fuchsia #C2337E): information. Links, citation
  chips (superscript). (Focus rings are glacier and selection is ember;
  see §11 and the tokens. Amended 2026-07-02.)
- Moss #7FBF8E: outcomes only, positive (validated, shipped, kept).
- Madder #E06557: outcomes only, negative (missed, failed, killed).
- Light tints for small mono-caps labels: glacier standard, blush #F3C1C1
  alternate. Full-saturation ember never colors a label.

## 3. Working palette (data only; role colors never plot data)

Named families, each with one home; a family never moonlights:

- Tangerine #F97316 · Marigold #E8A33D · Melon #FF9466: spend and cost
- Scarlet #E23D33 · Poppy #F0533F: severity in the Safety room only
- Flamingo #F26B8A · Magenta #C2337E · Rose #E89AB0: user-behavior data
- Mauve #B78BC7 · Amethyst #7E5AA6: agent identity (one fixed shade per face)
- Cornflower #6B8AFD · Cobalt #3B5BDB: benchmarks, baselines, comparisons
- Lemon #F2E27A · Daffodil #F5D94E: chart annotations, calendar density
- Teal #2E9E8F: the machine's data series (loop health trends, uptime)
- Pearl #EDEAE4 · Ash #A8A29A · Slate #6E6A64: axes, grids, disabled
- Laws: max three families per chart; caramel/brown is banned (reads old-age)

## 4. The restraint budget (per screen, hard law)

- At least 90% of any screen is neutral (canvas, ink, hairlines)
- One ember CTA · at most one aurora card · at most one shimmering element ·
  at most two pencil annotations · status color only on actual status
- One machine voice: glacier. Grayscale test before shipping: the screen must
  make complete sense with color removed; if meaning lives in color alone,
  add the word.

## 5. Type

- Newsreader (serif): display, heroes, spec bodies, ICE scores. 400 to 470.
  One italic emotional word per screen, max.
- Schibsted Grotesk: all UI. 13px base, 1.55 line height, 600 headings.
- JetBrains Mono: metadata. 9.5 to 10px caps, 0.10 to 0.12em tracking.
- Codystar: dotted-matrix numerals on aurora score cards only.
- Caveat: pencil annotations only.

## 6. Geometry and motion

- 4px grid; rhythm 8/12/16/24/40. Radii: 8 controls, 12 cards, 14 panels,
  99 pills. Density: comfortable and compact modes, set once.
- Interaction states (every control answers the cursor): hover lifts the
  background one surface step and brightens the hairline; live elements add
  their role-color glow. Press: ember darkens to its deep #C2571F. Focus:
  2px glacier outline, offset 2. Selection: ember at 28%.
- One easing cubic-bezier(0.23, 1, 0.32, 1); durations 140/200/280ms.
- Only three things move on their own: the live pulse on working agents, step
  progress, and the arrival of something new. Decoration never animates.
- Entrances are transform-first, staggered 30ms per row, capped at six rows.
- All motion gates on prefers-reduced-motion and an in-product toggle.
- The AI shimmer: slow living gradient, linear-gradient(90deg, #7FD1DC,
  #5B7CFA, #8B5CF6, #C77DFF, #EAF6FF, #3B5BDB, #7FD1DC), background-size
  280%, 5s drift. Only on text/marks representing the machine actively
  working; max one per screen.
- Aurora score cards: multi-hue drifting radial washes with Codystar numerals,
  glow bleeding slightly past the card. Only on score moments (loop health,
  teardown confidence, outcome scores). Hue encodes state: moss-forward
  healthy, ember-forward needs attention, madder-forward failing.

## 7. The mark

The bilateral Butterfly, exact production geometry (CadenceMark paths),
gradient-lit: molten ember upper wings, saffron-gold lower wings, fine light
edge, porcelain body, deep dark shadow, NO ring or halo decoration.
Status states (also the favicon): idle = ash wings + faintest pearl ring;
working = royal violet wings + breathing violet halo + slow flutter;
call waiting = full ember wings + brightest pulsing ember halo.
Arrival choreography (splash/loading): flies in, four quick wing beats,
lands, settles to slow two-wing rest. Glow intensity IS the signal.

Iconography (amended 2026-07-02, codifying what the prototype practices):
there is NO icon set. The nav uses the mono numeral index (01-06), a
deliberate signature (mono index, not icon soup). The Butterfly is the only
pictorial element; never redraw it (use assets/). Affordances are unicode
characters in mono: →, ⌘K, and the middot · as the separator everywhere.
Status is communicated by 6px glowing dots plus mono-caps words, never icons.

## 8. Information architecture

Six destinations + summonable AI + one door. Features NEVER add nav items.

- Today: the ritual. Call queue, what changed (with causes), machine status,
  the loop strip (SENSE > DECIDE > DEFINE > BUILD > LEARN with live counts).
- Discover: signal feed + auto-clustered themes ranked by corroboration; the
  evidence desk. Promoting a theme sends its bet to Decide.
- Decide: the ICE-ranked opportunity queue, Critic verdict inline, "Challenge
  this" teardown as first-class action. The decide stage between Discover
  (sense) and Plan (define).
- Plan: cited specs (serif body, margin citations), outcome-declared roadmap
  (Now/Next/Later, each bet with its measure; committing has ceremony).
- Build: ONE cockpit for all missions. Numbered agent steps, live pulses,
  inline gate, trace one toggle deeper, cost in every footer.
- Brain: decisions with outcome verdicts, learnings with what they moved,
  belief graph, exportable personal track record.
- Ask (Cmd+J): context-aware AI panel over any screen. Not a destination.
- Engine Room (one door): opens on a health summary, then four rooms named
  for the user's question: Spend, Quality, Safety, Record. Approvals live on
  Today (the Call queue), never here. Every row drills into detail with
  sub-tabs; nothing dead-ends.
- Settings: four panes (You, Workspace, Connections, Plan). Connections is
  the ONLY integrations home: two shelves (Yours / This workspace's); a
  connection card shows provider, scope, owner, glowing status (live/stale/
  failing), last sync, permissions, one action. Failing connections raise a
  Call. No input is ever asked twice. Admin stays role-gated and separate.

## 9. Components (canonical anatomies)

- Call card: who asks · what they ask · verbatim cited evidence · plain-words
  actions (Approve / Send back) · consequence as helper text · expiry.
- Mission row: status dot + title + agent/step in mono + cost. Slide-over:
  numbered steps, live step pulsing, inline gate, trace toggle.
- Status dots (word + dot + own glow/motion, always): working glacier pulse ·
  thinking blossom breathe · waiting-on-you ember flare · in-review marigold ·
  shipped moss · blocked madder · queued matte slate.
- Verdict chips: mono caps, tinted fill 12%, soft glow: VALIDATED/SHIP moss ·
  MISSED/KILL madder · REVISE ember · BY AGENT glacier · EVIDENCE THIN blossom.
- Pencil annotations (Caveat + neon underline, max two per screen): the PM's
  own voice: "best bet" lime, "pet feature?" blossom, "scope creep!" apricot.
- Citations: superscript blossom chips, verbatim quote on hover, source named.
- AI message: body + sources + time + cost in quiet mono, "How I got this"
  one click deeper. Model names live in the trace, never in the chrome.
- Buttons: one or two plain human words (Approve, Send back, Build this,
  Start, Challenge). Mechanism names are banned on controls.

## 10. Voice and microcopy

- A sharp PM's voice: calm, contractions, PM vocabulary (backlog, scope,
  ship, bet), one wink per screen max, always plain at trust moments.
- Examples: "Zero calls. Enjoy the quiet roadmap." · "Good call. The PR is
  open." · "Your pet feature has three problems. Receipts attached." ·
  "Scout is reading 48 hours of tickets so you don't have to."
- Humanized-output law (hard, UI + everything agents generate, enforced by
  sanitizer): no em or en dashes, no invisible Unicode, no AI-cliche words
  (seamlessly, leverage, empower, robust, unlock, delve), no exclamation
  marks, no emoji.

## 11. Journey and capability discovery

- Golden path: track pick > one connection (or seeded demo) > point the
  Critic at a belief > cited teardown lands on Today in 10 minutes.
- The loop strip on Today teaches the architecture by existing.
- Next-step engine: every object detail ends with one suggested action;
  every empty state is an instruction with a time estimate. No dead ends.
- Contextual reveal: a capability introduces itself the first time its
  trigger exists; one glacier coach mark, dismissed forever. No tours.
- The catalog: Cmd+K "What can it do?", searchable, each capability with a
  plain-words pitch and a "Try it" on real data.
- Keyboard: 1 to 5 switch surfaces, Cmd+K acts, Cmd+J summons, A/S answer
  the current Call, Esc closes. Shortcuts revealed on hover in mono. Focus
  is a 2px glacier ring. Every control answers the cursor (lift, brightened
  hairline, role-color glow).

## 12. Standing instructions (any builder, human or AI)

1. Run the placement algorithm before writing a line: which object, which
   intent, which layer, does it need attention (then it is a Call), or is it
   rare (then Cmd+K). New features never get nav items, badges, or banners.
2. Colors only from roles and ramps above. Never invent a hex.
3. Buttons are plain human words; consequence in helper text.
4. Voice rules and humanized-output law apply to every string.
5. Anything needing the human is a Call in the one queue. One home per
   concept; no duplicated inputs.
6. Design every state: hover, focus, active, empty (an instruction), loading,
   error. A shortcut for every repeated action.
7. Motion and glow only with meaning; one easing; reduced-motion gated.
8. Every object renders with its canonical anatomy; extend it for everyone.
9. Obey the restraint budget and pass the grayscale test before shipping.

## Amendments (2026-07-02, repo-side clarifications)

Adopted with the contract; every clarification is resolved FROM this
package's own files, never from the superseded parchment system:

1. Focus ring is glacier (2px, offset 2) and selection is ember at 28%.
   Source: this package's `tokens/colors.css` (`--focus-ring`, `--selection`),
   §11, and the prototype's `:focus-visible` / `::selection` rules. §2's
   original blossom line briefly claimed focus and selection; the tokens win.
2. Interaction states codified in §6 (hover lifts one surface step + brighter
   hairline, press = ember deep, focus = glacier ring). Source: `components.md`
   button and row anatomies and the prototype's hover/press values.
3. Iconography law codified in §7 (no icon set; mono numeral index; the
   Butterfly as the only pictorial element; unicode affordances; dots + words
   for status). Source: the prototype and `components.md`, which use no icon
   set anywhere.
4. The committed home of this system: the contract lives at the repo root
   (this file, the law); the full frozen handoff package (tokens, anatomies,
   notes, runnable prototype, specimen) lives at `design-reference/obsidian-v3/`;
   the agent entry point is the `supaprod-design` skill (`.claude/skills/`).
5. The surfaces the handoff deliberately stubbed (the ⌘K palette UI, the Ask
   panel, Settings, onboarding, Engine Room room details, chart grammar,
   density modes, micro-interaction recipes, the empty-state catalog) are
   specified in `design-reference/obsidian-extensions.md`, composed entirely
   from this contract's tokens and laws. This contract wins on any conflict.
