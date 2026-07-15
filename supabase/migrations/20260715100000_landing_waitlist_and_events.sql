-- Landing v2 GTM wiring (docs/planning/landing-page-v2-plan.md sections 7.1 and 7.2).
--
-- waitlist_signups: the beta waitlist with the teardown hook (optional bet_text)
-- and the referral queue-bump mechanic. All reads and writes go through
-- src/lib/landing.functions.ts using the service role. RLS is enabled with NO
-- public policies on purpose: anon and authenticated clients get nothing, which
-- is tighter than the plan's "insert-only public" because inserts happen
-- server-side.
--
-- landing_events: first-party funnel capture (landing_visit -> waitlist_join ->
-- referral_share -> demo_click) so launch-day analytics are verifiable even
-- before a PostHog key lands in the observability facade (AFD). No PII: the
-- event name, a small props payload, and an anonymous session key.

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  bet_text text,
  referral_code text not null,
  referred_by text,
  referral_count integer not null default 0,
  source text,
  created_at timestamptz not null default now()
);

create unique index waitlist_signups_email_key on public.waitlist_signups (lower(email));
create unique index waitlist_signups_referral_code_key on public.waitlist_signups (referral_code);

alter table public.waitlist_signups enable row level security;

create table public.landing_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  props jsonb not null default '{}'::jsonb,
  session_key text,
  created_at timestamptz not null default now()
);

create index landing_events_event_created_idx on public.landing_events (event, created_at);

alter table public.landing_events enable row level security;

-- Atomic referral bump so two referred signups landing together cannot lose a
-- count. Service-role callers only.
create or replace function public.bump_waitlist_referral(_code text)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update public.waitlist_signups
     set referral_count = referral_count + 1
   where referral_code = _code;
$$;

revoke all on function public.bump_waitlist_referral(text) from public;
revoke all on function public.bump_waitlist_referral(text) from anon;
revoke all on function public.bump_waitlist_referral(text) from authenticated;
