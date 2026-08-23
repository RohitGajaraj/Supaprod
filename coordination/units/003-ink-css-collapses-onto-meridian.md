# UNIT 003: ink.css collapses onto Meridian per ANS-001

**Date:** 2026-08-23 · **Lane:** LANE 1 · **Wave:** 1
**Files:** `src/styles/ink.css`, `src/__tests__/meridian-ratchet.baseline.json`,
`src/styles/__tests__/rows-are-scanned-not-read.test.ts`

## What was wrong

ink.css carried 170 occurrences (87 `--sp-`, 83 raw-colour). Measuring before editing
changed the plan twice:

1. **27 of its 80 defined sp-tokens had zero remaining `var()` uses anywhere under src**
   outside tests. They were mostly pure aliases into Meridian (`--sp-pass: var(--mrd-pass)`
   and friends) whose last readers ported with primitives.css on 2026-08-08. Definitions
   with no reader are deletable outright.
2. **The legacy Ink-v6 fence was half dead too.** Census by token family: `chip-*` all five
   tokens dead; `voice-*` eleven of sixteen; `ink-*` ten of twenty-four. The fence comment
   still said "~1400 call sites" — that count is from 2026-07-29 and is now wildly stale.

## What changed

**Deleted, zero live references each (verified two ways):** 19 sp-token definitions
(`sp-bg/body/dur-fast/ease/fail/float/gate/ink/lift/line/mute/pass/radius-pane/radius-panel/
sink/space-1/space-4/space-6`), the whole chip ramp, seven voice steps plus the four-token
`voice-memory` family, and ten ink tokens (overlay, grid pair, radius-control,
radius-hero, control-sm/md/lg, fast, slow). Verification: a census script over every
tsx/ts/css under components/routes/lib/hooks plus the stylesheet layer, then a second
exact-pattern grep (`var(--token[),]`) to catch what the first might have missed. Five
apparent hits were inspected individually: all sit inside comments.

**Aliased onto Meridian per ANS-001:** text-gate → `--mrd-t-h3` (19→20px, ruled up),
text-prose → `--mrd-t-prose` (13.5→14, ruled), leading-row → `--mrd-lh-snug`
(1.4→1.5, ruled), leading-body → `--mrd-lh-prose` (1.55→1.625, ruled), track-title/gate →
`--mrd-track` (ruled), radius-ctl → `--mrd-r-ctl` (8→9, ruled). Plus the value-exact
aliases: text-body/meta/label/data/data-sm, leading-tight, weight×3. Where name and value
disagree across systems (sp "data" is 12px = mrd small; sp "data-sm" = mrd data) the alias
follows the VALUE and says so in a comment.

**Left literal, deliberately:** `--sp-leading-title/gate/note` (no exact stop, no ruling),
`--sp-space-2/3/5/7` (ANS-001 maps space-2/space-3 to gap-mrd-inline/gap-mrd-stack BY ROLE
at the call site; no single definition can decide that), `--sp-warn` and the stage hues
(no ruling).

## Test fix, not test weakening

`rows-are-scanned-not-read.test.ts` failed after the aliases: it parsed literal numbers
from ink.css and both sides resolved to NaN. The doctrine it guards (row leading strictly
tighter than document leading) is about VALUES, so the test now resolves through an alias
into meridian.css before comparing. It fails if a token resolves to nothing, which is the
safe direction. It passes again on snug 1.5 < prose 1.625.

## Verification

Computed values read off the running app at `/login` and `/today`, both grounds:
`--sp-leading-row` = 1.5 = `--mrd-lh-snug`; `--sp-leading-body` = 1.625;
`--sp-text-gate` = 20px = `--mrd-t-h3`; `--sp-radius-ctl` = 9px; deleted tokens compute
empty. Rendered shell rows paint 14px/21px (the new snug leading). No console errors from
the change.

## Gates

| Gate | Result |
| --- | --- |
| `bunx tsc --noEmit` | exit 0 |
| `bun test` | 10,636 pass / 0 fail across 629 files |
| `bun run docs:check` | exit 0 |
| Ratchet | 2,859 → **2,810** (-49); re-frozen same commit |

Per-file: ink.css `--sp-` 87→69, raw-colour 83→52.

## For MAIN LANE / whoever reads this

The stale "~1400 call sites" figure for the legacy fence appears in ink.css's own header
comment. I left it but flagged it here: real remaining var() consumers are 15 ink-*, five
voice-*, two verdict-* tokens, concentrated in `components/ink/*` (LANE 0's paths now),
`components/mission/MissionOnboarding.tsx`, `components/product/RoadmapHistory.tsx`,
routes `t.$slug` and `proof`. When those port, the whole fence deletes in one commit as
its own header promises.
