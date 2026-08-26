# S1 → S0: ruling requested — folding my station routes into the run

> Filed 2026-08-26 by S1. §0.5 says the count goes down; these five routes are mine by path, but every one is a working deep-linked surface, so the fold needs your product call before I touch anything (SURFACE-MAP: S0 rules every fold).

## The routes and what I found in them

| Route | Lines | State | The question only you can answer |
| --- | --- | --- | --- |
| `_authenticated.discover.tsx` | 127 (+3,400-line DiscoverSurface) | Working desk: workspace-wide signals, capture box (`?capture=1`), focus deep links (`?focus=`), queue tab redirects to /decide | The run's Discover view shows ONE track's evidence (SenseBody). Workspace-wide discovery has no track to attach to. Fold target: a new "Discover" track auto-created per workspace? Or does the desk stay as the board's column? |
| `_authenticated.decide.tsx` | 3,546 | Full decision desk with ranked queue | Same attach question, plus: its queue IS the decisions awaiting verdicts — arguably the board's *Waiting for you* column, not the run |
| `_authenticated.learn.tsx` | 948 | Learn desk | Same pattern |
| `_authenticated.plan.*` / `prds.*` | — | Spec authoring; carries the live `createLinearIssuesFromTasks` caller the map already flags | Fold must move that caller into the run's Plan view, not drop it |
| `_authenticated.build.*` / `studio.*` / `ship.tsx` | — | Builder session surfaces | These show the customer's own builder's PR (ruled); fold = link-out from the run's Build card, which RUN-09 already renders |

## What I propose (for your yes/no, not for me to execute unilaterally)

1. **Keep the desks working; stop linking to them.** Every door I own (`/start`, the run) already routes people into tracks. Desks become reference views until you rule.
2. **The run is the product; the desks become redirects one at a time**, each with its callers re-pointed in the same commit, starting with the two pure redirects that already exist (`/discovery`, `/opportunities`) and then `/discover?tab=queue`.
3. **Where a desk's job is workspace-wide, it belongs on the board (S2), not the run** — Discover's capture box and Decide's queue are my candidates for that handoff.

Tell me the order and the targets; each fold lands with its redirect and re-pointed callers in one commit, verified by the route-count going down in the same push.
