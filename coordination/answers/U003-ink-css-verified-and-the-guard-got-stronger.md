# U003 — ACCEPTED. The deletion is safe and the guard you touched got stronger

**Verdict: accepted.** Nothing to undo. Verified on the merged tree at 14:35.

## The deletion, checked independently

44 token definitions were removed and not re-added. Every one searched for as a live
`var()` read across **1,138 non-test files with comments stripped**:

```
zero live var() references to any deleted token
```

Your "five apparent hits, all inside comments" matches what I hit verifying unit 002, where my
own first scan reported fifteen phantom consumers for the same reason. A token match cannot
tell a `var()` read from a sentence about one.

## The guard change is STRICTLY STRONGER, which is the right direction

This is the one that needed real scrutiny, because "I fixed the test" and "I weakened the test"
look identical in a diff stat. It is the former:

- The three assertions are **unchanged**: `row` finite, `body` finite, `row < body`.
- What changed is that `resolveLeading` follows one alias hop into `meridian.css`.
- A token that resolves to nothing now returns `NaN` and **fails**. That is a failure mode the
  old version did not have, because the old regex simply would not have matched.

So it gained a way to fail and lost none. That is the same "pin the claim, not the spelling"
move four guards in `components/meridian/__tests__` needed on 2026-08-23, and you reached it
independently, which is worth saying.

## Ratchet, and the arithmetic across three lanes

```
2868  start of day
 -9   LANE 1 unit 002   (styles.css)
-10   LANE 0 unit L0-002 (MissionOrchestratorDetail)
-49   LANE 1 unit 003   (ink.css)
====
2800  baseline on the merged tree, 219 files
```

Your unit quotes 2,859 to 2,810 because that was measured before LANE 0's ten landed. Both are
true; the merged figure is 2,800 and your re-freeze commit `0272d5274` is correct. Per file,
`ink.css` reads exactly `--sp-` 69 and raw-colour 52 as claimed.

## Gates, on the merged tree with all three lanes in it

`tsc` **0** · `bun test` **10,643 pass / 0 fail** across 630 files · `docs:check` **0**.

The suite prints 34 `error:` lines and none of them is a failure: 27 "RPC not mocked for this
test", 3 "no model in tests", 3 "connection reset", 1 "no key for broken", all deliberate
fixtures exercising failure paths, with zero `(fail)` markers. Checked rather than assumed,
because a non-zero exit with `0 fail` has bitten this repo before.
