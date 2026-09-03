# The design system

> _Meridian. Contract since 2026-08-15 · This file replaced the 2026-08-03 contract, archived at [`archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md`](./archive/DESIGN-SYSTEM-2026-08-03-to-08-14.md)._

**Meridian is the design system. There is no other one, and there is no surface exempt from it.**

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

---

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

Monochrome by default on a single neutral ladder. **Five status words and only five** — `you`, `agent`, `pass`, `fail`, `hold` — each meaning one thing everywhere:

- **`you`** a person is required. Not "important", not "primary". If no decision unblocks it, it is not this colour.
- **`agent`** a machine is working.
- **`pass` / `fail`** an outcome that has happened. Never an *intent* — "roll back" is not red, because red reports a result and distance plus a confirm is what protects a destructive act.
- **`hold`** stopped, waiting on a condition rather than on a person.

Categorical colour (`--mrd-viz-*`, the syntax palette) is a **separate system** and must never be read as status.

**It must survive a greyscale test.** If the screen stops making sense in greyscale, the colour was doing work that structure should have done.

### 4. Identity is shape. Status is hue.

A station, an agent or a mission is identified by its **glyph**. Painting identity as a colour ramp — seven stations, seven hues — has now been found and removed **three separate times**. See [`station-glyphs.tsx`](../../src/components/meridian/station-glyphs.tsx), which also carries the corollary learned the hard way: *a glyph sitting beside real controls may not borrow one of their shapes, however apt the metaphor feels.*

### 5. Look at it before you ship it

**The gates cannot stand in for this, and it is worth knowing why: the suite asks whether each component behaves, never whether anyone has looked at it.**

On 2026-08-14 every primary button carried a **1.19:1** label on paper, because `--mrd-solid` and `--mrd-ink` both invert across the grounds and so travel together instead of apart. Twelve controls, nine files, `tsc` clean, 8,787 tests green, and no fixture had ever handed a primary button an action — so nothing rendered the broken state on any machine. Rendering it in both grounds found it in one pass.

The gallery at [`/meridian`](../../src/routes/_authenticated.meridian.tsx) exists for this and nothing else. **Coverage is not reach, and reach is not a look.**

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

**Any component with an early return must carry `data-mrd=""` on that return too**, or its controls fall back to the legacy app-wide focus ring.

---

## Two doctrines that survive every design change

**The Engine-Room doctrine.** Complexity lives in the engine, never in the experience. The user meets the *output* of the machine, never the machine. Labels name the **outcome**, not the mechanism. Every new surface runs the Engine-Room Test — *would a smart non-technical person feel this is for them?* — and carries a greppable `Engine-Room:` line. Body: [`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md).

**Humanized output.** No em or en dashes, no invisible Unicode, no AI-cliché phrasing in UI copy, in source, or in anything the platform generates for a user. The runtime sanitizer at the AI chokepoint is the hard gate; markdown docs are exempt. Body: [`../conventions/humanized-output.md`](../conventions/humanized-output.md), applied in [`../conventions/ui-voice.md`](../conventions/ui-voice.md).

Surface mechanics — one page scroller, `@container` not `@media` inside a pane, fit-to-content heights, the wait, agent indicators — are in [`../conventions/surface-discipline.md`](../conventions/surface-discipline.md) and enforced by `src/__tests__/surface-discipline.test.ts`, which was proven to fail by planting the defect rather than only proven to pass.

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
