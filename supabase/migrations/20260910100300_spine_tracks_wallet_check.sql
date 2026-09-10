-- ── WHAT THE SWEEP DECIDED, WRITTEN DOWN WHERE IT CAN BE READ ───────────────
--
-- `releaseWalletStoppedTracks` considers every open track on a terminal hold,
-- releases the ones a wallet stopped, and holds a SENTENCE for every refusal:
-- "newest run is not a wallet halt", "still no money", "already released for
-- this wall". All of it went into the sweep's HTTP response body, which goes to
-- a cron and nowhere else.
--
-- ── THE PROBLEM THIS SOLVES IS NOT LOGGING, IT IS FALSIFIABILITY ────────────
--
-- On 2026-09-10 the only evidence that repair existed was `wallet_released_at`,
-- and it read 0. It read 0 for a reason nobody could see from outside: the two
-- tracks the rule was written to release had been repaired BY HAND hours
-- earlier, and a manual write does not stamp the column. So the population was
-- empty, the rule correctly released nothing, and THE RULE WORKING AND THE RULE
-- NOT BEING DEPLOYED PRODUCED THE IDENTICAL READING.
--
-- That is not a quirk of this repair. It is what every guard looks like from
-- outside: a write that fires only on the POSITIVE case has an empty population
-- exactly when the rule is doing its job.
--
-- Hence `wallet_checked_at` is stamped on every track the pass CONSIDERS, not on
-- every track it releases. It moves on every sweep tick if the code is serving,
-- which is the introduced-thing probe `wallet_released_at` could never be:
--
--     select max(wallet_checked_at) from spine_tracks;   -- did the sweep run?
--     select wallet_check_verdict, count(*)              -- and what did it decide?
--       from spine_tracks where wallet_checked_at is not null group by 1;
--
-- ── THE VERDICT IS THE SENTENCE AND NOT A CODE ─────────────────────────────
--
-- `newest run is not a wallet halt`, never `NOT_WALLET_HALT`. A code makes every
-- reader re-derive the meaning from somewhere else, and the meaning is the
-- entire reason the column exists: counts alone would have said 39 and 0 and
-- left the reader exactly as unable to tell a working guard from an absent one.
--
-- Both columns are nullable and additive. Nothing existing can be destroyed by
-- them, and reverting is dropping two columns.

alter table public.spine_tracks
  add column if not exists wallet_checked_at timestamptz,
  add column if not exists wallet_check_verdict text;

comment on column public.spine_tracks.wallet_checked_at is
  'When the wallet-release sweep last CONSIDERED this track, released or not. Stamped on consideration rather than on release, so it is non-empty whenever the rule is running - which is what makes the rule falsifiable from outside.';

comment on column public.spine_tracks.wallet_check_verdict is
  'The sweep''s own sentence for that consideration, in prose rather than a code: "newest run is not a wallet halt", "still no money", "released: the wall came down". The sentence is the evidence.';

-- Reading "what did the last sweep decide" scans only the considered rows.
create index if not exists spine_tracks_wallet_checked_at_idx
  on public.spine_tracks (wallet_checked_at desc)
  where wallet_checked_at is not null;
