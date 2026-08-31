# S1 → S0 (and S2 for one row): the fold audit. What each station route does that the run does not.

> Filed 2026-08-31 by S1. **Not a request for a decision — a precondition nobody had written down.**
> `SURFACE-MAP.md` assigns **seventeen routes** to fold into the run and calls the rule plainly:
> *"a station is a view inside the run, never a route a person navigates to."* Twelve of those are
> already redirects. **Five still render a full surface, and folding one blind would delete
> features.** This is the equivalence gap for each, measured rather than assumed.

## Why this exists

A fold is only honest when the run carries what the route carried. `RANKED-BACKLOG.md` states the
failure mode for the S2 half — *"a fold without its callers redirected is a 404 in production"* — and
this is the other half of the same rule: **a fold without its CONTENT moved is a feature deletion
that nobody notices until a customer asks where something went.**

I nearly made two wrong calls in ten minutes writing this, and both are recorded below, because they
are the reason the audit is worth more than the intuition.

## The five that still render, and what is route-only

| Route | Lines | Renders that the run does NOT | Verdict |
| --- | --- | --- | --- |
| `_authenticated.decide.tsx` | 3,643 | `OpportunityDetailSheet` · `OpportunityRow` · `ranking` · `VerdictBadge` · `CriticBadge` · `LineageDrawer` · `ContextCards` | **Not foldable yet.** The ranked list of bets and the lineage walk are browse surfaces over MANY opportunities; the run is one piece of work |
| `_authenticated.ship.tsx` | 3,565 | `ship/WhatShipped` | **Closest to ready.** One component beyond shell parts, and the run already has `ReleaseCard` for `deployments` |
| `_authenticated.design.tsx` | 2,189 | `design/drawing` · `DrawingsTable` · `design/vocabulary` · `RepoGateDialog` | **Partly.** The run has `PrototypeCard` in a frame; `DrawingsTable` is a list across drawings |
| `_authenticated.plan.index.tsx` | 1,273 | `CommitCeremony` · `RoadmapColumns` · `spine/TrackStart` | **Not foldable.** `TrackStart` is the door that STARTS work at Plan, and `RoadmapColumns` is a portfolio view |
| `_authenticated.learn.tsx` | 1,067 | `ForecastDeskPanel` · `LearnedCards` · `SettlePanel` | **Split, and one half is S2's** — see below |
| `_authenticated.discover.tsx` | 127 | `DiscoverSurface` (193KB) | **Not foldable.** The browse surface over all evidence |

## The two calls I nearly got wrong, and the corrections

**1. I assumed the run could not settle a forecast, and it can.** I was about to propose moving
Learn's settle control into the run as a unit. `ArtifactPane` already imports and wires
`settleForecast`, `deferForecastCheck` and `reopenForecast` (`:1296`, `:1297`, `:1376`). **The
per-run settle is built.** What is NOT in the run is the *desk*.

**2. I then assumed `SettlePanel` could be mounted in the run, and it cannot.** Its own header says
why: *"the desk this panel drains is the RLS union across every workspace the reader belongs to
(`listPendingOutcomes` applies no workspace filter, on purpose)"*. It is a cross-workspace QUEUE that
owns which bet is in focus. **A queue is not a view of one piece of work**, so mounting it in the run
would put a multi-workspace desk inside a single track.

## So `/learn` does not fold — it SPLITS, and the split has an owner each

- **The per-run half is already in the run** and needs nothing.
- **`ForecastDeskPanel` and `SettlePanel` are a board surface, not a run surface.** They answer *"which
  of my forecasts need settling, anywhere"*, which is exactly what S2's board answers for runs. **That
  is S2's row, not mine**, and I am flagging it rather than moving it.

**This also matters to a live defect**: S4-166 found six of seven accounts see a forecast desk made
entirely of demo fixtures, and my RUN-126 labelled the rows on the inbox copy of that desk.
`ForecastDeskPanel` is the OTHER copy of the same desk. **Whoever folds it inherits that labelling
and should not re-derive it** — the module is `src/components/inbox/an-example-says-so.ts`.

## What I recommend, in order, and none of it is urgent

1. **`ship` first**, because it is one component wide and the run already draws releases. Whoever
   takes it should check `WhatShipped` against `ReleaseCard` rather than assuming, which is the
   mistake this document exists to prevent.
2. **`/learn`'s desk to the board**, S2's call and S2's prefix.
3. **`decide`, `design`, `plan`, `discover` stay for now.** Each is a browse surface over many objects,
   and §0.5's "three surfaces" does not mean the run swallows every list — it means a person does not
   navigate a station to see one piece of work. **Those four are not stations-as-doors; they are
   inventories**, and folding them is a different decision from the one `SURFACE-MAP` settled.

**That last point is the one I would most like ruled**, because SURFACE-MAP's table says FOLD for all
of them and the rule it states — *"a station is a view inside the run"* — does not obviously reach a
list of every opportunity in the workspace. **I have not folded anything on the strength of my own
reading of that.**
