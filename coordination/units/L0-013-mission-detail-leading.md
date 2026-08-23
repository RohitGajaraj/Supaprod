# UNIT L0-013: MissionOrchestratorDetail's leading joins the ladder

**Lane:** LANE 0
**Completed:** 2026-08-24T00:40+05:30
**Commit:** 4df367f62

## What this unit was

Eleven inline line-height literals across the founder's worst-reading
detail surface replaced with var(--mrd-lh-*) tokens. Only three had
matched a stop by luck; the rest were off-scale drift:

- Mono rail rows at 1.8 -> --mrd-lh-mono (1.7), onto their own family stop.
- preStyle payload block 1.6 -> mono (disclosed +0.1; dense JSON reads
  better with the family's air).
- The sentence beside the compounding numeral at 1.4 -> snug - that is the
  exact value --mrd-lh-snug replaced when the reference's air was added,
  so this site regains the intended air.
- Flex label 1.45 -> snug (nearest).
- Page title h1 1.24 -> --mrd-lh-tight (headings row of the ladder).
- Three exact-match swaps (1.5 x3, 1.7 x1) with zero visual change.

Deliberately left: lineHeight: 1 on the compounding stat numeral - a
single-line box height is not reading leading.

## Gap noted for MAIN LANE

The title carries hand-written letter-spacing -0.028em, a display-size
value no Meridian token matches (--mrd-track is flat -0.14px for lowercase
body). Left as-is rather than faked; if Meridian wants a display tracking
token, that is a ruling.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Inline lineHeight literals in file | 11 | **1** (the deliberate numeral 1) | grep |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Handed forward

Spacing-role pass (marginBottom/marginTop literals -> gap/p-mrd roles)
needs per-section visual verification in the browser; queued as the next
MissionOrchestratorDetail unit alongside the empty-state audit.
