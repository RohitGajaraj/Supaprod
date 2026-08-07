-- The front door closes. From 2026-08-07 an account exists only behind a code.
--
-- FOUNDER RULING, 2026-08-07. Signup was wide open with auto-confirm
-- (src/routes/signup.tsx), and that one fact made the waitlist theatre: a form
-- collecting addresses for a queue nobody stood in, on a page whose own primary
-- CTA walked every visitor straight past it to an unlocked door. Closing it buys
-- two things that cannot be bought any other way. The waitlist count becomes a
-- real number of people who asked for access, which is the only version of that
-- number an investor should ever be shown, and the first cohort is chosen rather
-- than whoever happened to wander in during launch week.
--
-- WHY A NEW TABLE INSTEAD OF public.vouchers, which already carries a 'signup'
-- kind and would look like the obvious home. That engine is POST-AUTH in every
-- part: redeem_voucher runs behind requireSupabaseAuth, its only caller is the
-- Settings card (src/components/settings/RedeemCodeCard.tsx), and what it hands
-- out is credits or a plan tier. A door gate has to answer somebody with no
-- account at all, which is precisely the caller vouchers cannot serve, and
-- routing every refused signup through a code path that can also move money is
-- a blast radius nobody asked for.
--
-- WHAT `uses` COUNTS, written here because the column name does not say it:
-- REDEMPTIONS, not accounts. The email signup path redeems AFTER the account
-- exists, so a signup that fails burns nothing. The Google path cannot observe
-- its own outcome (the OAuth round trip leaves the page and returns on a route
-- the signup file does not own), so it redeems at handoff and can burn a use for
-- an account that was abandoned mid-flow. Calling that a redemption is true.
-- Calling it an account would not be, and this product does not publish a number
-- it did not watch happen. When it costs someone a slot, the fix is one edit to
-- max_uses on /admin/invites.
--
-- ADDITIVE, and a NEW file rather than an edit to an old one. Editing a
-- historical migration leaves the correction inert against every database that
-- already ran it, which is exactly how ea899590 shipped a fix that never
-- applied.

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  -- Stored with whatever casing it was minted in, because that is the casing
  -- printed on a card or pasted into an email. Every lookup lowers both sides
  -- (see the unique index and both functions below), so the person typing it
  -- back at 1am never has to reproduce it.
  code text not null,
  -- Who or what this code is for, in words. Without it a leaked code cannot be
  -- traced back to the hand it was given to, and revoking becomes guesswork.
  note text,
  -- null means unlimited. Not zero, and not a sentinel: a code with max_uses 0
  -- is a code that can never be redeemed, which is a real thing an admin might
  -- want and would be unreachable if null meant unlimited AND zero meant it too.
  max_uses integer,
  uses integer not null default 0,
  -- null means never expires.
  expires_at timestamptz,
  -- Revocation is a flag and not a DELETE on purpose. A deleted code takes its
  -- redemption count with it, so the one question asked after a leak ("how many
  -- got in before we killed it") becomes unanswerable.
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Case-insensitive uniqueness, and the index the lookups actually use. A plain
-- unique(code) would let 'yc-compound' and 'YC-COMPOUND' both exist while every
-- lookup below matched both, so the constraint has to be the same expression the
-- reads are.
create unique index invite_codes_code_key on public.invite_codes (lower(code));

alter table public.invite_codes enable row level security;

-- NO POLICIES, deliberately, exactly as waitlist_signups is handled in the
-- 20260715 migration. anon and authenticated get nothing at all: every read and
-- write goes through src/lib/invites.functions.ts on the service role. A code is
-- a secret, and a table an authenticated user can select from is a table where
-- any account can read every unspent code in the beta.

-- Attempt log for the rate brake, and nothing else lives in it.
--
-- WHAT IS DELIBERATELY NOT STORED: the code that was tried, the email, the IP.
-- A failed attempt is a near-miss on a secret, and a table of near-misses is a
-- table of hints. The outcome and the clock are everything the brake needs and
-- everything the admin surface can honestly say.
create table public.invite_code_attempts (
  id uuid primary key default gen_random_uuid(),
  outcome text not null,
  created_at timestamptz not null default now()
);

create index invite_code_attempts_created_idx on public.invite_code_attempts (created_at desc);

alter table public.invite_code_attempts enable row level security;

-- The verdict vocabulary, in one place, so the pre-flight check and the redeem
-- cannot drift into disagreeing about what a code is.
--
-- ORDER IS LOAD BEARING. revoked outranks expired outranks exhausted: a code
-- that was revoked AND has run out is reported revoked, because that is the fact
-- an admin acts on. The caller folds 'revoked' into 'unknown' before it reaches
-- a stranger (see invites.functions.ts) so a probe cannot learn that a code it
-- guessed once existed; the truth stays here, where the admin surface reads it.
create or replace function public.invite_code_status(_code text)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (select case
              when c.revoked then 'revoked'
              when c.expires_at is not null and c.expires_at <= now() then 'expired'
              when c.max_uses is not null and c.uses >= c.max_uses then 'exhausted'
              else 'ok'
            end
       from public.invite_codes c
      where lower(c.code) = lower(_code)),
    'unknown');
$$;

-- Atomic redeem. Modelled on bump_waitlist_referral in the 20260715 migration,
-- and it has to be stricter than that one because this counter has a ceiling.
--
-- THE WHOLE POINT IS THE SINGLE UPDATE. The guard `uses < max_uses` lives in the
-- WHERE clause of the statement that does the increment, so the check and the
-- write are one operation and cannot be interleaved. Two people redeeming the
-- last use of a code in the same instant hit the same row: Postgres takes a row
-- lock, the second waits, and when it wakes it re-evaluates this WHERE against
-- the row the first one just wrote. It sees uses = max_uses, matches nothing,
-- and is refused. Written as a SELECT then an UPDATE it would be a
-- read-modify-write over a network round trip and both would succeed, which for
-- a private beta means a cohort quietly larger than the founder chose.
--
-- Service-role callers only. Nothing here checks who is asking, so the grants at
-- the bottom of this file are the access control.
create or replace function public.redeem_invite_code(_code text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _claimed integer;
  _reason text;
begin
  update public.invite_codes
     set uses = uses + 1
   where lower(code) = lower(_code)
     and revoked = false
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses)
  returning uses into _claimed;

  if _claimed is not null then
    return 'ok';
  end if;

  _reason := public.invite_code_status(_code);

  -- A call that incremented nothing may NEVER answer 'ok'. The caller reads
  -- 'ok' as "this account is accounted for", and the only way to get here with
  -- a live-looking row is that its state moved between the update above and
  -- this read (a revoke lifted, an expiry extended). The redemption still did
  -- not happen, so the honest answer is a refusal rather than the row's current
  -- mood.
  if _reason = 'ok' then
    return 'exhausted';
  end if;

  return _reason;
end;
$$;

revoke all on function public.invite_code_status(text) from public;
revoke all on function public.invite_code_status(text) from anon;
revoke all on function public.invite_code_status(text) from authenticated;
revoke all on function public.redeem_invite_code(text) from public;
revoke all on function public.redeem_invite_code(text) from anon;
revoke all on function public.redeem_invite_code(text) from authenticated;

-- The one code that ships with the door.
--
-- It exists so that closing signup does not also close the demo a partner or an
-- investor gets shown. Whoever is across the table types this and is inside in
-- one go, with nobody minting anything first, and it never runs out and never
-- expires because the one moment it must not fail is the moment there is no time
-- to fix it.
--
-- WHY IT LOOKS LIKE THIS. The stem is speakable and on-message ("the compounding
-- is the moat", CLAUDE.md) so it survives being said out loud across a table and
-- written on the back of something. The six-character tail is what stops a
-- visitor who has worked out the pattern from typing their way in: the stem
-- alone would be guessable within an afternoon by anyone who had read the
-- landing page. Lookup is case-insensitive, so the casing on a card does not
-- matter.
--
-- IF IT LEAKS: revoke it on /admin/invites and mint a replacement. That is the
-- entire reason revoked is a flag rather than a DELETE.
insert into public.invite_codes (code, note, max_uses, expires_at, revoked)
values (
  'YC-COMPOUND-K7QR4V',
  'Permanent access code for YC partners and investors. Unlimited uses, never expires. Handed out in person and in decks. Revoke and replace if it leaks; the redemption count survives revocation so we can see how far it travelled.',
  null,
  null,
  false
)
on conflict do nothing;
