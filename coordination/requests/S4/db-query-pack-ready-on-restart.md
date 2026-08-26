S4 -> S0 / next S4 session · every DB question I owe, ready to paste · filed 2026-08-27

## Why this file exists

The Lovable plugin IS installed (`lovable@claude-plugins-official`, 2026-08-26T18:39:31Z) and
`claude mcp list` reports `plugin:lovable:lovable — ✔ Connected`. But `ToolSearch "+lovable"` returns
NO tools, because the plugin landed AFTER this session started. CLAUDE.md documents exactly this:
"MCP added mid-session needs a restart. `claude mcp list` reporting Connected is not evidence THIS
session can call it. Verify with ToolSearch." Confirmed true, with a concrete instance.

So: the moment a session starts with the plugin live, run these. Every one is a question a verdict
of mine is currently blocked on. All are READ-ONLY.

---

## 1 · STANDING QUESTION 1 - the acceptance, and ask it in the RIGHT form

S4-025 found CLAUDE.md and OPERATING-MODEL §2 carry DIFFERENT queries for this number. Ask the
operating model's form, and then ask 1c, which is the one that says WHY the answer is what it is.

```sql
-- 1a. the plain form (known to return a misleading 1: F-79)
SELECT count(*) FROM spine_tracks
WHERE entry_station='sense' AND station='learn' AND waived='[]';

-- 1b. the honest form from OPERATING-MODEL §2 (expected 0)
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station='sense' AND station='learn' AND waived='[]'
)
SELECT count(*) FROM walked w
WHERE w.id NOT IN (SELECT m.track_id FROM spine_track_members m
                   JOIN agent_approvals a ON a.mission_id = m.artifact_id
                   WHERE a.decided_at IS NOT NULL)
  AND w.id NOT IN (SELECT entity_id FROM stage_events
                   WHERE driven_via IS DISTINCT FROM 'sweep');

-- 1c. WHY each walked track is excluded — provenance, not a guess (S4-025 §4).
--     Separates "a person pressed it" from "the column is newer than the run".
WITH walked AS (
  SELECT id FROM spine_tracks
  WHERE entry_station='sense' AND station='learn' AND waived='[]'
)
SELECT w.id,
       count(*) FILTER (WHERE e.driven_via = 'sweep')                               AS driven_by_sweep,
       count(*) FILTER (WHERE e.driven_via IS NULL)                                 AS provenance_unknown,
       count(*) FILTER (WHERE e.driven_via IS NOT NULL AND e.driven_via <> 'sweep') AS pressed_by_hand
FROM walked w
LEFT JOIN stage_events e ON e.entity_id = w.id AND e.entity_type = 'spine_track'
GROUP BY w.id;
```

**Do not report a non-zero from 1a as the acceptance.** Check 1c first.

---

## 2 · S4-026 - has the verdict email path EVER fired?

The chain is built and briefed (Learn → learning.record → dispatchVerdictEmail → Resend) and cannot
deliver because RESEND_API_KEY is absent. This says whether it has ever had an event to carry.

```sql
SELECT count(*) FROM learnings WHERE recorded_by_agent_slug IS NOT NULL;
SELECT count(*) FROM tool_calls WHERE tool_name = 'learning.record';
SELECT count(*) AS email_verdict_col_exists FROM information_schema.columns
WHERE table_name='user_notification_preferences' AND column_name='email_verdict';
```

---

## 3 · S4-033 - does the "step 6 of 8" overstatement actually bite?

STEP_DONE contains "skipped" (delegate-desk.ts:138-151). If skipped steps are rare this is nearly
harmless; if common it is a standing overstatement on every board row.

```sql
SELECT status, count(*) FROM mission_steps GROUP BY status ORDER BY 2 DESC;
```
(if the table is named differently, the one the board reads via `plan.data.missions[].steps`)

---

## 4 · S4-021 §5 - the connector upsert I could NOT settle

`product-binding.functions.ts:319-331` upserts with no `onConflict` while uniqueness is enforced by
partial indexes on other columns. I could not execute this and refused to claim it.

```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename='connection_bindings';
-- and the live shape of the F-101 row:
SELECT id, provider, resource_kind, resource_id, resource_label, product_id, workspace_id
FROM connection_bindings WHERE provider='github';
```

---

## 5 · S4-028/034 - the brain numbers the landing page contradicts

The public Replay credits "Brain" with a precedent "right 3 of 4 times, D+14 +9%, Confidence 84%".
These are the numbers that say whether any of that is real yet.

```sql
SELECT count(*) AS total, count(*) FILTER (WHERE is_seed) AS seed FROM learnings;
SELECT count(*) FROM learning_citations;
SELECT count(DISTINCT date_trunc('microsecond', created_at)) AS distinct_microseconds,
       count(*) AS rows FROM learning_citations;
SELECT count(*) FROM decisions WHERE cited_by_count > 0;
```

---

## 6 · Still open from earlier sessions, re-listed so they are not lost

```sql
-- the 10 phase-3 press tracks: confirm they are abandoned and taking no sweep slots (F-89)
SELECT status, count(*) FROM spine_tracks
WHERE title = 'PHASE 3: Verify visible agency works' GROUP BY status;

-- open tracks past the F-43 drive ceiling, which F-99 says is why nothing finishes
SELECT id, station, attempts, station_drives, last_hold FROM spine_tracks
WHERE status='open' ORDER BY station_drives DESC LIMIT 15;
```

---

## The rule that applies to every answer above

**A number without its query is not evidence.** Paste the query beside the number, and the `now()`
the query ran at, per the UTC/IST rule that once turned "four minutes ago" into "yesterday".
