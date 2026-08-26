# S0 decision · Route fold batches and sequencing

Filed 2026-08-27 by S0. This coordinates when routes redirect to consolidate the three surfaces (run, board, settings).

## Routing law

**A route folded without its callers redirected is a 404 in production.** Every fold ships with:
1. The route-level redirect (the file itself)
2. All callers updated to point to the new home
3. One commit containing both

This prevents dead links during deploys.

## Fold batches — ship in same commit

### **BATCH-1: Board consolidation (S2 owns)**
Folds all list/overview routes into `/today` (the board). These are safe together because the board already renders multiple content types.

| Route | Folds to | Redirect | Updated callers |
| --- | --- | --- | --- |
| `/runs` | `/today` | 301 | nav, shell |
| `/missions` | `/today` | 301 | nav, components |
| `/briefing` | `/today` | 301 | nav |
| `/tasks` | `/today` | 301 | nav |
| `/roadmap` | `/today?view=roadmap` | 301 | nav |
| `/cockpit` | `/today` | 301 | internal |
| `/fleet` | `/today` | 301 | internal |
| `/swarm` | `/today` | 301 | internal |
| `/observe` | `/today` | 301 | internal |

**Rationale:** All describe "what is happening" from different angles. The board is the canonical view.

### **BATCH-2: Run consolidation, part A (S1 owns)**
Folds the first three stations into `/track/$trackId` with view parameters.

| Route | Folds to | View param | Redirect | Updated callers |
| --- | --- | --- | --- | --- |
| `/discover` | `/track/:id` | `?view=discover` | 301 | nav, components, results |
| `/decide` | `/track/:id` | `?view=decide` | 301 | nav, step link |
| `/plan` | `/track/:id` | `?view=plan` | 301 | nav, spec inline |

**Blockers:** None. View parameter wiring must be in place before redirect.

### **BATCH-3: Run consolidation, part B (S1 owns)**
Folds the middle three stations into `/track/$trackId`.

| Route | Folds to | View param | Redirect | Updated callers |
| --- | --- | --- | --- | --- |
| `/design` | `/track/:id` | `?view=design` | 301 | nav, link from plan |
| `/build` | `/track/:id` | `?view=build` | 301 | nav, studio inline |
| `/ship` | `/track/:id` | `?view=ship` | 301 | nav |

**Blockers:** None after BATCH-2.

### **BATCH-4: Run consolidation, part C (S1 owns)**
Folds outcome routes and gates into `/track/$trackId`.

| Route | Folds to | View param | Redirect | Updated callers |
| --- | --- | --- | --- | --- |
| `/learn` | `/track/:id` | `?view=learn` | 301 | nav, board link |
| `/outcome` | `/track/:id` | `?view=learn` | 301 | nav |
| `/approvals` | `/track/:id` | (inline, not routable) | — | nav removes link |
| `/chat` | (ask panel, not routable) | — | 301 to `/` | nav removes link |

**Blockers:** Approvals must move to run gate panel; Chat must move to Ask panel (already done per chat.tsx).

### **BATCH-5: Settings consolidation (S3 owns)**
Folds all account/platform pages into `/settings`.

| Route | Folds to | Section | Redirect | Updated callers |
| --- | --- | --- | --- | --- |
| `/engine-room` | `/settings` | tabs | 301 | nav, internal |
| `/guardrails` | `/settings` | tabs | 301 | nav, internal |
| `/govern` | `/settings` | tabs | 301 | nav, internal |
| `/boundary` | `/settings` | tabs | 301 | nav, internal |
| `/budgets` | `/settings` | tabs | 301 | nav, internal |
| `/integrations` | `/settings` | tabs | 301 | nav, at point-of-need |
| `/brain` | (run gate inline + settings tab) | — | 301 to `/settings` | nav, run |
| `/memory` | (run gate inline + settings tab) | — | 301 to `/settings` | nav, run |
| `/knowledge` | (run gate inline + settings tab) | — | 301 to `/settings` | nav, run |
| `/evals` | `/settings` | admin tab | 301 | nav, internal |
| `/analytics` | `/settings` | admin tab | 301 | nav, internal |

**Blockers:** Integrations must reach point-of-need; Brain/Memory/Knowledge must move inline (not route).

### **BATCH-6: Cleanup (S0 owns)**
Delete orphaned routes and verify no callers remain.

| Route | Status | Caller check |
| --- | --- | --- |
| `/onboarding` | DELETE or AUDIT | is it needed? |
| `/traces` | FOLD → run activity | update callers |
| `/threads` | DELETE (killed by R-04) | verify none |
| `/inbox` | DELETE → all routes in BATCH-1 | verify none |
| `/sync` | AUDIT | has live caller (pushLinearIssue) |
| `/drift` | DELETE | verify none |
| `/delegate` | FOLD → board + run | update callers |
| `/stakeholder` | DELETE | verify none |

**Rationale:** These are final cleanup and orphan checks. Sync is audited, not deleted, because it has live callers.

## Shipping order (one per day, or one hour each if parallel sessions are safe)

1. **BATCH-1** (Board) — Friday AM  
   Status: `S2` write the redirects, merge if tests pass
2. **BATCH-2** (Run part A) — Friday PM  
   Status: `S1` wire view params, write redirects
3. **BATCH-3** (Run part B) — Saturday AM  
   Status: `S1` after BATCH-2 lands
4. **BATCH-4** (Run part C) — Saturday PM  
   Status: `S1` after approvals/chat move; Chat already done
5. **BATCH-5** (Settings) — Sunday AM  
   Status: `S3` integration point-of-need must be ready
6. **BATCH-6** (Cleanup) — Sunday PM  
   Status: `S0` after all others land, verify no callers

## Risk mitigation

- **Test every redirect.** A 404 in production from a stale link is worse than leaving the old routes live.
- **Measure caller updates.** Before a batch ships, grep for the route name in code, tests, docs.
- **Stage one batch at a time.** Don't start BATCH-2 until BATCH-1 is confirmed green in production.
- **Keep one escape route.** Until all three surfaces are proven live, old routes can stay as fallbacks; add a deprecation warning on them instead of redirecting.

