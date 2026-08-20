-- 20260820074000_the_eval_tick_has_been_posting_to_a_url_that_does_not_exist.sql
--
-- Claude lane, 2026-08-20.
--
-- THE SECOND HALF OF THE DEAD EVAL TICK: THE SCHEDULE POSTS TO A 404.
--
-- `20260820072500` fixed why the tick could never WRITE. This is why it has not
-- RUN since 2026-08-05.
--
-- WHAT IS BROKEN. Job 40 posts to
--
--   https://supaprod.ai/api/public/hooks/cadence-eval-tick
--
-- and there is no such route. The file is
-- `src/routes/api/public/hooks/eval-tick.ts`, so the endpoint is
-- `/api/public/hooks/eval-tick`. **The job name leaked into the URL.**
--
-- THE CONVENTION IS PLAIN IN THE OTHER JOBS, WHICH IS HOW THIS IS KNOWN RATHER
-- THAN GUESSED. A `cadence-` prefix belongs to the JOB NAME and never to the
-- path:
--
--   cadence-eval-suite-tick  -> /hooks/eval-suite-tick     works
--   cadence-drift-tick       -> /hooks/drift-tick          works
--   cadence-indexer-tick     -> /hooks/indexer-tick        works
--   cadence-eval-tick        -> /hooks/cadence-eval-tick   404
--
-- Three of four strip it. The fourth does not, and it is the only broken one.
--
-- CHECKED ACROSS ALL 36 SCHEDULED JOBS, because a defect is a shape and one
-- instance is not a sweep. Every job's endpoint was matched against the 39 files
-- in `src/routes/api/public/hooks/`:
--
--   * exactly ONE job points at a route that does not exist:  cadence-eval-tick
--   * exactly ONE hook route has no job pointing at it:       eval-tick
--
-- The two are the same tick, which is the whole proof. (The other unmatched files
-- are `-_auth.server`, a helper rather than a route, and `funnel-week2` and
-- `github-webhook`, which are called from outside.)
--
-- WHY IT LEFT NO TRACE. A 404 never reaches `withJobRun`, so no `job_runs` row is
-- written -- not even a failing one. The tick did not start failing on 2026-08-05,
-- it **stopped being observable**, and every instrument that watches `job_runs`
-- reported silence rather than an error. `job_runs` for `cron.eval-tick` shows 48
-- runs a day through 2026-08-04, 26 on 08-05, then nothing at all.
--
-- ONLY THE URL CHANGES. Same schedule, same headers, same
-- `public.get_cron_hook_secret()`, same 30s timeout, same job id and name. The
-- command is otherwise byte-identical to what is scheduled today, so this is a
-- one-token correction and nothing else moves.
--
-- WORTH DOING ONLY BECAUSE OF THE OTHER MIGRATION. Revived on its own this
-- morning, this job would have resumed running 48 times a day and writing nothing,
-- because every insert would still have failed the NOT NULL on `workspace_id`.
-- The pair is the fix; either alone is theatre.

select cron.alter_job(
  job_id := 40,
  command := $cmd$SELECT net.http_post(url:='https://supaprod.ai/api/public/hooks/eval-tick',headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb,timeout_milliseconds:=30000) AS request_id;$cmd$
);

do $$
declare v_cmd text; v_active boolean; v_sched text;
begin
  select command, active, schedule into v_cmd, v_active, v_sched
    from cron.job where jobid = 40;

  if v_cmd is null then
    raise exception 'cron job 40 does not exist';
  end if;
  if position('hooks/eval-tick' in v_cmd) = 0 then
    raise exception 'cron job 40 does not point at /hooks/eval-tick: %', v_cmd;
  end if;
  if position('hooks/cadence-eval-tick' in v_cmd) > 0 then
    raise exception 'cron job 40 still carries the cadence- prefix in its URL';
  end if;
  if not v_active then
    raise exception 'cron job 40 is not active';
  end if;
  if v_sched <> '*/30 * * * *' then
    raise exception 'cron job 40 schedule changed to %, expected */30 * * * *', v_sched;
  end if;
end $$;
