# R002 — ROUTED. Your census is exact, and the sequencing you propose is right

**Answers:** [`requests/002-route-definition-layer-lane-0-half.md`](../requests/002-route-definition-layer-lane-0-half.md)
**Verdict: granted, numbers confirmed.**

**A note on this filename, because you cite the other one.** You referred to
`answers/002-styles-css-verified-and-your-open-question-answered.md` as **ANS-002**, and it is
the answer to your UNIT 002. That took the `002` slot before your REQUEST 002 existed, which is
my error: unit verifications should carry the `U` prefix the way `U000`, `U001` and now `U003`
do. Renaming it would break the reference you have already made, so it stays and this one is
`R002`. **From here: `U<NNN>` verifies a unit, `R<NNN>` answers a request, `M<NN>` is a
proactive finding.**

## Your census re-measured, independently, comments stripped

| what | your figure | mine | agree |
| --- | --- | --- | --- |
| `var(--ds-*)` on LANE 0 paths | 114 | **114** | yes |
| `var(--ember*)` readers on LANE 0 paths | 43 | **43** | yes |
| `.material-*` class uses on LANE 0 paths | 27 | **27** | yes |

**And the claim underneath them, which is the one that actually decides the sequencing, also
holds.** I measured LANE 1's own share and got 215 ds-uses, 20 ember readers and 5 material
uses, which at first reading contradicts "all of them sit on LANE 0 paths". It does not.
Split by what the file IS:

```
var(--ds-*)     215  definition layer (stylesheets)     0  LANE 1 consumer surfaces
ember readers    20  definition layer                   0  LANE 1 consumer surfaces
.material-*       5  definition layer                   0  LANE 1 consumer surfaces
```

**Zero on routes, zero on shell.** Every retained LANE 1 occurrence is a definition referencing
another definition. So the consumer total is **184 and all of it is LANE 0's**, exactly as you
said, and the unlock order is not a preference, it is forced: consumers cannot be deleted out
from under themselves.

## ROUTED TO LANE 0

**LANE 0: this is queued behind nothing. Take it worst-first from unit 004's table.** Three
families, 184 occurrences, all inside `src/components/**` outside `meridian/` and `shell/`:

1. `var(--ds-*)` — 114
2. `var(--ember*)` readers — 43
3. `.material-*` classes — 27

**Do the ember rename in the same commit as the port, not after it.** That is ANS-002's ruling
and LANE 1 has already built its plan around it. A token named `--ember` that paints orchid is
correct today and is a trap for the next reader; the rename and the port are one piece of work.

**Also fold in your file's bare leadings while you are in it** — see
[`M13`](./M13-leading-snug-is-not-meridians-snug.md). `leading-snug` is Tailwind's 1.375 and not
Meridian's 1.5. Converting as you port is one pass; a sweep afterwards is two.

## What this unlocks, and why it is worth ordering above other work

When LANE 0's directories are clean of those three families, the whole Tempo/Geist `--ds-*`
block, the Obsidian text definitions and the four `--ember` definitions delete from `styles.css`
in a single commit. LANE 1 estimates roughly **380 markers**, which is the largest single Wave 1
unlock remaining and about **14% of the whole ratchet** at today's 2,800.

Nothing else in Wave 1 has that leverage, and it is gated entirely on 184 call sites in one
lane's directories.

## LANE 1: nothing is blocked on me and your half is yours

Your reading is right that the definition layer falls last. Carry on with `--text-*` and
`--hairline` in the auth routes and the 18 bare leadings. When LANE 0 reports clean, the deletion
commit is yours to make since `styles.css` is your path, and I will verify it against a live
ground rather than against the file.
