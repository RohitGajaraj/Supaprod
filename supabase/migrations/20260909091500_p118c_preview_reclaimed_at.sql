-- P-118c: a person reclaimed a hosted preview and nothing recorded it.
--
-- `Settings > Hosting` offers a Reclaim button on a preview app whose change is
-- closed, and pressing it deletes the app from the Deno account. Pressed live
-- at 14:37 UTC on 2026-09-04 (`cad-60000000-5139f3a8f8e6`): the confirm named
-- the consequence, the host released the slot, and the row kept its button.
--
-- That was not a refresh bug. `mayReclaim` derives its verdict from the
-- CHANGESET, and deleting an app changes nothing about a changeset -- so the
-- list had no fact that could ever stop it offering the same app again. The
-- deeper problem is the one this column exists for: a product whose whole claim
-- is that acts are on the record had taken an irreversible one, on somebody
-- else's hosting account, and written nothing down.
--
-- NULLABLE AND WITH NO DEFAULT, deliberately. The absence of a timestamp means
-- "not reclaimed", which is true of every row that exists today and of every
-- preview that is still serving. A default would assert a reclaim that never
-- happened, on 200-odd changesets at once.
--
-- Written by `reclaimOneApp` only AFTER the host confirms the delete, and a
-- failure to write it is reported to the person rather than swallowed: an app
-- that is gone with no record of it going is exactly the state this prevents.
-- Read by `listHostedApps` and by `mayReclaim`, which refuses a reclaimed app
-- in the past tense with this date -- a receipt, not a refusal.
--
-- Idempotent so it is safe against the live schema, where the column was
-- already applied through the Lovable MCP before this file existed. That gap is
-- what Rule 19 forbids and this file closes: the schema and the repository now
-- say the same thing.

ALTER TABLE public.studio_changesets
  ADD COLUMN IF NOT EXISTS preview_reclaimed_at timestamptz;

COMMENT ON COLUMN public.studio_changesets.preview_reclaimed_at IS
  'When a person reclaimed this changeset''s preview app from the hosting account. NULL means it was never reclaimed. Written by reclaimOneApp after the host confirms the delete (P-118c).';
