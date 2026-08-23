# ANS-M08: Meridian has TEXT ROLES now. Use them, and stop assembling sizes

**Verdict:** confirmed
**Answered:** 2026-08-23T05:45:00+05:30
**Raised by:** nobody. MAIN LANE, on a founder instruction to fix the design system itself.

**Read this before you port a single surface.** It changes what "port to Meridian" means, and
it lands mid-flight in your Wave plan on purpose: the founder's reason for ordering it was that
if you port every surface onto a flawed Meridian, the flaw becomes the whole platform.

## What was actually wrong, measured

The founder said text is dumped with no distinction between header, subtext and status. He was
right, and the cause was structural rather than sloppy authorship.

**Meridian's 13 type stops each set `font-size` and nothing else.** That is correct for a
ladder. But a reader perceives hierarchy from size AND weight AND colour moving together, so
every author had to choose three things independently: one of 13 sizes, one of 60 colours, one
of 4 weights. Roughly three thousand combinations, nothing marking which are right.

Measured across the 47 Meridian components before this pass:

| | before | after |
| --- | --- | --- |
| hard-coded `text-[Npx]` | 259 | **157** |
| elements declaring `font-size` twice | 57 | **0** |
| headings rendering at or below body size | 9 of 16 | **0** |
| Tailwind default animations | 1 | **0** |

**And the worst of it: 35 deliberate sizes were never reaching the screen.** Every
`@utility text-mrd-*` rule is emitted AFTER every arbitrary `text-[Npx]` rule in the built
stylesheet (measured in `.output`: arbitrary 50292 to 50941, utilities 50971 to 51366). Both
set `font-size`. So on any element carrying `text-[11px]` beside `text-mrd-prose`, **the
utility wins and the typed size is discarded**, deterministically.

Authors had written `text-mrd-prose text-mrd-body` side by side believing both were colours.
`prose` is a size. So a 10.5px mono label, an 11px table figure and a 12.5px control label were
all rendering at a flat 14px. `FilterTable`'s chip was worse: the size sat in the base string
and `prose` in the active branch, so it rendered 10.5px until you selected it and 14px after.

## The five roles

```
mrd-eyebrow    nano 10px   / 650 / mute / tight / uppercase, tracked
mrd-title      h3   20px   / 500 / ink  / tight
mrd-subtitle   prose 14px  / 600 / ink  / snug
mrd-copy       prose 14px  / 400 / body / prose leading
mrd-meta       small 12px  / 400 / mute / snug
```

Each carries size, weight, colour and leading as **one decision**. A caller names the role and
cannot get the combination wrong, because there is no combination left to get wrong.

**The rule they encode, and this is the part to internalise:**

> **ADJACENT STOPS ARE FOR DENSITY, NOT FOR HIERARCHY.** 12px beside 12.5px is a table that
> needed to fit, not a heading above a caption. Two roles a reader must tell apart **without
> reading** differ on at least TWO axes.

`mrd-subtitle` is deliberately the SAME SIZE as `mrd-copy` and separates on weight (600 v 400)
and colour (ink v body). A third heading size between 20px and 14px would sit 2px from a
neighbour, which is the exact failure being fixed. **Weight at 600 against 400 is visible at a
glance and survives greyscale; two pixels does not.**

## How to use them

```tsx
// before, and this is the shape that was wrong
<h2 className="text-mrd-lead leading-snug font-medium text-mrd-ink">{title}</h2>
<p className="mt-mrd-3 text-[13px] leading-relaxed text-mrd-prose text-mrd-body">{body}</p>
<p className="mt-mrd-3 text-[12.5px] leading-relaxed text-mrd-mute">{detail}</p>

// after
<h2 className="mrd-title">{title}</h2>
<p className="mt-mrd-3 mrd-copy">{body}</p>
<p className="mt-mrd-3 mrd-meta">{detail}</p>
```

**Spacing, width and layout stay on their own classes.** A role says what the text IS; it never
positions it.

**When NOT to use a role.** A page's own title is a heading, not a block role: `text-mrd-h1`
and `text-mrd-h2` still serve it. And dense table text that genuinely needs a specific stop
(an 11.5px figure column) takes the stop directly, `text-mrd-data`, with its colour beside it.
The roles describe text inside a block: a card, a panel, a dialog, an empty state.

## Two things you must not do

1. **Never put a `text-mrd-*` size utility beside a `text-[Npx]` on the same element.** The
   utility silently wins. If you see one, the fix is to keep the size the author meant and
   delete the other, which is what this pass did 35 times.
2. **Do not invent a sixth role.** If a surface seems to need one, file a `meridian-gap`
   request. The whole point is that the set is small enough to hold in your head.

## What changed under you, so nothing surprises you

`src/components/meridian/**` and `src/styles/meridian.css` are MAIN LANE's until `STATUS.md`
releases them. Landed in `0e267390b`, `971645bf2`, `6521b2cf0`:

- Five role utilities added to `meridian.css`.
- 48 call sites moved onto roles; 35 discarded sizes restored onto the ladder.
- **`AgentPulse`'s lattice is INK, not azure**, on a founder ruling. The guard that forbade it
  is inverted rather than deleted, so the decision stays enforced in its new direction. Azure
  stays wherever it separates a machine from a person on the same glyph family (`marks.tsx`
  `running` against `gate`, `StatusChip`, `InsightCards`).
- **`AgentStatusIndicator.tsx` is deleted.** Imported once, rendered nowhere, held the only
  Tailwind default animation, and had no elapsed figure. If you were planning to use it, use
  `AgentPulse` or `LoadingState`.
- Dialog's title was `text-[14px]` above a 14px body. It is `mrd-title` now.

**Gates on the merged tree at `6521b2cf0`:** `tsc` 0 · `bun test` 10,626 pass / 0 fail across
627 files · `docs:check` 0 · **ratchet unchanged at 3,170**, which is the point: none of this
was retired vocabulary, which is exactly why the ratchet never saw any of it. See
[`M04`](./M04-the-ratchet-cannot-see-the-founders-pain-point.md).
