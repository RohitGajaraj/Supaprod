-- SW-4 / mission 3.10 TRUST RAMP: graduation proposals per (agent, tool).
--
-- Approval mode today is composed from two axes: agent_tools.mode is
-- (user, tool)-scoped and agent_autonomy.arc is (user, agent)-scoped; there
-- is no stored per-(agent, tool) mode, and the only auto-advance
-- (auto_advance_agent_arc) flips the arc silently. The ramp fixes both:
-- after N clean approvals the system writes a PROPOSAL row (the house_rules
-- pending/approved/rejected pattern); only a human acceptance writes the
-- graduated mode into agent_tool_modes, which loop.server.ts overlays on the
-- seeded tool mode at run start. The resolveToolMode safety floors still
-- bind after the overlay, so a graduated mode can never bypass
-- HIGH_RISK_FORCE_REVIEW / HIGH_RISK_MIN_CONFIRM.

-- 1. The graduated per-(agent, tool) mode. Written ONLY by an accepted
--    proposal (decideTrustGraduation); never by the loop.
create table if not exists public.agent_tool_modes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  agent_slug  text not null,
  tool_name   text not null,
  mode        text not null check (mode in ('auto', 'confirm', 'review')),
  source      text not null default 'graduation'
                check (source in ('graduation', 'operator')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, agent_slug, tool_name)
);

alter table public.agent_tool_modes enable row level security;
grant select, insert, update, delete on public.agent_tool_modes to authenticated;
grant all on public.agent_tool_modes to service_role;

drop policy if exists "agent_tool_modes own" on public.agent_tool_modes;
create policy "agent_tool_modes own"
  on public.agent_tool_modes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. The proposal queue: the graduation IS an approval item.
create table if not exists public.trust_graduation_proposals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  agent_slug   text not null,
  tool_name    text not null,
  from_mode    text not null check (from_mode in ('auto', 'confirm', 'review')),
  to_mode      text not null check (to_mode in ('auto', 'confirm', 'review')),
  clean_streak integer not null default 0,
  rationale    text,
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid
);

-- One live proposal per (user, agent, tool); history rows keep their status.
create unique index if not exists trust_grad_pending_uniq
  on public.trust_graduation_proposals (user_id, agent_slug, tool_name)
  where status = 'pending';
create index if not exists trust_grad_user_status_idx
  on public.trust_graduation_proposals (user_id, status, created_at desc);

alter table public.trust_graduation_proposals enable row level security;
grant select, insert, update, delete on public.trust_graduation_proposals to authenticated;
grant all on public.trust_graduation_proposals to service_role;

drop policy if exists "trust_grad own" on public.trust_graduation_proposals;
create policy "trust_grad own"
  on public.trust_graduation_proposals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. The streak query's index: decided approvals per (user, agent, tool),
--    newest first.
create index if not exists agent_approvals_ramp_idx
  on public.agent_approvals (user_id, agent_slug, tool_name, decided_at desc)
  where decided_at is not null;
