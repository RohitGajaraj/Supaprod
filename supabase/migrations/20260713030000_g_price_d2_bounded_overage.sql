-- G-PRICE PR-D2: bounded, opt-in overage — the anti-surprise-bill guardrail
-- (pricing-architecture §2 Rule 4, §9d "the single missing feature that sank Replit
-- and Devin"). Default is still stop-at-allowance (never silent overspend); an account
-- owner may explicitly opt in to a BOUNDED overage window (a rate multiplier on the
-- monthly grant, capped, never unlimited) so a chargeable call is allowed to draw past
-- the pool once, rather than every call halting the moment the pool empties.
--
-- account_credits.overage_enabled: off by default (the safe floor). When on,
-- overage_cap_multiplier bounds how far past the monthly grant the account may draw
-- before it hard-stops for real (Zapier's 1.25x-to-3x precedent). The chokepoint checks
-- this in assertAccountCredits; it is enforced application-side (same pattern as every
-- other credit gate in this engine), not a DB CHECK, since it depends on the SAME
-- window/cycle math the rest of the cap system already uses.

alter table public.account_credits
  add column if not exists overage_enabled boolean not null default false,
  add column if not exists overage_cap_multiplier numeric not null default 1.25
    check (overage_cap_multiplier >= 1.0 and overage_cap_multiplier <= 3.0);
