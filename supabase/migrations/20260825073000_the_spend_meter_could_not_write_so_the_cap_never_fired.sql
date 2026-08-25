-- The account spend meter has not recorded a single call in ten days.
--
-- `ai_budgets.workspace_id` is `NOT NULL DEFAULT current_user_default_workspace()`,
-- and that function is `SELECT ensure_user_default_workspace(auth.uid())`.
-- **`auth.uid()` is NULL for every service-role caller** — every cron tick, and
-- every `supabaseAdmin` write. So the default resolves to NULL, the INSERT dies
-- with `23502`, and `incrementBudget` (`runtime.server.ts:1533`) swallows the
-- error into `console.error` and carries on.
--
-- MEASURED 2026-08-25 07:19:52 UTC:
--
--   SELECT count(*), max(updated_at) FROM ai_budgets;          -- 6 | 2026-08-15 06:00:10
--   SELECT count(*) FROM ai_events WHERE created_at > now() - interval '24 hours';
--                                                              -- 8373
--   SELECT count(DISTINCT user_id) FROM ai_events WHERE created_at > now() - interval '7 days';
--                                                              -- 14
--
-- **Six budget rows for fourteen spending users, and nothing has metered since
-- 2026-08-15 while 8,373 calls went through in the last day alone.**
--
-- WHY IT MATTERS MORE THAN THE NUMBER. `checkBudget` (`runtime.server.ts:933`)
-- opens with `if (!b) return;` — no row means no cap — and its daily arm only
-- fires when `b.day_window = current_date`, so a frozen window short-circuits it
-- permanently. **The account-level spend cap has therefore never been able to
-- fire.** It is not a cap that is set too high; it is a cap that cannot count.
-- The Engine Room spend panel (`engine-room-glance.ts:597`) renders the frozen
-- number as though it were current.
--
-- THE FIX IS TO NAME THE COLUMN. The default is fine for a human request, where
-- `auth.uid()` is populated; it is only wrong for the service role, which is
-- most of the traffic. `ensure_user_default_workspace` resolves from
-- `workspace_members` and then `workspaces.owner_id`, and only creates one when
-- the user genuinely has none — so this attributes the spend to the user's real
-- workspace rather than inventing one.
--
-- This is the same root cause as the RAG indexer writing 58,874 embeddings into
-- a `rag_chunks` table that has held 17 rows since 2026-08-09. Fixed separately;
-- recorded here because one defect wearing two costumes is worth naming once.
create or replace function public.record_ai_budget_usage(_user_id uuid, _tokens integer, _usd numeric)
 returns table(new_daily_tokens integer, new_monthly_tokens integer, new_daily_usd numeric, new_monthly_usd numeric, daily_usd_cap numeric, monthly_usd_cap numeric, alert_at_pct integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  _today date := current_date;
  _month date := date_trunc('month', current_date)::date;
  -- Named explicitly so the service role does not fall through to a default
  -- that is NULL without an `auth.uid()`.
  _ws uuid := coalesce(public.current_user_default_workspace(), public.ensure_user_default_workspace(_user_id));
begin
  return query
  insert into public.ai_budgets as b (
    user_id, workspace_id, day_window, month_window,
    daily_tokens_used, monthly_tokens_used, daily_usd_used, monthly_usd_used
  )
  values (
    _user_id, _ws, _today, _month,
    coalesce(_tokens, 0), coalesce(_tokens, 0), coalesce(_usd, 0), coalesce(_usd, 0)
  )
  on conflict (user_id) do update set
    day_window   = _today,
    month_window = _month,
    daily_tokens_used =
      case when b.day_window = _today then coalesce(b.daily_tokens_used, 0) else 0 end
      + coalesce(_tokens, 0),
    monthly_tokens_used =
      case when b.month_window = _month then coalesce(b.monthly_tokens_used, 0) else 0 end
      + coalesce(_tokens, 0),
    daily_usd_used =
      case when b.day_window = _today then coalesce(b.daily_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    monthly_usd_used =
      case when b.month_window = _month then coalesce(b.monthly_usd_used, 0) else 0 end
      + coalesce(_usd, 0),
    updated_at = now()
  returning
    b.daily_tokens_used, b.monthly_tokens_used,
    b.daily_usd_used, b.monthly_usd_used,
    b.daily_usd_cap, b.monthly_usd_cap, b.alert_at_pct;
end;
$function$;
