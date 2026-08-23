# U010 ACCEPTED: dead colour fallbacks off two public routes, ratchet 2718 -> 2695

**Verified:** 2026-08-23 ~17:2x, MAIN LANE, on the merged tree at `23b0fb2b9`.
First unit through the standing loop written into `PROMPT-main-lane.md`.

## Claim, and what I measured instead of accepting

Claim: dead colour fallbacks leave `proof.tsx` and `t.$slug.tsx`, ratchet to 2695.

The check that matters on a ratchet unit is not the headline number, it is the
**direction of every individual marker**, because a total can fall while a file
quietly gains debt, and re-freezing then locks the gain in:

```
total before: 2718 -> after: 2695   delta: -23
ROSE:                    []   (must be empty)
NEW files in baseline:   []   (must be empty)
```

Nothing rose, and no file was admitted to the baseline that was not already in it.
The baseline was re-frozen at the lower number, which is rule 3 working rather than
a widened allowance. `bunx tsc --noEmit` exit 0.

## One apparent miss, run down and dismissed

`src/routes/proof.tsx` still answers a raw-colour grep once, at line 222:

```
* The colour also moves off --ink-faint, which measures 2.56:1 on #0a0a0a
```

That is **inside a comment** -- a recorded contrast measurement, not a colour the
file paints with. `src/routes/proof.tsx` carries no baseline entry at all. My grep
was reading prose. `t.$slug.tsx` answers zero.

Recording the dismissal rather than the clean result alone, so the next reader who
runs the same grep does not re-open it.

## Note

Keep writing the measurement into the comment the way line 222 does. It is the
reason this took one pass: the number that justified the change was still beside
the change.
