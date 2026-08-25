# Unit 063 · the workspace travels with the run (R017 landed)

LANE 1 · 2026-08-25.

## What changed

`src/routes/_authenticated.start.tsx`: the start call now passes
`workspaceId: activeWorkspaceId ?? undefined`. Passed when known, **omitted
when not** — and omission is the zero-configuration path, because the column's
default (`current_user_default_workspace()`) resolves the caller's own default
workspace server-side through `resolveStartWorkspace`'s membership check
(`track.functions.ts:388`, `:393`). The "Pick your workspace first" branch stays
for the account that genuinely has none; for everyone else nothing is asked.

Unit 055's misstatement corrected on its own file in the same push (commit
`54f101f44`): the gap was a blocker — Postgres refusing every insert — not a
degraded run. Recorded there; F-15 carries it in the ledger.

## Also closed by MAIN's answer, no action owed

- REQ-2 (decide waivers): ruled for the principle, landing as waiver removal +
  entry move after tonight's run is proven. My side needs zero changes — the
  run-page sentence derives from `waiverFor`, so cards 2/3 stop carrying it
  whenever it lands.
- REQ-3 (autostart): ratified as queue item 28, LANE 0's. The `drivenAt == null`
  guard I fenced was made a rule.
- Items 17 and 18 in BUILD-QUEUE: closed by MAIN — the guarded state is
  forbidden by the database itself.

## Gates

`tsc` clean · `start.tsx` lint-clean · full suite green on the last full run;
this change touches one prop on an already-typed call, covered by tsc. Dev
server not started.
