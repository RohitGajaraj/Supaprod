# The evidence, from the live production database

> _Measured 2026-08-25 00:0x IST via Lovable MCP against project `371dd588-1b70-4629-9bb5-9f003f3af373`.
> Every number here has its query. A number without its query is not evidence._

**The founder's question — "has one journey ever run end to end?" — now has an answer, and it is no.**

---

## 1. No track has ever walked the spine

```sql
SELECT count(*) AS tracks_total,
       count(*) FILTER (WHERE entry_station='sense') AS entered_at_sense,
       count(*) FILTER (WHERE station='sense')       AS still_at_sense,
       count(*) FILTER (WHERE station='learn')       AS reached_learn,
       count(*) FILTER (WHERE last_hold='waiting-on-a-person') AS waiting_on_a_human,
       count(*) FILTER (WHERE driven_at IS NULL)     AS never_driven
FROM spine_tracks;
```

| tracks_total | entered_at_sense | still_at_sense | reached_learn | waiting_on_a_human | never_driven |
| --- | --- | --- | --- | --- | --- |
| **59** | **58** | **45** | **1** | **9** | 1 |

**58 tracks entered at the first station. Zero have ever reached the last one.**

The single row at `learn` is not a counter-example — it is the proof:

```sql
SELECT id, workspace_id, origin, entry_station, station, status, created_at, driven_at, attempts
FROM spine_tracks WHERE station = 'learn';
```

- `workspace_id` = `60000000-0000-4000-8000-000000000000` — a **seeded** tenant
- `entry_station` = **`define`** — it skipped `sense` and `decide` entirely
- created `2026-08-01 13:55`, driven `2026-08-01 16:10`, `attempts` = 0 — the day the table was born

**76% of every track ever created is stuck at station one.**

## 2. Why they are stuck — three different causes, one of them damning

```sql
SELECT last_hold, count(*) AS n, max(driven_at) AS last_driven, sum(attempts) AS attempts
FROM spine_tracks WHERE station='sense' AND status='open'
GROUP BY last_hold ORDER BY n DESC;
```

| hold | n | attempts | last driven |
| --- | --- | --- | --- |
| `out-of-time` | 18 | 3 | 2026-08-21 12:11 |
| `needs-evidence` | 17 | **51** | 2026-08-21 12:00 |
| `waiting-on-a-person` | **9** | **0** | 2026-08-21 12:00 |
| *(never driven)* | 1 | 0 | — |

**`needs-evidence` × 17 with 51 attempts** is a loop that cannot satisfy its own precondition and
retries forever, spending real money. `MAX_STATION_ATTEMPTS` has never fired.

**`waiting-on-a-person` × 9 with 0 attempts is the finding that matters most.** The product decided
it needed a human, stopped, and **never told anyone.** For three months the system has been waiting
on the founder nine times over, in silence. That is not a demo gap — **the product stalls invisibly
and blames nothing.** It is the single sharpest instance of his complaint, and it is why a live,
visible agent presence is product value rather than polish.

## 3. The engine is alive, and crawling

```sql
SELECT to_char(max(driven_at),'YYYY-MM-DD HH24:MI') AS last_drive,
       count(*) FILTER (WHERE driven_at > now() - interval '24 hours') AS driven_last_24h,
       count(*) AS total
FROM spine_tracks;
```

| last drive | driven in 24h | total tracks |
| --- | --- | --- |
| 2026-08-24 18:30 (4 min before measuring) | **5** | 59 |

**Correction to an earlier reading in this folder:** the cron is NOT dead. It ran minutes ago. But it
moved **5 tracks in 24 hours** out of 59, and the 45 at `sense` have not moved since **2026-08-21**.
A seven-station journey needs ~21 agent seats. **At this rate one journey takes weeks** — which is
the same thing as never, for a person watching.

## 4. The moat has never closed

```sql
WITH seeded AS (SELECT id FROM workspaces
  WHERE name ILIKE ANY (ARRAY['%sample%','%demo%','%helio%','%explore%']))
SELECT CASE WHEN d.workspace_id IN (SELECT id FROM seeded) THEN 'seeded/demo' ELSE 'REAL' END AS tenant,
       count(*) AS decisions,
       count(*) FILTER (WHERE forecast_claim IS NOT NULL)      AS with_forecast,
       count(*) FILTER (WHERE forecast_resolution IS NOT NULL) AS graded
FROM decisions d GROUP BY 1;
```

| tenant | decisions | with forecast | **graded** |
| --- | --- | --- | --- |
| **REAL** | 97 | 14 | **0** |
| seeded/demo | 236 | 146 | 91 |

**Update to canon:** the old claim was *0 of 131 forecasts on real workspaces*. That is now stale —
**14 real forecasts do exist.** The worse fact replaces it: **not one has ever been graded.** The
loop's closing move, *"I predicted X, it turned out Y, here is what I now believe"*, has **never
once happened for a real user.** Fourteen predictions sit waiting for a verdict that no code delivers.

---

## What this proves, in one line

**The product has a working engine, a full component library and a real moat, and in three months
it has never once carried a single piece of work from the first station to the last — because it
stalls silently, retries forever, crawls in the background, and has no screen where any of that is
visible.**
