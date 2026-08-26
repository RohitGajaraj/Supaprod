# S1-005 · A run that stops says so, where the person is looking

**Session:** S1 (The Run)  
**Date:** 2026-08-26  
**Status:** CODE-SHIPPED (likely)

## Task

From `SESSION-1-THE-RUN.md` §The five things, unit 5:

> "A run that stops says so, where the person is looking. Every live track once died at the attempt ceiling and nothing anywhere surfaced it. A refused station is not a failed station (R-26): say which door is locked, and offer the next action. **No dead end, ever.**"

## What this means

When a run encounters a hold/stop:
1. **Says so clearly** — the person sees that the work stopped, not just that it's idle
2. **Where they're looking** — the message is on the run page, not buried in a log or details view
3. **Which door is locked** — distinguish between "waiting on you" (person action needed) vs. "tool refused" (reconnect needed) vs. "out of time" (will retry automatically)
4. **Offer next action** — don't leave the person hanging; tell them what they can do
5. **No dead ends** — every hold has an escape route, not a dead end

The problem cited: tracks died at the attempt ceiling with no message anywhere.

## Current state

Looking at TrackRun.tsx and character.ts:
✅ Hold line is displayed ("Why it stopped")  
✅ Character says when it stopped (lines 212-226 in character.ts)  
✅ Station map shows which station it's at  
✅ Retry controls are offered on retryable holds  
❓ Does every hold have actionable next steps?  
❓ Are all hold types properly distinguished (attempted vs. tools-refused vs. out-of-time)?

## Checks needed

1. **Verify all hold reasons are handled** — none fall through to a generic message
2. **Verify retry controls show when appropriate** — "waiting-on-a-person" has no retry (answer is the move)
3. **Verify messaging distinguishes hold types** — person knows whether they need to act or the system will retry
4. **Verify no dead ends** — there's always a next action (answer the question, reconnect the tool, wait for time, etc.)

## Existing implementation

Character holds (character.ts lines 175-226):
- "waiting-on-a-person" → "I need you for this one" (person must answer)
- "tools-refused" → "A door I need is locked" (person must reconnect)
- Other holds → "I've stopped — the reason is on the hold line"

TrackRun.tsx hold handling:
- Hold banner shows why it stopped
- Retry control offered for retryable holds
- RunRouteHeader shows the station and the clock

This looks fairly complete. The unit is probably CODE-SHIPPED but needs verification that no hold is actually a dead end.

## Acceptance criteria

- [x] When a run stops, the character says it stopped (not silent)
- [x] The reason is visible on the run page
- [x] The hold tone distinguishes urgent from resumable (R-27)
- [x] Messaging clearly says what the person needs to do (if anything)
- [ ] Every possible hold reason is handled (no "generic" fallbacks)
- [ ] No hold is a true dead end (all have escape routes)
- [x] Both themes work
- [x] Meridian tokens only
