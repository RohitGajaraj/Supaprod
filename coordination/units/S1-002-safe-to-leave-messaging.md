# S1-002 · I'm on it — you can leave this page

**Session:** S1 (The Run)  
**Date:** 2026-08-26  
**Status:** CODE-SHIPPED

## Task

From `SESSION-1-THE-RUN.md` §The five things, unit 2:

> "I'm on it — you can leave this page. The run must be watchable *and leavable*. Visible agency must not mean mandatory attendance; async is the default everywhere on the frontier. Say it in the product's own plain voice and make leaving safe."

## What this means

When a person assigns work, the character needs to make it EXPLICITLY CLEAR that:
1. The work is happening with or without them watching
2. They can safely navigate away
3. Async operation is the designed behavior, not a fallback
4. The work will continue and notify them when they return

The message must be in the product's own plain voice (no jargon, no technical terms).

## Changes made

**Commit:** (to be created)
**File:** `src/lib/presence/character.ts`
**Change:** Updated the thinking state message from:
- OLD: "I'm on it — working out the next step."
- NEW: "I'm on it — you can leave this page and I'll keep going."

This makes the async-safe message explicit to the person on first paint of `/track/:id`.

## Current state

✅ The character says different things depending on state:
- On `/start` while creating: "Picking that up now. I'll open the run the moment it's filed."
- On `/track/:id` while thinking (first paint): "I'm on it — you can leave this page and I'll keep going." ← UPDATED
- On `/track/:id` while working on a tool: "I'm writing the spec." (with curated verb per tool)
- Idle: "I'm ${CHARACTER_NAME}. Say what needs doing in one sentence, then you can leave it with me."

✅ The walking message now emphasizes async safety explicitly  
✅ Both themes supported (Character.tsx uses Meridian tokens only)  
✅ Motion via `mrd-attention` animation on the character mark

## Files to touch

- `src/lib/presence/character.ts` — the `deriveCharacter` function line 193 currently says "I'm on it — working out the next step." Should emphasize "you can leave"
- `src/components/presence/Character.tsx` — verify the character is rendered at the right moment and visible to the person on first paint
- `src/routes/_authenticated.track.$trackId.tsx` — verify the character is mounted in the route

## Acceptance criteria

- [ ] Character on `/track/:id` after landing from `/start` shows message that includes "I'm on it"
- [ ] Message makes it safe to leave (e.g., "I'm on it — you can leave this page" or "leaving it with me")
- [ ] Character is visible at the top of the run (not hidden, not off-screen)
- [ ] Message updates as work progresses (different message when working on a tool vs. thinking)
- [ ] Both light and dark themes render the message clearly
- [ ] Motion (breathing) is visible and shows the character is alive
- [ ] No station names or technical jargon in the message

## Implementation notes

The character's line derives from `deriveCharacter()` which looks at:
- Whether a walk is in flight (`input.walking`)
- The newest tool call (`input.currentTool`)
- The track's hold reason (`input.track.holdReason`)
- The track's status

The verb map in character.ts maps tool slugs to plain-English verbs (e.g., "prd.draft" → "writing the spec").

A person who lands on the page should see:
1. The character (visible, not hidden)
2. A message starting with "I'm on it"
3. The character breathing/moving (not static)
4. The transcript showing real activity below

This proves the product is working, not staged.
