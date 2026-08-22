# Surface discipline: space, scroll, colour and the wait

> **PARTLY STALE, 2026-08-22.** **Its laws still bind and are enforced by `src/__tests__/surface-discipline.test.ts` — one page scroller, `@container` not `@media` inside a pane.** What is stale is the *vocabulary in its examples*: they name `--sp-*` tokens from the retired Cadence/ink system. Read the laws, ignore the token names. The design system is **Meridian** and there is no other one — contract [`DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md), system `src/styles/meridian.css`, components `src/components/meridian/`. v1 Ember, v3 Obsidian, v4 Loom, v5 Tempo and Cadence/ink were all retired 2026-08-14 and the retirement is enforced by `src/__tests__/meridian-ratchet.test.ts`.


> _Created: 2026-08-01 · Last updated: 2026-08-01_

**What this is.** The rules that govern how any Supaprod surface uses vertical space,
scroll, colour and loading states. Every one of them was written after a measured
defect, not from a principle someone liked. It applies to work we do today and to
every feature added, modified or deleted after today, which is the reason it exists
as a file rather than as a memory of one session.

Companion rules: [`anti-slop.md`](./anti-slop.md) is the quality bar,
[`engine-room-doctrine.md`](./engine-room-doctrine.md) is the calm-front law,
[`design-anatomy.md`](./design-anatomy.md) is card and detail-view anatomy,
[`ui-voice.md`](./ui-voice.md) is the words.

---

## 0. The two governing laws

Everything below is subordinate to these. When a rule below appears to conflict with
one of these, these win.

### 0.1 The ratchet: today's design is the floor

> **Founder ruling, 2026-08-01:** _"if I said to you, 'It's too much of a vertical
> scroll and you need to reduce that', that doesn't mean you need to compromise on the
> look and feel and user experience perspective. As of now, the design looks clean.
> Just that you need to optimize it and make it better. Don't just compress and shrink
> it and make it worse. Your baseline is what we have today. You need to enhance it on
> top of that."_

**No change may make a surface worse than it is today in order to satisfy an
instruction.** A request to reduce scrolling, tighten a layout, fit more in, or speed
something up is a request for a BETTER surface, never a smaller one. If the only way
you can see to satisfy the letter of a request is to shrink type, strip padding, cap a
height, hide information or drop a state, you have not found the answer yet. Say so and
propose the structural fix instead.

The practical test before you commit: **would a person who liked yesterday's screen
prefer today's?** If the honest answer is "it fits better but reads worse", revert.

### 0.2 The standard: Stripe, Google, Anthropic

> **Founder ruling, 2026-08-01:** _"The design should look premium, ultra-premium, and
> it should be to the standards of Google, Stripe, and multiple products that have been
> used by millions and billions of customers and are being operated at an
> enterprise-scale B2B level. That's what our standards are. ... we have done most of
> the design. It's just that we are adding those fine touches. It's not that we are
> completely skinning."_

Two things follow, and the second is the one that gets forgotten:

- **The bar is a product operated at scale**, not a product that demos well. That means
  states nobody screenshots: empty, partial, failed, permission-denied, very long
  content, very short content, slow network, and every one of them composed rather than
  merely handled.
- **We are past the reskin.** The system (`--sp-*` tokens, `src/styles/primitives.css`,
  `src/components/shell/primitives.tsx`) is the built thing. Work is now FINE TOUCHES on
  top of it: a spacing relationship, a state that was missing, a colour that carries
  meaning it did not carry before. A change that reaches for a new visual language on a
  surface that already has one is a regression against 0.1, however good it looks in
  isolation. Modify or delete freely where something is genuinely wrong; do not
  re-invent where it is merely unfinished.

---

## 1. Exactly one page scroller

`.sp-work` (`src/styles/shell.css`) owns vertical scrolling for the authenticated app.

**A nested vertical scroller inside it is a trap.** Measured on 2026-08-01: the Build
diff had two, each `max-height: 60vh; overflow-y: auto`. Wheeling with the pointer over
the diff scrolled the diff and the page stayed still, so the page read as frozen.
Reported as _"I'm not able to scroll to the end. It's got stuck."_ `.sp-work` had
2229px of content in a 778px window at the time, so there was plenty of page left to
scroll and no way to reach it from where the pointer naturally sat.

- `overflow-x: auto` on its own is fine and often correct: a line of code or a wide
  table has nowhere else to go.
- A bounded height plus `overflow-y` is allowed ONLY for a region a person would not
  wheel over in order to move the page: a side rail, a dialog body, a popover, a command
  palette, a live log. If the region is the main reading area, it may not trap.
- If you find yourself capping a height to stop a region getting tall, read §3 first.
  The cap is almost always the wrong tool.

## 2. Container queries for anything inside a pane

A viewport media query answers a question about the WINDOW. Anything living in a column,
a pane or a split needs a question about its OWN width.

Measured: `@media (max-width: 900px)` on a two-column code diff never fired at a 1512px
window while the pane itself was 467px, so two code columns would have been ~230px each.

Use `@container (max-width: ...)` with `container-type: inline-size` on the region's own
wrapper. Reserve media queries for genuinely page-level structure (the shell, the rail,
the page padding).

## 3. Fit the content; never pin a content region to a number

A box pinned at `420px` held three lines inside an empty pane, and three hundred lines
scrolling inside the same box. Founder: _"wrong shape."_

- Content regions size to their content. Use `max-height` as a ceiling only where
  unbounded growth is genuinely possible and harmful, and prefer solving the growth.
- Control sizing is exempt and deliberate: icons, marks, avatars, buttons and inputs at
  32/36/38/40px, hairlines.
- A loading placeholder must not be taller than the content it stands in for. A fixed
  420px box containing the words "Reading the diff." was the single largest piece of
  unexplained blank space on the Build surface.

## 4. How to reduce vertical extent legitimately

This section exists because "reduce the scrolling" is a request that invites exactly the
regression §0.1 forbids. There are two lists. Use the first.

**Structural, always allowed:**

- **Use the horizontal axis.** A list above its detail becomes a list beside its detail.
  This is how the Build diff went from a long scroll to a two-pane split, and it is what
  VS Code, Cursor and GitHub's review all do.
- **Collapse what nobody reads.** A 900-line file with a four-line change renders ten
  rows, because unchanged context collapses to a stated count. The information is not
  hidden, it is summarised and expandable.
- **Escape the reading measure where the content is not prose.** `.sp-main` caps at 74ch
  because that is a readable line of TEXT. Code, tables, grids and canvases pass `wide`
  and use the room.
- **Remove genuine duplication.** The path was printed above the diff AND inside it; one
  of those was free to delete. Two headers for one thing is not density, it is repetition.
- **Progressive disclosure that already exists.** Reuse the `more` / expand contract
  rather than inventing a new fold.

**Compression, never allowed as an answer to "too much scroll":**

- Reducing type size, line-height, or the spacing scale.
- Removing padding from a region that reads well.
- Capping a height so content scrolls inside it (see §1: this also creates a trap).
- Deleting a state, a label, or an explanation to save a row.
- Collapsing two distinct facts onto one line so they run together.

## 5. Colour carries meaning or it does not appear

The system is monochrome by default with a small, earned set of exceptions. Colour is
information, never decoration, and it must survive greyscale: if removing colour removes
meaning, the meaning was not encoded anywhere else and the design is wrong.

- **A diff delta is always green and red.** Founder ruling 2026-08-01: _"we need to
  display it in red and green ... so that its evident."_ Grey numerals are not read. This
  is the one place colour needs no legend, because plus-green and minus-red is the oldest
  convention a developer surface has. It applies wherever a delta is shown, at every
  level, and the unit shown must be the unit measured (lines, not characters).
- **A zero side is not drawn.** `+10 -0` presents a zero as a finding; nothing was
  removed because there was nothing there to remove.
- **Never colour alone.** Every coloured state carries a sign, a word or a shape as well.
  `+`/`-` for a delta, a word for a status, a mark for an agent.
- **Do not introduce a new hue for a state that already has a word.** The changeset
  ladder is a sentence, not a coloured pill, because that one genuinely needed a legend.

## 5b. A quiet action is never drawn in the metadata ink

> **Founder ruling, 2026-08-01:** _"as of now it looks like a very non-activated
> texture. Wherever the buttons or action items need to be taken ... in a subtle way
> ... so that he knows this is where he can act if he wants to."_ And immediately
> after: _"don't overpower and overdesign and spoil the current design."_

The cause was one token, not a missing component. `.sp-block-more` — the affordance
every surface uses for "Draft it", "Edit", "Show all 9", "Drop this file" — was drawn
in `--sp-mute`, which is the ink for "merged", "3 files" and every timestamp. A VERB
and a LABEL rendered identically, so the eye had no way to separate them and nothing
signalled interactivity until you happened to hover. **A signal you can only receive
by hovering is a signal received by accident**, and it never reaches touch or a
keyboard scan at all.

The rule, and the reason it stops where it does:

- **An action is one step up the ink scale from the data around it.** `--sp-body`, not
  `--sp-mute`. This alone does most of the work and costs nothing visually.
- **It carries a rest-state affordance**, currently a 1px dotted underline at ~26%
  alpha. Dotted-at-rest is the oldest "interactive but quiet" convention there is and
  needs no legend. It goes solid on hover, which is where emphasis belongs.
- **No chrome.** No fill, no border, no brand colour, no size change. Affordance is
  not emphasis: a primary action still gets a real button, and this is for everything
  else.
- **The focus ring is an `outline`, never a `box-shadow`.** `src/styles.css` carries
  an unlayered `[data-obsidian] :focus-visible { box-shadow: none }` after
  `primitives.css` in source order, so shadow-based rings are silently erased. Five
  rules in `primitives.css` were already inert for this reason.
- **A disabled quiet action stops promising**: it drops to the metadata ink and loses
  the underline entirely.

## 6. The wait

One component, `src/components/supaprod/BrandWait.tsx`, wired into
`defaultPendingComponent` in `src/router.tsx`, which covers every route in the product.

- **The mark, not the word.** The product name is the one fact a person waiting already
  has. The seven-petal mark in loader mode says something instead: seven stations, one
  continuous journey, energy running the loop, the brain pulsing at the core, and a
  fainter second comet for the record keeping up with the work.
- **Centred against the viewport**, not against the top 40% of a region.
- **The brand must be recognisable while it waits.** The loader's own track was once an
  effective alpha of 0.02, so all a person saw was a comet and the mark could not be
  identified. A brand loader whose brand cannot be recognised is failing its only job.
- **Announced once, silently.** A `role="status"` live region carries the words; no
  visible caption. A screen reader must never get silence during a wait.
- A region-level wait states what it is READING as a fact ("Reading the record."), and
  never wears an agent's clothes. `Loading working` is only for a genuinely dispatched
  agent; see §7.

## 7. An agent indicator means an agent is running

`AgentPulse` / `Loading working` appear only where the call path genuinely reaches the
AI chokepoint (`src/lib/ai/runtime.server.ts`) or `runAgentLoop`. A plain fetch gets a
plain fact. The per-action `detail` is a noun THIS SURFACE ALREADY READ: a file, a line,
an artifact, a tool, a count. Never a second verb, never a percentage, never a guess
about a step the client cannot see. Where no specific fact is in scope, pass none.

**One indicator per piece of work.** Two live indicators for one job is cognitive load,
not reassurance. When a richer indicator already exists (Ask's per-turn `Working` line
carries real server progress and an elapsed count), do not add a second.

---

## 8. The checklist, per change

Run this on any change that touches a surface. It is short on purpose.

1. **Ratchet.** Would someone who liked the old screen prefer the new one?
2. **One scroller.** Did you add a vertical scroll container inside `.sp-work`?
3. **Container, not viewport.** Any new breakpoint on something inside a pane?
4. **Fit.** Any new fixed height on a content region?
5. **Measure.** Is the content prose (keep 74ch) or not (pass `wide`)?
6. **Colour.** Does every new colour carry meaning, and survive greyscale?
7. **Wait.** Does every new async state say something true, and announce itself?
8. **Agent.** Does every working indicator sit on a real dispatch?
9. **Look at it.** In a browser, at laptop width, in both themes. Type-checking is not
   feature-checking, and a screenshot has caught things every measurement missed.

## 9. What is guarded, and what is reviewed

Guards outlast documents, so the mechanical rules are tests rather than prose. See
`src/styles/__tests__/surface-discipline.test.ts`.

| Rule | How it holds |
| --- | --- |
| No nested vertical scroller in the work column | test |
| Pane-level selectors use `@container` | test |
| No fixed height on the diff body | test |
| Diff delta uses the token pair, not hex | test |
| The loader carries no product name | test |
| The ratchet, §0.1 | review, and taste |
| The standard, §0.2 | review, and taste |

---

## Related

- [`anti-slop.md`](./anti-slop.md) — the quality bar this serves.
- [`engine-room-doctrine.md`](./engine-room-doctrine.md) — complexity lives in the engine.
- [`design-anatomy.md`](./design-anatomy.md) — card and detail-view anatomy.
- [`ui-voice.md`](./ui-voice.md) — the words on the surface.
- [`ui-verification-steps.md`](./ui-verification-steps.md) — how to check a surface.
