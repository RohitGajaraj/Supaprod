-- ─────────────────────────────────────────────────────────────────────────────
-- P-39 (A-QUEUE.md), item 3, corrected to the right module (A1, 2026-09-03).
--
-- The failure A1 found live: `deployments` row `97c7b268-94e5-43f2-8a53-c7a5a339e180`,
-- changeset `e7565181-1f64-4145-82e5-6da9cf7063e6`, commit `5151319...`, provider
-- `deno`, environment `preview`, `status = 'failure'`, `triggered_by =
-- 'ci-poll-tick'`, `deploy_url` null -- and nothing anywhere on that row, or on
-- the run screen for the track that owns the changeset, says WHY.
--
-- The first draft of this fix looked at `deno-deploy.server.ts`, which IS a
-- Deno Deploy adapter but is the admin-only "Supaprod-hosted" PoC (P5b, no
-- production caller, no `deployments` row, no run screen anywhere in its call
-- path). The real path is `deployChangesetApp` (`changeset-deploy.server.ts`),
-- called from `ci-poll-tick.ts`'s preview-deploy branch, which upserts
-- straight into THIS table -- `deployChangesetApp` already computes a `reason`
-- string (the HTTP status and the response body) on every failure; the upsert
-- simply never wrote it anywhere. The reason existed and was thrown away at
-- the write site, not missing at the source.
--
-- `failure_reason` is nullable and never set on a success -- a success needs
-- no explanation, and a null here is itself the fact "either this succeeded,
-- or it failed before this column existed."
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.deployments
  add column if not exists failure_reason text;
