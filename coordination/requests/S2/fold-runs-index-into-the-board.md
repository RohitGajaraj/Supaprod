# REQUEST · complete the fold: /runs becomes part of the board

**Filed by:** S2 · 2026-08-26 · proposes; S0 rules, owns deletions and redirects.

## State measured today

Seven doors onto "what is happening" are ALREADY redirect stubs (`cockpit` `fleet` `swarm` `observe` `briefing` `tasks` `calendar` `m.*` `agents` `missions.*`) — earlier sessions folded them. What remains of the seven-doors problem is that TWO live surfaces still split the board's job:

| Route | Lines | What it holds |
| --- | --- | --- |
| `/today` | 1,745 | attention triage: calls, blocked, running, finished, insights |
| `/runs` | 1,427 | the hand-over composer (goal/spec), run gate + stalled triage, spend total, list/board views |

SURFACE-MAP disposition: `/today` KEEP "this becomes the board"; `runs.index` FOLD → board. The fold is not executed.

## Why fold now

A person with three pieces of work running must know which surface answers "what is my team doing right now". Today they must know that triage lives on `/today` while the fuller list and the composer live on `/runs` — two doors, one question. §0.5: neither is a destination; the board is.

## The callers I found (so nothing 404s)

`/runs` is the most-linked route in the product: AppFrame nav row `[g r]`, today's "Open Runs" goTo, build.index, nav-model PRIMARY_NAV, chat-dispatch, BoardPanel, HeldClaims, ReadyToBuild, OpportunityDetailSheet, AgentRelay, InboxSurface, ChangesPanel, AgentSpendDetail, LivePulse, plus redirect stubs landing there. **Every one of those links stays valid if `/runs` becomes a redirect to the board** — the URL survives as an alias, the same pattern the other ten folds used.

## What must move before the route can fold (the live capability inventory)

1. **The composer** (two doors: goal → orchestrated mission, spec → studio dispatch). The assign gesture belongs on the board AND in the run per SURFACE-MAP's delegate ruling; `/start` is S1's KEEP door for handing work over. Proposal: the board gains ONE "Hand something over" door that routes to `/start`, and the composer itself consolidates there (S1+S0 to rule — it is their prefix).
2. **RunGate + StalledWork triage** — these are board content proper; they move into `/today`'s feed as sections (or replace the thinner crewSections that overlap them).
3. **RunsGrid/RunBoard list+kanban views and spend total** — board content; RunBoard kanban may become the board's second view rather than a separate page.
4. **`useSpineStrip(null)` publish** — moves with the content.
5. Tests pinning runs.index (`nav-model.test.ts`, `route-inventory.test.ts`, key-model tests) update in the same commit.

## What I am NOT proposing

Deleting `/runs/$missionId` — that is run detail, S1/S0's three-surface "run", reached FROM the board. Only the LIST route folds.

## Sequencing proposal

S0 rules → S2 executes the content move inside its own prefix (`today/**`, `runs/**` components are mine; the ROUTE files `_authenticated.runs.index.tsx` are route files under my ownership per the operating model's S2 row) with the redirect landing in the SAME commit, callers untouched because the path survives.
