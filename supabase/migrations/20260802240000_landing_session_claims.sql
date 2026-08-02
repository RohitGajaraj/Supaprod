-- The landing attribution seam. One row per anonymous landing session that
-- turned into an account.
--
-- WHY A TABLE AND NOT A COLUMN ON landing_events. landing_events is append only
-- telemetry. Putting user_id on it would mean rewriting every row a session
-- already wrote at the moment of signup, and rewriting again for anything it
-- writes afterwards. It would also store one fact once per event instead of
-- once, and it is the wrong shape anyway: the account is a property of the
-- session, not of a click.
--
-- WHY NOT A PROPERTY INSIDE landing_events.props. props is an unindexed jsonb
-- blob with no constraints. The claim would live on one arbitrary row, and
-- reading it back would mean digging it out of json and then joining to the
-- rest of the session by session_key regardless. That is this table, built by
-- accident and without the uniqueness guarantee.
--
-- WHY THIS SHAPE IS THE PRIVACY ANSWER. The link between a person and their
-- anonymous trail exists in exactly one row, in one table, with its own
-- timestamp. Deleting that row makes the trail anonymous again, completely and
-- permanently, with no rewrite of the event history and nothing left behind.
-- An erasure request is one DELETE. Neither a column nor a json property can
-- offer that.
create table public.landing_session_claims (
  -- The anonymous key the browser minted, 32 hex characters. Unique as the
  -- primary key: a session belongs to the first account that came out of it,
  -- and a second signup in the same tab is a different person on a shared
  -- browser, whose earlier anonymous browsing is not theirs to claim.
  session_key text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);

-- The reverse lookup: given an account, find the session it came from.
create index landing_session_claims_user_idx
  on public.landing_session_claims (user_id);

-- Same posture as landing_events and waitlist_signups: RLS on, and no policies
-- at all. Every read and write goes through the service role in
-- src/lib/landing.functions.ts, so anon and authenticated clients get nothing.
-- A visitor must never be able to read this table: it is the one place the
-- anonymous trail and a real account are tied together.
alter table public.landing_session_claims enable row level security;
