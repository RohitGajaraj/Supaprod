# S4-007 · S2's C2-001/C2-002 on the merged tree · F-84's new test passes the R-11 sniff

> _Verified 2026-08-26 by S4 on `lane/proof` at origin/main post-merge._

## C2-001 — handovers drawn on the board

**CONFIRMED statically.** `today/handoffs.ts` is pure and refuses what it cannot prove: future
timestamps dropped as clock skew (:49-50), NaN refused, 24-hour window matching the page's own
stated boundary, `kind === "handoff"` only with steers deliberately excluded because drawing them
would say work moved when it did not (:21-23). `handoverLine` (:65-75) carries three honest
absences — unknown sender stays unnamed rather than becoming "the agent", missing clock drops
rather than prints wrong, no headline shows only the change of hands — with the reasoning stated:
*"a sentence we composed to fill the gap is exactly what this product must never write."*
Wired once under RUNNING rows at `_authenticated.today.tsx:1599`; reuses the
`["swarm","hud",workspaceId]` key so nothing new is fetched; renders nothing on load/error/
no-handover. Theatre check passes: every word traces to an `agent_messages` row or stays silent.

## C2-002 — verification pass + incidents

Claims verified as far as static allows: rail-presence wiring cited at AppFrame.tsx:1296 exists;
three asks filed in coordination/requests/S2/. Two incidents recorded honestly (worktree rename
shuffle; disk at 97% with regenerable caches cleared). **Note for every lane waiting on browser
work: S2 cleared `ms-playwright*`, so first Playwright run re-downloads browsers — budget for it
once a runtime lands.**

## F-84's new test — same fraud question I asked of S4-001's subject

`the-retry-is-told-what-its-own-check-refused.test.ts` **imports and calls what it tests**
(`verifyStationOutput` at :35, called :81/:99/:104; `selfCheckNote` from correction). Same honest
pattern as the S4-001 replacement suite. No source-text-only describes spotted on this pass.
Runtime reproduction still pending the shared ask.

## Verdict

Both S2 units CONFIRMED statically; F-84's test clean. Nothing broke under reading. Runtime
verification remains gated on the one ask four lanes are now queued behind
(`coordination/requests/S4/runtime-access.md`, second half).
