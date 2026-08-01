-- THE CEILING WHERE THE AUTONOMY IS: a budget per piece of work, not per run.
--
-- WHY. `checkMissionCaps` already stops a run, and its own header records why it
-- had to be widened once before: "a ten hop mission got ten separate ceilings
-- and could spend ten times the cap with every individual check passing. The
-- column was a per-run ceiling wearing a mission name."
--
-- That is now true one level up. The unit of UNATTENDED work is no longer a run
-- or a mission, it is a TRACK: the driver walks one track through seven stations
-- with nobody watching, each station runs a crew of two or three agents, and
-- each station may be attempted up to MAX_STATION_ATTEMPTS times. Only Build
-- opens a mission, so six of the seven stations dispatch with mission_id null
-- and every one of their runs carries its own independent ceiling that nothing
-- sums.
--
-- Measured live on 2026-08-01: of fourteen driver runs, six had a mission and
-- eight did not. One track pass is roughly sixteen runs, so the effective
-- headroom was sixteen times the per-run cap with every individual check
-- passing, and the tick drives five tracks at a time. Real spend is about three
-- cents a run, so nothing has run away; the point is that nothing was stopping
-- it, and moving each station from one agent to a crew tripled the rate behind
-- that gap.
--
-- WHAT THIS ADDS. A meter and a ceiling on the track itself. The driver checks
-- before every seat, not once per tick, because a crew is two or three
-- dispatches and a budget checked only at the top would be overrun by the rest
-- of the crew before anything looked again. It charges each seat from that run's
-- own `agent_runs.spend_used_usd`, and persists the meter on every path out of a
-- tick, including the ones that hold at a gate or stall: a counter that only
-- advances on the happy path is a budget that resets itself whenever work gets
-- interesting.
--
-- NULL MEANS NO CEILING, on both columns, and that is a deliberate human
-- decision the runtime obeys rather than an accident. Resolution order is the
-- track's own cap, then the workspace default, then the built-in
-- DEFAULT_TRACK_SPEND_CAP_USD in src/lib/spine/track-caps.server.ts. An
-- unreadable workspace resolves to the built-in number and never to null, since
-- failing to null would let a database hiccup silently remove the limit.

alter table public.spine_tracks
  add column if not exists spend_used_usd numeric not null default 0,
  add column if not exists spend_cap_usd numeric;

comment on column public.spine_tracks.spend_used_usd is
  'Dollars this track has spent across every station, seat and retry. Written by the driver '
  'on every path out of a tick, including holds and stalls.';
comment on column public.spine_tracks.spend_cap_usd is
  'This track''s own ceiling. NULL means "inherit", resolved against the workspace default '
  'then the built-in. An explicit NULL set by a person means no ceiling and is obeyed.';

alter table public.workspaces
  add column if not exists default_track_spend_cap_usd numeric;

comment on column public.workspaces.default_track_spend_cap_usd is
  'Default ceiling on one piece of work end to end. NULL means the built-in '
  'DEFAULT_TRACK_SPEND_CAP_USD applies. The twin of default_mission_spend_cap_usd, one level up.';
