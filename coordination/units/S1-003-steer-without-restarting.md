# S1-003 · Steer without restarting

**Session:** S1 (The Run)  
**Date:** 2026-08-26  
**Status:** RESEARCH PHASE

## Task

From `SESSION-1-THE-RUN.md` §The five things, unit 3:

> "Steer without restarting. One instruction back into work that is still moving — *"the empty state is wrong"* — taken mid-flight. Undo a step, not the run. Take a step over by hand and hand it back. If the only controls are Start and Stop, this is a batch job."

## What this means

While a run is actively working, the person should be able to:
1. **Interrupt with new direction** — send a message/instruction mid-flight without losing work
2. **Undo a step** — revert the last action without restarting the whole run
3. **Take over and hand back** — do a piece of work yourself mid-flight and hand it back to the agents
4. **No restart tax** — these operations don't waste the work already done or spend money re-doing settled steps

This is what separates "agentic partner" from "batch job that you watch."

## Current state

Looking at TrackRun.tsx, the controls available are:
- ✅ "Run it now" — starts the walk (or continues if paused)
- ✅ "Stop" — pauses the walk
- ❓ Retry controls on holds — can release a specific hold
- ❌ "Interrupt with new direction" — not implemented
- ❌ "Undo last step" — not implemented
- ❌ "Take over manually and hand back" — not implemented

## What's missing

1. **An interrupt mechanism** — a way for the person to send a mid-flight instruction (like "the empty state is wrong, fix it")
2. **Undo UI** — a way to undo the last completed step without restarting the whole run
3. **Manual take-over** — a way to do a piece of work yourself (edit the spec, revise the design) and hand it back
4. **Hand-back mechanism** — resuming the run after manual work

This is a complex feature set. Let me research what's currently possible and what would need to be built.

## Files to investigate

- `src/components/track/TrackRun.tsx` — the control panel
- `src/lib/spine/track.functions.ts` — the available server functions
- `src/lib/spine/driver.ts` — the station logic (can we skip/redo steps?)
- `src/routes/_authenticated.track.$trackId.tsx` — the page structure

## Acceptance criteria

This unit will likely be split into smaller units for each capability. For now, document what's possible today and what would need implementation.

- [ ] Document current control capabilities
- [ ] Identify which steering features are already possible (e.g., mid-walk retries)
- [ ] Identify which features need new server functions
- [ ] Identify which features need new database schema
- [ ] Prioritize which features to build first
