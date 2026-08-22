# ANS-M03: All seven unrecorded migrations are applied, and two artifacts now lie about themselves

**Verdict:** confirmed
**Answered:** 2026-08-23T04:40:00+05:30
**Raised by:** nobody. MAIN LANE, on the founder's standing instruction to verify every
migration himself rather than leave it to Lovable.

## Every migration newer than `schema_migrations` is applied

`supabase_migrations.schema_migrations` still ends at **`20260820110000`**, so seven
migrations on disk are not recorded in it. All seven are applied. Verified by their **effect
on live schema**, not by the record, because the record is the thing that is behind:

```sql
select
 (select count(*) from information_schema.columns where table_schema='public'
    and table_name='workspaces' and column_name='cold_start_promotion_enabled') as m120000,
 (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='protect_credit_cap_ceiling') as m160000,
 (select count(*) from information_schema.columns where table_schema='public'
    and table_name='agent_approvals' and column_name='expiry_default') as m190000_col,
 (select count(*) from pg_indexes where schemaname='public'
    and indexname='agent_approvals_pending_expiry_idx') as m190000_idx,
 (select pg_get_function_arguments(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='admin_grant_credits' limit 1) as m000000_args,
 (select count(*) from information_schema.columns where table_schema='public'
    and table_name='spine_tracks' and column_name='seat_cursor') as m010000,
 (select max(version) from supabase_migrations.schema_migrations) as record_max;
```

| Migration | What proves it applied | Result |
| --- | --- | --- |
| `20260822120000` promotion bar | `workspaces.cold_start_promotion_enabled` | present |
| `20260822160000` spend ceiling | function `protect_credit_cap_ceiling` | present |
| `20260822190000` approval default | `agent_approvals.expiry_default` + `agent_approvals_pending_expiry_idx` | both present |
| `20260822210000` decision edge | comment on `learnings.decision_id` names `applyOutcome` | present |
| `20260822230000` restatement | `signals.restated_count` + rpc `bump_signal_restatement(uuid,int)` | both present |
| `20260823000000` credit default | `admin_grant_credits(_user_id uuid, _credits bigint, _reason text DEFAULT 'topup'::text)` | default is `topup` |
| `20260823010000` seat cursor | `spine_tracks.seat_cursor` | present |

**Nothing to apply and nothing to deploy for this.** All seven are idempotent and the record
was deliberately left behind rather than backfilled. That decision still holds; I am not
backfilling it on my own authority.

## Two artifacts that describe a world that no longer exists

Both are the same shape as the ratchet header in [`M01`](./M01-ratchet-header-total-is-stale.md):
something true when written, false now, and still being read.

### 1. `src/lib/sources/sink.server.ts:275` says the restatement counter is inert. It is not.

```
 * FAIL-OPEN, AND CURRENTLY INERT. `restated_count` does not exist on `public.signals`
 * yet; the migration adding it is written but deliberately unapplied.
```

The column exists (`NOT NULL DEFAULT 0`), the RPC exists, and seven signals carry a non-zero
count with a maximum of 5:

```sql
select count(*) agent_signals, count(*) filter (where restated_count>0) ever_restated,
       max(restated_count) max_restated from signals where source='agent';
-- 902 | 7 | 5
```

A reader trusting that comment would believe the counter is dead and either rebuild it or
discount it. It is live and it is the only number that says how often one observation was
repeated.

### 2. `agent_runs.attempt` is written on 6 rows out of 2,225

```sql
select count(*) runs, count(attempt) attempt_set from agent_runs;
-- 2225 | 6
```

Set on 1 strategist, 1 researcher, 3 discovery-scout and 1 data-analyst run, and on nothing
in the last two days. **Do not read this column and do not put it on a surface.** Anything
rendering "attempt 3 of 5" from it renders blank for 99.7% of runs. The retry count that
actually moves is `spine_tracks.attempts`, which is per track and per station.

## What this changes

**For LANE 1: one hard rule, no rework.**

**Trust disk over document, and trust the live database over both.** Three artifacts checked
tonight described themselves wrongly: the ratchet header, the sink comment, and the `attempt`
column. All three read as authoritative. If a comment, a count in `docs/design/DESIGN-SYSTEM.md`,
or a column name tells you what is true, and you are about to build on it, **ask me to measure
it**. That is a `db-fact` request and it costs you nothing to file.

**For MAIN LANE, carried forward:** both stale artifacts are product code, so I am not editing
them while you hold the tree. They are recorded here and in `STATUS.md`, and I will fix them
once you have pushed and gone quiet, per the protocol.
