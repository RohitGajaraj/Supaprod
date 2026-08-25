# Unit 081b · primitives.css + today.css: the dead component families leave (104 → 73 selectors)

**Lane:** LANE 1 (own path) · **2026-08-25** · no dev server. Extends unit 081
to the style files its census covered second.

## What left, and the proof for each

Thirty selector names in primitives.css and one in today.css had **zero
occurrences in any ts/tsx (tests included) and no dynamic construction**
(partial-string greps: `sp-receipt-${`, `` `sp-more ``, template composition —
none). Cross-CSS readers checked before cutting, which saved one mistake:
`.sp-selbar-acts` was still targeted by today.css — and following that thread
showed the WHOLE selbar family is dead in both files (no element applies
`.sp-selbar` anywhere; the decide.tsx hit is a comment), so both sides went
together with the reasoning preserved in a removal note.

Families removed: the record lamp (`sp-record` + button + `sp-lamp` keyframes +
reduced-motion), the receipt's dead children (arrow/verb/time/what + the
failed-verb compound — `.sp-receipt` itself is LIVE and stays), `sp-row-marks`,
`sp-row-time`, `sp-cell-body`, `sp-acts-trailing`, `sp-field-label`, the
checkbox (`sp-check` + media), the switch (`sp-switch` + media), the more-menu
(`sp-more`/`-btn`/`-item`/`-menu`), `sp-gate-line`, `sp-line-label/control`,
`sp-row-action`, `sp-row-open`, `sp-cell-lead/sub`, and both selbar families.

**Kept deliberately:** `.sp-row[data-has-action="true"]` — the attribute IS set
by `meridian/rows.tsx:145` (MAIN's, live). The first script pass flagged it by
proximity; the grep saved it.

## Honest note: two instrument cuts, both repaired

The scripted block-remover mis-scoped twice: it ate a comment that described
the `.sp-check` tick, and it consumed the receipt media query's closing brace
(brace-depth check caught it: 185/184). Both repaired by hand against
`git show HEAD` before any gate ran. The final file is balanced (174/174) and
the diff was reviewed rule-by-rule rather than trusted.

## Ratchet (designed flow)

Re-frozen: `primitives.css --sp-` 134 → 117 · `class:sp-` 8 → 6. Running total
this session: **1536 → 1507** occurrences.

## Gates

Full `bun test` **11,185 pass / 0 fail** · `tsc` clean · post-sweep census: 0
truly-dead selectors remain in any lane style file. No rendered change: every
removed rule required a class no element applies.

## Census note for MAIN

`--sp-row-scan` and the other surviving `--sp-*` tokens in primitives.css are
alive and stay. The file's remaining debt is spelling, not existence — a port
onto Meridian tokens with per-surface verification, which is a porting unit,
not a deletion.
