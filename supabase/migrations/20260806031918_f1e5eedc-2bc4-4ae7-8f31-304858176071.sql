alter table public.signals
  add column if not exists is_sample boolean not null default false;

alter table public.opportunities
  add column if not exists is_sample boolean not null default false;

update public.opportunities
   set is_sample = true
 where is_sample = false
   and title in (
     'Launch push notifications for engagement',
     'Redesign onboarding to reduce day-1 drop-off',
     'Add offline mode for core features',
     'Test $4.99/month tier (vs. $9.99)',
     'Pivot positioning to SMB (vs. Consumer)',
     'Invest 3 weeks in UX polish before beta wave 2',
     'Build a defensible moat (AI-powered workflows)',
     'Rebuild b'
   );

comment on column public.signals.is_sample is
  'Written by onboarding seeding, not by a person or an agent. Surfaces must mark it, and anything that forms a judgement must exclude it.';

comment on column public.opportunities.is_sample is
  'Written by onboarding seeding, not by a person or an agent. Surfaces must mark it, and anything that forms a judgement must exclude it.';