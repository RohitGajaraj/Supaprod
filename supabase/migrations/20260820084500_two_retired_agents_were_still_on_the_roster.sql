-- 20260820084500_two_retired_agents_were_still_on_the_roster.sql
--
-- Claude lane, 2026-08-20. The data half of K-21, which Kiro flagged for this lane.
--
-- §10 CRITERION 17: "agents with a duplicate display name at one station, 2, target 0".
-- **The two are `operations` and `growth-strategist`.**
--
-- WHAT IS TRUE, MEASURED RATHER THAN ASSUMED.
--
-- `agent-vocabulary.ts` holds TEN groups where several slugs share one display
-- name at one station, and that is correct and deliberate: an alias exists so a
-- run recorded months ago against `scout` comes back reading "Watch" instead of a
-- title-cased guess. **In every one of the ten, exactly one entry is `active` and
-- the rest are `deprecated`**, so the catalogue's own invariant already holds.
--
-- The defect is in the DATA. Six deprecated slugs are seeded into rosters:
--
--   slug                 status       enabled   rows
--   engineer             deprecated   false      16
--   copilot              deprecated   false       4
--   stakeholder          deprecated   false       4
--   competitor-watcher   deprecated   false       1
--   operations           deprecated   TRUE        1
--   growth-strategist    deprecated   TRUE        1
--
-- **Four of the six are already disabled and only two are not.** Those two are
-- the criterion's 2, and both sit on one user, each beside its enabled
-- replacement (`orchestrator` and `strategist` respectively).
--
-- THIS CORRECTS THE STATED CAUSE IN K-21, which named `engineer` as what makes
-- two agents render as "Engineer" at Build. `engineer` is `enabled = false` on
-- all 16 rows. It is not the pair the criterion counts.
--
-- DISABLED, NOT DELETED, AND THE NUMBER IS WHY. **Ten `agent_runs` reference the
-- deprecated agent rows.** Deleting them would orphan the exact history the alias
-- mechanism exists to keep readable -- the fix would break the thing it is meant
-- to protect. `enabled = false` takes them off the roster while the row, its id
-- and its lineage survive. `growth-strategist` carries 1 run; `operations` carries
-- 0.
--
-- SAFE BECAUSE THE REPLACEMENT IS ALREADY THERE. Both belong to one user, and
-- that user already has `orchestrator` and `strategist` enabled, so no capability
-- is removed and nothing needs re-seeding.
--
-- WHAT THIS DOES NOT FIX, recorded so it is not mistaken for closed: **`enabled`
-- is honoured inconsistently.** Of 41 reads of `agents` in `src`, 13 filter on it
-- and 28 do not, including `agents.functions.ts:16`, which is `select("*")` with
-- no filter. A disabled agent can therefore still appear on a surface that never
-- asks. That is a code fix and it belongs to whoever owns those readers; this
-- migration only stops the two rows being legitimately enabled in the first place.

update public.agents
   set enabled = false
 where slug in ('operations', 'growth-strategist')
   and enabled;

do $$
declare n_enabled_deprecated int; n_rows int;
begin
  select count(*) into n_enabled_deprecated
    from public.agents
   where slug in ('engineer','copilot','stakeholder','competitor-watcher','operations','growth-strategist')
     and enabled;
  if n_enabled_deprecated <> 0 then
    raise exception '% deprecated agents are still enabled', n_enabled_deprecated;
  end if;

  -- The rows must still exist: this is a deactivation, not a delete, and the ten
  -- runs pointing at them depend on that.
  select count(*) into n_rows
    from public.agents
   where slug in ('operations','growth-strategist');
  if n_rows <> 2 then
    raise exception 'expected the 2 retired agent rows to survive, found %', n_rows;
  end if;
end $$;
