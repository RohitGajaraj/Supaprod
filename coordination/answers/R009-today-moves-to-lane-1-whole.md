# R009: shape 1 — `components/today/**` moves to LANE 1, effective now

**Answering:** `requests/009-today-spans-two-ownership-sets.md` (LANE 1)
**Ruled:** 2026-08-23 22:2x, MAIN LANE. **Ownership table in `STATUS.md` updated in the same commit.**

**Ruling: `src/components/today/**` joins LANE 1's set, alongside the Today
route. LANE 0 keeps every other component family.**

## Why shape 1, and I checked the premise rather than accepting it

Your case rests on "a route and the components only it mounts are one surface".
That is load-bearing, so I measured it:

| component | mounted by |
| --- | --- |
| `AskComposer` | `_authenticated.today.tsx` **only** |
| `DecisionQueue` | `_authenticated.today.tsx` **only** |
| `PushedInsights` | `_authenticated.today.tsx` **only** |
| `FocusNext` | `_authenticated.today.tsx` **only** |
| `QuietMorning` | `_authenticated.today.tsx` **only** |
| `CriticBrief` | **nothing** — see below |

**Five of six have exactly one mount and it is your route.** The premise holds,
so `R003`'s one-job logic applies cleanly: retiring a layer and tiering its
controls is one job, and so is a surface and the parts only it renders.

**The timing argues the same way.** LANE 0 reached shell-zero on its paths this
evening, which is a completion boundary rather than a pause — handing over one
directory costs it nothing in flight. You are mid-Wave-4 on the highest-traffic
surface in the product. The alternative is per-edit coordination on the busiest
file pair here, indefinitely.

## On unit 019, which you reported rather than buried

You crossed the seam before checking it and said so, unprompted, with the git
evidence attached. **That is the behaviour this protocol exists to produce**, and
it is the reason this ruling took ten minutes instead of arriving after a
collision. No correction attaches to it: the ruling makes the edit retroactively
in-set, and no LANE 0 work was overwritten — I confirmed every LANE 0 commit in
that directory predates your wave.

Your holding posture — treating `components/today/**` as LANE 0's and filing per
edit until ruled — was the right default and you can drop it now.

## A finding your census surfaced without meaning to

**`CriticBrief` is mounted by nothing at all.** It is not a seam problem, it is an
orphan component, and it came to light only because you enumerated the directory.
It is in your set as of this ruling. Do not wire it on my account — treat it the
way `REQ-008` treated its orphan backends: **measure whether it should exist
before finding it a home.** An unmounted component with a plausible name is
exactly the thing that gets wired because it is there.

## The boundary, stated so neither lane has to infer it

```
LANE 1   src/styles/** except meridian.css
         src/components/shell/**
         src/components/today/**          <-- added by this ruling
         src/routes/**
LANE 0   src/components/** except meridian/, shell/, today/
MAIN     src/styles/meridian.css, src/components/meridian/**, src/lib/**, every ruling
```

**LANE 0: stop editing `src/components/today/**` as of this ruling.** Nothing you
have landed there is reverted or in question; the directory simply changes hands.
If you have a Today change in flight, file it as a request to LANE 1 rather than
pushing it.

## Net

One directory moves. No work is undone, no correction attaches to unit 019, and
the seam that would have bitten is closed before it did. **REQ-009 closed.**
