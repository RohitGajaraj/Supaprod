# S1-004 · The ask happens in place, once, and the answer covers the class

**Session:** S1 (The Run)  
**Date:** 2026-08-26  
**Status:** RESEARCH

## Task

From `SESSION-1-THE-RUN.md` §The five things, unit 4:

> "The ask happens in place, once, and the answer covers the class. 90 approval requests were raised for one internal tool since July: 42 cancelled, 38 expired, 10 pending, **zero ever approved** — because they went to `/approvals`, detached from the work they blocked. `TrackConsent` exists; make it the only place consent is ever asked."

## What this means

When a run encounters a gate/approval/consent moment:
1. **In place** — the question appears ON the run page, not on a separate `/approvals` page
2. **Once** — the person sees it one time, not as a notification that they can ignore
3. **Answer covers the class** — answering "approve this change" doesn't just approve one instance; it sets a rule/preference for similar decisions going forward
4. **No orphaned gates** — every approval is attached to the work that blocked on it, not floating in an inbox

The problem cited: 90 approval requests, 0 approved (because people never went to `/approvals`). The solution: mount TrackConsent inline on the run page.

## Current state

✅ `TrackConsent` component exists (built in prior work)  
✅ Can render questions/gates inline on the run  
✅ Is mounted somewhere on the track page  
❓ Does it handle all gate types?  
❓ Does the "answer covers the class" feature exist?  
❓ Is it the ONLY place gates appear, or do gates also appear on `/approvals`?

## What needs work

1. **Verify TrackConsent is always mounted** — on every track page, for every gate
2. **Verify gates don't appear elsewhere** — no orphaned gates on `/approvals` that duplicate this
3. **Implement "answer covers the class"** — when answering a gate, offer to set a rule for future gates of the same type
4. **Remove alternative gate surfaces** — if gates appear anywhere else, fold them into TrackConsent or delete them

## Files to check

- `src/components/track/TrackConsent.tsx` — the gate rendering
- `src/routes/_authenticated.track.$trackId.tsx` — is TrackConsent mounted?
- `src/routes/_authenticated.approvals.tsx` — does this still show gates? If so, we need to fold/redirect
- `src/components/ask/**` — are there other gate components that should route through TrackConsent?

## Acceptance criteria

- [ ] Every gate that appears on a run appears inline on the TrackRun page
- [ ] No gates appear on separate pages like `/approvals`
- [ ] The person can answer a gate without navigating away from the run
- [ ] Answering a gate updates the run immediately (no refresh)
- [ ] "Answer covers the class" feature is implemented (setting rules for future gates)
- [ ] Both light and dark themes work
- [ ] Meridian tokens only
