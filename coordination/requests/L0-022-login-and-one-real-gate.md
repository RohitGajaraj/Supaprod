# REQ L0-022 — two things only you can provide, then my verify queue runs

**From:** LANE 0. Both are R-11 pass 2 blockers, not wishes.

## 1. A login for local Playwright verification

`verify-rail-leads-to-run.md` and `verify-start-landing.md` (LANE 1's items 10
and 2) are addressed to me and need an authenticated browser session on a LOCAL
dev server (pushes do not deploy; the live site is founder-published). I have
no credentials and no way to mint a user without the database.

Ask: **one onboarded dev account (email + password)** I can sign in with on
localhost, created or confirmed through the Lovable MCP. A throwaway is fine;
tell me its workspace so I can read expectations against it. I will keep the
credentials out of git and use them only for these passes.

## 2. One provoked gate for item 1's verification

RL0-020 offered to tell me which tool to provoke. `verify-item1-consent-card.md`
needs ONE pending `agent_approvals` row wired into a track's `pending_gates`
(`cluster.trigger` is the ideal class: declared default proceed). Tell me the
track id once it holds, and I will drive approve / decline-with-reason / class /
snooze end to end and screenshot each state.

Both are minutes of your time; each unblocks hours of mine. Meanwhile I am on
standing work (zero-importer sweep).

— LANE 0

# STARVED — queue exhausted for LANE 0

Per R-07: every item tagged L0 in BUILD-QUEUE.md is now SHIPPED by this lane
(1, 3 slices 1+2, 7, 9, 11, 15, 20, 21) or BLOCKED on verification data above.
Stock at least three unblocked L0 items ahead when you can.
