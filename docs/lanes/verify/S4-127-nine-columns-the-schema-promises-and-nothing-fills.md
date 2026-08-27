# S4-127 · Nine columns the schema promises and nothing has ever filled

> _S4, 2026-08-27. The schema equivalent of an orphaned function: a column that is NULL on every row
> is a promise the database makes that no code keeps._

## The method

```sql
SELECT key, count(*) FROM <table> t, jsonb_each(to_jsonb(t))
GROUP BY key HAVING count(*) FILTER (WHERE value = 'null'::jsonb) = count(*);
```

Every column, every row, no column list to keep up to date.

## What came back

| table | rows | columns NULL on every row |
| --- | --- | --- |
| `decisions` | 369 | `forecast_deferred_at`, `forecast_next_check_at`, **`forecast_resolved_by_agent_slug`** |
| `prds` | 119 | `outcome_deferred_at`, `outcome_suggestion` |
| `spine_tracks` | 106 | `last_hold_because`, `project_id`, `spend_cap_usd` |
| `learnings` | 135 | `product_id` |

## Five of the nine are one story, and it is `S4-063`'s

**The grading lifecycle exists in the schema and has never run, at both ends.**

- `decisions.forecast_next_check_at` — **when to look at this forecast again.** Never scheduled.
- `decisions.forecast_deferred_at` — **this forecast was put off.** Never deferred.
- `decisions.forecast_resolved_by_agent_slug` — **who graded it.** Never attributed, on any of the
  91 resolutions.
- `prds.outcome_deferred_at`, `prds.outcome_suggestion` — the same two ideas at the outcome end.

Somebody designed a full lifecycle for grading a prediction: check it later, defer it, record who
settled it, suggest an outcome. **Nine columns of intent, and the product has never used one of them.**

`S4-063` reached this from the brief — Learn's seats are never told what was forecast, so nothing
grades it. **This reaches the same conclusion from the schema, with no shared evidence.**

## The other four, each different

- **`spine_tracks.last_hold_because`** — **not a finding.** S0 added it tonight in `33edbd6a6` so a
  conflicted merge names itself on the track instead of dying in a log. It is NULL on all 106 because
  the code that fills it is not deployed. **This is what a correctly-ordered migration looks like the
  day before its code ships**, and it should be checked again after the deploy rather than now.
- **`spine_tracks.spend_cap_usd`** — never set on any track, which sits beside `S4-105`: 10 of 14
  budget rows have no cap either. **There is no ceiling anywhere in this system today**, at the track
  level or the budget level.
- **`spine_tracks.project_id`** and **`learnings.product_id`** — the scoping columns. Nothing ties a
  track to a project or a learning to a product, which is worth holding beside `S4-055`: nine of ten
  users see unlabelled demo data in their open-work list, and the columns that would let a surface
  filter by product are empty.

## What I am not claiming

- **An always-NULL column is not automatically dead.** `last_hold_because` proves it: one of the nine
  is a migration landing ahead of its code, exactly as it should.
- **I surveyed four tables**, chosen because they carry the loop's own artifacts. There are dozens
  more.
- **NULL on every row is not the same as unwritten.** A column written and then cleared would look
  identical, and nothing here distinguishes them.
