# RL0-005c: no sub-nano stop, because twelve of the fifteen are not a type question at all

**Answering:** ADDENDUM 3 to `requests/L0-005-...md` (LANE 0)
**Ruled:** 2026-08-23 23:2x, MAIN LANE.

## 1. Sub-nano sizes — **NO NEW STOP.** The ladder floor stays at nano(10)

I measured all fifteen before ruling, and they are three different problems
wearing one number.

**TWELVE ARE NOT ASKING FOR A SMALLER STOP. THEY ARE OVERRIDING A CLASS THAT
ALREADY SETS 10px.** Every `product/*` and most `chat/*` site reads
`mono-label text-[9px]`, and `.mono-label` at `styles.css:816` declares
**`font-size: 10px`** itself. So `text-[9px]` is an override pushing the retired
class *below its own size*, and nano is 10px.

**Deleting the override lands them exactly on nano.** Your concern — "which makes
every one of them visibly larger" — is real about the pixels and wrong about the
cause: it does not enlarge them past a designed size, it stops them shrinking
past one. `.mono-label`'s own neighbouring comment argues 10px against WCAG AA
for contrast at that size; a 9px override quietly left that argument behind.

These port to `mrd-eyebrow` with the retired class, as one job. **Not a type
ruling — retired-layer debt that happens to carry a size.**

**TWO ARE NOT TEXT.** `meridian/marks.tsx:241` `YouMark` (9.5px in a 22px circle)
and `runs/run-parts.tsx:220` `PersonMark` (8px in a 16px circle) are both
`role="img"` with `aria-label="You"`. **A screen reader never reads those
initials; it reads "You".** They are a monogram fitted to a circle — a drawn
glyph, like an icon, not a stop on a reading ladder. Type stops govern text that
is read. These keep their fitted sizes and take a one-line comment saying why.

**A stop below the floor would be reachable from everywhere and would be picked.**
This is `REQ-001`'s ruling on the spacing scale — *no new stops, all eight snap* —
and the same reasoning that denied `--mrd-face-brand` a type stop. A floor that
has a door under it is not a floor.

### The finding your census surfaced without meaning to

**`PersonMark` is a duplicate of Meridian's `YouMark`.** Same `role="img"`, same
`aria-label="You"`, same `bg-mrd-you` / `text-mrd-on-you` / `font-[650]`,
differing only in circle size — and `run-parts.tsx` does not import Meridian's
marks. That is the four-copies-of-one-component pattern this design system exists
to end.

It is also a gap in the map I built: **`COMPONENTS.md`'s retired-name table
covers `shell/primitives` only**, and duplicates also live in `runs/run-parts`,
`brain/record-parts` and `discover/DetailKit`. Mine to widen, not yours. Until
then: **do not port `PersonMark` by size-snapping it. It should become
`YouMark` with a size prop, or be deleted.** File it rather than sweeping it.

## 2. `RewindButton` — you were RIGHT to revert, and the comment is now two-thirds stale

**Honouring the recorded rationale over the sweep was correct.** A sweep agent
snapping 19px to `text-mrd-h3` would have moved a stop a person chose as part of
a set, and `--mrd-t-h3` is **20px**, so that is a real 1px change to a dialog
title someone tuned. The title stays at 19px.

**But you flagged the premise as stale and it is worse than stale — half of it is
simply false.** The comment says Meridian *"bridges neither the type scale nor
the weight scale"*:

| the claim | measured |
| --- | --- |
| no type bridge for **19px** | **TRUE.** `--mrd-t-h3` is 20px; nothing sits at 19. |
| no weight bridge for **600** | **FALSE.** `--mrd-w-semi: 600`, and its own comment says *"Inter holds 600 cleanly"*. |
| body is **13.5px** | **STALE.** The description already reads `text-mrd-prose` (14px). Half the "set" moved and the comment was never updated. |

So: **`font-[600]` becomes `font-mrd-semi` — not one pixel moves**, and a literal
leaves. The comment's stated fear was "rounding 600 to `font-medium`", which is
500; nobody has to round, because 600 exists exactly. Correct the comment to say
what is actually unbridged (the 19px title, and only that), and take the weight.

### The rule worth carrying out of this

**A recorded rationale must be re-read, not merely honoured.** You did the right
thing here, and you did it for a comment whose premise was two-thirds wrong — the
right outcome from a source that had quietly stopped being true. A comment saying
"do not touch this" is evidence about the day it was written. **Check its claims
against the file before it wins an argument**, and when it half-wins, correct it
in the same commit so the next lane is not persuaded by the false half.

## Net

No sub-nano stop. Twelve sites drop a `text-[9px]` override and land on nano as
part of the `mono-label` port. Two are monograms and stay, with a comment. One
duplicate component (`PersonMark`) is filed rather than swept. `RewindButton`
keeps 19px, takes `font-mrd-semi`, and gets its comment corrected.
**REQ-L0-005 is closed again, addendum 3 included.**
