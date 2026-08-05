-- Give the onboarding seeds a way to admit what they are.
--
-- THE DEFECT. `seedWorkspaceForTrack` fires at step 1 of onboarding and inserts four
-- signals and four opportunities into the user's REAL workspace. They are invented:
-- "90% of sign-ups drop after day 1", "Competitor just launched push notifications",
-- "Launch push notifications for engagement". Specific, alarming, and about a product
-- the reader has not told us anything about yet.
--
-- Nothing on screen says so. `track-seeds.ts` documents the intended honesty label and
-- claims it lives in two places, the project NAME and "the description under it", and
-- BOTH fail:
--
--   1. `projects` has no description column at all, so `projectDescription` in
--      track-seeds.ts is dead data that can never reach a screen.
--   2. The project name IS prefixed "Example: ", but no surface renders it.
--      `listOpportunities` selects from `opportunities` with no join to `projects`,
--      and Decide takes the rows unfiltered.
--
-- So the first thing a Product Hunt visitor sees on Decide is "4 bets ranked, strongest
-- first" and a gate asking them to keep or drop a bet about a product they do not have.
-- For a product whose entire claim is that its judgement is grounded in YOUR record,
-- that reads as a faked demo, which is the most damaging possible first impression.
--
-- WHY A COLUMN RATHER THAN READING THE PROJECT NAME. A name prefix is a convention, and
-- a convention drifts: rename the seed project once and every label in the product goes
-- quiet with no test failing. A boolean is a fact the row carries itself, it survives a
-- rename, and it is what the ranking and belief paths can filter on cheaply.
--
-- `is_sample` already exists on `workspaces` and is read the same way, so this is the
-- existing vocabulary rather than a new one.
--
-- Forward-only. Default false, so every real row a user or an agent has ever written is
-- untouched and unaffected.

alter table public.signals
  add column if not exists is_sample boolean not null default false;

alter table public.opportunities
  add column if not exists is_sample boolean not null default false;

-- THE BACKFILL, anchored on the titles rather than on the project name.
--
-- The obvious anchor is wrong, and the live database says so. `track-seeds.ts` names its
-- three projects with an "Example: " prefix, so matching `p.name like 'Example: %'` looks
-- like the deterministic choice. Checked before writing it: there are ZERO such projects
-- in production. The live seeded projects are named "Mobile App Roadmap" and "Startup
-- MVP" -- the prefix was added to the seed file later, and every row already out there
-- predates it. That backfill would have matched nothing and reported success.
--
-- The titles are the stable anchor because they are strings WE author and have not
-- changed: 16 live opportunities across 4 workspaces still carry them exactly. A user
-- would have to type "Test $4.99/month tier (vs. $9.99)" verbatim to be caught.
--
-- Deliberately NOT matched by project: a person who added their own opportunity to a
-- seeded project would have it wrongly labelled an example, and mislabelling a user's
-- real bet as fiction is a worse failure than leaving one seed row unlabelled.
--
-- Guarded with `is_sample = false` so re-running is a no-op rather than a rewrite of
-- rows a human may since have corrected.

update public.opportunities
   set is_sample = true
 where is_sample = false
   and title in (
     -- solo track
     'Launch push notifications for engagement',
     'Redesign onboarding to reduce day-1 drop-off',
     'Add offline mode for core features',
     'Test $4.99/month tier (vs. $9.99)',
     -- founding track
     'Pivot positioning to SMB (vs. Consumer)',
     'Invest 3 weeks in UX polish before beta wave 2',
     'Build a defensible moat (AI-powered workflows)',
     'Rebuild backend in Rust (performance/scaling)',
     -- tech track
     'Refactor auth system for multi-org and custom scopes',
     'Rebuild API layer for horizontal scaling',
     'Ship official Python SDK (and eventually Go)',
     'Audit and optimize cloud spend'
   );

update public.signals
   set is_sample = true
 where is_sample = false
   and title in (
     -- solo track
     'Users asking for offline mode',
     '90% of sign-ups drop after day 1',
     'Competitor just launched push notifications',
     'Premium tier at 8% conversion',
     -- founding track
     'Investor feedback: ''nice to have, not need to have''',
     'Beta testers love the workflows, not the UX',
     'Competitor raised Series A, pivoted to SMB',
     'Tech co-founder wants to rebuild in Rust',
     -- tech track
     'API latency hitting 500ms under load',
     'Users asking for SDKs in Python and Go',
     'Technical debt in auth system is mounting',
     'Five-figure monthly cloud bill, still growing'
   );

comment on column public.signals.is_sample is
  'Written by onboarding seeding, not by a person or an agent. Surfaces must mark it, and anything that forms a judgement must exclude it.';

comment on column public.opportunities.is_sample is
  'Written by onboarding seeding, not by a person or an agent. Surfaces must mark it, and anything that forms a judgement must exclude it.';
