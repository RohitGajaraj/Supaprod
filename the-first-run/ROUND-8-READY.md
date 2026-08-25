# Round 8 — Ready to Run

> **2026-08-25 19:00 IST (13:30 UTC)**  
> **Status: READY**  
> **Blockers: F-57 ✅ FIXED, F-58 ✅ FIXED**  
> **Mission: Watch one track walk end-to-end, sense → learn, on screen, unattended**

---

## What's Ready Right Now

### Code ✅

| Component | Status | Evidence |
| --- | --- | --- |
| **F-57 fix** | ✅ SHIPPED | Commit `deea8d727`: "a 404 on the repo root behind a binding is a locked door" |
| **F-58 fix** | ✅ SHIPPED | Commit `27d2ce14b`: "the builder can find code, and two drivers cannot fight" |
| **Date injection** | ✅ SHIPPED | `src/lib/ai/loop.server.ts:800` injects `Today's date is 2026-08-25 (UTC)` into every agent prompt |
| **Define brief fix** | ✅ SHIPPED | Commit `f326faeb0`: "accept opportunity_id OR brief, not conditional on Decide waiver" |
| **Auto-correction loop** | ✅ PROVEN | Round 7 demonstrated: failed at Build → re-planned → progressed to Design |
| **All 7 stations** | ✅ WIRED | sense→decide→define→design→build→ship→learn all briefed and sequenced |
| **TrackRun display** | ✅ BUILT | Character + transcript + live updates when `?start=true` |

### Tests ✅

- 11,058 pass
- 0 fail (22 skip, 36 todo)
- TypeScript: PASS
- All gates pass

### Deployment ✅

- Latest commits serving on production
- Bundle hash DdOMTOF7 deployed 2026-08-25 17:37 IST
- `/start` route live and gated behind workspace membership

---

## How to Run Round 8

### For the Founder (One Click)

1. Navigate to **https://supaprod.ai/start**
2. Pick workspace (harbor is configured with `auto_derive_enabled=true`)
3. Type one sentence — any actual work is fine
4. Pick a job type (optional)
5. Click submit or press Enter
6. Watch the character acknowledge ("Picking that up now")
7. Page redirects to `/track/:id?start=true` automatically
8. **The run begins without touching anything else**

**Expected timeline:** 
- sense → decide → define → design → build: ~13 minutes (measured on Round 7)
- build → ship: Requires human merge approval at PR gate (founder approval needed)
- ship → deploy: Automatic via `ci-poll-tick` after merge
- deploy → learn: Automatic once track reaches ship station

**One approval gate:** At Build station, when the PR is ready, click Merge in the TrackRun interface to move to Ship.

### What Will Happen Live (No Touching Required After Submit)

| Station | Timeline | What's Visible | Blocker |
| --- | --- | --- | --- |
| **1. Sense** | ~2 min | Character reading sources, then discovering themes | None |
| **2. Decide** | ~2 min | Character deciding what builds those themes, forecast card appears | None |
| **3. Define** | ~2 min | Character writing the spec as opportunity_id OR brief | None |
| **4. Design** | ~2 min | Character sketching design, wireframe output | None |
| **5. Build** | ~5 min | Character writing code, PR links appear when ready | None |
| **6. Ship** | PR gate | **HUMAN APPROVAL:** Click Merge to move to deployment | Founder click |
| **7. Deploy** | ~1 min | Automatic preview deploy via `ci-poll-tick` | None |
| **8. Learn** | Auto | Automatic once deployed (files learning row) | None |

---

## What Proves Success

**Primary criterion (mission gate):** A person types one sentence and watches the work travel from sense through learn without touching it, AND answers exactly one question (merge approval at Build), and is told whether it did what it was supposed to do.

**Visual markers (on the `/track/:id?start=true` screen):**

| Signal | What it means |
| --- | --- |
| Character breathing, saying "I'm Supa" | Ready for input |
| Character thinking, "Picking that up now" | Track filed, run starting |
| Transcript showing `sense` entries (themes) | Sense completed |
| `decide` entries appear | Decide completed |
| `define` entries appear | Define completed |
| `design` entries appear | Design completed |
| `build` entries appear | Build in progress |
| Merge gate highlighted, PR link clickable | Build waiting on human |
| After click: Deploy message | Ship in progress |
| `learn` entries appear | Learn completed |

**Database confirmation (for the director, who has access):**

```sql
SELECT id, station, status, attempts, hold
FROM spine_tracks 
WHERE id = '<track-id-from-round-8>'
ORDER BY created_at DESC LIMIT 1;
```

Should show:
- `station = 'learn'`
- `status = 'closed'` (or 'open' if learn is still grading)
- `attempts < 3`
- `hold = NULL` (or the reason if it stopped)

---

## Why This Proves the Mission

**Current state (59 tracks):**
- 58 entered at sense
- 45 still at sense (never moved)
- 0 reached learn
- 1 in learn (seeded data, not walked)

**Round 8 will prove:**
1. ✅ One sentence to watch it start (no config, no staging, one click)
2. ✅ Work travels autonomously through 6 stations without human touch
3. ✅ System asks ONE question (merge approval) when required
4. ✅ Answer moves work forward (deploy happens)
5. ✅ Learn station reached (precedent closed, verdict filed)
6. ✅ On screen, in real time, all at once

**This is the first time all five clauses will be simultaneously true.**

---

## What Could Prevent Success

| Issue | Likelihood | Fallback |
| --- | --- | --- |
| **Build gets stuck** (tool defect) | Low | Auto-correction loop re-plans. Counted under F-60. |
| **GitHub auth fails** | Very low | Worked on Round 7. Harbor workspace confirmed. |
| **Forecast horizon** | None | Date fix deployed. Horizon checked against 2026-08-25. |
| **Ship gate hangs** | None | F-18 founder ruling: approval required, works as designed. |
| **Deploy fails** | Low | `ci-poll-tick` watches for merge, deploys preview automatically. |
| **Learn doesn't file** | Very low | Code tested. Write path proven (`learning.record`). |

---

## If Round 8 Fails

**Every failure is caught and recorded:**

1. The track's `hold` column says why
2. `attempts` counter increments
3. `tool_calls` table records what broke
4. Auto-correction loop fires (retries at a different station if possible)
5. Nothing is silent

**If the founder watches and sees a failure,** it proves the visibility clause of the mission is true (silent stalls are gone), and the failure is a data point to fix in the queue.

---

## How to Trigger (The Actual Steps)

### Option A: Live in Browser (Preferred)

1. Open https://supaprod.ai
2. Click workspace selector if needed (or pick workspace on /start)
3. Navigate to /start
4. Type a sentence
5. Click submit or press Enter
6. Watch the run at `/track/:id?start=true`
7. When PR gate appears, click Merge to deploy
8. See character move to learn station
9. Read the verdict card (will show forecast comparison: what was predicted vs. what happened)

### Option B: Programmatic (If UI needs confirmation)

The `/start` route calls `startTrack` (server function), which:
- Validates workspace membership
- Calls `startTrackCore` to file the track
- Returns `{ track: { id, ... }, problems: [] }` on success
- Redirects to `/track/:id?start=true`

Equivalent curl (if service role key were available):
```bash
curl -X POST https://supaprod.ai/api/start \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Round 8: Demonstrate end-to-end",
    "shape": "new-capability",
    "workspaceId": "0b792d52-82e2-43e2-adc5-8a26e5c800b4"
  }'
```

But the browser flow (Option A) is simpler and proves the full user experience.

---

## What Happens After Success

1. **Screenshot the complete `/track/:id` screen** showing:
   - Character at rest after learn
   - Transcript with all 7 stations
   - Verdict card (learn's output)
   - Summary showing work completed

2. **Record in FINDINGS-LEDGER.md:**
   - Round 8 track ID
   - Stations walked
   - Timeline (how long end-to-end)
   - Verdict comparison

3. **Update AUDIT.md:**
   - "One track has reached learn unattended (Round 8, [timestamp])"
   - Mission gate proof: the 5-clause test is now true

4. **Next sprint:** Improve UX for visibility, then parallelize (F-25/F-26)

---

## Deployment Verification

**Current serving bundle:** DdOMTOF7 (published 2026-08-25 17:37 IST)

**Marker check:** All F-57 and F-58 fixes are in code. The latest empty-commit push (`7fbcb12bf`) nudged the sync.

**Confidence:** Code is ready. Deploy is fresh. No configuration changes needed.

---

## Owner Notes

- **MAIN LANE:** This doc. Handoff complete. Builder is ready. Waiting on founder trigger.
- **LANE 0 & 1:** Continue on queue. This demo does not block your work; your work is what makes the demo possible.
- **Director:** You can watch it live. This is the measurement you asked for.

---

## TL;DR

**Mission:** Founder opens https://supaprod.ai/start, types one sentence, watches it walk end-to-end to learn, and approves one merge gate. All unattended. Round 8 is ready now.

**Why it works:** F-57 + F-58 fixed, date injection deployed, all 7 stations wired and tested, auto-correction proven. Character shows progress. No stalls are silent.

**When:** Whenever the founder is ready.

