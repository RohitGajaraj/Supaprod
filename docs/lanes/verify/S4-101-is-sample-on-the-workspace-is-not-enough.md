# S4-101 · `workspaces.is_sample = false` is not enough, and only seven tables can do better

> _S4, 2026-08-27. The fixture trap one level deeper than the one I fell into three times tonight.
> Found while verifying S0's F-124b, which was itself a correction of the same kind._

## The rows that proved it

S0 corrected themselves that their 13 Deno previews and 14 executed merges were all on sample
workspaces. Verified, and one number is not what either of us expected:

| | sample | **real workspace** |
| --- | --- | --- |
| merge approvals `executed` | 14 | **0** |
| `deployments` | 38 | **4** |
| `studio_changesets` | 41 | 10 |

**Four deployment rows sit on a REAL workspace.** They are still fixtures:

```
60000000-0d00-4000-8000-000000000003   staging      https://staging.relay.helio-labs.example.com
60000000-0d00-4000-8000-000000000001   production   https://relay.helio-labs.example.com
60000000-0d00-4000-8000-000000000002   production   https://relay.helio-labs.example.com
60000000-0007-4000-8000-000000000001   production   https://atlas.helio-labs.example.com
```

Sequential synthetic ids, three of them stamped to the same millisecond, and every URL on
**`example.com`** — the domain reserved by RFC 2606 for documentation, which cannot resolve to
anything.

**So `is_sample` on the workspace does not catch seeded rows planted on a real workspace.** S0's
substantive claim is right — there are no genuine deployments at all — and the filter that was
supposed to establish it left four fixtures in the "real" bucket.

## Only seven tables can answer the question directly

```sql
SELECT table_name FROM information_schema.columns WHERE column_name = 'is_sample';
-- agent_memory, learnings, opportunities, prds, signals, themes, workspaces
```

**`deployments`, `studio_changesets`, `agent_approvals`, `spine_tracks`, `agent_runs` and `decisions`
do not carry it.** For every one of those, the only filters available are a join to the workspace,
which is now proven insufficient, or reading the row's own fingerprint.

## The rule, third version tonight

Tonight has produced three versions of the same rule and this is the one that survives:

1. **A count needs its population.** (`S4-041`)
2. **The population is `is_sample`, not "everything".** (`S4-086`, `S4-093`)
3. **On the eighteen tables with no `is_sample`, the workspace join is a proxy and it leaks.** Check
   the fingerprint: sequential ids matching `^[0-9]0000000-`, several rows sharing a millisecond, and
   `example.com` anywhere in a URL.

## I held my own headline against it, and it survived

`S4-095` reported 37 of 55 real tracks stuck at `sense`, from a workspace join, on a table with no
`is_sample`. So it is exposed to exactly this leak.

```sql
SELECT t.station, count(*), count(*) FILTER (WHERE t.id::text ~ '^[0-9]0000000-')
FROM spine_tracks t JOIN workspaces w ON w.id = t.workspace_id
WHERE w.is_sample = false GROUP BY 1;
```

**Zero fixture-shaped ids, at every station, in all 55 tracks.** The funnel stands unchanged: 37 at
`sense`, 35 of them held, and every one genuine.

## The size of the leak, across every table with no `is_sample`

I said I had not audited the other tables. Closing that rather than leaving it:

| table | rows on a REAL workspace | fixture-shaped | share |
| --- | --- | --- | --- |
| `agent_approvals` | 48 | **19** | **40%** |
| `studio_changesets` | 10 | **3** | **30%** |
| `decisions` | 153 | 7 | 5% |
| `agent_runs` | 1,066 | 12 | 1% |
| `spine_tracks` | 55 | **0** | 0% |
| `deployments` | 4 | **4** | **100%** |

**Two fifths of the approvals and a third of the changesets that pass the workspace filter are
seeded.** Any count from those two tables that used `is_sample = false` alone is wrong by that much,
including my own `S4-093` before its correction.

## And it changes a number on the critical path

S0's picture of the ship chain rests on two counts. Split by fingerprint, on real workspaces only:

| `studio_changesets.status` | rows | fixture-shaped | **genuine** |
| --- | --- | --- | --- |
| `pr_open` | 7 | 1 | **6** |
| `staged` | 2 | 1 | **1** |
| `merged` | **1** | **1** | **0** |

**S0's "six real changesets sit at pr_open" is confirmed exactly.** Their "one changeset ever merged"
is not: that single row is fixture-shaped.

**No changeset in this product has ever genuinely merged.** Not one, on any real workspace, in the
product's life. S0 believed there was one, and the difference matters for the critical path: the
merge is not a mechanism that worked once and then stopped. It is a mechanism that has never once
completed on real work.

Everything else in their conclusion survives and is strengthened by it.

## Both of my headline findings survive the deeper check

Neither `spine_tracks` nor `agent_runs` carries `is_sample`, so both were exposed:

| finding | exposure | result |
| --- | --- | --- |
| `S4-095`, 37 of 55 real tracks at `sense` | `spine_tracks`, workspace join only | **0 fixture-shaped, all 55 genuine** |
| `S4-094`, 166 runs and 7.1M tokens in 24h | `agent_runs`, workspace join only | **0 fixture-shaped in the window** |

The 12 fixture-shaped `agent_runs` are all older than the 24-hour window, whose oldest row is
2026-08-26 09:15:02.

`spine_track_members`, which is where the 31 artifacts come from and which also has no `is_sample`,
is clean on both counts: **zero fixture-shaped `artifact_id` or `track_id` across all 1,548 rows in
the product's life**, and zero in the window.

**Checked rather than asserted, on my own numbers first.**

## What I am not claiming

- **The fingerprint is a heuristic, not a flag.** A fixture written with a random uuid would pass it,
  and a genuine row could in principle be created in the same millisecond as another.
- **I did not audit the other fifteen tables** for planted fixtures, only `deployments`,
  `spine_tracks` and the merge approvals.
- **The right fix is a column, not a regex**, and that is S0's call: `is_sample` on the tables that
  carry seeded rows would make all of this a one-word filter.

  **S0's reply sharpens that and I agree with the constraint they added: they will not BACKFILL by
  regex.** Marking a row as seeded on the strength of `^[0-9]0000000-` risks hiding real work, which
  is a worse failure than the one being fixed. They are checking whether those exact ids appear in a
  seed migration first: if they do, the backfill is provable and marks exactly those; if they do not,
  the column ships empty and defaults false, and **the fingerprint stays a diagnostic rather than
  becoming a writer**. That is the right line and it is one I did not draw.
