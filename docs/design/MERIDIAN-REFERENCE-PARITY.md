# Meridian against beautifului.dev: the parity map

> _Created: 2026-08-15 · Last updated: 2026-08-26_

> _Created 2026-08-15._ **The standard, set by the founder: nothing less than beautifului.dev.**
> "If you give me a better version than that, I'm still happy with that, but nothing less than the
> standards of beautiful UI.dev."
>
> This file is the component-by-component map: what exists, what the reference has that we lacked,
> what was modified, and what had to be newly built because the product had no equivalent.

## How the comparison was made, and why it is trustworthy

Not by looking at the rendered demo. All 19 reference components were extracted **as source** from
the page's own Next.js flight payload, which is the same string the site's "View code" panel
renders. Each blob declares its byte length ahead of it, so a truncated read is detectable.

```
19 blobs decoded, 191,239 bytes total
```

Every claim below is a diff against that source, or a measurement taken in a live browser, never an
impression. Where a value is quoted (a contrast ratio, a column width), it was read back off a
canvas or off `getBoundingClientRect`, because `getComputedStyle` returns `oklch()` verbatim in this
engine and parsing that as rgb silently produces garbage.

**Re-extract with:** fetch `https://www.beautifului.dev/`, decode the `self.__next_f.push([1,"…"])`
chunks, JSON-parse each, concatenate, then split on the `<id>:T<hexlen>,` markers.

---

## The 19, and where each one stands

Status is against the reference baseline. **Ahead** means we deliberately carry something the
reference does not, for a reason recorded in the component's own header.

| # | Component | Status | What changed on 2026-08-15 |
| --- | --- | --- | --- |
| 01 | Loading State | ✅ ahead | No gap. All three variants (Drive/Dots/Orbit) present with the reference's timings. We add `startedAt`, so a run reopened four minutes in reports the age of the WORK, not of the component; and `role="status"` with the decorative grid hidden from assistive tech. |
| 02 | Thinking | ✅ parity | No gap found. |
| 03 | Streaming Text | ✅ fixed | Four defects. See below. |
| 04 | Approval Card | ✅ parity | Custom-answer input present; only the aria wording differs, which is correct for our vocabulary. |
| 05 | Tool Chips | ✅ parity | No gap found. |
| 06 | Task Rows | ✅ parity | Both variants (capsule / list) present. |
| 07 | Chat | ✅ fixed | Composer was a single-line `<input>`. See below. |
| 08 | Prompt Bar | ✅ parity | Already a `rows={1}` auto-growing textarea with `overflow-wrap:anywhere`, matching the reference exactly. |
| 09 | Recommendation Card | ✅ ahead | We render `confidence: null` as a hollow ring with the verb **Review**, because production writes an unparseable model response as zero and a meter at zero is still a measurement. |
| 10 | Context Cards | ✅ parity | Kind badge and external-link mark present. |
| 11 | Diff Table | ✅ fixed | Three overflow defects. See below. |
| 12 | Records Table | ✅ fixed | Column widths were being silently overruled. See below. |
| 13 | Filter Table | ✅ parity | No gap found. |
| 14 | Sidebar Nav | ✅ parity | Renders a real `<nav>` landmark; the reference uses a bare div. |
| 15 | Search | ✅ ahead | Clear button and empty-state tile present. We add roving focus, so the results are reachable by keyboard. |
| 16 | Insight Cards | ✅ fixed | Chart was a polyline; **one of three cards was never ported**. See below. |
| 17 | Code Block | ✅ parity | No gap found. |
| 18 | Fine-tune Card | ✅ parity | No gap found. |
| 19 | Selection Actions | ✅ parity | Describe-edits input present. |

Plus two that are ours and have no counterpart: **StalledWork** (a pending approval is not a row in
a list, it is a stalled piece of work with a cost) and **NeedsSetup** (a missing precondition is not
an empty state).

---

## The gaps that were real, and what was done

### 16 · Insight Cards — the largest gap of the nineteen

**The chart was drawn with a ruler.** `pathFor()` emitted `M … L … L …`, a polyline. The reference
runs its series through `liveline` and gets a smooth curve with a gradient wash.

Restored as inline SVG, because `liveline` is not in this app and its entire `useDarkMode` observer
exists only to feed that library a theme prop Meridian does not need.

**Monotone cubic (Fritsch–Carlson), not Catmull-Rom, and that is a correctness choice.** The reflex
smoothing for a chart overshoots: between two points a cardinal spline bulges past both, so a series
bottoming at `-4.41` is *drawn* dipping to `-4.9`. On a chart whose whole job is "what did a person
forecast, and what happened", rendering a value the data never held is a false reading. Monotone
cubic clamps each tangent at a direction change, guaranteeing the curve stays inside the interval
its own endpoints define.

**The third card did not exist.** The reference pages three: a comparison, an **anomaly**, and an
allocation. The port took the first and third. `ThresholdInsight` is the missing middle, built onto
a capability the product already ships — per-track spend caps — so it is a port of the structure
onto a real fact rather than an invented one. A breached cap takes the **fail** colour, not orchid:
the crossing already happened, and nothing about drawing it asks anyone to decide anything.

Also: the stat block above the chart (name / current value / starting value per series) replaced a
bare legend; the chart frame gained its header; series gained persistent end-point dots.

**One correction worth recording.** The "since start" delta was briefly printed through the series
formatter, which put a `%` on a change measured in percentage *points* — `+18%` on a line that went
42 → 60, which is a 43% rise. It now names the starting value instead, which is the same quantity in
the same unit and cannot be misread.

### 11 · Diff Table — three overflow defects

1. **Column 0 carried no overflow rule at all**, so a long name wrapped freely and grew the row,
   breaking alignment with the fixed-height tag pill beside it.
2. **The tag pill let its label wrap inside `h-5.5`**, pushing a second line out through the bottom
   of the capsule. This is the "long source names" case: the tag column *is* the Source column.
3. **The added-rows block used CSS grid, whose items default to `min-width: auto`** — so `truncate`
   there was inert. The ellipsis never fired, the track grew past its percentage, and the added rows
   fell out of register with the header above them.

All text cells now clamp to two lines with `break-words` and carry `title`. `break-words` is the
part that is easy to omit and the part that makes it hold: a line clamp bounds height, and only
`break-words` bounds width when a token has nothing to break on.

### 12 · Records Table — the colgroup was a suggestion

The table declared real widths (`34ch` for the work title) and did not get them. Under the default
`table-layout: auto`, `<col width>` is advisory and `w-full` caps the table at its container. The
declared widths summed to ~600px inside a ~430px column, so the browser clawed back 170px from the
only column that could break — the prose one. **The work title rendered ~90px wide, one word per
line, six lines deep**, beside three half-empty columns.

That is also why the horizontal scroll the component's own comment promises never appeared: a table
that shrinks to fit has nothing to overflow.

Now `table-fixed` with a `min-width` computed from the declared widths. Measured after: the work
column went **90px → 292px**, and the region scrolls (419 client / 688 scroll).

### 03 · Streaming Text — four defects

1. **"It pastes the entire block at once."** The reveal was never broken — it started on mount and
   finished in ~4s, while the panel sits ~30 panels down the gallery. By the time you scroll to it,
   it is over. Verified: `aria-busy="false"`, all 90 spans present. Now gated on an
   `IntersectionObserver` so it starts when it is actually on screen, which is right in production
   too — an answer that streams to nobody has streamed to nobody. A `loop` prop (workbench only)
   makes the behaviour demonstrable more than once, which is why the reference loops.
2. **No source marks.** The reference draws a favicon per source. Ours are internal artefacts, so a
   favicon has nothing to fetch; `SourceKind` marks (doc / thread / call / ticket / code / board)
   are the honest equivalent, drawn in Meridian neutrals. Colour-coding the kinds was rejected:
   this system spends hue on status only, and "came from a call" is a category.
3. **No overlapping avatar stack** on the sources button. Restored, capped at three.
4. **No rating controls.** The reference's third and fourth action icons were dropped. Restored,
   and rendered *only* when `onRate` is wired — a thumb that goes nowhere lies about being heard.

**The left edge was changed and changed back.** It was briefly replaced with an inset pill-shaped
bar; the founder compared both and kept the original `border-left` on the rounded card. The taper
into the card's radius is what ties the rule to the card. **Do not "fix" this to an inset bar.**

### 07 · Chat — the composer could not wrap

It was `<input>`. A single-line input does not wrap; it scrolls sideways, so a long question walks
off the left edge. Founder: "if I keep on typing it just gets extended in the same row." Now a
`rows={1}` textarea that grows to a five-line ceiling then scrolls internally, matching the
reference's own composer. Enter sends; Shift+Enter makes a newline, which an input never could.

---

## What changed in the system itself

### The focus treatment, and the ember that would not die

The accent fired on every tab press, every click into a field, every selected row. One token caused
all of it: `--ds-focus-color` in `styles.css` resolved to the ember accent, and every field style in
the app reads it through `--focus-blue` / `--form-focus` / `--ring` / `--focus-ring`. The unlayered
`[data-obsidian] :focus-visible` rule then painted it over every component's own focus utility —
unlayered CSS beats every layer, so Tailwind's `focus-visible:outline-[…]` was permanently inert.

This had been reported before, on 2026-07-30, and fixed by scoping three controls. **That is why it
came back.** The cause is now fixed at source, and Meridian owns a neutral `--mrd-focus` inside
`[data-mrd]`, which every one of the 21 component roots carries so the treatment travels with the
part rather than with the page.

Also removed: the command palette's ember caret, its ember active-row outline, ember focus outlines
in five components, the range slider's ember bloom, the receipt-card hover glow, and both graph
canvases' selected-node ring.

**A text field now gets no focus box at all.** It answers "where is the keyboard" twice already —
a caret is blinking in it, and its border has stepped up. A third answer drawn around the outside is
a box appearing for no reason. Buttons, links and rows keep their ring; they have no caret.

### The palette gained a fifth role

Four roles could not express the most common state in the workspace. **39 of 43 work items stand at
the first station for want of a connected source**, and that rendered as grey body text.

`--mrd-hold`, a restrained amber, means **stopped and not on you**: no source connected, a cap
nearly spent, an approval expiring. It is the difference between a row you can unblock by deciding
something and a row that needs a *condition* to change. Collapsing it into orchid is not a shade of
wrong, it is the opposite instruction — it sends someone hunting a button that does not exist.

Hue separations: 51° (fail↔hold), 74°, 83°, 80°, 72°. Measured worst-case contrast, both grounds:

| | hold | hold-dim | you | you-dim | agent | agent-dim | pass | fail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dark | 8.07 | 4.31 | 5.98 | 3.77 | 5.62 | 3.76 | 7.27 | 4.65 |
| paper | 4.58 | 3.88 | 5.44 | 4.26 | 5.09 | 3.72 | 4.53 | 4.98 |

Amber was previously banned outright by this system. That ban over-corrected a real rejection: what
the founder rejected was gold as the **primary accent**, and that still stands. Amber here is a
status on a chip, a dot and a rule, at a chroma below both orchid and green so it can never
out-shout the hue that asks for a person.

**A sixth role is refused.** A sixth hue lands inside 40° of a neighbour, which is where the
commonest colour vision deficiencies merge them. An "informational" hue is the specific trap: it
reads blue, and blue already means a machine is working. Something that needs noticing and carries
none of the five meanings needs **structure**, not a colour.

### Typography, taken from the reference and applied app-wide

Measured off the live page by walking every rendered text node and tallying its computed
size/weight/leading/tracking — so this is what the reference ships, not what its source appears to
ask for.

- **Inter + JetBrains Mono**, self-hosted, variable, latin subset (48KB + 40KB), OFL noted beside
  the files.
- **`-0.14px` tracking on everything, uniformly, at every size.** This is the largest and least
  obvious difference; we had no tracking token at all.
- **1.5 leading** against our 1.4. That extra tenth is most of the "light, not overpowering" quality.
- **14px base** against our 13px, over a dense small ladder: 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 14.

This reverses Meridian's own earlier argument that "twelve sizes inside a 10px span is a gradient,
not a hierarchy". That reasoning is right for headings and wrong for a dense working UI: the
reference runs eight stops inside a 4px span and still reads as hierarchy, because hierarchy is
carried by **weight and colour** while size carries **density**.

> **A trap worth recording.** Setting `letter-spacing` on `html` did nothing. An existing
> `@layer base` rule declares `body { letter-spacing: 0 }`, which does not merely fail to inherit —
> it resets the entire tree, because everything inherits from body. Both elements are now listed.

### The brand mark is not the UI accent

The mark read `var(--ember)` and `var(--marigold)`, so retiring ember from the UI would have turned
the logo orchid. That coupling was the bug. `--brand-mark-ember` and `--brand-mark-gold` are now
theme-invariant and independent; the mark keeps its ember and its gold bead exactly as before.

### The app shell stopped hiding itself

The rail **auto-collapsed by itself** once a reader had visited four stations, on the theory that a
familiar reader knows the icons. The result was a column of ten unlabelled 14px glyphs. Retired:
familiarity with a *station* is not familiarity with its *icon*, the product changed shape on a
schedule the user could not see, and it is the opposite of the reference, whose left plane names
every destination always. The manual toggle stays; the product deciding for you does not.

---

## Two things this pass deliberately did not do

- **The gallery's accent picker was removed, not relocated.** It offered four candidate hues whose
  decision closed on 2026-08-14. It was also actively harmful: each candidate overrode `--mrd-you`
  on its own grounds, so a contrast sweep that sampled the first light ground on the page reported
  the orchid dim stop failing AA. It was not — on an honest ground it reads 4.26. **An instrument
  aimed at a preview will describe the preview.**
- **The legacy brand-CTA embers were left alone** (`btn-pill`, `btn-reject`, the flashlight-tabs
  active label). Those are brand fills rather than interaction states, and the founder scoped them
  to the later product-wide rollout.

## Still open

- The app shell beyond the rail: the reference's dashed rule, quiet section label, pinned footer
  block and end-of-list dimming are not yet carried across.
- Button standardisation. The system currently mixes neutral, filled and accented primaries across
  components; these need one declared set.
- `Mona Sans` and `IBM Plex Mono` `@font-face` blocks are now inert (nothing references them). They
  cost nothing at runtime — a browser only fetches a face that is used — but they should go with
  the legacy layer.
