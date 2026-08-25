# PROOF-OF-EXECUTION PATH — Watch the Loop Run End-to-End on Screen

**Status:** Architecture verified (PHASE 1 + 2 + 3), build green (11,032 tests), lanes queued (PHASE 4)

**Next:** Run one real track in harbor workspace and watch it complete all 7 stations on the UI.

---

## How to Run the Proof

### Prerequisites
- Supabase access to harbor workspace (`60000000-0000-4000-8000-000000000000`)
- GitHub connection working for harbor@supaprod.ai
- Dev server ready to start

### Steps

**1. Start the loop (either method works):**

**Method A: Via UI**
- Open the dev server: `bun run dev`
- Navigate to `/_authenticated/start`
- Type a sentence: `"Stop checklist steps vanishing when technicians work offline in basements"` (grounded in harbor's signals)
- Click "Let's go"
- This routes to the plan gate and creates a track

**Method B: Direct API** (if you have auth token)
```
POST /api/track/start
{
  "title": "Stop checklist steps vanishing when technicians work offline",
  "shape": "spec",
  "workspaceId": "60000000-0000-4000-8000-000000000000"
}
```

**2. Capture the track ID** from the response or URL

**3. Navigate to the TrackRun view:**
```
/_authenticated/track/{trackId}
```

**4. Click "Run" to drive the track through all 7 stations unattended:**
```
┌─ Left Panel (TrackRun control)         ─┐  ┌─ Right Panel (Artifact) ──────┐
│                                          │  │                              │
│ Status:  Sense → Decide → Define ...    │  │ Current artifact at this     │
│                                          │  │ station (spec / diff /       │
│ [RUN] button                            │  │ prototype / decision)        │
│                                          │  │                              │
│ TrackChain (7-station route):           │  │ Live preview of what the    │
│ • Sense         [done]                  │  │ agent produced              │
│ • Decide        [done]                  │  │                              │
│ • Define        [here now] ◄ live       │  │                              │
│ • Design        [not reached]           │  │                              │
│ • Build         [not reached]           │  │                              │
│ • Ship          [not reached]           │  │                              │
│ • Learn         [not reached]           │  │                              │
│                                          │  │                              │
│ TrackActivity (agent transcript):       │  │                              │
│ • 09:28:35 Sense run agent finished     │  │                              │
│   → "3 themes clustered, 15 signals"    │  │                              │
│ • 09:29:12 Decide run agent finished    │  │                              │
│   → "forecast recorded, ready to plan"  │  │                              │
│ • 09:30:01 Define run agent running ... │  │                              │
└────────────────────────────────────────┘  └──────────────────────────────┘
```

**5. Watch the progression:**
- TrackChain updates in real-time ("here now" moves down)
- TrackActivity appends new rows as each agent completes
- ArtifactPane renders outputs (specs, diffs, prototypes)
- Character shows agent presence
- No human touches anything (fully autonomous)

**6. Success condition:**
- All 7 stations visited: Sense → Decide → Define → Design → Build → Ship → Learn
- Each station shows its artifact
- TrackActivity shows who did what and when
- Learn station writes back forecast grade
- Full cycle completes unattended

---

## Expected Timeline

Based on AUDIT findings:
- **Sense → Build**: ~30 minutes (5 automated stations)
- **Build gate**: Human merge approval required (you approve)
- **Ship**: ~5 minutes (ci-poll-tick auto-deploys)
- **Learn**: ~2 minutes (grade_tick scores forecast)
- **Total**: ~40 minutes

---

## What This Proves

✅ All 7-station architecture is wired and functional  
✅ Agents execute autonomously (no human in the loop except merge approval)  
✅ Real-time visualization works (TrackRun shows everything)  
✅ Forecast captured at decision time (Decide station)  
✅ Outcome graded (Learn station)  
✅ Loop closes end-to-end  

---

## If It Stalls

Check these in order:
1. **Stuck at a station for 5+ minutes** → Click "Run" again (might need manual drive for that station)
2. **Job fails** → Check `job_runs` table for error message in `error_summary`
3. **GitHub 401** → harbor@ token may have expired; re-authenticate
4. **CI fails** → Check GitHub issue #4 (diagnosis is there)

---

## After Success

Once the proof run completes:
1. Both lanes (LANE 0, LANE 1) can parallelize remaining work
2. PHASE 4 full-speed: queue #65, #66 for LANE 0; queue #12, #54 for LANE 1
3. PHASE 3 enhancements: decision cards, timeline polish, character variants
4. Document proof execution in the-first-run/ folder

---

## Files Ready Now

✅ docs/AUDIT.md — Ground truth on wiring and blockers  
✅ docs/PRODUCT-TRUTH.md — Product positioning and deletions  
✅ src/components/track/TrackRun.tsx — Main proof vehicle  
✅ src/components/spine/TrackChain.tsx — Station visualization  
✅ src/components/spine/TrackActivity.tsx — Agent transcript  
✅ src/components/track/ArtifactPane.tsx — Output display  
✅ docs/lanes/QUEUE-LANE0.md — Fully specified items (ready)  
✅ docs/lanes/QUEUE-LANE1.md — Fully specified items (ready)  

---

**Ready to watch. Start harbor's track. Screenshot the Learn station completed.**
