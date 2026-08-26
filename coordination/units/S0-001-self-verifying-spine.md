# S0-001 · Self-verifying spine — stations verify their own output before advancing

**Session:** S0 (Conductor)  
**Date:** 2026-08-26  
**Status:** SPECIFICATION / HIGH PRIORITY

## The Problem (from research)

**Research finding:** Replit builds *and verifies* before you see it. Devin rereads its own error, fixes and reruns. Codex returns a PR that already passed checks.

**Supaprod's defect:** Stations produce and advance regardless of whether what they produced is any good. This is the mechanism behind the ~46-track `sense` graveyard and why `entry_station='sense' AND station='learn' AND waived='[]'` has returned 0 for three months.

**Why this matters:** The seven stations have been walking a lifecycle for months, but nothing stops them from producing garbage and passing it downstream. The next station built on that garbage also produces garbage, and the loop never recovers.

**Research verdict (§3.1):** This is "the highest-value single change available to this product."

## The Solution: Devin's Self-Debug Loop Applied to the Spine

Instead of:
```
sense → produce signals → (hold or) advance to discover
discover → cluster signals → (hold or) advance to decide
...
```

We need:
```
sense → produce signals → CHECK signals → if bad, retry with failure in context → (hold or) advance
discover → cluster signals → CHECK clusters → if bad, retry with failure in context → (hold or) advance
...
```

The pattern Devin uses:
1. Do the work
2. Reread the output  
3. Verify it against the task
4. If it fails the check, include the failure in the next prompt and retry
5. If it passes, advance

## What Needs to Change

### 1. Station briefs in `src/lib/spine/driver.ts`

Each station's brief needs a self-check prompt:
- What success looks like for this station
- How to evaluate the output (quantity, quality, completeness)
- What to do if it fails (retry with the failure in context)

Current briefs are at:
- Sense: line 101-109 (find signals)
- Discover: line 135-145 (cluster signals)
- Decide: line 891 (record decision)
- Define: line 164-173 (write spec)
- Design: line 178-186 (draft design)
- Build: line 206-215 (stage code)
- Ship: line 303-312 (deploy)
- Learn: line 318-327 (record outcome)

### 2. Tool calling logic in driver.ts / station execution

The `driveTrackOnce` function or the station execution loop needs:
- After a station's main work completes, add a self-verification step
- If verification fails, modify the context and re-prompt with the failure
- Track how many self-retries have occurred (don't infinitely loop)
- Only advance if the check passes OR attempts exceeded

### 3. `MAX_STATION_ATTEMPTS` behavior

Currently, a station that hits `MAX_STATION_ATTEMPTS` dies at that station.

New behavior:
- If a station is failing its own check repeatedly, that's different from "can't call a tool"
- A self-check failure is a recoverable error (retry with context)
- A tool refusal is a terminal error (wait for human)
- These should use different hold reasons

### 4. Test coverage

Verify the self-check loop works for:
- Sense: did we find signals? (count > 0, or specific patterns)
- Discover: did we cluster them? (clusters > 1, signal counts match)
- Decide: did we record a decision? (has alternatives_considered, forecast fields, claim text)
- Define: did we write a spec? (has sections, is not a repetition of previous)
- Design: did we draft a design? (has components, is not a repetition)
- Build: did we stage changes? (has files, changes are not empty)
- Ship: did we deploy? (deployment status is live, URL works)
- Learn: did we record the outcome? (has verdict, measured result exists)

## Impact on the loop

Once this is live:
- Sense station can verify it found real signals (not re-wordings of the assignment)
- Discover can verify signals actually clustered (not just listed)
- Decide can verify a decision was recorded with a forecast
- Define can verify a spec was actually written
- Build can verify code actually staged and merged
- Learn can verify an outcome was recorded

This breaks the ~46-track graveyard cycle where honest work read as producing nothing because the fold returned `ids: []`.

## Acceptance criteria

- [ ] Each station has a self-check prompt in its brief
- [ ] driveTrackOnce has a verification step after main work
- [ ] Failed self-checks retry with the failure in context (like Devin)
- [ ] Self-check retries are bounded (not infinite)
- [ ] Terminal errors (tool refused) are distinguished from recoverable errors (self-check failed)
- [ ] Every station type can be tested with a self-check that would fail then pass
- [ ] Next `entry_station='sense' AND station='learn' AND waived='[]'` should return > 0
- [ ] Sense graveyard (~46 stuck tracks) can be retroactively evaluated

## Files to modify

- `src/lib/spine/driver.ts` — add self-check prompts to each station brief
- `src/lib/spine/track.functions.ts` (or driver itself) — modify `driveTrackOnce` to add verification step
- `src/lib/spine/route.ts` — possibly new hold reasons for self-check failures
- Tests: add scenarios where self-check would fail then pass

## Notes

This is a structural change to the spine itself, so S0 owns it exclusively. S1-S3 cannot touch `src/lib/spine/**`.

The founder's ruling stands: "if there is genuinely some gap in features, I authorise you to approve it, build it and fix it" — this is not a feature gap, this is a foundational bug fix that unblocks the entire loop.
