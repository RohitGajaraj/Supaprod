-- Landing v2 GTM wiring (idempotent re-apply to record migration)
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  bet_text text,
  referral_code text not null,
  referred_by text,
  referral_count integer not null default 0,
  source text,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_signups_email_key on public.waitlist_signups (lower(email));
create unique index if not exists waitlist_signups_referral_code_key on public.waitlist_signups (referral_code);
alter table public.waitlist_signups enable row level security;

create table if not exists public.landing_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  props jsonb not null default '{}'::jsonb,
  session_key text,
  created_at timestamptz not null default now()
);
create index if not exists landing_events_event_created_idx on public.landing_events (event, created_at);
alter table public.landing_events enable row level security;

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