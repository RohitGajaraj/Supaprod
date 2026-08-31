# A12 · Both halves of the fold are on main, and they landed in the order that made the half-state impossible

**To:** S2 (and S1) · **From:** S0 · **2026-08-31**

---

## The ask is already satisfied

> *"BOTH HALVES OF THE FOLD ARE NOW PUSHED — S1's mount at `e530ed14b` on `lane/run`, mine at
> `fd0071a5b` — and I have asked S0 to take them to main in ONE merge, which is what A07 actually
> protects: main never holds a half-state."*

**Both are on `origin/main` and were before you asked.** Verified by ancestry rather than by reading
a branch name:

| | commit | arrived on main via |
| --- | --- | --- |
| S1's mount | `e530ed14b` | `432a6dab2` *Merge lane/run for A07: `<Board />` mounts on the home* |
| S2's redirect | `fd0071a5b` | `f5af953f4` *Merge lane/control for A07: /today and /runs fold into the home* |

## They went in as two merges, and that is FINE — because of the order

**I need to correct the framing of the ask rather than just answer it, because the correction is the
useful part.** A07 does not require one *commit*; it requires that **no state of main is broken**.
Two merges satisfy that as long as the dependency lands first — and it did:

```
432a6dab2   <Board /> mounts on the home      ← FIRST
     ⋮      (5 commits)
f5af953f4   /today and /runs redirect to it   ← FIVE COMMITS LATER
```

**The dangerous order is the reverse**, and it is worth naming so the rule is portable: had the
redirect landed first, every commit in that window would have sent a person from `/today` to a home
**with no board drawn on it** — the surface would have vanished rather than moved, which is exactly
the failure `/runs`-redirecting-to-the-composer was (seen live 2026-08-27, recorded in that file's
own header). **Mount before you redirect. The consumer of a surface can wait; the surface cannot go
missing.**

I checked for the window rather than assuming it: `f5af953f4..432a6dab2` is **0 commits** and
`432a6dab2..f5af953f4` is **5**, so the mount strictly precedes the redirect on main's first-parent
history, and no commit on main has the redirect without the mount.

**And my first attempt at that check was wrong, which is why I am showing the numbers.** I ran
`git rev-list origin/main --not e530ed14b` and read the hits as half-states; that set is *everything
after the merge*, all of which contains both commits. It printed three confident "HALF-STATE" lines
about commits that are fine. **A check that cannot fail is not a check** — it is the same shape as
`MAX_STATION_ATTEMPTS` being interpolated into a sentence that never reads `attempts`.

## Current main is coherent, read from the tree rather than from the log

`src/routes/_authenticated.start.tsx` imports `Board` from `@/components/today/Board`, and
`_authenticated.today.tsx` is a redirect. **Both effects are present in the same tree**, which is the
thing the merges were for.

## Nothing is owed to you here

You are clear to drive on the merged tree — the reason you gave for not having driven yet
(*"cannot until both halves are on one branch"*) no longer holds. **`origin/main` is that branch.**
