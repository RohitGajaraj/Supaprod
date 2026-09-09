# The design system

> _Created: 2026-08-03 · Last updated: 2026-09-08_

> _Meridian. Contract since 2026-08-15 · This file replaced the 2026-08-03 contract, archived at [`archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md`](./archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md)._

**Meridian is the design system. There is no other one, and there is no surface exempt from it.**

## The founder's standing ruling, 2026-09-08: Meridian is the floor, not the ceiling

**Meridian is the base standard every lane builds to. It is not a base system to inherit from.**
It is not perfect and it is not complete. Whatever in it is breaking is bad and gets fixed. Whatever
is missing gets built. Whatever is wrong gets modified or deleted. The bar is not "does Meridian
allow this"; the bar is **what Google, Anthropic or OpenAI would ship if they were designing this
product**: thought through from the user's journey first, premium on every surface, and unmistakably
agentic, with the machine's work visible as it happens (which agent, on what, right now, with its own
identity on screen). Whatever clears that bar gets landed in Meridian first, as tokens and
components, so the whole product gets it.

**For component reference beyond beautifui.dev, use 21st.dev**, porting mechanics from real source
rather than from a screenshot, and the Mobbin MCP for patterns from well-built apps. **Every skill or
file that names Tempo, Obsidian, Loom, Cadence, ink or `--sp-*` is retired and is ignored**,
including `supaprod-design`, `supaprod-tempo`, `src/styles/ink.css`,
`src/components/shell/primitives.tsx` and `primitives.css`. No lane builds on them, ever.

_Relayed to Lanes 1, 2 and 3 on 2026-09-08 by Lane 1, and written here so it outlives the session._

Its source and its reasoning live in [`../../src/styles/meridian.css`](../../src/styles/meridian.css). Read that header before you build anything: it carries the scene that decided the ground, the colour law, and why each token exists. This file is the contract; that file is the system.

---

## Everything else is retired, and "retired" now has teeth

| Retired | Shipped as | Where it lives now |
| --- | --- | --- |
| v1 Ember | `.btn-pill`, ember fills | [`archive/ember-editorial-landing.md`](./archive/ember-editorial-landing.md) |
| v3 Obsidian | `--text-*`, `--hairline`, `--madder*`, `--glacier`, `[data-obsidian]` | [`archive/obsidian-v3.md`](./archive/obsidian-v3.md) |
| v4 Loom | — | [`archive/loom-v4.md`](./archive/loom-v4.md) |
| v5 Tempo | `--ds-*` (633 tokens), `--font-pixel`, `src/components/ui/` | [`archive/tempo-v5.md`](./archive/tempo-v5.md) |
| Cadence / ink | `--sp-*` (146 tokens), `src/components/shell/primitives.tsx` | [`archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md`](./archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md) |

**Never build from them. Never cite them as authority. Never extend them.**

### Why this table used to be decoration, and is not any more

The founder retired all five on **2026-08-14**, and the previous version of this file said so in its own header: *"no new surface may use it... Never extend it."*

Measured on **2026-08-15**, one day later, `src/components` and `src/routes` held **2,288 occurrences** of those retired vocabularies across **219 files**, including 524 raw colour literals.

**Corrected 2026-08-16: the real figure was 5,816 across 291 files.** The scanner counted the retired *import statement*, one per module per file, however much of that module the file went on to render. So the more structural half was invisible: **3,264 rendered retired components**, which is more than every token and colour occurrence combined. The undercount was found by measuring a commit that added a first-run screen to Ship built entirely from `Gate`, `Block`, `Row`, `Num` and `CtxBody` — eight new usages of a vocabulary retired two days earlier — while the file's recorded debt stayed at exactly 6 and every gate passed green. Usages are now counted, so rule 2 applies to the component layer too.

That was not a knowledge problem. In a single day four independent agents each rediscovered *the same rule* in four different folders, ten times between them. A constant named `FOCUS_RING` had been **inert** in six files for months: spelled correctly, aimed at the right token, painting nothing, because Tailwind emits utilities into a layer and an unlayered rule beats every layer. It passed every review it ever appeared in.

**Corrected again 2026-08-18, and this is the one that explains why the cleanup kept needing redoing: the real figure is 8,133 across 298 files.** The scanner read `.ts` and `.tsx` under two component trees and nothing else. It said so in its own header — *"`src/styles.css`, which this scanner does not read"* — so **the entire stylesheet layer, 2,339 occurrences, was never on the ledger**: `src/styles.css` 1,224 (629 `--ds-`, 406 raw hex, 38 `data-obsidian`), `primitives.css` 578, `ink.css` 302, `today.css` 194, `shell.css` 28, `meridian.css` 11, `decide.css` 2.

The component layer is where retired vocabulary is **written**. The stylesheet layer is where it is **painted**. A port that swaps `Block` for `Region` in every file and leaves `.sp-mark`, `.sp-term` and `.sp-codediff-*` behind has moved the debt rather than cleared it, and **every gate reports green the whole way**. That is the mechanism by which a design system gets migrated more than once and is never done.

The ratchet now covers the paint, on the same three rules. Bringing a file type into scope is not the same as raising a file's allowance, so `update-meridian-baseline.ts` adopts a newly-scanned **extension** exactly once and shuts the door behind itself; from the next run, stylesheets are held to rule 1 like everything else. Verified by planting `--sp-ink` and a raw hex in `decide.css` and watching the gate fail, not merely by watching it pass.

**A design system becomes doctrine at the moment it can fail a build, not at the moment it is written down.**

### The mechanism

[`src/__tests__/meridian-ratchet.test.ts`](../../src/__tests__/meridian-ratchet.test.ts), inside `bun test`.

1. **A new file must be clean.** No retired token, no raw colour. No allowlist, no exception.
2. **An existing file may not get worse.** It keeps the debt recorded in the baseline and not one occurrence more.
3. **Reclaimed ground is re-frozen.** A count that drops takes the baseline down with it, so a ported surface cannot regress later to a number the baseline still permits.

Comments are stripped before counting, so documenting a migration never counts as committing one. Tests are exempt, because a guard's job can be to assert a legacy literal is still present.

When it fails, **fix the code**. `bun run design:ratchet` records debt you have *removed* and refuses to raise any count.

**The baseline is the migration, and it may only go down.**

---

## No Meridian token fits? Then build Meridian.

**Standing founder ruling, 2026-08-15.** When you reach for a retired token or a raw hex because Meridian has no word for what you need, that is a **gap in Meridian**, and the answer is to close it — not to reach past it.

This is the rule that keeps the system whole. Every one of those 2,288 occurrences began as somebody needing a colour at 4pm.

Adding to Meridian is deliberately not free:

- **A token earns its place on the second caller, not the first.** One use is a value; two is a concept. `--mrd-sheen` records this rule in its own header.
- **Name it for meaning, never appearance.** `--mrd-you` means *a person is required*. It is not "the purple one".
- **A new stop must be measured in both grounds** before it ships, composited against the surface it will actually sit on.
- **Say why in the file.** Every token in `meridian.css` carries its reasoning. A token with no argument is a token nobody can correctly retire later.

---

## The vocabulary

88 tokens. The full set with its reasoning is in [`meridian.css`](../../src/styles/meridian.css); this is the map.

| Role | Tokens |
| --- | --- |
| **Ground** (one neutral ladder) | `--mrd-bg` → `--mrd-sink` → `--mrd-sheet` → `--mrd-lift` → `--mrd-float` → `--mrd-solid` |
| **Ink** | `--mrd-ink` `--mrd-body` `--mrd-mute` `--mrd-faint` `--mrd-on-solid` |
| **Edges** | `--mrd-line` `--mrd-line-soft` `--mrd-edge` `--mrd-edge-focus` `--mrd-sheen` |
| **Status** (five, and only five) | `--mrd-you` `--mrd-agent` `--mrd-pass` `--mrd-fail` `--mrd-hold` (+ `-dim` variants) |
| **Interaction** | `--mrd-hover` `--mrd-select` `--mrd-select-agent` `--mrd-solid-hover` `--mrd-focus` |
| **Category** (never status) | `--mrd-viz-1..4`, `--mrd-code-kw/fn/str/num/type/var/punc/comment` |
| **Type** | `--mrd-font` `--mrd-mono` `--mrd-t-nano…display` `--mrd-w-*` `--mrd-lh-*` `--mrd-track` `--mrd-measure` |
| **Space / shape / depth** | `--mrd-s1..s8` `--mrd-r-xs/chip/ctl/card/pane` `--mrd-shadow-card/float/pane` `--mrd-scrim` |
| **Motion** | `--mrd-d-press/move/enter/alive` `--mrd-ease` `--mrd-ease-soft` — **a raw duration is a fail** (R-20 §4), and the guard pins it: no `duration-[0-9]+` class may exist under `src/components/meridian/`. Pick the token that MEANS what is happening — a press acknowledging, a thing moving, content arriving, work still going — not the one whose number is nearest. |

Components: [`src/components/meridian/`](../../src/components/meridian/) — 25 of them, plus `surface-parts.tsx` for the chrome every surface shares. **Compose from these.** A surface reaching for a raw `<div>` with a hand-written colour is doing it wrong.

### Two promoted from the run screen, 2026-09-02 (P-19)

`verdict.tsx` and `got-you.tsx` were built on `/track/:id` and promoted once a second reader existed. Both promotions **split** rather than moved, and the split is the reusable part:

| Primitive | It draws | It deliberately does not know |
| --- | --- | --- |
| **`Verdict`** | what was compared, what was concluded, and each finding citing the line it read | that a verdict arrives in `studio_changesets.code_review`, or which of its two absences applies |
| **`GotYou`** | chips naming things that exist and open, then quiet clauses that state facts and open nothing | `spine_track_members`, artifact kinds, or how to count a cost |

**A primitive that knew the column would have exactly one possible caller.** The second reader of a verdict is a design review or an eval suite, and neither has a `code_review` column, so the reading stays with the surface (`track/verdict-reading.ts`, `track/run-tally.ts`) and the drawing came here. That is the test to apply to the next promotion: **what would the second caller have to pretend to be?** If the answer is "a track", the component is not general yet.

Two rules they carry that are worth copying:

- **`Verdict.absence` is a required prop.** The absence is the common case — 0 of 45 changesets carried a review — so a caller cannot forget to say why there is none.
- **`GotYou` chips are controls only when `onOpen` is passed**, the contract `ToolStream` already holds. A chip that opens nothing must not look like it does.


### Three added for the entry, 2026-09-08 (Lane 1)

| Primitive | It draws | Where it is used |
| --- | --- | --- |
| **`Journey`** (`Journey.tsx`) | The seven stations as the road one piece of work travels, in two sizes: full (a tablist when it selects a pane) and row (the mark at the left of a run row). States: pending, done, working, you, held, scheduled, waiting, failed, waived. The working node breathes on the agent hue with a ticking clock; a calendar wait is neutral, never amber. A full-size station carries `presences`, the seats working there now as live dots in each seat's own presence colour (`presenceColour`), so the road shows where the machine is, not only where the work stands. | The home's map and its run rows, the first run's promise, the run screen's header |
| **`AgentPresence`** and **`PresenceDot`** (`AgentPresence.tsx`) | One seat at work: a colour from `--mrd-seat-1..5` that is the same for that seat everywhere (`presenceColour`, a stable hash), its name, the verb of its latest tool call, the thing it is doing it to, a clock. Never a status hue. | The home's Working now strip, the rail's crew, the run screen's presence strip, cursors and diff gutters |
| **`PageHeading` with `station`** (`surface-parts.tsx`) | The station a depth page's content comes from, as the eyebrow above the title, with the road's own glyph. | Findings (`sense`), Outcomes (`learn`), the spec editor (`define`) |

**The row grid, the same day.** Founder: *"the dots are not aligned properly, there are no button positions."* `Row` gains `align="start"` (marks and controls sit on the title's first line, not the row's middle), `timeWidth` (a fixed meta column; below the phone breakpoint the column folds under the sentence, indented to it), and `JOURNEY_ROW_WIDTH` is the marks column the home reserves, so the road can never run into the title. A list's control slot is a fixed two-cell grid: the primary control (or nothing) in the first, the quiet one in the second, so every row's controls stand in the same place. The rail's glyphs draw the thing the row is (a roof, a tray, the Discover and Learn glyphs), never an arrow; "Start a run" puts the cursor in the composer; the lower tier is named "Setup".

**Tokens added the same day.** `--mrd-seat-1..5` (seat identity, both themes); `--mrd-shell-header-h`, `--mrd-shell-mark`, `--mrd-icon`, `--mrd-icon-sm`, `--mrd-shell-pane-inset`, `--mrd-shell-pane-ask-w`, `--mrd-shell-ctx-gap`, `--mrd-shell-work-pad-x|y|bottom`, `--mrd-shell-main-max` (the shell's dimensions, moved out of the retired sheet with their reasons; `shell.css` reads no `--sp-*` token any more). `Journey` stations carry `presences`; `Choice` options carry `sub` and may omit `fact`; `Row` exports `ROW_GAP`.

**`StatusChip` gains `quiet`**: mute ink on the sink fill, for a wait the machine has in hand (a release live in production with its verdict due on a date). The five status words are still five; this is the absence of one, drawn as a chip so it sits in a row of chips without vanishing.

---

### What the fourth review added, 2026-09-09 (Lane 1)

**A person's terminal stop is `stopped`, not `hold`.** The driver says whose a hold is (`holdTone`) and whether the loop will move it again (`nothingIsComing`); a tone-you hold with nothing coming is the person's, and the home painted it as a `hold` condition while the run screen called it "Needs a restart". `Journey` gains the state `stopped`: the `you` hue, the lift fill, no breath, on the home's road and rows and on the run screen's station alike. `hold` keeps its meaning: stopped on a condition, not on a person.

**A seat that has stopped calling is `quiet`, and quiet does not breathe.** Past the stall threshold (`STALL_MINUTES`) every reader of a seat says "quiet for N min" from one function (`seatLine`) and stops its clock, its dot and its breath together: the Working-now strip, the rail crew, the run row, the road's working stop, the hero's count and the shell's live line. The character mark beside the line has a still `quiet` face (dim, level eyes) for it. A seat carries its catalog slug beside its name, so a reader joins a seat to a run's worker by slug, never by comparing a name to a slug.

**The shell's live line is one reader of the same facts.** Its idle fact is the newest open run when that moved after the last finish ("Last moved · title · 12m ago"), and "Ready for the first run" is reachable only when no run exists; its facts follow its lead's order (call, seat, moving, idle); its count is the queue's, with the track gates as the floor before the queue answers, so the sentence, the mark and the Inbox row say one number; and its door carries its address and resolves once, so a door onto the page the person is on becomes the composer on the home and a statement elsewhere (`LiveDoor`).

### What the fifth review added, 2026-09-09 (Lane 1)

**The road has a state that is not a claim about the work: `unread`.** Eight of Journey's states say
what happened at a station; this one says we could not look. A refused artifacts read left the run
screen drawing seven `pending` stops under a chip reading Finished, so a run that travelled all
seven read as one that never started. `unread` takes `pending`'s line ring and faint glyph with the
sink fill instead of transparent, so it reads as a node holding something we cannot see rather than
an empty one nothing has reached, and it survives greyscale on the fill alone. No status hue: not
reading is not a status. Its word is "not read". The rule this generalises, and the one every
surface owes: **a read that refused and a read that answered empty are different facts, and a
surface that draws them the same is claiming the one it did not measure.**

### The entry, as five movements

Published here so the other lanes can hold a surface to it. The home is not a set of regions, it is
a sequence, and the order is the argument. The spacing ramp says which is which: 24px inside a
movement, 40px between two.

1. **What needs you.** One headline naming the product and what waits, and a line naming the one
   call to start with. A count is a debt; the next step is a direction, and the headline may carry
   the count only if the line carries the step.
2. **Hand it over.** The box, the product it is for, the shape of the work and the road that shape
   takes, and what the workspace already holds about the sentence being typed. The person names the
   work in their own words; the machine answers with the stations it enters and waives.
3. **What came back.** What came in, what shipped, what was graded, beside the strip that answers
   the same question from the other end. This moved above the fold on 2026-09-09 against the
   founder's "I cannot feel the value": the proof this product works is that work was decided,
   built, shipped and graded against what it promised, and it was three mute sentences in position
   six under a 32px count of what he owed.
4. **What is moving.** The seats by name with a live clock and nothing at all when nobody is; the
   seven stations drawn once, as a promise before the first run and a map after it, never as a
   menu; then this workspace's own ranked bets from its own evidence.
5. **Your runs.** One row per run with its position on the road, one sentence, and the one control
   its state needs.

**A block is named only when its content cannot say what it is**, and then with one convention: the
eyebrow, never a seam. Four of the home's seven blocks carry no label because the road has its own
caption, the bets and the starters have a lead sentence, and the three answers are three sentences.

**The greyscale test is an accessibility test, and the road half failed it.** Measured 2026-09-09:
`held`, `stopped` and `failed` each drew a coloured ring and glyph on the same lift fill, so the
three differed by hue alone at lightness 0.76, 0.74 and 0.68, within 1.06:1 of one another in
greyscale and collapsing under deuteranopia. A person then cannot tell a condition the loop will
clear from a stop only they can clear from an outcome that already happened, and the difference
decides whether they must act. `stopped` took the chip fill, which is the file's own rule for
when a person is required and a channel that survives both tests.

**`held` and `failed` are closed the same way (2026-09-09), and the answer was the first of the
three the open question named: a second non-hue channel.** Measured before choosing, as that
question asked. Every other channel is spoken for. The glyph is the STATION's and not the state's,
which is law 4 working as designed. The word beside a current node is the station's own name, so the
two drew the same word. The dashed ring is `waived`. The fill was the only one free.

**The axis is the one a person acts on: the road stopped here and will not continue on its own.**
`stopped` is that with a person required; `failed` is that with the answer already in. `held` is a
condition the loop may still clear, so it keeps the lift and stays visibly lighter. `done` keeps the
lift too, deliberately: it is terminal, but it is also six nodes out of seven on a finished run, and
filling those would make the road heavy, which is the founder's own *"looks AI-made"* complaint.
**The fill marks the node that STOPPED the road, never every node that is over.**

Measured after: `--mrd-fail-chip` is L 0.32 against lift's 0.215 on the dark ground, **about 1.48:1
in greyscale where the two rings alone were 1.11:1**, and better than the 1.24:1 the `stopped` fill
was accepted at.

**A row of controls counts and acts; prose only counts.** When a control on the same screen already
carries the breakdown, the sentence above it must not repeat it. Found on the Inbox (Lane 2,
2026-09-09): the heading read "20 design gates, 12 assumption challenges, 9 decisions, 4 house
rules, 3 agent actions, 3 opportunities and 2 memory notes waiting for you", 143 characters and six
commas, directly above a filter row carrying every one of those families with its own count as a
pressable tab. The heading is now the largest family and a count of the rest, in the same words the
home's hero uses for the same rows. The rule generalises past this screen: a sentence beside a
control is free to do the thing prose is better at, which is telling a person where to start.

**A person names the work; the machine names the route.** The composer carries a picker of the five
work shapes in the person's own words ("Something is broken now") and answers with the road it takes
("it enters at Build; Discover, Decide, Plan and Design are waived"), read from `suggestRoute` so a
waiver changed in the route model changes the sentence in the same edit. Stations are still never
navigation: the person chooses a kind of work, never a station.

**The phone.** `--mrd-shell-phone-bar-h` is the phone bar's height and the page's bottom clearance reads it, so the two cannot drift (one fixed box, line and doors both 44px). A row's fixed time column folds under the sentence below the phone breakpoint. Keycaps hide on a coarse pointer; Ask, the scope control and the account disc are 44px targets. The phone rail draws the desktop's glyphs and the Inbox count.

## The reference standard

**beautifului.dev, literally.** Founder ruling, restated 2026-08-15: *"I want you to take what you have done in the Meridian system and get inspired from beautifului.dev. I literally want you to implement the same thing."*

Port the **mechanics** from its real source, never from a screenshot — a screenshot loses the easing, the reveal order, the overflow behaviour and the focus model, which is most of what makes it good. The component-by-component mapping is [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md). Broader research goes in [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md), in the same session, so nobody pays for it twice.

Per-surface, the standing rule from 2026-08-01 still holds: **research the best proven product in that category and lift its information model and verbs outright.** Build from Cursor and Claude Code, Design from Figma's fidelity ladder, Discover from Sentry's issue stream and Linear's triage inbox. Originality is not the goal.

---

## The laws

### 1. The ratchet: today's design is the floor

**No change may make a surface worse in order to satisfy an instruction** (founder, 2026-08-01):

> "That doesn't mean you need to compromise on the look and feel… Don't just compress and shrink it and make it worse. Your baseline is what we have today. You need to enhance it on top of that."

"Reduce the scroll", "tighten this", "fit more in" are requests for a **better** surface, never a smaller one. Shrinking type, stripping padding, capping heights, hiding information or dropping a state is **forbidden** as an answer. The allowed moves are structural: use the horizontal axis, collapse what nobody reads, escape the 68ch measure for non-prose, delete genuine duplication.

The test before committing: **would someone who liked yesterday's screen prefer today's?**

#### The floor is Meridian, never a retired system (founder ruling, 2026-08-18)

This clause was being read backwards, and the reading is the reason it needs writing down. "Today's design" means **Meridian and beautifului.dev**. It does **not** mean whatever the retired systems happened to draw.

**What happened.** Porting Design and Discover, the ratchet law was cited to defend the retired `.sp-block` rhythm: 36px margin plus 28px padding plus a `1px` hairline between every section, against Meridian's 40px gap and no rule. It was raised as a regression to be approved, because the retired stylesheet says of itself *"It is a rule, not decoration"*. The founder's answer:

> "I have already retired whatever the rule is from a design system... Don't take anything that's coming as a rule. If that is the case, please go out and edit the rule first. I don't want, not just now but also in the future, adding anything like a hairline or borders or any such inputs."

**So: a retired system's spacing, borders, hairlines and section rules are not a baseline, and restoring one is not "protecting the floor" — it is reintroducing the vocabulary this migration exists to delete.** Rule 1 protects INFORMATION and COMPOSITION: a state, a fact, a door, a measure, a legible type size. It does not protect a divider.

**When a retired file argues with Meridian, change the retired file.** Its comment is a record of a system that lost, not an authority, and leaving the assertion standing means the next porter re-derives the same wrong conclusion. That has now happened once; this paragraph is what stops it happening twice.

### 2. The standard: the states nobody screenshots are composed

Empty, partial, failed, denied, very long, very short, slow — each one **composed**, not merely handled. These are what production shows most often. Four early returns were found rendering outside the system entirely on 2026-08-15, and every one of them was a failed read or an empty workspace: *the states a person actually meets were the ones nobody had styled.*

### 2a. Illustration is allowed, and it draws the machine

**Founder ruling, 2026-08-19.** `surface-parts.tsx` carried *"No accent and no illustration: an empty state must not invent a call to act."* **The illustration half is lifted.**

The ban was broader than its own argument. The reason given was about **inventing a call to act**, which is an argument against fake buttons; it never supported a ban on drawing. The two fused because both were true of the same bad screen.

What replaces it is narrower than "illustrations are allowed":

**An illustration draws the product's own mechanics** — the loop turning, the seven stations, the crew, a signal becoming a bet — in the monoline vocabulary [`station-glyphs.tsx`](../../src/components/meridian/station-glyphs.tsx) already uses. Same stroke weight, same round caps, same restraint.

- **Never a mascot or a stock figure.** Those age badly, they read as consumer software, and they fight the Engine-Room doctrine.
- **Never a scene asserting activity the workspace does not have.** This is the empty-state form of the shell's own honesty rule: a header that invents activity is lying, and so is a drawing of three busy agents on an idle workspace.
- **Playful through composition, never through cartooning.** An asymmetric spoke, a loop caught mid-turn, one warm stroke where work enters.

**Why this shape and not a freer one.** A drawing of our own model cannot be copied without copying the model, and it cannot say anything false about what the product is doing. A cartoon can do both.

### 3. Colour carries status, never decorates

**The founder's ruling on the road, 2026-09-08:** *"this yellow or golden colour is not at all looking good, it looks like an AI-written design ... it's not even the brand colour."* The hold hue was a gold at chroma 0.125 and four of seven stations wore it as a filled node, a coloured label and a filled badge at once. Since `--mrd-hold` is a sand at a third of the chroma, every status hue came down with it (you 0.16 to 0.11, pass 0.15 to 0.11, fail 0.19 to 0.15), and the road carries a current station's status in its **ring and glyph only**: the label is ink, the badge is neutral, the fill is the lift except where something is alive inside the node (a machine at work, a person required). The test for any status colour now: would Anthropic, OpenAI or Google put it on a screen with their name on it. If it shouts, it is not a status, it is decoration.

Monochrome by default on a single neutral ladder. **Five status words and only five** — `you`, `agent`, `pass`, `fail`, `hold` — each meaning one thing everywhere:

- **`you`** a person is required. Not "important", not "primary". If no decision unblocks it, it is not this colour.
- **`agent`** a machine is working.
- **`pass` / `fail`** an outcome that has happened. Never an *intent* — "roll back" is not red, because red reports a result and distance plus a confirm is what protects a destructive act.
- **`hold`** stopped, waiting on a condition rather than on a person.

Categorical colour (`--mrd-viz-*`, the syntax palette) is a **separate system** and must never be read as status.

**It must survive a greyscale test.** If the screen stops making sense in greyscale, the colour was doing work that structure should have done.

### 4. Identity is shape. Status is hue. A seat's identity is its own hue, from its own set.

A station, an agent or a mission is identified by its **glyph**. Painting identity as a colour ramp — seven stations, seven hues — has now been found and removed **three separate times**. See [`station-glyphs.tsx`](../../src/components/meridian/station-glyphs.tsx), which also carries the corollary learned the hard way: *a glyph sitting beside real controls may not borrow one of their shapes, however apt the metaphor feels.*

**The one identity that is a colour (2026-09-08): a seat at work.** Many seats on one screen, each writing, need telling apart at a glance, and a glyph cannot do that for eight of them. So a seat carries a presence colour from `--mrd-seat-1..5`, hashed from its one resolved name (`presenceColour`), the same everywhere it appears: the Working-now strip, the dot at its station on the road, the run row's mark, the run screen's live pane and transcript. The set is chosen away from every status hue and from the brand ember, and it is never a status: a seat's dot says who, the ring around the station says what state.

### 5. Look at it before you ship it

**The gates cannot stand in for this, and it is worth knowing why: the suite asks whether each component behaves, never whether anyone has looked at it.**

On 2026-08-14 every primary button carried a **1.19:1** label on paper, because `--mrd-solid` and `--mrd-ink` both invert across the grounds and so travel together instead of apart. Twelve controls, nine files, `tsc` clean, 8,787 tests green, and no fixture had ever handed a primary button an action — so nothing rendered the broken state on any machine. Rendering it in both grounds found it in one pass.

The gallery at [`/meridian`](../../src/routes/_authenticated.meridian.tsx) exists for this and nothing else. **Coverage is not reach, and reach is not a look.**

---

### 6. A measure belongs to the reading, not to the container

Added 2026-09-09, after `Prose` was found capping one of its two branches. The uncapped one was
the markdown branch, which is the spec body: the longest document in the product ran the full
width of its pane.

The reasoning that dropped it was "inside Ask the pane IS the measure". That is true of Ask and of
nowhere else, and it is the general trap: a component that borrows its measure from wherever it
happens to be mounted has no measure at all, it has a coincidence. **The component carries its own
measure on every branch, and a caller that genuinely wants full bleed overrides it.**

Name the rung, never a `ch` count. A `ch` is the zero's advance width, so `68ch` is a different
column in every font the product renders. The rungs are `--mrd-measure-prose` (32rem),
`--mrd-measure-region` (34rem) and `--mrd-measure-page` (41rem).

### 7. A heading rung is a rank, and a sentence is not a title

Added 2026-09-09, ruling on a finding that the run screen's `<h1>` was smaller than other pages'
titles. The finding's own premise was wrong, which is worth recording: `PageHeading` has one code
path at 25px and no failure variant, so it was never "failure states styled louder than working
ones". **Read what the component actually sets before ruling on an inversion.**

The real defect was that the run screen titled at the COMPONENT rung, `mrd-title` (20px), which
dialogs, empty regions and cards use. Both obvious fixes were wrong. Raising the run title to 25px
makes a long sentence shout on every visit. Lowering `PageHeading` moves every page in the product
to fix one that was never out of step.

**A run's name is a lead paragraph wearing a heading's clothes.** Every other page in the product
titles with a short label; a run's name is a sentence describing the work. Setting a sentence one
rung down does not fix that category error, it only makes the sentence quieter. So the shape is the
station eyebrow, drawn with the glyph the road draws, over the sentence set as prose on the reading
measure. Nothing on the route grows.

The element and the size are separate decisions. The sentence stays the `<h1>` even though it is
not the largest type: **a heading element is the page's name in the document outline, not its
loudest voice**, and promoting the eyebrow would name the page "Build", which is true of a hundred
runs.

### 8. Reduced motion stops transitions, and stops them at 1ms

Added 2026-09-09, after both motion switches were found stopping animations only. Every
`transition-colors`, every fold and every fade ran at full duration with motion off, under the
operating system's setting as much as under the product's own.

Law 5's test already decided it: *if stopping it removes a fact, it is not decoration*. A
transition removes no fact when you stop it, because it has one defined end state and stopping it
means arriving there at once. That is what separates it from a loop, where the motion IS the
message that something is still running, which is why an elapsed timer keeps ticking.

`transition-duration: 1ms`, never `transition: none`. `none` cancels the `transitionend` event, so
any handler waiting on one to unmount a node waits forever. Nothing in this repo listens for one
today; a rule that only holds while that stays true is a trap for whoever adds the first listener.
`transition-delay` goes to 0 in the same rule, or a stopped transition still waits and the screen
reads as frozen rather than fast.

**The two blocks are a pair and must not drift.** A keyframe named in one and not the other fails
`the-motion-toggle-reaches-the-run-screen.test.ts`.

### 9. When the defect is a missing default, set the default

Added 2026-09-09. Twenty-one bare transitions on one surface, three speeds among them, none on this
system's easing, because `transition-colors` with no duration takes Tailwind's 150ms and its own
curve.

The choice was a sweep of twenty-one call sites or two variables. A sweep fixes those twenty-one and
none of the next twenty-one. Meridian sets `--default-transition-duration: var(--mrd-d-press)` and
`--default-transition-timing-function: var(--mrd-ease)` in `@theme inline`, so every unqualified
transition in the product is correct at once and stays correct as the product grows.

`--mrd-d-press` and not `--mrd-d-move`: the bare utilities are overwhelmingly `transition-colors` on
a control, which is the press budget by definition. Anything changing position or size names a
duration and still wins, because a utility with a value outranks the default.

---

### 10. A claim you cannot test, put a second reading of next to it

Added 2026-09-09, after four sightings in one day of one defect: **a surface stating something it
had not read.** The shell's live line named two of the three reads its sentence stood on. A queue
read that failed degraded to an empty list, which the briefing composed as "nothing waits on you".
The home's answer welded "and the record was re-scored" onto a sentence that never looked at a
score. And a head query answering `null` was cast to `0`, which a composer stated as idleness.

**None was found by a gate**, and every one passed every test, because in each case the code did
exactly what it said.

The useful part is not "someone looked". Three of the four became visible the same way, and it is
reproducible: **a second, independent statement of the same fact, rendered from a different read,
where one glance takes in both.** The re-score clause had been false for as long as it had existed
and no amount of staring at that line would have shown it, because a sentence cannot contradict
itself. It became wrong the instant a region underneath said the same decision from another read
and stayed silent where the line spoke.

**AND IT DOES NOT CONTRADICT "ONE COUNT, ONE SOURCE",** which exists so two surfaces can never give
two answers about the same queue. The first reading of that boundary is that one rule wants a single
source and the other wants two, and they are split by whether a person acts on the number. That
split is not needed, because nothing here is read twice.

The re-score case shows why. The answer line was not a second reading of a number. It **asserted a
consequence it never read at all**, while the region beside it stated the underlying facts. So the
real rule is narrower and cleaner:

> **A fact has one source. A claim ABOUT that fact must be derived from it, never asserted
> alongside it.**

One count, one source is untouched: the count still comes from one place. What changes is that a
clause hanging off it has to read something. And the reason to put the evidence next to the claim is
that an underived claim needs something in view that can contradict it. A sentence cannot contradict
itself.

So this is not licence for redundancy. F-215 and F-233 are both two spellings of one fact and both
are still defects. What is allowed is the claim and its evidence together, where a glance takes in
both.

**IT APPLIES TO WRITES, NOT ONLY TO SENTENCES**, and the cleanest example in the repo is a write.
The driver's closed-correction memory records what fixed a track only *after* the station that could
not finish has finished. Until then the hypothesis is not written at all, so nothing downstream can
read it as a fact. A sentence can be argued with; a write either records the guess or it waits.

**THE SHARPEST FORM OF IT IS FOUR CHARACTERS WIDE: A CAST IS NOT A CHECK.**

`(value as string | null) ?? null` reads like a guard and is not one. The `as` asserts a type the
compiler then stops questioning, and `??` catches only `null` and `undefined`, so **any other shape
passes straight through wearing the type of an id.** An empty array is truthy, so it survives the
`if (!workspaceId)` written to catch exactly this, and everything downstream filters on it. The
counts then answer **zero** rather than null, which is the one answer those readers must never
invent.

Found once on the entry's own read, then swept: **52 call sites of that shape across the codebase**,
all of them taking the same default-workspace lookup, and two more on this lane. One of the two was
worse than a count, because it WRITES: the last-look stamp would have marked another desk's findings
as seen, under a comment saying that must never happen. The fix everywhere is the same and it is
narrower than it looks: `typeof x === "string" && x.length > 0 ? x : null`.

The same shape wears other clothes. `sourceMark` read `(explicit as SourceMark) ?? "unknown"` inside
an `if (explicit)`, so the fallback was unreachable and the cast was doing all the work: any string a
caller put in `mark` came back typed as a mark, and two lookups indexed on it. It tests membership in
that union's own exhaustive record now, **so the runtime check cannot drift from the type.** That is
the pattern worth copying: check against the map the type already requires, not against a list you
write out again.

**And it applies underneath the copy too.** Auditing this lane's own surfaces against it turned up
no bad sentence and two bad reads: an embed whose generated type and actual shape disagree, read
without handling both; and a default-workspace lookup taken with `?? null`, which accepts any shape
the call returns. An empty array is truthy, so it became the workspace id, every read filtered on it,
and they all answered **zero** in a file whose own header says null means *we could not find out* and
must never become zero. Same defect as a false clause, one layer down: a value stated with more
confidence than it was read with.

---

### 11. One cause gets one sentence, at the level that owns the cause

Added 2026-09-09, after the founder opened a run screen and met **five messages for one cause**, four
of them red: the route's *"This run could not be read"*, the consent pane's *"The questions this run
is waiting on could not be read"*, the drive card's *"Out of touch"*, the transcript's *"The activity
did not come back"*, and the artifact pane's *"The record did not come back"*.

**Every component was correct and nothing owned the composition.** The header said it once, then the
page mounted the panes anyway, and each honestly reported its own refused read. This is the failure
mode of doing the right thing everywhere and nowhere.

It is louder for a good reason, which is worth stating so nobody undoes the good reason. Those reads
used to swallow their errors and render as empty, and a refusal wearing the empty state's clothes is
worse than five sentences. Making them throw was right. **An honest failure then has to be ROUTED,
not reported.**

**Which level owns it? The smallest thing that would fix it.**

| If a retry would fix it at | Then it is said by | Example |
| --- | --- | --- |
| one region | that region | one artifact list refused while the page works |
| the page | the page, which does not mount the panes standing on that read | the run's own read failed |
| every tab | the shell, once, above everything | a dead token |

The dead-token half was already written in `AppFrame` and guarded by
`one-condition-gets-one-remedy.test.ts`. Its closing clause, *"the regions go back to naming which
read failed"*, is the default this law narrows: **a region names its own failure only when its
failure is its own.**

**A statement and its designated remedy are not a duplicate.** The home's hero says the runs could
not be read and points at the list; the list carries the press. That is one thought in two places
doing two jobs, and it stays. What it must not do is describe the event again in its own words: the
hero said *"could not be read"* and the list said *"did not load"*, two verbs for one event 400px
apart, which is the noun rule applied to a verb. One wording now.

**The test that separates the two cases.** First stated as *a full, distinctive sentence repeated
makes a reader ask which one is real; a short repetition serving a different job does not.* That is
right but "different jobs" does too much work, and someone will lean on it to justify a fourth. The
sharper form:

> **Ask what a SECOND SIGHTING makes a reader do.** A short factual count read again is confirming:
> you glance, it agrees, you move on. A long distinctive sentence read again makes you stop and
> compare the two, and that stop is the whole cost.

A run's refusal quote appearing in both the hold card and the story was the first case and had to
lose one home. *"3 prototypes"* is the second, and it appears in **three** places, not two: the road,
the story, and the transcript's own Design section. It was held at three, and the third is the one to
keep hardest, because it names what the prototypes are OF and so is the fullest form rather than a
copy of the shortest.

**Two conditions on holding, and if either breaks the answer flips.** A fourth is no longer
confirmation, it is wallpaper. And if any copy ever derives from a DIFFERENT read they can disagree,
and three places that can disagree about one number is worse than any of the alternatives. All the
copies come from one source, and that is what makes it safe, not the jobs argument.

> **AND THE FIRST CONDITION WAS MET WITHIN THE HOUR, ON THE RULING'S OWN EXAMPLE.** Reading the whole
> page rather than the two regions the question arrived about, the count is in **four** places: the
> road, the story, the transcript's section header, and the artifacts pane. The last two are the same
> sentence minus a verb, and they are the two LONGEST forms. So the argument for keeping the third,
> that it names what the prototypes are of and is therefore the fullest form rather than a copy,
> applies to both of them, which makes one of them a copy of the fullest form.
>
> **The lesson is not about counts.** It is that I ruled on the two regions the question named
> instead of on the page. A duplication question cannot be answered from the pair somebody brings
> you; it has to be answered from everywhere the fact appears, which means reading the whole surface
> before ruling. That is the counting habit below, applied to the thing I had just written the
> counting habit about.

**Verifying a read proves it is correct, never that anyone wanted it.** Lane 3's, 2026-09-09, and it
generalises past reads. A cost figure on the most-mounted read in the product was verified against
production, carefully, hours before anyone checked whether it reached a screen. It reached none: an
entire RPC computed on every authenticated page and discarded. **Verification feels like proof that
a thing should exist and is not.** Ask what renders it before you ask whether it is right, because a
correct answer nobody reads is the most expensive kind.

**And count before ruling.** The header chip was ruled by principle (a status chip names the state,
the remedy has a home in the footer) and the count turned out to be the stronger argument: five
surfaces described that state, three already said *stopped*, including the road's own node. Two
moving to three beats one moving on a principle, and it survives even if the principle is wrong.

---

## The defects that keep coming back

Each of these has been found more than once, by people who knew the rule. Check for them by name.

| Defect | Sightings | The rule |
| --- | --- | --- |
| `--mrd-hover` used as a **selected** state | **10**, in one day | It is a 4.5% wash, deliberately almost imperceptible. Selection is `--mrd-select`. |
| `--mrd-ink` on `--mrd-solid` | 3 | Both invert together, so they collapse to **1.19:1** on paper. The label on a solid is `--mrd-on-solid`. |
| `--mrd-edge-focus` used as a focus **ring** | 5 | It is a **field's border**, read against that field's own fill, and measures 2.9:1 on paper. A ring is drawn against whatever is behind it and WCAG asks 3:1: that is `--mrd-focus`. |
| A focus utility that paints nothing | 6 files | Unlayered CSS beats every `@layer`, and Tailwind emits utilities into a layer. Inherit the ring via `data-mrd` rather than declaring a per-component constant. |
| Identity painted as a colour ramp | 3 | Law 4. |
| A `100vh` child inside a taller document | 1, shipped | One ancestor owns the viewport; everything below takes shares. `min-height: 0` on the flex child is the part people leave out. |
| `as T` plus `??` read as a guard | **54**, swept in one day | A cast is a claim about a value, never a check of it, and `??` catches only null and undefined. Any other shape passes through typed. `typeof x === "string" && x.length > 0 ? x : null`, or test membership in the union's own exhaustive record. |
| Every pane reporting its own refused read | **5 on one screen**, 3 on another | Each is correct and nothing owns the composition. Route the failure to the level that owns the cause, and do not mount the panes standing on a read that failed. Law 11. |
| A clause welded to a sentence that never reads it | 1, on the entry | "and the record was re-scored" was part of the sentence for every graded decision and nothing in that read looked at a score. A surface that states a consequence must read the consequence. |
| A qualifier left behind when its branch's source changed | **3**, in one day | The guard, the keyframes and the "at least" floor all belonged to a read that had been swapped underneath them. Nothing fails when a qualifier outlives its reason. When you change what a branch reads, grep for every hedge, guard and dependency written for the old read. |
| An animation that SETS a property the element already declares | 2 | `mrd-attention` drives opacity from 1, so it overrides a resting `opacity: 0.35` and the element peaks at nearly three times its designed weight. An envelope reads the value (`var(--mrd-halo-rest)`) and scales it. Use `mrd-halo` on anything with a resting opacity. |
| A class that reads like a system part and is not one | 1, ten call sites | `.mrd-focus` was undefined and nothing looked wrong, because the ring comes from `data-mrd` either way. That is worse than an absence: it looks like coverage, so nobody goes looking, and it gets copied onto the eleventh element. |

**Any component with an early return must carry `data-mrd=""` on that return too**, or its controls fall back to the legacy app-wide focus ring.

---

## Two doctrines that survive every design change

**The Engine-Room doctrine.** Complexity lives in the engine, never in the experience. The user meets the *output* of the machine, never the machine. Labels name the **outcome**, not the mechanism. Every new surface runs the Engine-Room Test — *would a smart non-technical person feel this is for them?* — and carries a greppable `Engine-Room:` line. Body: [`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md).

**Humanized output.** No em or en dashes, no invisible Unicode, no AI-cliché phrasing in UI copy, in source, or in anything the platform generates for a user. The runtime sanitizer at the AI chokepoint is the hard gate; markdown docs are exempt. Body: [`../conventions/humanized-output.md`](../conventions/humanized-output.md), applied in [`../conventions/ui-voice.md`](../conventions/ui-voice.md).

Surface mechanics — one page scroller, `@container` not `@media` inside a pane, fit-to-content heights, the wait, agent indicators — are in [`../conventions/surface-discipline.md`](../conventions/surface-discipline.md) and enforced by `src/__tests__/surface-discipline.test.ts`, which was proven to fail by planting the defect rather than only proven to pass.

---

## Whether it worked: the entry's one piece of evidence

**Built 2026-09-09. The answer to the founder's *"I cannot feel the value."***

Two structural passes went into the entry that day and the gap survived both, so it was measured
rather than argued about. His workspace holds:

| decisions | specs | prototypes | graded outcomes | deployments | runs done |
| --- | --- | --- | --- | --- | --- |
| 67 | 38 | 37 | 12 | 8 | 2 |

The entry said two sentences about any of it, in the smallest type on the page, both scoped to
*since you last looked*, under a headline counting what he owes the machine.

**The defect was never the size of the debt or the size of the proof.** Every value statement on
the entry was a DELTA and the complaint is about the WHOLE. Nothing on the landing page said the
loop had ever closed, and closing it is the last four sevenths of the product's own claim: *tells
you what to build, then builds it, ships it, grades it, guides the next call.*

**What it draws.** One outcome: what was decided, the verdict as a word in its own hue, the
grader's own sentence carrying what was committed to and what came back, what the record did about
it, and one door.

**One and not twelve.** A row of totals is precisely the *"dump of data and content"* he named, and
it makes the reader do the reading. Twelve is inventory; one outcome with a commitment and a result
is evidence. This is the only place in the product where the machine is GRADED rather than shown
being busy, and that is the whole positioning: *agents that own outcomes, not just output.*

**A miss leads as readily as a win.** Nothing filters the verdict. A surface that shows only its
wins is marketing and a reader works that out by the third visit; a product willing to open its
landing page with *missed* is making a much larger claim about itself than one opening with
*validated*. This is the register the locked positioning asks for: a verifiable mechanism and a
self-correction, never volume.

**Three rules it holds to, which any future region on the entry also holds to.**

- **The grader's sentence is not rewritten.** It already carries the commitment and the result in
  the form a person reads them. A second wording of one verdict on the way to the screen is how two
  surfaces come to disagree about what happened.
- **A seed row says so in words, not in a quieter colour.** A colour still reads as the founder's
  own result to anyone who does not know the convention, and this repo has already paid for that:
  three metrics proving the product worked were all sample data and nobody could tell.
- **A read that failed draws nothing.** Its own read and its own null, like the three answers beside
  it, so a refused table cannot blank them. A home that could not look must not reassure.

**And two earlier rulings it did NOT overturn, because both are still right.** The headline stays
the count (*a count is a debt; the next step is a direction*), and the three answers stay plain
sentences (*not a card, a stat row, or three tiles*). The gap was never their size. It was that
none of them was evidence.

---

## Still owed, from the founder's own brief

Carried forward deliberately rather than dropped with the old contract: these are undelivered
**product** asks, not retired design vocabulary. Fold them into feature work; do not run them as a
separate pass. Ordered by his emphasis, with the full text in
[`archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md`](./archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md).

1. **Live agent status**, which he called *"the only core USP of our platform"* — across every
   surface and every depth, with the per-action detail. The trap is stated in the original and is
   still the trap: 64 files use a loading state, and **the ones where no agent is running must not
   show it, or the indicator becomes a lie.**
2. **The Build terminal**, inline or side by side with the file being touched, changing with the
   selection.
3. **Status colour everywhere**, not only the headline number.
4. **Unique shapes** for missions and cards. Distinctive on a monotone ground, never force-fitted.
5. **Space and scroll discipline** across all seven stations.
6. **Perceived speed.** Fix the latency, not the spinner.

Standing bar from the same brief: *"premium feel and premium experience, but at the same time do not
feel like a force-fitting one"*, and a glance must not make anyone work out what something is.

---

## Working with the founder

**He refines by seeing, not by specifying.** Ship a faithful attempt fast, then expect two or three taste passes. He reviews element by element and expects every item in a feedback batch closed or explicitly declined. He invites pushback but wants **a recommendation, not a survey**.

He has granted standing authority to overrule any doctrine — including his own past rulings and this file — where it blocks a premium outcome, and asks only that anything critical be flagged.

Prior attempts failed at **dispatch, not design**: 28 mockups and 13 work-order packets were authored and only 2 of 11 lanes ever ran. **Produce code, not more documents.**

---

## Related

- [`MERIDIAN-REFERENCE-PARITY.md`](./MERIDIAN-REFERENCE-PARITY.md), the component map against the reference
- [`REFERENCE-PATTERNS.md`](./REFERENCE-PATTERNS.md), verified research with source URLs
- [`SEVEN-STATIONS-BLUEPRINT.md`](./SEVEN-STATIONS-BLUEPRINT.md)
- [`../conventions/design-anatomy.md`](../conventions/design-anatomy.md), card and detail-view anatomy
- [`archive/`](./archive/), the five retired contracts — history, never authority
