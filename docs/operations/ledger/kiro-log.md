# Kiro build log

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**Kiro is the only writer of this file.** Append only; never edit or delete a past entry. Protocol and entry format: [`README.md`](./README.md). Work list: [`../kiro-queue.md`](../kiro-queue.md).

Verbs: `STARTED` · `BUILT` · `BLOCKED` · `QUESTION`

---

## K-01 · STARTED · 2026-08-19 22:27

Taking K-01 because both ledgers were empty, so nothing was `STARTED` or `BUILT`, and K-01 is
the lowest-numbered item with no dependencies. K-02 and K-03 both wait on it.

---

## K-01 · BUILT · 2026-08-19 22:41

**Did.** Added `--mrd-stop` to `src/styles/meridian.css` in both grounds, `oklch(0.68 0.105 12)`
on dark and `oklch(0.48 0.105 12)` on paper, with the `@theme inline` binding
`--color-mrd-stop`. Measured both values with a throwaway OKLCH to sRGB to WCAG script against
every ground stop and against the token's own 13% wash, and recorded the numbers in the token's
comment: dark worst case 5.21 plain against `float` and 4.29 on its own wash there, paper worst
case 5.67 plain against `sink` and 4.71 on its own wash. Both clear the 3:1 non-text floor with
room and clear 4.5 as text on every plain surface, so the same token can carry a label as well
as a fill. The comment names K-02's `Action` destructive variant as the first caller and K-03's
stop-a-run confirm in `Dialog` as the second.

**Unsure.** Three real judgment calls, and the hue is the biggest one.

1. **It is in the red family, at hue 12 against `--mrd-fail`'s 27.** The item asks for something
   "distinguishable from `--mrd-fail` (27) and from `--mrd-hold` (78) at a glance", and read
   strictly that pushes toward a hue outside the warm arc. I measured the wheel before choosing
   and there is no clean seat: the widest gap between adjacent status hues is 83 degrees
   (pass 152 to agent 235) and its centre, 193, is 41 and 42 from its neighbours and reads as a
   cyan, which this file already names as a trap because blue means a machine is working. A stop
   control sits on exactly the surface an agent-working indicator sits on, so cyan is the worst
   available seat rather than the best. Every other gap centre lands within 37 of a neighbour,
   inside the range the file's own note says colour vision deficiencies start merging. So I kept
   the red family and separated on chroma instead: 0.105 against fail's 0.19, which renders as
   #d07c87 clay against fail's #f0574e vermilion. Side by side they are plainly different
   colours. **If the founder reads "distinguishable at a glance" as requiring a different hue
   family, this is the decision to overturn, and the alternative I would pick is a neutral plus
   structure rather than cyan.**
2. **I declared it a CONTROL palette, not a sixth status hue.** meridian.css refuses a sixth
   status meaning outright, and it also says a thing that needs noticing without one of the five
   meanings "needs STRUCTURE, not a new colour". Read one way, that sentence answers K-01 with
   "do not add a token". I did not read it that way, because `viz` and `syntax` already exist
   beside the five as non-status palettes, so a third one is a precedent rather than an
   exception, and because the alternative leaves an interrupt either wearing `--mrd-fail`
   (forbidden) or wearing a neutral (indistinguishable from the benign secondary beside it,
   which is how somebody discards a run by aiming one button off). I wrote the constraint that
   keeps it honest into the file: it may only paint something a person can press, never a chip,
   a dot, a rule or a row's state.
3. **One token, no `-dim` and no hover stop.** The item says one token, so that is what shipped.
   K-02 will need a hover treatment for the destructive variant; I intend to derive it there with
   `color-mix(in oklab, var(--mrd-stop) ...)`, which is not a raw colour and not a second token,
   rather than come back and widen this item. If that turns out to want a real token, it earns
   its place on the second caller like everything else.

**Noticed.** Four things.

1. **My contrast calculator disagrees with two of this file's own recorded paper figures, and I
   cannot tell which is right.** The light block says "Measured worst case on paper, against
   `sink`: you 5.4, agent 5.1, fail 5.0, pass 4.5". I reproduce `you` at 5.45 and `hold` at 4.58,
   which match, but I get `fail` at 5.44 against the stated 5.0. The gap is only on `fail`, which
   suggests the recorded number was taken before `--mrd-fail` moved from 0.52 to 0.50 lightness
   (the comment two lines above records exactly that move) and was never re-measured. Worth a
   sweep, and it is not mine because it changes numbers in a shipped comment.
2. **`--mrd-fail` does not clear 4.5 on its own 13% wash on the DARK ground.** It measures 3.96
   against `float`, and the light-block comment says the wash cases were solved for paper only:
   "Twelve nodes, all on paper". So the failed chip on a dark floating pane is a hair under the
   text floor and nobody has looked. My new token measures 4.29 in the same spot, so it is better
   than the incumbent there, but the incumbent is the defect.
3. **`--mrd-edge-focus` is still declared in both grounds with a comment saying to delete it
   "once nothing outside src/ reads it".** It is aliased to `--mrd-field-focus` and it also has a
   live `@theme inline` binding, which means the deprecation cannot complete while the binding
   invites new callers. Not in any queue item I have seen.
4. **The `@theme inline` block is missing bindings for four declared tokens** as far as I can
   tell from reading it: `--mrd-lift-hover` and `--mrd-solid-hover` are bound, but there is no
   `--color-mrd-you`-style binding for `--mrd-pass-dim` or `--mrd-fail-dim` because those are
   never declared, while `--mrd-hold-dim`, `--mrd-you-dim` and `--mrd-agent-dim` are. So three of
   the five status words have a resting stop and two do not, which is a gap a caller will hit the
   first time a `pass` mark needs to sit at rest. Nothing is broken today; it is an asymmetry.

**Gates.** tsc clean · 9,405 pass / 0 fail / 23 skip / 60 todo across 569 files · build ok.
Verified the token reaches the built stylesheet: `.output/public/assets/styles-*.css` carries
`--mrd-stop:oklch(68% .105 12)` and `--mrd-stop:oklch(48% .105 12)`. Ratchet total unchanged;
the hex values in the comment are stripped by `stripCssComments` before counting, so they are
not raw colour.
