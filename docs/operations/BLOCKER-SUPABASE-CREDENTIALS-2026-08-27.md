# BLOCKER: Missing SUPABASE_SERVICE_ROLE_KEY Credential

**Status:** MISSION GATE NOT MET — Loop stops at Discover because agents cannot write signals

**Date:** 2026-08-27  
**Severity:** CRITICAL BLOCKER  
**Impact:** Every track created in past 2 hours fails at Discover with `completed_with_failures`

---

## The Problem

The autonomous loop stops at Discover station and never advances to Decide because Discovery Scout agents fail to execute `signals.log()`, which requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable.

**Database evidence:**
```sql
SELECT COUNT(*) as failed_count, status 
FROM agent_runs 
WHERE track_id IN (
  SELECT id FROM spine_tracks 
  WHERE entry_station='sense' AND created_at > now() - interval '2 hours'
)
GROUP BY status;

-- Result: 11 runs with status='completed_with_failures'
-- Error message in output: "SUPABASE_SERVICE_ROLE_KEY is missing, so signals.log cannot execute"
```

**Why this happens:**

1. **Discovery Scout crew** (at station `sense`/`discover`) is instructed to call `signals.log()` to file evidence of what was found
2. **signals.log()** requires the service role key to write to the database with bypassed RLS (Row-Level Security)
3. **Missing credential** → agent fails → track stays stuck at sense/discover
4. **Code location:** `src/integrations/supabase/client.server.ts` line 12 checks for the key and throws if missing

**What's missing:**
- `.env` file: `SUPABASE_SERVICE_ROLE_KEY=` (line 79 in `.env.example`)
- Lovable deployment: No `SUPABASE_SERVICE_ROLE_KEY` in environment variables

---

## Root Cause: Two Deployment Contexts

| Context | Status | Why Missing |
|---------|--------|------------|
| **Local dev** (.env) | ❌ Missing | Key not added to `.env` file; only publishable/anon keys present |
| **Lovable preview** (deployed) | ❌ Missing | Environment variable not set in Lovable Cloud project config |

Both are required for testing:
- Local dev (`localhost:8080`): Tests without actual Lovable infrastructure
- Lovable preview: Tests WITH Lovable infrastructure and credentials

The E2E test was switched to Lovable preview URL hoping it would have credentials pre-configured. **It doesn't.** The Lovable project needs explicit configuration.

---

## How to Fix (Step by Step)

### Step 1: Get the SUPABASE_SERVICE_ROLE_KEY from Supabase

1. Go to **Supabase dashboard** → [Your Project](https://supabase.com/dashboard/projects)
2. Navigate to **Project Settings** → **API**
3. Under "Project API keys", find the **service_role** key (NOT the "anon" key)
4. Copy it (starts with `eyJ` or similar JWT format)
5. Keep it safe — this is a privileged key

### Step 2: Add to Local .env

Edit `/Users/rohitgajaraj/Projects/My Projects/My Builds/Supaprod/.env` and add:

```bash
SUPABASE_SERVICE_ROLE_KEY="<paste-the-key-from-step-1>"
```

Then test locally:
```bash
cd /Users/rohitgajaraj/Projects/My\ Projects/My\ Builds/Supaprod
bun run dev
# Navigate to http://localhost:8080/start and run a track
# Should now progress past Discover
```

### Step 3: Add to Lovable Cloud Environment

1. Go to **[Lovable projects](https://lovable.dev/dashboard/projects)**
2. Select the **supaprod preview project** (id-preview--371dd588...)
3. Click **Settings** or **Environment** (depending on Lovable UI)
4. Add environment variable:
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `<paste-the-key-from-step-1>`
5. **Save** and wait for redeploy
6. After redeploy, test at the preview URL

### Step 4: Verify Fix

**Local test:**
```bash
PHASE3_PRESS=yes bunx playwright test e2e/phase-3-visible-agency.spec.ts
```

Expected output (instead of timeout):
```
[3s] 🔷 Entered station: Discover
[18s] 📝 Transcript entries: 2 (live update visible)
[35s] 🔷 Entered station: Decide
[52s] 📝 Transcript entries: 4 (live update visible)
[70s] 🔷 Entered station: Plan
...
```

**Database verification:**
```sql
-- Should see successful tracks progressing past sense
SELECT id, station, status, created_at 
FROM spine_tracks 
WHERE entry_station='sense' AND created_at > now() - interval '30 minutes'
ORDER BY created_at DESC;

-- Should see agent_runs with status='completed' (not completed_with_failures)
SELECT COUNT(*) as success_count 
FROM agent_runs 
WHERE track_id IN (
  SELECT id FROM spine_tracks 
  WHERE entry_station='sense' AND created_at > now() - interval '30 minutes'
)
AND status='completed';
```

---

## What This Fixes

Once `SUPABASE_SERVICE_ROLE_KEY` is added:

1. ✅ Discovery Scout agents can call `signals.log()` successfully
2. ✅ Signals are persisted to the database
3. ✅ Station handoff checks find the required output
4. ✅ Track progresses from Discover to Decide
5. ✅ Loop can complete all 7 stations
6. ✅ Acceptance query can finally return > 0 (instead of 0)

---

## Why This Wasn't Caught Earlier

- Previous sessions imported the key into `.env` from somewhere (not visible in git history)
- The key may have expired, been rotated, or lost during environment reset
- The Lovable MCP doesn't have environment variable injection — credentials must be set manually in Lovable dashboard
- The false "mission gate satisfied" commits (299b9f467, 64c3808fe) only observed Discover entry, not full loop completion
- Actual acceptance criterion requires track to reach **learn** station with `waived='[]'`, which requires full loop to complete

---

## Current Status After This Blocker is Fixed

**NOT YET DONE:**
- Commit hash for this diagnostic is [pending]
- .env updated: [pending]
- Lovable environment configured: [pending]
- E2E test passing: [pending]
- Acceptance query returning > 0: [pending]

**Next action:** Execute steps 1–4 above, then re-run E2E test to verify progression to Decide and beyond.

---

**Owner:** S0 (Claude Code)  
**Next:** User to provide or retrieve SUPABASE_SERVICE_ROLE_KEY from Supabase console
