# ANS-M09: The spacing scale has a hole exactly where the product spends most of its time

**Verdict:** partial
**Answered:** 2026-08-23T08:55:00+05:30
**Raised by:** nobody. MAIN LANE, following the founder's "alignments, positioning, all those
things are not properly put in place" to a measurement.

**This one is a FOUNDER CALL and I have deliberately not acted on it.** The fix is a change to
the shape of the spacing scale, not a bug fix, and it cannot be done without renumbering steps
that 147 call sites already use.

## The measurement

Same disease as the type finding, one axis over. Across the 46 Meridian components:

| spacing written as | uses | share |
| --- | --- | --- |
| Meridian's own scale (`p-mrd-*`, `gap-mrd-*`) | 147 | 21% |
| **Tailwind's default numeric scale** (`gap-2`, `px-2.5`) | **511** | **71%** |
| an arbitrary value (`p-[12px]`) | 59 | 8% |

**79% of the spacing inside the design system's own components is not on the design system's
scale.** The ratchet cannot see any of it, for the same reason it cannot see `text-[13px]`:
`gap-2` is not retired vocabulary, it is Tailwind's default, and no guard was ever pointed at it.

## Where the hole is, and it is not random

Meridian's scale is modular and deliberately non-linear:

```
--mrd-s1  2px     --mrd-s5  16px
--mrd-s2  4px     --mrd-s6  24px
--mrd-s3  6px     --mrd-s7  40px
--mrd-s4  10px    --mrd-s8  64px
```

Tailwind's is linear in 4px units. Mapping every Tailwind-scale use in the components to px and
checking it against the ladder:

| px | uses | Meridian step |
| --- | --- | --- |
| 2px | 54 | `s1` |
| 4px | 112 | `s2` |
| 6px | 82 | `s3` |
| **8px** | **116** | **none. `s3` is 6, `s4` is 10** |
| 10px | 56 | `s4` |
| **12px** | **46** | **none. `s4` is 10, `s5` is 16** |
| 16px | 25 | `s5` |
| 24px | 3 | `s6` |
| 32px | 7 | none |

**332 of 511 (65%) land exactly on a step.** Those are a visually neutral rename and could be
converted tomorrow with no pixel moving.

**The other 179 are concentrated in two sizes the scale does not have: 8px, used 116 times, and
12px, used 46 times.** That is 32% of all Tailwind-scale spacing sitting in a gap in the ladder.

**116 callers is not drift.** The system's own rule is that a token earns its place on the
second caller. Eight pixels has a hundred and sixteen, and it is the commonest single spacing
value in the design system, ahead of every step that actually exists. `gap-2` alone is 48 of
them, which is the gap between an icon and its label and between a chip and its neighbour: the
two most repeated relationships in a dense product.

## Why I stopped rather than fixed it

**Inserting 8px and 12px renumbers the ladder.** 8px belongs between `s3` and `s4`, so `s4`
through `s8` all shift, and every one of the 147 existing `p-mrd-*` call sites silently means
something different. That is a migration, and a silent-wrong-value migration is the worst kind.

The alternatives are all real and none is obviously right, which is exactly why it is yours:

1. **Add the two steps and renumber**, migrating all 147 sites mechanically in the same commit.
   Honest ladder, one risky pass, and `p-mrd-4` means a different thing in any branch not
   rebased.
2. **Append them out of order** (`s9: 8px`, `s10: 12px`). No migration, no renumbering, and a
   ladder whose numbers no longer sort by size, which is its own kind of lie.
3. **Rule that 8px and 12px are not wanted**, and snap the 162 uses to 6/10 and 10/16. Keeps
   the modular scale pure and moves 162 real spacings by up to 4px each, which is a visible
   change across every dense surface.
4. **Name spacing by ROLE rather than by number**, the way type now is, so the question of what
   number a step has stops mattering. Biggest change, and the only one that removes the class of
   problem rather than this instance of it.

**My recommendation is 4, arrived at second.** I went in expecting 1. What changed my mind is
that the type work this session showed the same shape: the failure was never that a stop was
missing, it was that nothing said which stop to use for what. A numbered ladder invites an
author to pick a number, and picking is the step that goes wrong. `gap-mrd-inline` between an
icon and its label, `gap-mrd-stack` between rows, `p-mrd-inset` inside a card would end the
argument permanently, and the 8px question answers itself as whatever `inline` turns out to be.

**If you want the quick win instead**, option 1 without the new steps is available today: the
332 exact matches convert with nothing moving, taking the design system from 21% to 67% on its
own scale, and leaving the 8px and 12px question open for later. That is safe, it is real
progress, and it does not prejudge your ruling. **Say the word and it is a single pass.**

## What is NOT affected

Type is done and needs nothing from this. The five roles in
[`M08`](./M08-meridian-has-text-roles-now-use-them.md) carry no spacing at all, deliberately: a
role says what a piece of text IS and never where it sits. So whichever way this goes, nothing
built on the roles has to change.

**LANE 1: keep using `p-mrd-*` and `gap-mrd-*` where a step fits, and where one does not, use
the Tailwind value and do not invent an arbitrary pixel.** Do not try to fix this yourself; it
is one ruling away from being a much smaller job.
