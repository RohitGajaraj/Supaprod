-- When a track was last released from a hold that a wallet caused.
--
-- ── WHY A COLUMN AND NOT A RE-READ OF THE HALT ──────────────────────────────
--
-- `going-in-circles` is TERMINAL: the sweep stops giving the track slots, so a
-- track stopped by an empty account never gets a turn in which to notice the
-- account has money again. `c6cd66ebc` stops that happening to new tracks; the
-- ones already stopped need releasing, and `6cc7a010` has now sat still for six
-- days against an account holding 15,238 spendable credits.
--
-- The release has to happen ONCE per wall. Without a marker, a track released
-- into an account that is empty again stops for the same reason, is released
-- again on the same evidence, and a permanently empty wallet becomes a
-- permanent loop that spends a sweep slot every tick for ever. So the rule is:
-- release only when the newest wallet halt is NEWER than this stamp. A wall
-- that came down and went back up is a new halt and earns a new release; the
-- same halt never earns two.
--
-- Null means never released, which is every track today.
alter table public.spine_tracks
  add column if not exists wallet_released_at timestamptz;

comment on column public.spine_tracks.wallet_released_at is
  'When this track was last released from a terminal hold whose runs halted out_of_credit. The repair releases only when a wallet halt is newer than this, so one wall earns one release.';
