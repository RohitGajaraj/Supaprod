# Session handoff (durable)

> _Last updated: 2026-07-29 21:35 IST. The run spine is rebuilt, five parallel lanes landed, everything is pushed. Three founder calls are open at the bottom._

**This file is the durable, git-tracked session handoff.** It replaces `.remember/remember.md` as the committed record, because that file empties itself on read.

---

# 2026-07-29 evening, the run spine and the parallel sweep

## State: green, and pushed

`main` is at `b54482dd`. Working tree clean. tsc 0, build 0. Every lane below is
committed and pushed to `origin/main`.

## What the founder found, and what it actually was

The founder opened localhost and reported that the run section still rendered in the
legacy design. That was exactly right, and the cause was one line:
`AppFrame.tsx`'s rail pointed **Runs** at `/m`, which is Mission Control, the single
surface the rebuild never ported. So the primary nav row for the engine's spine landed
on the legacy five-region shell.

They also asked whether a run is only the build leg. It is not, and the code already
agreed: `missions.current_agent_id` can be any of the thirteen agents, and
`/build/$missionId` already branched to `MissionOrchestratorDetail` for missions with no
builder run at all. The route was named Build purely as a leftover of the
Builder to Studio to Build rename, and the name was telling users the spine covered one
stage of seven.

## What shipped

**The run spine.**
- `/build` is now `/runs`. `/build/*` stays alive permanently as a redirect carrying
  search state, per this repo's rule that an existing URL keeps working.
- The seven-stage strip belongs to a run. The shell owns the region, the run owns the
  content: a surface publishes through `src/components/shell/run-strip.tsx` and only a
  run does, so the strip is always there on a run and nowhere else. It was previously
  drawn on every route, hidden by default, and showed workspace-wide activity rather
  than one run's progress, which is the inverse of the founder's ruling.
- The chips are a segmented control. Clicking 05 swaps the work region to Build for this
  run; you never leave the run to walk its own lifecycle.
- `src/lib/run-stages.functions.ts` reads the other six from the record, walking
  mission to changeset to prd to opportunity / decision / flow / scaffold / learning.
- The diffstat states LINES. It stated characters, which is not a diff: a line rewritten
  to the same length nets to zero, and so do two lines swapped. New pure `diffStat` in
  `studio-hunks.ts` sums the same `computeHunks` alignment the Changes tab renders from,
  so the headline cannot drift from the hunks underneath it. 7 new tests.
- The Runs board: a second view, columns by work state (In plan / Working / Waiting on
  you / Done / Stopped), measured in a headless browser. Five columns at 1440 and 1366,
  three below 1040px of board width, zero horizontal overflow at any width.

**The surfaces.** Crew became where you govern (autonomy dial, tool-reach cap, enable
switch moved from Settings; per-tool controls drawn only where `resolveToolMode` would
honour them). Settings and Sources were redesigned, Sources splitting into what the crew
reads and what you can add. Brain gained a reader for house rules and the recall line,
both of which were being written and read by nothing.

**The design system.** `Grid`, `Cell`, `Choices`, `Checkbox`, `Value`, and `htmlFor` on
`Line`, closing gaps three lanes each worked around by hand. Seven components ported off
the retired system, nine orphans deleted.

## Bugs found on the way, all fixed

1. **`trust.server.ts` held opposite defaults for one column.** `loadAgentArc`, what the
   loop calls, returns `trusted` when no `agent_autonomy` row exists per the 2026-07-08
   founder ruling. `computeAllAgentTrust` returned `observing`. Every workspace that
   never touched the dial was told its crew was on probation while the loop ran it
   autonomously.
2. **`agent-fleet.ts`'s `RUN_STATE` had no entry for `"complete"`**, which is what
   `runAgent` writes on success, so finished runs bucketed as "other" and went uncounted.
3. **`TeamCard` rendered "No invitations yet" on a FAILED read**, a lie about the
   workspace. `MembersCard`'s error said "Try again" with nothing to click.
4. Two Supabase selects named columns that do not exist (`opportunities.evidence_count`,
   `studio_changesets.file_count`). Both typechecked clean.

## THE TRAP THAT CAUGHT THIS SESSION THREE TIMES, READ THIS

**`tsc` does not catch a bad Supabase select string.** `.select("a,b,c")` is a plain
string in the generated types, so a wrong column name typechecks perfectly and fails at
runtime. Verify every selected column against `src/integrations/supabase/types.ts`
directly. `file_count` is the nastiest case: it LOOKS real because it is a field on the
`StudioChangesetSummary` TypeScript type, but it is computed from child rows, not stored.

**Second trap: `src/styles.css` is a FILE beside the `src/styles/` DIRECTORY.** A grep
over `src/styles/` misses the 122KB root stylesheet and will tell you that `bento`,
`mono-label`, `--hairline`, `--madder` and `--moss` are dead. They are not; they resolve,
and they resolve dark. One commit message in this session says otherwise and is corrected
by the next.

**Third trap: `styles.css:2174` has an unlayered `[data-obsidian] :focus-visible` with
`box-shadow: none`**, and it sits after `primitives.css` in source order. So a focus ring
written in `primitives.css` is inert, and any box-shadow on a focused element is erased.
Five rules in `primitives.css` are currently inert because of this.

## Open, and waiting on the founder

1. **Mission Control: harvest then retire, or retire now?** After the rail repoint there
   is exactly one live door left into the legacy shell: the composer, when you pick a
   journey, opens the per-product stage canvas. Retiring it is NOT a deletion.
   `faces.tsx` is 102KB of eight real stage canvases (Evidence, Decision, Spec,
   Prototype, Code, Ship, Growth), and they are product-scoped where the new strip is
   run-scoped, so one does not simply replace the other. Recommendation: harvest the
   faces for the depth the stage panels need, then retire.
2. **The success-toast rule.** `docs/conventions/anti-slop.md` does NOT ban success
   toasts, despite several briefs in this session claiming it does. The doctrine is real
   (agents/FINAL-agent-presence.md R10, "the Commit": settling a call writes a receipt
   showing what it caused, not a toast confirming the click registered) but it lives
   elsewhere. Meanwhile `_authenticated.settings.tsx` has 10 `toast.success` calls.
   Either write the rule into anti-slop.md and sweep Settings, or accept toasts outside
   the run surfaces.
3. **97 failing tests, all pre-existing.** They assert the inline-style anatomy of
   design-system components no lane touched (`src/components/discover/DetailKit`,
   `StatCell`, `SignalCard`, `StatusPill`), plus a guardrail for the superseded
   DESIGN-TEMPO contract. The 20 tests covering files changed this session pass. They
   need updating or deleting; 97 red is how a real regression hides.

## Next, in order

1. The six stage panels are still thin (one fact plus a link) while Build has a full
   body. A lane is deepening them from the record as of this writing.
2. Whatever the founder decides on Mission Control.
3. The remaining legacy-CSS components the Settings lane listed as out of its set.
