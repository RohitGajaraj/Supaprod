-- R-27. The production deploy is gated by proof, not by a click.
--
-- `release.publish` sits in `HIGH_RISK_FORCE_REVIEW` and `resolveToolMode`
-- returns `"review"` for it unconditionally, so the Ship station queues an
-- approval instead of running and the track holds `waiting-on-a-person`.
-- `AUTO_SHIP_ENABLED` (`STUDIO_AUTO_SHIP=1`, live today) un-pins the MERGE and
-- reaches this tool not at all.
--
-- WHY A CLICK IS THE WEAK ANSWER, measured rather than asserted:
--
--   SELECT status, count(*) FROM agent_approvals WHERE tool_name='cluster.trigger';
--   -- 42 cancelled | 38 expired | 10 pending | 0 approved   (R-04, since July)
--
-- Ninety questions raised, none ever answered. A gate nobody answers is a stall
-- wearing governance as a costume, and it is precisely how a run reaches Ship
-- and dies there while the product claims it runs while nobody watches.
--
-- WHAT REPLACES IT is a standing decision plus four preconditions the loop must
-- PROVE: the changeset is merged, CI was green at that head sha (already
-- enforced in-tool at `studio.pr.merge`), a successful Deno preview exists at
-- that exact commit (already enforced in `promoteChangeset`), and the work
-- carries a FORECAST. The fourth is the new one and it is the point: the loop
-- may ship on its own only work it can be graded on later. A change nobody can
-- grade cannot ship itself.
--
-- THIS COLUMN IS ONLY THE STANDING DECISION. It is deliberately not a
-- per-deploy switch and not a per-user permission: a person decides once, for a
-- workspace, in advance, and the run then proves each deploy against the
-- contract. Every other clause of R-27 lives in code.
--
-- DEFAULT FALSE, AND R-22 IS WHY IT IS `NOT NULL`. `default_track_spend_cap_usd`
-- shipped nullable with no default and `resolveTrackSpendCap` read the resulting
-- NULL as a workspace that had deliberately cleared its ceiling — a decision
-- nobody had made and no surface could make. When an absent value and a chosen
-- value share one representation, the absent one must resolve to the SAFE
-- reading. Here `NOT NULL DEFAULT false` removes the representation entirely:
-- there is no "unset", so there is nothing to misread.

alter table public.workspaces
  add column if not exists autonomous_ship_enabled boolean not null default false;

-- WHO DECIDED, AND WHEN. A standing permission with no audit row is not an
-- enterprise control, it is a setting. R-16's enterprise bar asks for an audit
-- trail and for a failure that names what failed; this is the first half, and
-- it is the half that answers "who allowed this deploy" three months later when
-- nobody remembers. Nullable on purpose: `false` is the product's default rather
-- than anybody's decision, so there is no actor to record until someone turns it
-- on. A row with the flag true and no actor is therefore visible as a direct
-- database write rather than a decision made in the product.
alter table public.workspaces
  add column if not exists autonomous_ship_enabled_at timestamptz;

alter table public.workspaces
  add column if not exists autonomous_ship_enabled_by uuid references auth.users(id) on delete set null;

comment on column public.workspaces.autonomous_ship_enabled is
  'R-27. Standing decision that release.publish and studio.revert may run unattended in this workspace, subject to the four proof preconditions in resolveToolMode/promoteChangeset. Default false; reversing is this one UPDATE.';
comment on column public.workspaces.autonomous_ship_enabled_at is
  'R-27. When the standing decision was taken. NULL while the flag is false.';
comment on column public.workspaces.autonomous_ship_enabled_by is
  'R-27. Who took the standing decision. NULL with the flag true means a direct database write rather than a decision made in the product.';
