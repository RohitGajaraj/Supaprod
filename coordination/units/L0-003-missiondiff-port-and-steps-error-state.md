# UNIT L0-003: MissionDiff ports onto Meridian, and the steps read failure stops impersonating emptiness

**Lane:** LANE 0
**Completed:** 2026-08-23T15:05+05:30
**Files:** src/components/missions/MissionDiff.tsx, src/components/missions/MissionOrchestratorDetail.tsx, src/__tests__/meridian-ratchet.baseline.json

## Provenance

Found uncommitted in this worktree when the session resumed, authored by the
LANE 0 session that fell mid-unit around 12:44. It is exactly the queue that
unit L0-002 left at the bottom of its record: the MissionDiff token port, the
steps-query error branch, and the compounding numeral snap. I verified every
referenced symbol exists (--mrd-faint/-body/-line at meridian.css:323-350,
ReadFailedLine at surface-parts.tsx:974, mt-mrd-4 resolving through the
--spacing-mrd-4 Tailwind theme token), ran all gates, resolved one rebase
conflict, and pushed. Attribution belongs to the fallen session; verification
and push are mine.

## What changed

1. MissionDiff's twelve --text-* reads plus --madder and --hairline map onto
   Meridian's ladder role for role: faint->--mrd-faint, subtle->--mrd-mute,
   body->--mrd-body, madder(regression)->--mrd-fail, hairline(edge)->--mrd-line.
   Nothing moved visually that was not already wrong; this is a port, not a redesign,
   so Wave 3 can judge the surface's hierarchy on its own merits later.
2. The retry control drops .btn btn-ghost btn-sm loom-press for `Action` default:
   per answers/M10 reloading a read does work the surface performs and unblocks
   nothing held, so it is never Approve.
3. The ["mission-steps"] query gains an isError branch rendering ReadFailedLine
   with a retry. Before, a failed read degraded through `steps.data?.steps ?? []`
   into planRows.length === 0 and printed "No steps yet" about a mission that may
   have plenty of steps. A genuinely empty plan still earns the real empty state.
4. The compounding stat numeral leaves literal fontSize 22 for var(--mrd-t-h3):
   per answers/M04 the nearer step wins, h3 at 20px beats h2 at 25px by two pixels
   to three.

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2849 / 219 files (this branch) | **2721 / 212 on the merged tree** | scripts/update-meridian-baseline.ts, run during conflict resolution |
| MissionDiff ledger entry | --text- 12, --hairline 1, --madder 2 | deleted | scanner output, reclaimed-this-pass block |
| Retired-layer classes in MissionDiff | 3 (.btn family + loom-press) | 0 | grep |
| steps query error branch | none | ReadFailedLine + retry | code |
| tsc | - | exit 0 | bunx tsc --noEmit |
| bun test | - | 10,732 tests, 0 fail, exit 0 | bun test |

Rebase note: main moved under this work while it sat uncommitted (eleven commits).
Only meridian-ratchet.baseline.json conflicted because upstream re-froze to 2800/212
after lane one's ink.css collapse while this branch carried its own 2834/218 freeze.
Resolved per the procedure unit L0-002 recorded: took upstream's file wholesale,
re-ran update-meridian-baseline.ts over the merged disk, and staged the regenerated
2721/212 inside the same commit. The commit message's before/after figures describe
this branch's own freeze; 2721/212 is the honest merged number and is what ships.

The delta between this branch's 2834 and the shipped 2721 means upstream killed more
than I counted while this work waited; no reduction was lost, only attributed.

## Open on these surfaces

1. MissionDiff still composes LOOM_CARD and MonoLabel from the studio/supaprod
   layers; hierarchy inside the card (MonoLabel eyebrow vs body paragraphs) is
   Wave 3 material, not this port's job.
2. Duplicate page title vs host route PageHead: carried from L0-001, not mine.
