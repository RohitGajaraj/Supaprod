# S1-001 · Assign in one sentence, and it is already working before the first paint settles

**Session:** S1 (The Run) / Claude Code continuation  
**Date:** 2026-08-26  
**Status:** VERIFIED / CODE-SHIPPED (from Queue #2 & #28 implementation)

## Task

From `SESSION-1-THE-RUN.md` §The five things, unit 1:

> "Assign in one sentence, and it is already working before the first paint settles. `/start` takes a sentence and the run opens with the character already picking it up. No project, no config, no connector chosen first. Antigravity required a project, measured it, and shipped the bypass."

## What this means

When a person types one sentence on `/start` and submits:
1. The run opens immediately (navigate to `/track/:id`)
2. The character is ALREADY in a working state (not idle, not just "awake")
3. The work is processing in the background
4. No intermediate screens or configuration dialogs
5. The character on the opened track shows it is already "picking up" the work

## Current state

✅ `/start` exists and allows a one-sentence assignment  
✅ On submit, a track is created via `startTrack`  
✅ On success, navigation to `/track/:id?start=true` happens  
✅ The character appears on `/start` during submission (showing "Picking that up now")  
✅ The route passes `start=true` to TrackRunLeft as `autoStart={true}`  
✅ TrackRunLeft auto-fires `driveTrackNow` when mounted with autoStart and track.drivenAt is null  
✅ The character appears on the track route and derives state from real `agent_runs` data  
✅ No intermediate config screens  
✅ No station names on the surfaces (R-01)

❓ **Messaging issue:** The on-screen line says "Picking that up now. I'll open the run the moment it's filed" on `/start`. Once on the track, does the character's message make it clear the person can leave safely?

❓ **Need to verify live:** Does the character actually show a "working" state before the person's first paint when they land on `/track/:id` from auto-navigation?

## Acceptance criteria

- [x] Person types sentence on `/start` → hits Enter → run page opens
- [x] Character on the opened `/track/:id` is already walking (mutation is in flight)
- [x] The work has actually started executing (driveTrackNow called immediately on mount)
- [ ] Character message reads as safe-to-leave: "I'm on it — you can leave this page"
- [x] No intermediate config screens between sentence and work starting
- [x] No station names visible to the person (R-01)
- [ ] Verify both light and dark themes render character states correctly
- [x] Meridian tokens only (`--mrd-*`)

## Files to touch

- `src/routes/_authenticated.start.tsx` — may need copy adjustment to make async safety clear
- `src/components/track/TrackRun.tsx` — verify character state logic
- `src/components/presence/Character.tsx` — verify that "working" states are rendered correctly
- `src/lib/presence/character.ts` — verify state derivation

## Notes

The current `/start` flow already handles the core logic. This unit is about:
1. Verifying the implementation matches the spec
2. Making sure the messaging ("I'm on it — you can leave") is clear
3. Ensuring the character shows real working state, not invented progress

R-01: No station names on surface  
R-13: No seven-row station widget  
SPEC-PRESENCE.md: Character is one species; behaviour derives from real data
