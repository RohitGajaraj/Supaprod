-- SW-4 / mission 3.4 DESIGN STATION: design becomes a gated pipeline stage
-- between Define and Build.
--
-- A spec carries a design gate (pending -> approved/rejected, decided by a
-- human on the spec page); both dispatch paths (Studio + Build Console)
-- refuse to dispatch while the workspace's design stage is on and the gate
-- is not approved. The gate verdict writes a stage_events row and a taste
-- learning into design memory. Everything fails open pre-migration: absent
-- columns read as "stage off" and dispatch behaves exactly as before.
--
-- Default ON is the launch posture; founder-gated input 6 in
-- docs/planning/mission-demo-week.md ratifies on-by-default vs opt-in, and
-- the owner-only toggle (toggleDesignStage) flips it per workspace either way.

alter table public.prds
  add column if not exists design_gate_status text not null default 'pending'
    check (design_gate_status in ('pending', 'approved', 'rejected')),
  add column if not exists design_decided_by uuid,
  add column if not exists design_decided_at timestamptz;

alter table public.workspaces
  add column if not exists design_stage_enabled boolean not null default true;
