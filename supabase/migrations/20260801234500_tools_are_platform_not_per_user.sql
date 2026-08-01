-- RETIRE PER-USER TOOL SEEDING. The platform decides; a row is only a deviation.
--
-- FOUNDER RULING 2026-08-01: "shouldn't it be building at a platform level
-- holistically? What happens if a seventeen thousand new user signs up, there is
-- no need for backfilling because the right solution is put in place at the
-- platform level and the platform takes care of everything. But if you don't
-- backfill today, the existing users would not see the latest data. So we need
-- to take care of them as of today; from tomorrow it should be automatic."
--
-- WHAT WAS STILL WRONG AFTER THE LAST FIX. The migration two before this one
-- collapsed six competing `agent_tools` seeds into one authority. That fixed the
-- DRIFT and kept the SHAPE: capability was still COPIED into every account, so
-- tool fifty-five would still have needed a backfill against every existing
-- user, and user seventeen was still one un-fired trigger away from a Plan
-- station that cannot write a spec.
--
-- THE MODEL NOW. `src/lib/ai/tools/defaults.ts` is the platform's tool policy and
-- `loop.server.ts` builds every agent's tool list from `TOOL_REGISTRY`, applying
-- `agent_tools` rows as OVERRIDES. An absent row means "the platform default
-- applies", not "you may not". So a newly registered tool is live for every
-- account the moment it ships, a new account needs no seeding at all, and there
-- is nothing left that can drift.
--
-- THE BACKFILL IS A DELETE, WHICH IS THE WHOLE POINT. Under the old model an
-- account got current by having rows written to it. Under this one it gets
-- current by having none: a stored row PINS that account to the policy of the
-- day it was seeded, so a default changed later would never reach the sixteen
-- accounts that already exist. Clearing them is what puts today's users on the
-- same policy tomorrow's users are born with.
--
-- WHY CLEARING IS SAFE HERE, checked against the live table before writing:
--   * 864 rows, and ZERO with `enabled = false`. No account has switched a tool
--     off, so no account loses anything it had chosen to disable.
--   * Every row was written by one of the six seed functions. The only human
--     writer, `updateToolMode`, keyed on a row id that only a seed could create,
--     and this product has not launched: the sixteen accounts are the founder's,
--     the demo logins, and test signups.
-- If either of those stops being true, narrow this to rows that agree with the
-- default rather than widening the model back to per-user grants.

delete from public.agent_tools where built_in = true;

-- Nothing to seed any more, so nothing seeds. This was the single authority
-- introduced hours earlier; the model it served is the one being retired.
drop trigger if exists seed_agent_tools on public.profiles;

comment on table public.agent_tools is
  'PER-ACCOUNT OVERRIDES ONLY, never a grant. The tool list is TOOL_REGISTRY and the '
  'policy is src/lib/ai/tools/defaults.ts; a row here records where ONE account deviates. '
  'No row means the platform default applies. Do not seed this table: a seeded row pins '
  'that account to the policy of the day it was written.';
