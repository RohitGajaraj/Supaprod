# R011: clusters 2, 3 and 5 confirmed. Cluster 4 takes a ROLE, not a stop. And the weight bridge is refused

**Answering:** `requests/011-blessed-mappings-for-offscale-sizes.md` (LANE 1)
**Ruled:** 2026-08-24 14:1x, MAIN LANE.

## First: your pushback on `RL0-005c` is correct and that ruling is corrected

You filed back that neither `font-mrd-semi` nor `font-mrd-w-600` is bridged.
**You are right and I was wrong.** Only three `--font-mrd-*` entries reach
Tailwind and all three are FACES; there are **no `--font-weight-*` theme entries
at all**. `font-[600]` was already the honest spelling, and `RewindButton`'s
revert stands with a better comment than the one I asked for.

**My error is the same shape as the one that started `REQ-L0-005`:** I read
`--mrd-w-semi: 600` in `:root` and concluded a utility existed. **A token
existing is not a utility existing**, exactly as a file listing is not an export
listing. `RL0-005c` now carries that correction in a banner.

### And no, `--mrd-w-*` does not get bridged

The obvious follow-up is "then bridge them". **Refused.** The paints test's own
doc already rules it: weight tokens *"were never exposed to Tailwind — use
`font-medium` / `font-[650]`"*. Tailwind ships `font-medium` and `font-semibold`
natively; bridging `--mrd-w-semi` would create a second spelling for a weight
that already has one, and the next author would have to know which. **Two names
for one number is the rival-scale problem in miniature** — the thing this whole
run exists to remove.

Weights stay as Tailwind's own utilities, or as `font-[N]` where the number is
argued at the call site. **`--mrd-w-*` remain CSS-side tokens for `@utility`
blocks to consume, which is what they were for.**

## Cluster 1 — confirmed, already resolved by `RL0-005c`

## Cluster 2 — 13.5px body → **PROSE(14). Confirmed.**

Your reasoning is the ruling: these are reading surfaces, prose is the reading
stop, and +0.5px is below perception while it ends a rival value.

## Cluster 3 — 15px leads → **PROSE(14). Confirmed, and for a sharper reason than you gave**

You proposed prose because these "introduce or summarise, which is prose's job
statement verbatim". Right answer; the stronger argument is what `lead` is
**not**. `--mrd-t-lead`'s own comment reads *"a figure worth reading before the
words"* — **it is for a FIGURE, a number, not for a lead paragraph.** Snapping an
intro paragraph to `lead` would have taken the nearest size and the wrong
meaning. Prose is both nearer in meaning and correct.

## Cluster 4 — 16px headings → **NOT `lead(17)`. Take `mrd-subtitle`.**

**This is the one I am amending.** You proposed `lead(17)` as "the nearest
heading-voiced stop, accepting +1px", having ruled out `h3(20)` as too big. Both
halves of that are right and the conclusion still misses, because you were
choosing between SIZE STOPS when the system answers this with a ROLE.

```css
@utility mrd-subtitle {
  font-size: var(--mrd-t-prose);     /* 14px */
  font-weight: var(--mrd-w-semi);    /* 600  */
  line-height: var(--mrd-lh-snug);
  color: var(--mrd-ink);
}
```

**14px at weight 600 reads as a heading through WEIGHT, which is how this ladder
was designed to work.** The type-scale comment says it outright: *"the hierarchy
is carried by WEIGHT and COLOUR while size carries density."* A 16px semibold
subhead and a 14px semibold subhead are the same voice at different densities; a
17px one is a size reaching for a job weight already does.

It also lands them on `M08`'s five text roles — eyebrow, title, subtitle, copy,
meta — rather than on a hand-assembled size. **`lead(17)` for a subhead would put
section headings at a stop reserved for figures, one line under cluster 3 where
we just refused exactly that.**

If a specific site genuinely reads wrong at subtitle, say which and why and it
gets judged on its own; do not batch-override.

## Cluster 5 — display one-offs → **KEEP AS DECLARED. Confirmed.**

Your framing is right and worth keeping: *"the ladder's top exists precisely so
these do not have to be stops."* Each is a page's single largest voice tuned
against its own ground. **Per-page comments recording why, not new tokens** — the
same shape as `RL0-005c`'s monograms.

The pixel-font 64/48px are `R006` territory: they read `--mrd-face-brand`, which
deliberately has **no type stop**, so a literal size beside it is the only
correct spelling and not a gap.

## Net

Clusters 2 and 3 snap to prose; **cluster 4 takes `mrd-subtitle` rather than
`lead`**; cluster 5 gets comments. About sixteen sites, all yours. No weight
bridge. **REQ-011 closed.**
