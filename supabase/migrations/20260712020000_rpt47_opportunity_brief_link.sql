-- RPT-47 (finish): link an opportunity to a strategic top bet, so a watched
-- assumption can feed the ranking.
--
-- The Strategic Brief's top_bet items carry watched assumptions (FS-02); when a
-- signal contradicts one, the assumption flips to 'challenged'. This column lets
-- a human explicitly tie a discovered opportunity to the bet it rides on (never
-- an AI text-match guess). The ranking (src/components/discover/ranking.ts) then
-- reads that link: an opportunity on a STANDING bet ranks up among its peers,
-- and one whose bet's assumption is CHALLENGED ranks down. That is the honest
-- "watched assumptions feed rankings" wiring the formation-flow pass left as a
-- scoped remainder.
--
-- Additive + forward-only: nullable, ON DELETE SET NULL, so retiring a bet
-- simply unties its opportunities rather than cascading a delete. No backfill.

alter table public.opportunities
  add column if not exists linked_brief_item_id uuid
    references public.brief_items (id) on delete set null;

create index if not exists opportunities_linked_brief_item_idx
  on public.opportunities (linked_brief_item_id)
  where linked_brief_item_id is not null;
