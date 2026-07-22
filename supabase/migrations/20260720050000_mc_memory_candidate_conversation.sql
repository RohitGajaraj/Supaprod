-- Threads <-> memory link (front-end reimagining, screen-9 rail views). A memory
-- candidate saved from a thread ("Save to the brain") records its source
-- conversation, so the Threads rail can back two views honestly, from the same
-- link, with no faked data:
--   * "In the brain"    = the thread has an APPROVED memory candidate.
--   * "Waiting on you"   = the thread has a PENDING memory candidate (a real
--                          gate on that thread, the same object the Approvals
--                          count shows).
--
-- Additive + nullable; ON DELETE SET NULL so removing a thread never loses the
-- memory it produced. Reads and the proposeMemoryCandidate write are tolerant of
-- the pre-migration window (they degrade to "no link" rather than erroring),
-- mirroring the K1-K5 folder/version pattern.

alter table public.memory_candidates
  add column if not exists source_conversation_id uuid
    references public.conversations(id) on delete set null;

create index if not exists memory_candidates_source_conversation_idx
  on public.memory_candidates (source_conversation_id);
