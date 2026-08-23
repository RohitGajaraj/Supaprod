# UNIT L0-002: MissionOrchestratorDetail speaks Meridian's tiers (adopted from the fallen session)

**Lane:** LANE 0
**Completed:** 2026-08-23T13:45+05:30
**Files:** src/components/missions/MissionOrchestratorDetail.tsx, src/__tests__/focus-ring-is-inherited.test.ts, src/__tests__/meridian-ratchet.baseline.json

## Provenance

Found uncommitted in this worktree, authored by the LANE 0 session that joined at 11:50
and died around 12:44 without committing. I reviewed every hunk, ran all gates on the
merged tree, and am pushing it so it exists. Attribution belongs to that session; the
verification and the push are mine.

## What was wrong

M10 measured 23 untiered controls here, the largest single concentration in the tree, on
the exact surface type the founder says reads worst ("additional details ... back to back").
Five controls still composed the retired palette's `.btn` family via
`@/components/shell/primitives`; the governance gate painted ember, a colour the standing
ruling reserves against interaction states; bespoke `FOCUS` outline utilities fought the
cascade instead of inheriting the `[data-mrd]` ring; raw pixel gaps sat where spacing steps
exist; and the h1 fell through to a base-layer clamp that printed 36px+ over the route's
own 25px `<PageHead>`, inverting the hierarchy.

## What changed

- All five retired-layer controls moved onto Meridian tiers by the M10 test: gate approve
  -> `Approve` (unblocks a held tool call), reject -> `Action destructive` (stops the
  pending call), launch -> `Approve` (releases a mission held on a person), cancel/replay/
  retry/capture -> `Action`. Ten Meridian controls now stand beside eight native buttons,
  every native button reveal/toggle-only by the tier test, each decision commented inline.
- GatePanel wash and edge moved from ember to color-mixes of `--mrd-you`, the system's
  "a person is required" hue, matching ApprovalCard and Approve's face.
- Both roots now carry `data-mrd=""`; the bespoke FOCUS const is deleted and the
  focus-ring guard's exemption register drops this file (13 exempt -> 12).
- Raw gap values became spacing tokens (`var(--mrd-s3)`), the h1 composes
  `text-mrd-h2 font-semibold text-mrd-ink` with the old class's exact metrics.
- Ratchet ledger: this file's entry deleted entirely (class:sp- 5, import 1, usage 4).

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Ratchet total | 2,859 / 220 files (upstream freeze this rebased onto) | **2,849 / 219** | `bun run design:ratchet` re-freeze in this commit |
| Retired-layer classes in file | 5 | 0 | grep sp-btn/sp-title (live code; 4 comment mentions remain) |
| Ember refs in file | several | 0 | grep --ember |
| Controls on Meridian tiers | 0 | 10 (+8 justified natives) | grep '<Action\|<Approve' |
| tsc | - | exit 0 | bunx tsc --noEmit |
| bun test | - | 10,631 pass / 0 fail, exit 0 | bun test |

Rebase note: the first push attempt hit a legitimate conflict in
meridian-ratchet.baseline.json because both lanes re-froze reductions simultaneously
(upstream 2868->2859 elsewhere; this port -10 and one fewer file here). Resolved by taking
upstream's numbers then re-running design:ratchet on the merged tree, which regenerated
2849/219 from disk and is included in this same commit per the re-freeze rule.

## Open on this surface, queued as my next units

1. `MissionDiff.tsx` (same folder, mounted here): live retired tokens `--text-faint`,
   `--text-subtle`, `--text-body`, `--madder`, `--hairline`. Still on the ledger.
2. The `["mission-steps"]` query has no isError branch: failures degrade silently to an
   empty plan list, which reads as "no steps yet", a lie.
3. One hard-coded `fontSize: 22` numeral (compounding stat) to snap onto the ladder.
4. `loom-press` remains on native buttons but resolves nothing under a `data-mrd` root;
   needs either deletion or a scope ruling with MAIN LANE.
5. Duplicate page title vs the host route's PageHead: handed up in L0-001, not mine.
