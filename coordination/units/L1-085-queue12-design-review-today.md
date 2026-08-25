# UNIT L1-085 — Queue 12: Design review - Today (`_authenticated.today.tsx`)

**Lane:** LANE 1 · **Review of:** Post-auth landing page · **Rubric:** R-12 five questions · **Date:** 2026-08-26

## R-12 Question 1: Who is here, and what did they come to do?

**Answer:** An operator who ran agents overnight while away. Came to ask: "What happened while I wasn't watching, and what needs my attention right now?"

The Today page is the **morning brief for an operator**, not a dashboard. It answers the question in triage order: what costs the most to delay, what needs your decision first, and what's already moving.

## R-12 Question 2: The ONE thing this surface exists for

**Answer:** Allocate attention. An operator's cognition is the limiting resource. This surface TRIAGES BY EXCEPTION — it tells you what NOT to show — because "review everything" is not an answer when four agents run in parallel.

(From the file's own header: "The binding constraint on an agentic product is not screen space, it is human cognition — an operator running four agents in parallel is spent by 11 a.m.")

## R-12 Question 3: Keep / Move / Kill, per region

| Region | Status | Reasoning |
|--------|--------|-----------|
| **Morning greeting + counts line** | ✅ KEEP | Carries the whole morning in one sentence: "X decisions ready for review, Y runs stuck." Spoken in operator's vocabulary (measured frequency across 5.72M words). Highest-leverage element. |
| **Forecasts (Calibration)** | ✅ KEEP | Evidence the loop is learning: what was predicted vs. what happened. Part of the ONE thing (what happened). Deserves to be seen. |
| **Decision queue (approvals)** | ✅ KEEP | Most time-sensitive: a gate call blocks a run. Sorted by cost-to-undo (gates first, then runs blocked on you, then live runs, then finished). |
| **Missions (running, stuck, shipped)** | ✅ KEEP | Grouped by whose move it is (not by object type). States the verb beside each row: answers "so what do I do?" at a glance. |
| **Quiet morning state** | ✅ KEEP | "Nothing is waiting on you" is the best sentence the product can show. Teaching space when stakes are low. Intentional quiet. |
| **Workspace list** | ⚠️ MOVE or REVIEW | The workspace switcher belongs on the shell / rail, not as a block on the page. Today's job is triage, not admin. If it must be here, scope it differently (e.g., "Quick switch" context). |

**Regions nobody can name a job for:** None identified. Every visible region answers a clear question in the triage flow.

## R-12 Question 4: Which Meridian component per region

| Region | Component | Name | Notes |
|--------|-----------|------|-------|
| **Greeting + counts** | `PageHeading` + prose | Surface-parts | ✅ Correct. The line is prose because it needs operator vocabulary, not a standardized label. |
| **Forecasts** | `Region` (titled) + `Reading` (list) | Surface-parts | ✅ Correct. `Reading` is the right list carrier; `Region` frames the context. |
| **Decision queue** | `Region` (titled) + `Action` (rows) | Surface-parts | ✅ Correct. `Action` for each decision; `Region` as context. |
| **Missions (AgentInbox)** | `Region` (titled) + `Reading` + `RunState`/`ShippedState` | Surface-parts + custom | ✅ `Region` + `Reading` for structure; custom `RunState`/`ShippedState` components for verbs + state display. Meridian contract maintained. |
| **Quiet morning** | `QuietMorning` (custom) | Today-specific | ✅ Custom component, appropriate for this special state. No generic Meridian equivalent needed. |
| **Workspace list** | `Region` (titled) + `Door` (links) | Surface-parts | ⚠️ If it stays: correct structure. But recommend moving to shell or re-scoping. |

**Checked first but did not serve:** None identified. All components used are correct for their regions. No unadopted Meridian components could replace what is here.

## R-12 Question 5: Can a person DO something here?

| Region | Actionable | What |
|--------|-----------|------|
| **Forecasts** | ✅ YES | Click through to the forecast detail; review/update the resolution |
| **Decision queue** | ✅ YES | `Action` buttons on each row: approve/reject/snooze decisions; open runs from missions |
| **Missions** | ✅ YES | `Action` buttons: open a run, cancel a mission, retry a stuck run |
| **Quiet morning** | ❌ NO (by design) | This state is read-only, intentionally. Teaches names while stakes are low. |
| **Workspace list** | ✅ YES | `Door` links switch workspaces |

**Verdict:** This surface is NOT write-heavy, which is correct. It is a **triage surface**, not a command center. The operator's moves are: open something (a run, a forecast, a decision), take an action (approve/reject/snooze), or switch context (workspace). All three are present.

---

## Summary for LANE 1

The Today page **passes R-12** with one caveat:

**Passes:** The design is coherent. Regions are named by whose move it is (not by object type). Every element earns its place by serving the triage question. Meridian components are correct. The surface is appropriately read-heavy, not write-heavy.

**Caveat:** Workspace switcher should be reviewed — does it belong on the operator's morning brief, or should it move to the shell/rail? If it moves, the page becomes even cleaner.

**Next:** Queue #2 (`/start`) replaces this as the post-auth landing once it has full feature parity. This review governs that replacement, ensuring the new entry point maintains the triage discipline.

---

## Gates

- No code changes in this unit
- Review-only verification unit
- All findings recorded for LANE 1 reference
