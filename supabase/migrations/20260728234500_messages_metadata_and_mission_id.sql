-- Repair the messages table so Ask can rehydrate and answers can be promoted.
--
-- WHY: two earlier migrations raced to add messages.mission_id and neither
-- landed. 20260607095340 adds it referencing agent_runs WITH "IF NOT EXISTS";
-- 20260607100000 adds it referencing missions WITHOUT one. Whichever applied
-- first made the other fail, so production has neither column, and nothing ever
-- added messages.metadata at all.
--
-- The damage, both silent:
--   * conversations.getConversation selected mission_id and metadata, so every
--     rehydration failed with 42703 and the Ask panel rendered its empty state
--     on threads that had messages. The panel has never shown history.
--   * ask-promote.setAskPromoted selects metadata and discards the error, so
--     promoting an answer into a note, decision or task returned { ok: false }
--     and did nothing, with no error shown to anyone.
--
-- Both columns are additive, nullable and unindexed-by-default, so this is safe
-- to apply to a live table with no rewrite and no lock beyond the catalog.
-- Every statement is idempotent, so it is safe to re-run and safe to apply on a
-- database where one of the 2026-06-07 pair did land.

-- 1. metadata: the typed answer blocks, chat meta, and the promoted-record map
--    that src/lib/ask-thread.ts parses. jsonb, defaulted so existing rows read
--    as an empty object rather than null.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. mission_id: lets a chat reply deep-link to the run it spawned.
--    Added WITHOUT a foreign key on purpose. The two 2026-06-07 migrations
--    disagree on the target (agent_runs vs missions) and this cannot be
--    resolved without reading production, which is unavailable right now.
--    A nullable uuid carries the deep link today; the constraint can be added
--    later once the target is confirmed, and adding it then is a metadata-only
--    operation with NOT VALID. Guessing wrong here would fail the deploy.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS mission_id uuid;

-- 3. Partial index: mission_id is null for ordinary chat turns, so only index
--    the rows that carry a link.
CREATE INDEX IF NOT EXISTS idx_messages_mission_id
  ON public.messages (mission_id)
  WHERE mission_id IS NOT NULL;

-- RLS is unchanged: the existing "own messages all" policy on public.messages
-- already scopes every row by auth.uid() = user_id, and both new columns live
-- on that same row, so they inherit it. No new policy is needed and none is
-- added, because widening the policy surface here would be a security change
-- disguised as a bug fix.
