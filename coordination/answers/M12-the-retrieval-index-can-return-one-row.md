# M12 — the retrieval index can return one row, and it has been that way for fourteen days

**Kind:** proactive finding, no request
**Raised by:** MAIN LANE
**Written:** 2026-08-23 12:52 IST
**Verdict:** confirmed, with one of my own intermediate claims corrected below
**Whose fix this is:** **the founder's call, not a lane's.** Neither lane is chartered for this
and neither should stop porting to take it. Filed so it is not discovered a third time.

## The finding in one line

`match_rag_chunks`, the only reader of `rag_chunks`, can return **at most one row, for any user,
for any question**, because 16 of the 17 rows in the table have a NULL embedding and the function
excludes those. Nothing has been written to the table since **2026-08-09**.

## The measurement

```sql
SELECT source_kind, count(*) AS rows,
       count(*) FILTER (WHERE embedding IS NOT NULL)    AS has_embedding,
       count(*) FILTER (WHERE workspace_id IS NOT NULL) AS has_workspace,
       count(*) FILTER (WHERE embedding IS NOT NULL
                          AND workspace_id IS NOT NULL) AS passes_both_filters,
       min(created_at) AS oldest, max(created_at) AS newest
FROM rag_chunks GROUP BY source_kind;
```

| source_kind | rows | has_embedding | has_workspace | passes both | oldest | newest |
| --- | --- | --- | --- | --- | --- | --- |
| `finding` | 17 | **1** | 17 | **1** | 2026-07-13 | **2026-08-09** |

There is no other row. No `prd`, `doc`, `note`, `signal` or `meeting` chunk has **ever** existed.

The reader, read from the live database rather than from a migration file:

```sql
SELECT pg_get_functiondef(p.oid) FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='match_rag_chunks';
```

```sql
  where c.user_id = auth.uid()
    and public.is_workspace_member(c.workspace_id)
    ...
    and c.embedding is not null          -- <- 16 of 17 rows die here
  order by c.embedding <=> query_embedding
  limit match_count;
```

## Correcting myself, because the wrong cause was one step away

`src/lib/rag/findings.server.ts:59` says **"workspace_id stays unset"**, and `match_rag_chunks`
filters on `is_workspace_member(c.workspace_id)`. Reading those two together gives a clean and
completely wrong answer: that every finding row is invisible on tenancy.

It is wrong. `has_workspace` is **17 of 17**. The comment is stale — the tenancy backfill it
predates has since run. Only the embedding filter is actually binding. The comment should be
corrected by whoever next touches that file, because it will mislead the next reader the same way.

## The mechanism, which is what makes it permanent rather than a bad week

Three things that are each defensible alone:

1. **`findings.server.ts:60` may write a NULL embedding.** The insert ends
   `embedding: embedding ? (embedding as unknown as string) : null`. A finding recorded without a
   precomputed vector is written anyway, which is the right call — losing the text would be worse.
2. **`match_rag_chunks` excludes NULL embeddings.** Also right: a null vector has no distance, so
   it cannot be ranked. `match_themes` does the same thing, and `embed-tick`'s own header explains
   why that filter exists.
3. **Nothing backfills `rag_chunks`.** `cron.embed-tick` sweeps `signals`, themes, memories and
   entities. It does not know this table exists. `src/lib/rag/indexer.server.ts` embeds inline at
   insert, so it never revisits a row it already wrote.

Each is reasonable. Together they mean a row written without an embedding is invisible **forever**,
and 16 rows are sitting in exactly that state.

## Why the indexer has not covered for it

`cron.indexer-tick` is the path that would file `prd`/`doc`/`note` chunks *with* embeddings. It is
being killed before it can report, on most runs:

```sql
SELECT job_name, status, error_kind, started_at, finished_at
FROM job_runs WHERE started_at > now() - interval '24 hours' AND status <> 'ok'
ORDER BY started_at DESC;
```

Reaped `RunNeverFinished` at 20:07, 22:07, 23:07, 01:07, 04:07, 06:07 UTC, and one still `running`
from 07:07 at the time of writing. One run succeeded, at 03:07, in 41.9s — **and `rag_chunks` gained
nothing from it**, which is the part worth pausing on. `touched_24h` is 0.

The header of `indexer-tick.ts` predicted this failure and fixed the half it could see: before
2026-08-14 the tick returned `{ ok: true, indexed: 0 }` and wrote `status='ok'` while the index went
stale. That fix works — it no longer claims success. The remaining half is that a job which hangs
and a job which fails look identical from the table, and both leave the index empty.

## What this does NOT say

- **It is not a money leak.** Live spend is ~$0.94 over 14h across 5 tracks. Nothing is burning.
- **It is not new breakage.** `discovery.functions.ts:2187` recorded "16 rows and every one is
  source_kind 'finding'" on 2026-08-06. It reads 17 today. That comment being *still true* after
  17 days is the strongest evidence here: the corpus indexer has never once succeeded.
- **It does not mean retrieval throws.** It returns a short list, or an empty one. Every caller
  degrades quietly, which is why this has gone unnoticed for two weeks.

## Why it is worth the founder's attention

Layer 03 is the one that is defensible alone, and retrieval over the corpus is how it reaches
anything written down. Today that reach is one chunk.

It also stands beside [`M02`](./M02-the-loop-is-alive-and-blocked-on-evidence.md) rather than
duplicating it. M02 found the critic correctly halting Decide because 902 of 1,418 signals are
agent-authored with no source link. This is a **second and independent** reason evidence cannot be
assembled: the index that would supply it holds one usable row. Fixing the signal-linking problem
alone would not give the critic more to read.

## The cheapest thing that would prove a fix

Not a code change — a query. After any attempted fix, this must move off 1:

```sql
SELECT count(*) FILTER (WHERE embedding IS NOT NULL) AS retrievable,
       count(*) AS total, max(created_at) AS newest
FROM rag_chunks;
```

`retrievable = 1, total = 17, newest = 2026-08-09` is today's reading. A fix that leaves
`retrievable` at 1 has not worked, whatever the job table says about it.

## For anyone reading loop health after me

Two columns here lie, and I nearly filed both as findings before checking:

- **`spine_tracks.updated_at` is dead.** Track `b8a36b6f` moved `spend_used_usd` from 0.1320 to
  0.1441 between two of my queries minutes apart while `updated_at` sat at 03:00:43. Use
  `driven_at` for "when was this visited" and the linked `agent_runs` for "when did work happen".
- **Nearly all apparent stranded spend is sample data.** $8.99 of the $10.09 total sits on
  `is_sample = true` workspaces, frozen since 2026-08-21 because the driver correctly skips them.
  Always join `workspaces` and filter `is_sample = false` before raising an alarm about the loop.
  This is the second time this session that shape has looked like a fire and been sample rows.

```sql
SELECT w.is_sample, count(*) AS tracks,
       round(sum(t.spend_used_usd)::numeric,4) AS spend
FROM spine_tracks t LEFT JOIN workspaces w ON w.id = t.workspace_id
GROUP BY w.is_sample;
```
