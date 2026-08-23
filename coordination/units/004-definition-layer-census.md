# UNIT 004: the definition-layer census

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 1 → 3 bridge
**Files:** none (measurement only). Output feeds `requests/002`.

## Method

Every `.tsx`/`.ts` under `src/components`, `src/routes`, `src/lib`, `src/hooks` outside
tests, comments stripped the way the ratchet scanner strips them. Counted per file:
`var(--ds-*)`, `var(--text-*)`, `var(--hairline*)`, ember-family readers
(`var(--ember*)` plus `--ember*` in var position), the five `.material-*` classes as
class tokens, and bare Tailwind leadings (`leading-snug|tight|relaxed|none|normal|loose`),
the last per M13's ruling.

## The headline: styles.css's definition layer is 100% LANE 0-shaped

| family | LANE 1 (routes + shell) | LANE 0 (components) |
| --- | --- | --- |
| `--ds-*` | **0** | **114** |
| ember readers | **0** | **43** |
| `.material-*` | **0** | **27** |
| `--text-*` | 36 | 149 |
| `--hairline*` | 17 | 41 |
| bare leadings (M13) | 18 | 117 |

My half of `--ds-`/ember/materials is zero because my routes already ported or never used
them; what remains on my paths is `--text-*`/`--hairline` in the unauthenticated auth
routes and the M13 leading conversion, which I take file-by-file as I port.

## LANE 0's worklist, worst first (total retired uses)

| uses | file |
| --- | --- |
| 48 | components/onboarding/ObsidianOnboarding.tsx (all --ds-) |
| 22 | components/ui/button.tsx (21 --ds-, 1 ember) |
| 21 | components/admin/VouchersPanel.tsx |
| 20 | components/supaprod/Primitives.tsx |
| 18 | components/engine-room/ConnectionStrip.tsx |
| 18 | components/product/SpecProjectionsPanel.tsx |
| 15 | components/engine-room/RoomCard.tsx |
| 14 | components/supaprod/MissionGraph.tsx |
| 13 | components/supaprod/Sketch.tsx |
| 13 | components/missions/MissionDiff.tsx |
| 12 | components/obsidian/flashlight-tabs.tsx (7 ember) |
| 12 | components/runs/run-parts.tsx (all bare-leading) |
| 11 | components/obsidian/ask-canvas.tsx |
| 10 | components/obsidian/callcard.tsx (5 ember) |
| 10 | components/engine-room/SelfImprovementPanel.tsx (all bare-leading) |

Long tail of ~40 further files carries the rest. Full table reproducible from this unit's
method; not pasted twice.

## What dies when that lands

The entire Tempo/Geist `--ds-*` definition block in styles.css (~240 markers across both
theme grounds), the Obsidian `--text-*` definitions, and the four `--ember` definitions
(rename + deletion as one port, per ANS-002). That is roughly 380 of my remaining ~694
styles.css markers — the single largest unlock left in Wave 1.

## My own next ports (LANE 1 side)

Auth routes first: signup.tsx (15), join.$token.tsx (11), login.tsx (7),
reset-password.tsx (6), forgot-password, plus 18 bare leadings across routes including
_authenticated.meridian.tsx (5), _authenticated.brain.tsx (3), _authenticated.approvals.tsx (2).
These are first-touch surfaces; text-hierarchy porting there changes no funnel decision
(the funnel ruling governs CTA styling, not type roles).
