alter table public.themes
  add column if not exists status_reason text;

alter table public.themes
  drop constraint if exists themes_status_reason_len_check;

alter table public.themes
  add constraint themes_status_reason_len_check
  check (status_reason is null or char_length(status_reason) <= 400);

comment on column public.themes.status_reason is
  'Why this cluster stopped: the operator''s own words when they declined it ("not a pattern") or merged it into an existing bet ("same as that one"). Written on the way down, cleared on the way back to ''new'', so it always explains the status currently on the row. Added 2026-08-10: before it, a decline recorded what happened, how big the cluster was, when, and by whom, but nothing recorded why -- so a dismissed cluster could not be handed back as prior judgment when the same complaint returned louder. The append-only history of every such call, including withdrawn ones, is in human_gate_events (subject_type = ''theme'').';