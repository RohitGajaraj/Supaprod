# Obsidian v3 · Repo extensions (gap fills on top of the contract)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

**What this is.** The v3 handoff deliberately stubbed a set of surfaces (its
`implementation-notes.md` § "Out of scope"): the ⌘K palette UI, Settings,
onboarding, Engine Room room details, plus patterns the contract names but does
not draw (chart grammar, density modes, micro-interaction recipes). This file
fills those gaps. **Authority chain:** [`docs/design/archive/obsidian-v3.md`](../docs/design/archive/obsidian-v3.md)
is the law and wins on any disagreement; every value below is composed from the
package's own tokens (`design-reference/obsidian-v3/tokens/`); nothing here
introduces a new hex, font, easing, or duration. Authored as Head-of-Design
gap fills per the founder's 2026-07-02 directive; sources of intent:
[`AI_Product_Design_Constitution.md`](./AI_Product_Design_Constitution.md).

---

## 1. Command palette (⌘K) and the capability catalog

The one place all 250+ capabilities live without ever touching the nav
(contract §11 "the catalog", §12.1 "rare = Cmd+K").

- **Panel:** centered, 560px (max 92vw), top 18vh. Glass per §1: `--raised`
  base, blur 20, 8% white hairline, radius `--radius-panel` 14. Scrim
  rgba(4,4,5,0.6) + blur(3px). Enter `cadRise` 200ms; Esc closes; focus trapped.
- **Input:** Schibsted 15px on a bare row (no box), caret ember, placeholder
  muted: "Search, act, or ask what it can do". A mono `ESC` hint right.
- **Result rows** (max 8 visible, then scroll): mono index left (01..08, faint,
  turns ember on the active row), label 13px primary, right-aligned mono hint
  (the shortcut, or the object kind: CALL · MISSION · SPEC). Active row bg
  `#1A1A1E`, 2px glacier focus ring on keyboard. Sections in mono-caps labels:
  JUMP · ACT · ASK · CATALOG.
- **The catalog mode** ("What can it do?"): each capability is one row: a
  plain-words pitch (13px, "Tear down a belief with receipts") + a "Try it"
  quiet action that runs it on real data (§11). Never a marketing name; never
  a mechanism name.
- **Voice:** empty query shows the five destinations + the three most recent
  objects. No result: "Nothing by that name. Try a verb, like challenge or
  connect." (instruction, never a dead end).

## 2. Ask (⌘J) · the summonable AI panel

Context-aware AI over any screen; a panel, never a destination (§8).

- **Panel:** right-docked slide-over, 420px (max 92vw), same chrome as the
  mission slide-over (§9): bg `#101013`, left hairline, `cadSlideIn` 240ms,
  Esc closes, focus trapped and restored.
- **Header:** mono-caps label ASK + the current context named in plain words
  ("About: the checkout fix mission") + Close. The context chip is glacier
  hairline (the machine reads the screen; glacier is its voice).
- **Thread:** AI messages use the canonical AI-message anatomy (§9): body +
  sources + time + cost in quiet mono + "How I got this" one click deeper.
  User turns right-aligned on `--surface-card-deep`, radius 12.
- **Input:** bottom-fixed, textarea grows to 4 lines, mono cost preview under
  it when a heavy action is proposed. Enter sends; the ONLY ember in the panel
  is a CTA the answer proposes (for example "Build this"), max one, and only
  when the action genuinely needs the human.
- **While thinking:** the shimmer (one per screen budget: the rail working
  line yields to the panel while Ask is open) on a three-word status in mono:
  "reading 48 tickets". Never a spinner.

## 3. Settings · four panes, and the Admin posture

§8 fixes the panes: You, Workspace, Connections, Plan. No input asked twice.

- **Layout:** quiet left index (mono 01..04 + label, same anatomy as the nav)
  inside the content column, not a second rail. Right: one card stack per
  pane, max-width 720px. Every row is label 13px + value muted + one action.
- **Connections** is the ONLY integrations home: two shelves (Yours · This
  workspace's). The connection card anatomy is contract §8 verbatim: provider,
  scope, owner, glowing status word (live moss / stale marigold / failing
  madder), last sync in mono, permissions, ONE action. A failing connection
  raises a Call; it never badges Settings.
- **Plan:** the money pane. Spend to date in mono, the cap, one primary action
  ("Add headroom", ember only if action is genuinely required now).
- **Admin (posture, role-gated):** Admin is not a fifth pane and never enters
  the nav. It is a role-gated door on the Workspace pane ("Admin console →"
  quiet mono link, visible to admins only) opening the same room pattern as
  the Engine Room (§5 below): rooms answer questions (Members, Roles, Audit,
  Billing), verdict-first, sub-tabs for depth. A smart non-technical admin
  must pass the Engine-Room Test on every label.

## 4. Onboarding · the golden path, screen by screen

Contract §11 fixes the path: track pick → one connection (or seeded demo) →
point the Critic at a belief → cited teardown lands on Today in 10 minutes.

1. **Arrival:** black canvas, the Butterfly arrival choreography (§7: flies
   in, four wing beats, lands, settles). One line in Newsreader 34px: "Judgment,
   with receipts." Sub in muted 13px. One ember CTA: "Start". Nothing else.
2. **Track pick:** three quiet cards (radius 12, hover lift one step), each a
   plain-words job: "Find what to build next" · "Ship what is decided" ·
   "Prove what worked". Picking one sets the seeded examples; it never limits
   capability (§11: capability reveals contextually later).
3. **One connection:** a single Connect button per §8 shelf anatomy; the
   seeded-demo path is equal-weight, one quiet action: "Use demo data
   instead · 0 setup". Empty-state law applies: each option carries a time
   estimate ("Intercom · about 2 minutes").
4. **Point the Critic:** one input, pre-filled with a real belief from the
   connected source ("Mobile capture is our biggest gap"), one ember CTA:
   "Challenge this". The consequence line: "The teardown lands on Today ·
   receipts attached".
5. **Land on Today** with the working shimmer live in the rail and one glacier
   coach mark (§11: introduced on first trigger, dismissed forever): "Your
   first teardown is being built. This badge is where decisions find you."
   No tour. Nothing else is explained until its trigger exists.

## 5. Engine Room · the room-detail pattern

The glance (2×2 rooms) is designed; each room opens with the same pattern so
nothing dead-ends (§8: "every row drills into detail with sub-tabs").

- **Room header:** the room's question in Newsreader 20px ("What is this
  costing me?"), the verdict line in mono under it, the state chip right.
- **Verdict-first body:** one aurora score card ONLY if the room has a score
  moment (Spend trend, Quality score); otherwise the top row is a plain-words
  verdict sentence. Then rows: each row = subject + mono value + status word,
  drilling into a sub-tab detail (table or trace), never a modal.
- **Sub-tabs:** mono-caps text tabs with the underline as the active signal.
  Depth budget: glance → room → sub-tab → row detail, four levels, never more.
- **Approvals never live here** (§8). Anything actionable raises a Call on
  Today; rooms only explain and prove.

## 6. Chart grammar (the working palette, drawn)

§3 gives the families and laws; this is how a chart is actually built.

- **Frame:** no chart borders or fills; the card is the frame. Axes and grid
  in `--slate` at 40% opacity, 1px. Axis labels mono 8.5px caps `--ash`.
- **Series:** max three families per chart (§3). The machine's own series is
  always `--teal`. Benchmarks and baselines are `--cornflower`/`--cobalt`
  dashed 4/3. Role colors NEVER plot data; ember appears in a chart only as
  a needs-a-human marker on a point, max one.
- **Annotations:** `--lemon`/`--daffodil` for callouts; the PM's own pencil
  note (Caveat) may point at one data moment, inside the two-per-screen budget.
- **Tooltip:** `--raised` card, radius 8, hairline, mono values, series name
  in its family color, no glow.
- **Sparklines** (rows, stat trios): single series, 1.5px, no axes, no dots
  except the last value (3px, the family color). Stat trio anatomy stays
  contract §9 (Brain): Newsreader numeral + mono micro-label.
- **The pencil layer (founder input, 2026-07-02): the machine draws exact,
  the human draws pencil.** Machine series stay precise vectors; every HUMAN
  mark on a chart is hand-drawn in character: a Caveat label, a rough circle
  around the data point that matters, a hand arrow, a wavy underline. Pencil
  marks use only the pencil inks (`--pencil-lime`, `--pencil-blossom`,
  `--pencil-apricot`), render as rough SVG paths (slight point jitter, about
  1.5px stroke, one pass, no fill), and count inside the two-pencil-marks
  budget per screen. Pencil never touches axes, grids, or the series
  themselves; it annotates, it does not plot. This is the chart-level
  expression of the contract's pencil-annotation ink: the PM's own hand on
  the machine's exact work.
- **Abstract washes:** the aurora treatment (drifting radial blobs + Codystar
  numeral) stays the ONLY sanctioned abstract element. A chart card may take
  it only when the chart IS a score moment (loop health, teardown confidence,
  outcome score); ordinary data charts stay flat obsidian. No other abstract
  or decorative art enters a chart.
- **Empty chart:** the instruction law, not a ghost chart: "No spend yet.
  The first mission draws this line."

## 7. Micro-interaction recipes (subtle animation, inside the law)

The motion law (§6) is the budget; these are the sanctioned spends. One
easing `--ease`, durations from the tokens, everything reduced-motion gated.

- **Press:** transform scale(0.985) for `--dur-control` 140ms, then back;
  fill goes `--ember-deep` on primary. No ripples, ever.
- **A Call clearing:** the answered card rises out (`cadRise` reversed,
  200ms) while the queue closes the gap at 280ms; the nav badge count ticks
  down with a single `cadPulse`; the hero count word crossfades 140ms.
- **A gate opening (mission unblocked):** the ember step dot hands off to a
  glacier working dot: ember glow fades 200ms, glacier pulse starts on the
  next beat. The linkage IS the choreography; nothing else moves.
- **Toast:** `cadRise` 200ms in, auto-dismiss 3.6s, fade 140ms out. One at a
  time; a new toast replaces, never stacks.
- **Progress (calls answered, step fill):** width transitions 280ms `--ease`;
  never animate from zero on mount, only on change (decoration never animates).
- **Slide-over layering:** panel `cadSlideIn` 240ms; scrim opacity 200ms; on
  close the panel leads and the scrim follows, 140ms.
- **Hover:** background one surface step + hairline brighten, 140ms; role
  glow only on live elements. Nothing translates on hover; lift is tonal,
  not spatial.
- **New arrivals** (a fresh signal, a landed teardown): `cadRise` staggered
  30ms per row, capped at six rows (§6); rows beyond six appear instantly.

## 8. Density modes (comfortable · compact)

§6 names two modes, set once (Settings → You). Comfortable is the spec as
written. Compact applies one rule: **rows lose one rhythm step, type does not
change.** Mission rows 14/18 → 10/14 padding; card padding 20/22 → 16/18;
list gaps 13px → 9px; the loop strip and top bar are exempt (they are already
minimal); type sizes, mono labels, and the restraint budget are untouched.
Density is a spacing decision, never a font-size decision.

## 9. Empty-state catalog (the instruction law, per surface)

Every empty state is an instruction with a time estimate (§11), in the §10
voice. Canonical set:

- **Today, zero calls:** "All clear. The loop is running itself." (the moss
  hairline card; already designed in the prototype).
- **Discover, no sources:** "Nothing sensed yet. Plug in Intercom and give it
  ten minutes." One Connect button.
- **Plan, no specs:** "No specs yet. Approve an opportunity and Scribe drafts
  the first one, cited, in about five minutes."
- **Build, no missions:** "The cockpit is idle. Send something worth building
  from Discover."
- **Brain, empty record:** "Your track record starts with the first call.
  Answer one on Today."
- **Engine Room, all clear:** "Four rooms, nothing burning. Come back when a
  chip turns marigold."

Never a blank box, never an illustration, never an exclamation mark.

---

**Linkage.** This file is referenced from the contract's Amendments section,
[`README.md`](./README.md), and the `cadence-design` skill.
When any spec here is implemented, verify against the contract first; if a
conflict surfaces, the contract wins and this file gets corrected in the same
change.
