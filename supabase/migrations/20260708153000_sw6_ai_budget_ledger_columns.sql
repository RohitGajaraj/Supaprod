-- SW-6 follow-up (founder-authorized chokepoint change): close the ai_budgets
-- ledger-reset residual left open by 20260708140000.
--
-- Residual: a non-admin owner could PATCH their own row's spend LEDGER
-- (daily_usd_used = 0, or roll day_window forward so checkBudget's
-- `day_window = today` guard short-circuits) and keep spending past the cap.
-- It could not be closed with an auth.uid() trigger while the runtime metered
-- usage through the request's user-scoped client, because the legitimate charge
-- and a tampering PATCH were the same principal (that earlier trigger attempt
-- was reverted; it would have frozen the runtime's own charges).
--
-- The runtime now meters usage through the service-role admin client
-- (incrementBudget / incrementSurfaceBudget in src/lib/ai/runtime.server.ts),
-- so the two writers ARE finally distinguishable at the grant layer. Column-
-- level privilege is the clean primitive: authenticated may write the cap /
-- alert columns (updateGlobalBudget, upsertSurfaceBudget) but NOT the ledger
-- columns. A tampering PATCH that names a ledger column is rejected with
-- "permission denied for column ..."; service_role keeps GRANT ALL, so the
-- runtime's metering write is unaffected.
--
-- checkBudget still READS via the user client (SELECT is untouched). No product
-- flow writes the ledger from the authenticated role.

-- ai_budgets: caps + token caps + alert threshold are the only owner-writable
-- columns. Ledger (daily/monthly _tokens_used, _usd_used, day_window,
-- month_window) becomes service-role-only.
revoke update on public.ai_budgets from authenticated;
grant update (daily_usd_cap, monthly_usd_cap, daily_token_cap, monthly_token_cap, alert_at_pct)
  on public.ai_budgets to authenticated;

-- ai_surface_budgets: caps + enabled are owner-writable. The upsert conflict key
-- (user_id, surface) is granted too so upsertSurfaceBudget's ON CONFLICT UPDATE
-- succeeds regardless of whether PostgREST names the key columns in its SET.
-- Ledger (daily/monthly _usd_used, day_window, month_window) is service-role-only.
revoke update on public.ai_surface_budgets from authenticated;
grant update (daily_usd_cap, monthly_usd_cap, enabled, surface, user_id)
  on public.ai_surface_budgets to authenticated;

-- INSERT is intentionally left intact: the only authenticated inserters
-- (updateGlobalBudget, upsertSurfaceBudget) never name a ledger column, so a
-- fresh row always starts at a zero ledger; and the seed trigger + the DELETE
-- revoke (20260708140000) + the unique(user_id) constraint together mean a real
-- user can never reach a no-row state to craft a tampering INSERT.
