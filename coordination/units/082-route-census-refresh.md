# Unit 082 · route census refresh: 84 authed routes, 43 pure redirects, the five-door distance measured

**Lane:** LANE 1 (R-07's named standing work) · **2026-08-25** · source-only,
no dev server. Supersedes the numbers in unit 061.

## The numbers (script in the unit record, re-runnable)

| | unit 061 (morning) | now |
| --- | --- | --- |
| authenticated route files | 84 | **84** (85th is the `_authenticated` layout itself) |
| pure redirects | 48 | **43** |
| real surfaces | 36 | **41** |

The redirect count FELL by five and surfaces rose — `/track/$trackId` and the
workbench landed as real surfaces, several stubs were promoted or re-typed.
Deletions remain gated by R-15 §3 (nothing deletes until a run finishes end to
end), so the census measures; it does not cut.

## Distance to PRODUCT-TRUTH's five doors

Target doors: `/start`, `/track/:id`, tracks list, engine room, settings.

| Class | Count | Members |
| --- | --- | --- |
| The five doors themselves | 4 + 2 lists | `start`, `track.$trackId`, `settings`, `engine-room` (+ `runs.index`, `approvals` as the lists/overflow R-04 names) |
| Station engines + legacy surfaces (fold candidates) | 20 | discover, decide, plan.index, plan.spec.$id, design, build.index, ship, learn, prds, runs.$missionId, traces, traces.$traceId, track-record, trust-ledger, inbox, crew, boundary, brain, onboarding, today |
| Admin (own tree behind its own gate) | 12 | admin.* incl. the index |
| Gallery / internal | 3 | meridian (the exhibition), sync, admin redirect stub |

**Reading:** the product's customer surface is 6 routes; everything else is
either the admin tree, the design gallery, or fold candidates for the five-door
collapse — 20 surfaces whose fold ORDER is exactly what item 6 sequences once a
run finishes end to end and deletions ungate. The prds trio remains
load-bearing (unit 061's finding, unchanged — do not delete).

## Method note

Redirect-vs-surface classified by `throw redirect(` in `beforeLoad` with no
component render of its own. Two known soft spots, stated rather than hidden:
`_authenticated.boundary.tsx` (1131 lines, a real surface with no rail door —
item 22's fold target) classifies as a surface, correctly; and any file that
both redirects conditionally AND renders would classify as a surface — a manual
pass found none new since 061.

Gates: none owed (no code). No dev server.
