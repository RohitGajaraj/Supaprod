# UNIT L0-082 — the proof-path collision: corrected a file the director deleted

**Lane:** LANE 0 · **Outcome:** deletion accepted, correction withdrawn
· **Date:** 2026-08-25

## What happened, in order

1. Reading production I found `docs/PROOF-PATH.md` — the founder-facing guide
   for watching the acceptance run — carrying three facts that would have
   failed him on step 1: `/_authenticated/start` is not a URL (real path
   `/start`), `POST /api/track/start` names an endpoint that does not exist,
   and the Build-gate step predated R-27.
2. I corrected it in place, marked per the AUDIT-correction precedent, and
   disclosed in INBOX item 11.
3. My commit then hit the rebase: **`63abf65d1` had already deleted the file**
   along with `prove-loop.ts` and `MISSION-GATE-VERIFICATION.md` — the fake
   proof artifacts, removed by the A seat for routing-rule violations and
   claims the evidence had refuted.

## Resolution

Deletion accepted (`git rm`, no objection). The corrections are moot; INBOX
item 11 now carries only the durable fact: wherever a proof guide re-emerges,
the founder flow is `/start` → one press → `/track/{id}` — never
`/_authenticated/*` paths or a REST track-start call.

## The lesson, stated so it sticks

I reached for another session's doc while it was already being judged
elsewhere — the CLAIMS protocol covers code files but the same race exists on
docs. Check the newest main before editing any file I do not own, even for an
obvious defect; if it is being purged, my fix is wasted work at best and a
conflict at worst.
