# UNIT L0-043 — item 1: consent is asked in place, inside the run

**Lane:** LANE 0 · **Item:** BUILD-QUEUE #1 · **Spec:** SPEC-CONSENT.md · **Date:** 2026-08-25

## What changed

**`src/components/track/TrackConsent.tsx` (new)** and its mount at the top of
`TrackRun`.

- Reads `getTrackGates` (RL0-020) on the transcript's exact 10s cadence, so
  question and transcript are never one poll apart. Renders nothing when there
  is nothing; `unreadable` renders a fail-loud line, never a quiet empty.
- One CallGate per open gate (composed, not rebuilt — SPEC-CONSENT §7 named it):
  question from `gateHeadline`, who asked through `agentDisplayName` with the
  `castByStation` roster fallback, age via `stoppedFor`/`isOverdue`, evidence
  lines for reversibility+undo (`REVERSIBILITY_LABEL`·`toolConsequence`),
  risk driver (`assessTool.drivenBy`), the agent's own rationale verbatim, and
  the snoozed fact when set. Consequence slot = `expiryNote` ("If you do
  nothing"). **No tool name renders anywhere** (§2.4).
- **Controls** (§3): two verdict rows drawn PlanGate's way — borderless, hover
  wash, inset ring on `--mrd-focus`, mono digit, per-option consequence from
  derived strings; each commits on press, no Submit (§3.6). "Let it run" fires
  `decideTrackGate(approve)`. "Don't run it" opens Meridian's `ReasonField`
  (Enter commits, dead until non-empty); commit = decline + steer in ONE call
  (`steer: true`, §5.3). The class control prints its own reach:
  "Answer all N questions like this one in this workspace", offered only where
  the declared default is `proceed`; otherwise "Answer all N the same way"
  routes through the same reason field (reject needs a reason server-side).
  Snooze is the only deferral: "Set it aside for a day" via
  `snoozeApprovalItem`, and a snoozed gate STAYS on the card at full weight
  with its line (§2.3). No dismiss exists.
- **Answering resumes the run** (§4.2): on settle, invalidates gates/activity/
  chain/artifacts then calls `onAnswered` → TrackRun's existing
  `driveTrackNow`. SEQUENTIAL, and skipped when the row came back
  `approved`-not-executed or still pending — driving then would hold again at
  the same gate and burn a seat. Settled gates render their outcome sentence
  read off the row's actual status (§4.3), newest first, never hidden.

## Deviations, stated for MAIN's veto

1. **`expiresAtIso`:** not added to `TrackGate`; I convert `expiresAtMs` via
   `new Date(ms).toISOString()`. That is a lossless spelling of the same
   instant, not a reconstruction from partial data — but §2.2 said add the
   field, so say the word and I swap to it.
2. **Class-decline UX:** reject-all shares the single ReasonField rather than
   having its own batch form; server refuses reason-less rejects either way.

## Gates

`tsc` 0 · full suite **10,881 pass / 0 fail** · eslint clean · dev server
never started (R-21).

## Verification owed

No live track holds a pending gate tonight (RL0-020), so the card's rendered
truth is unverified against production. Per RL0-020's offer, MAIN: provoke one
`cluster.trigger` gate on the live walk and I will drive it end to end;
acceptance assertions (§8) are written into
`requests/verify-item1-consent-card.md`.
