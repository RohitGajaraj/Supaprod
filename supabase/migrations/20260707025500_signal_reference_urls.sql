-- SIGNAL-SOURCES: audited multi-URL references on a signal.
-- A signal today carries a single `url` (its origin). Web-research signals draw
-- on several references, so we add `reference_urls`: an array of {url, title}
-- audited references the signal cited. The consumer UI (SignalRecordBody)
-- shows the origin icon plus a click-through Sources list of every reference.
-- Named `reference_urls` on purpose (`references` is a SQL reserved word).
-- The producer that writes multiple URLs is backend/Lovable; this is the
-- column. Idempotent; defaults to an empty array so existing rows read cleanly.
alter table public.signals
  add column if not exists reference_urls jsonb not null default '[]'::jsonb;

comment on column public.signals.reference_urls is
  'Audited references the signal drew on: an array of {url, title} objects (esp. web-research signals). The single `url` column remains the primary origin.';
