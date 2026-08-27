-- IS THIS ROW A DEMO FIXTURE? SIX TABLES COULD NOT ANSWER.
--
-- ── THE HOLE, FOUND BY S4 AFTER I FELL IN IT ───────────────────────────────
-- `workspaces.is_sample` is how every session tells seeded rows from real work.
-- Only SEVEN tables carry the flag themselves: agent_memory, learnings,
-- opportunities, prds, signals, themes, workspaces. For everything else the
-- workspace join is a PROXY, **and it leaks**: four seeded `deployments` rows
-- sit on a workspace whose `is_sample` is false.
--
--   60000000-0d00-4000-8000-000000000003  staging     staging.relay.helio-labs.example.com
--   60000000-0d00-4000-8000-000000000001  production  relay.helio-labs.example.com
--   60000000-0d00-4000-8000-000000000002  production  relay.helio-labs.example.com
--   60000000-0007-4000-8000-000000000001  production  atlas.helio-labs.example.com
--
-- This is not academic. Counting fixtures as real work produced a wrong headline
-- three times in one night from S4 and once from me: F-124 claimed "13 deno
-- previews, 14 merges executed, nothing needs building" and every one of those
-- rows was seeded. The founder's rule the same evening: a measurement of current
-- rows may shape PRIORITY and must never shape DESIGN. It cannot do either
-- safely while the question needs a join that lies.
--
-- ── THE BACKFILL IS A FACT, NOT A FINGERPRINT ──────────────────────────────
-- S4 offered a fingerprint: sequential ids matching `^[0-9]0000000-`, rows
-- sharing a millisecond, `example.com` in a URL. Good for LOOKING and I would
-- not write it into a migration: marking a row seeded on the strength of its id
-- SHAPE risks hiding real work, which is a worse failure than the one being
-- fixed.
--
-- Measured instead, and it is decisive. Deployment ids group into seven prefixes
-- `10000000` through `70000000`, each holding exactly the SAME four suffixes,
-- which is the demo seed copied into seven workspaces. **Every one of those 28
-- rows carries an `example.com` URL and no other row does.**
--
-- So the backfill tests the URL, and that is a fact about what the row CLAIMS
-- rather than about how its id was typed: `example.com` is the RFC 2606 reserved
-- documentation domain, it cannot resolve to anything, and a deployment that
-- points at it is definitionally not a deployment that happened. A real row can
-- never legitimately match.
--
-- ── WHAT IS DELIBERATELY LEFT UNMARKED, SAID OUT LOUD ──────────────────────
-- Only `deployments` is backfilled, because only there is the evidence airtight.
-- The other five get the column and nothing else, so:
--
--   is_sample = true   is PROVEN seeded.
--   is_sample = false  means NOT PROVEN SEEDED. It does not mean proven real.
--
-- That asymmetry is the honest state and it is better than the status quo, where
-- neither direction was knowable. Narrowing it further is a matter of finding
-- the next airtight fact, never of loosening this one.
--
-- ── TWO QUESTIONS, AND CONFLATING THEM CAUSED EVERY WRONG HEADLINE ─────────
-- Writing this column surfaced the actual confusion, which is not about which
-- filter to use but about which QUESTION is being asked:
--
--   "Is this row a planted fixture?"  -> is_sample ON THE ROW. A property of
--                                        the row itself.
--   "Was this demo work?"             -> the workspace join. A property of the
--                                        work the row came out of.
--
-- **Neither answers the other**, and the 13 Deno previews prove it. They sit on
-- a sample workspace, so they are demo WORK. But their `deploy_url`s are real,
-- distinct, hosted addresses with unique build hashes, written by the real
-- `ci-poll-tick` across three days: they are **genuine deploys that actually
-- executed**, not fixtures. So `is_sample = false` on them is correct, and a
-- reader who wanted "was this demo work" and reached for this column would be
-- misled in the opposite direction from before.
--
-- Both my F-124 and its correction F-124b picked one question and answered the
-- other. Whoever adds the next filter should say which of the two they mean.

alter table public.deployments        add column if not exists is_sample boolean not null default false;
alter table public.studio_changesets  add column if not exists is_sample boolean not null default false;
alter table public.spine_tracks       add column if not exists is_sample boolean not null default false;
alter table public.agent_runs         add column if not exists is_sample boolean not null default false;
alter table public.agent_approvals    add column if not exists is_sample boolean not null default false;
alter table public.decisions          add column if not exists is_sample boolean not null default false;

-- The one provable backfill. See the note above on why this is a fact about the
-- claim rather than a guess about the id.
update public.deployments
   set is_sample = true
 where deploy_url like '%example.com%'
   and is_sample = false;

comment on column public.deployments.is_sample is
  'True only where PROVEN seeded. False means not proven seeded, never proven real: see 20260827050000.';
