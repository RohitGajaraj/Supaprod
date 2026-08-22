# ANS-M04: The ratchet cannot see the founder's number one pain point, and 95% of the fix is a lookup table

**Verdict:** partial
**Answered:** 2026-08-23T04:14:00+05:30
**Raised by:** nobody. MAIN LANE, re-measuring the premise the brief rests on.

**Read this before WAVE 1.** It confirms the brief's conclusion, corrects three of its
numbers, and changes what you should measure and in what order.

## The brief's conclusion is right, and now it is measured rather than asserted

> "Meridian ALREADY has 14 type steps and a full status family, so it is an **adoption
> failure, not a design-system gap**."

**The conclusion holds.** The system is rich and under-used. Three corrections to the numbers,
because you will reach for them:

| Brief says | Actually | Why it matters |
| --- | --- | --- |
| 14 type steps | **13** | The 14th, `--mrd-t-body`, was renamed to `--mrd-t-base` on 2026-08-21. Only comments mention it now. Asking for it back re-opens a closed fix. |
| status family is pass/fail/hold/agent/**stop**/you, each with `-chip` and `-on-chip` | **five** status words, each with base/chip/on-chip. `--mrd-stop` is **not a status** | meridian.css:495 is explicit: "a chip wears one of the five status words... `--mrd-stop` has no chip **because a control is pressed rather than reported**." It paints an INTENT. |
| `styles.css` 703 + `primitives.css` 279 + `ink.css` 190 = 37% | **exactly right**: 1,172 of 3,170 | Verified against the baseline's per-file counts. |

**Do not build a "stop chip."** It is not a Meridian gap, it is a category error, and building
it would widen the system in the one direction its own colour law forbids. If you need to show
a halted run as a *state*, that is `--mrd-fail` or `--mrd-hold`. `--mrd-stop` is for the button
that halts it.

## The finding that changes the work order

**The ratchet does not measure typography.** `RETIRED_MARKERS`
(`src/__tests__/meridian-ratchet-scan.ts:180`) counts exactly these: `--sp-`, `--ds-`,
`--text-`, `--hairline`, `--madder`, `--glacier`, `--font-pixel`, `--raised`, `data-obsidian`,
retired-module imports and usage, retired class names, and raw colours.

**Tailwind sizes are not on that list.** `text-[13px]`, `text-sm`, `text-xs` are invisible to
it. So a file can score zero on the ratchet and still mix four type scales, which is precisely
the founder's complaint, and the run's headline metric cannot see it.

**Proof, and it is not a corner case.** The five worst type-mixing files are all **absent from
the ratchet baseline**, meaning perfectly clean:

| File | ratchet | hard-coded sizes |
| --- | --- | --- |
| `src/components/meridian/InsightCards.tsx` | **clean** | 25 |
| `src/components/meridian/surface-parts.tsx` | **clean** | 18 |
| `src/components/crew/CrewChrome.tsx` | **clean** | 15 |
| `src/components/meridian/ContextCards.tsx` | **clean** | 13 |
| `src/components/meridian/DiffTable.tsx` | **clean** | 11 |

**Four of those five are Meridian's own components.** The design system's components mix type
scales, and every surface composes from them. Porting the three CSS files first will not reach
this, because this debt is not in the stylesheets.

**How wide it is**, across `src/components` and `src/routes` (488 `.tsx` files):

```bash
# files speaking Meridian's scale
grep -rl -E '\--mrd-t-|text-mrd-' src/components src/routes --include='*.tsx' | wc -l   # 126
# files speaking a rival scale
grep -rlE 'text-\[[0-9]+px\]|--text-|\btext-(xs|sm|base|lg|xl|2xl|3xl)\b' \
  src/components src/routes --include='*.tsx' | wc -l                                   # 171
```

| | files |
| --- | --- |
| Meridian's scale only | 48 |
| **both scales in the same file** | **78** |
| rival scale only | 93 |

More files speak a rival scale than Meridian's, and 78 speak both at once. **That is the
mechanism behind "text randomly dumped"**: not an absent scale, but two scales arguing inside
one component.

## The part that makes this a night's work rather than a month's

Every hard-coded pixel size in the tree, against the 13 steps that already exist:

```bash
grep -rhoE 'text-\[[0-9]+px\]' src/components src/routes --include='*.tsx' | sort | uniq -c | sort -rn
```

| hard-coded | count | existing step | verdict |
| --- | --- | --- | --- |
| `text-[13px]` | 150 | `--mrd-t-base: 13px` | exact duplicate |
| `text-[12px]` | 137 | `--mrd-t-small: 12px` | exact duplicate |
| `text-[11px]` | 83 | `--mrd-t-tiny: 11px` | exact duplicate |
| `text-[10px]` | 51 | `--mrd-t-nano: 10px` | exact duplicate |
| `text-[20px]` | 13 | `--mrd-t-h3: 20px` | exact duplicate |
| `text-[14px]` | 9 | `--mrd-t-prose: 14px` | exact duplicate |
| `text-[17px]` | 7 | `--mrd-t-lead: 17px` | exact duplicate |
| `text-[25px]` | 5 | `--mrd-t-h2: 25px` | exact duplicate |
| `text-[32px]` | 2 | `--mrd-t-h1: 32px` | exact duplicate |
| `text-[9px]` | 12 | none, below `nano` | **a real question** |
| `text-[15px]` | 5 | none, between `prose` and `lead` | **a real question** |
| `text-[52px]` | 3 | none, above `display` | **a real question** |
| `text-[34px]` | 2 | none, between `h1` and `display` | **a real question** |
| `text-[8px]` | 1 | none | **a real question** |

**480 hard-coded sizes. 457 of them, 95.2%, are re-typing a value the scale already defines
exactly.** That portion is a mechanical substitution with a lookup table, not a design
exercise, and it is the single highest-value pass available tonight.

**The other 23 are the only real design questions in the whole typography problem**, and they
are worth your judgement rather than a rule:

- **`8px` and `9px` sit below `--mrd-t-nano: 10px`**, which the scale calls "uppercase
  micro-label, always at weight 650". Anything smaller is almost certainly a legibility bug
  rather than a missing step. My ruling: **round them up to `nano`** unless you can show a
  surface that genuinely needs 9px, in which case file it and I will adjudicate.
- **`15px` between `prose: 14px` and `lead: 17px`, and `34px` between `h1: 32px` and
  `display: 40px`.** Both are almost certainly drift, not intent. Snap to the nearer step.
- **`52px`** is above `display: 40px` and appears 3 times. That is the one that might be a
  genuine gap, and it earns a token **only on the second caller** with a distinct meaning. If
  all three are one hero on one surface, it is a one-off, not a step.

## What I recommend you measure instead

The ratchet stays the run's headline metric and must keep going down. But it will not move
when you fix the founder's actual complaint, and a night that fixes hierarchy could show a
flat ratchet and read as no progress.

**Add this as a second number in each unit file.** It costs one command and it is the one the
founder would recognise:

```bash
grep -rhoE 'text-\[[0-9]+px\]|--text-[a-z0-9-]+|\btext-(xs|sm|base|lg|xl|2xl|3xl)\b' \
  src/components src/routes --include='*.tsx' | wc -l
```

**Tonight's opening value: 873.** Every unit that ports a surface should move it down, and it
should reach roughly 416 once the 457 exact duplicates are substituted.

## What this changes

**The WAVE 1 order in the brief is right for the ratchet and wrong for the pain point.** Both
are worth doing; they are different debts and they do not overlap:

- `styles.css` / `primitives.css` / `ink.css` hold **1,172 retired-vocabulary occurrences** and
  no Tailwind sizes at all. Porting them moves the ratchet and fixes colour and spacing.
- The **873 rival size references live in `.tsx` files**, four of the five worst inside
  `src/components/meridian/`. Porting the stylesheets does not touch one of them.

**My recommendation: do the Meridian components first, not the stylesheets.** The brief's own
argument for stylesheets-first is "fix those FIRST or you fight them on all 222 files", and
that argument applies with more force to the component layer: every surface renders
`InsightCards`, `surface-parts`, `ContextCards`, `DiffTable` and `RecordsTable`, so fixing
those five files changes what every screen looks like, while fixing `styles.css` changes what
the retired layer underneath them looks like. **If you disagree, say so in a unit file and
carry on** — you are the building lane and you can see the surfaces; I am reading counts.

**Nothing here needs undoing.** No unit exists yet.
