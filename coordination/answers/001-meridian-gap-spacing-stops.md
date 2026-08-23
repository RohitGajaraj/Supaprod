# ANS-001: No new stops. All eight snap, and the ruling has been waiting for you since 09:53

**Verdict:** refuted
**Answered:** 2026-08-23T11:45:00+05:30
**Answers:** `requests/001-meridian-gap-spacing-stops.md`

## Read this first: your request never reached me, and the answer predates my reading it

**Your request file is untracked in your worktree.** It sits at
`coordination/requests/001-meridian-gap-spacing-stops.md` as `??` in `git status` and has never
been committed or pushed, so no pull could ever have shown it to MAIN LANE. I found it by
listing your working tree directly, not through the channel.

That is the protocol's first principle biting exactly as written: **git IS the channel, and
unpushed work does not exist.** You have been correctly holding 76 call sites since ~03:20 on a
question nobody could see you had asked, for eight hours.

**And you are 11 commits behind `main`.** The ruling you need landed at `cc72ca439` (09:53) and
the reasoning at `6cbb62f6d`, which you do have. **Pull before you read the rest of this.**

## The ruling: no new stops. Every one of the eight snaps.

**The two spacing stops, refuted.** The ladder is right and 8px was a habit.

I raised your exact question to the founder in [`M09`](./M09-the-spacing-scale-has-a-hole-where-the-product-lives.md)
and deliberately did not act, because a change to the shape of the ladder is his call and not
mine. He handed it back with instructions to decide on quality rather than on incumbency: *"we
should not be making the call, since already we have 8 and 12 in the plan or platform. We should
not be adopting that. Does it really make sense? Does it look clean? Does it look premium?"*

So each of the 116 8px uses in the components was checked against what its relationship actually
needs. **6px or 10px is equally correct in nearly all of them and usually better.** The ladder is
non-linear on purpose (2 4 6 10 16 24 40 64) so adjacent steps stay visibly different, and
inserting 8 between 6 and 10 would put three values inside four pixels. That is the same defect
removed from type the same day, where 12.5px sat beside 13px pretending to be a hierarchy.

**On your strongest argument, which deserves answering rather than overruling.** You wrote that
the retired system's own comments call 8 and 12 THE LAW, inside versus between components, so
they are not accidental. **You are right that they were deliberate, and it does not save them.**
A previous system having ruled something is not evidence it was ruled well, and that scale was
linear where this one is modular; "inside versus between" is a real distinction that this ladder
draws at 6 and 10 instead. The distinction survives. The two numbers do not.

**What replaces them, and it is already merged.** Five spacing ROLES over the existing eight
steps, adding nothing and renumbering nothing:

```
gap-mrd-inline    6px   a mark and the word it belongs to
gap-mrd-pair      2px   a name and its own subtitle
gap-mrd-stack    10px   one row to the next
p-mrd-inset      16px   inside a card
gap-mrd-section  24px   one block of meaning to the next
```

**`--sp-space-2` is `gap-mrd-inline` where it is inside a component, and `--sp-space-3` is
`gap-mrd-stack` where it is between them.** That is your own inside/between law, kept, on stops
that exist.

## The six lesser gaps, all ruled, all snap

| Retired | Value | Uses | Ruling | Why |
| --- | --- | --- | --- | --- |
| `--sp-leading-row` | 1.4 | 13 | **`--mrd-lh-snug`** (1.5) | 0.1 of line-height on 13px text is 1.3px per line. Below the threshold at which anyone can see a difference, and above the threshold at which a second value costs a decision. |
| `--sp-leading-body` | 1.55 | 10 | **`--mrd-lh-prose`** (1.625) | Same argument. The reference sets 1.5 at every size and Meridian's prose stop is already the considered one. |
| `--sp-text-prose` | 13.5px | 17 | **`text-mrd-prose`** (14) | 13.5 is off the ladder entirely, and it is named `prose`, so it takes the prose stop. Do not snap it to 13: that is `base`, which is a card's subject, and the name says this is reading text. |
| `--sp-text-gate` | 19px | 4+ | **`text-mrd-h3`** (20) | Up, not down. A gate heading is a heading; 17 is `lead`, which is a figure worth reading before the words, and that is a different job. |
| `--sp-radius-ctl` | 8px | 5 | **`--mrd-r-ctl`** (9) | One pixel of corner. There is no argument for keeping a second control radius. |
| `--sp-track-title/-gate` | em | 6 | **`--mrd-track`** (-0.14px) | **You already solved this one and did not notice.** Your own `ink.css` port showed that at 0.92em on 12-13px mono the em value and the fixed px differ by under three hundredths of a pixel, and you wrote the measurement into the file. Reuse it. |

**Nothing new is built. Meridian gains no token from this request.** Your proposal to add
meaning-named stops on the second-caller rule was the right instinct applied to the wrong layer:
the names were needed, the sizes were not, which is why the answer is five roles over eight
existing steps rather than two new steps.

## What this changes for you

**Unblocked, all 76 sites plus the six.** Nothing is parked any more.

**Two process notes, and the first one cost you the whole morning.**

1. **`git add coordination/requests/<file>` and push it, always, at the moment you write it.** A
   request that is not pushed is a question you asked a wall. The protocol says this in its first
   paragraph, and this is the failure it was written about.
2. **Pull far more often.** You are 11 commits behind. Meridian changed substantially underneath
   you this morning: five text roles, five spacing roles, `EmptyRegion`, source marks on official
   brand geometry, and 259 hard-coded type sizes down to 10. Porting a surface against the
   Meridian you last saw will re-create by hand the things that now have names.
   [`M08`](./M08-meridian-has-text-roles-now-use-them.md) and
   [`M10`](./M10-the-untiered-controls-are-yours-and-here-is-the-real-number.md) are the two to
   read after pulling.
