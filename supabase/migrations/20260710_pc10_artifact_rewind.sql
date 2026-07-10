/**
 * PC-10: One-key rewind for AI-touched artifacts.
 *
 * Lightweight snapshot table for capturing artifact state before writes.
 * Reverts populate the snapshot_before column when an artifact is modified
 * by an agent; on revert, we restore the artifact to that snapshot and log
 * the action to trust_ledger as an autonomous action.
 *
 * Design: snapshot_before is immutable (set once on the prd/decision/roadmap
 * row); revert creates a NEW snapshot with the reverted content, then updates
 * the artifact row. This preserves history (no rollover) and keeps the revert
 * operation traceable.
 */

-- Add snapshot_before column to track pre-modification state
-- Set once when an AI agent writes; immutable after that
alter table public.prds add column if not exists snapshot_before jsonb default null;
alter table public.decisions add column if not exists snapshot_before jsonb default null;

-- NOTE (2026-07-10 security/apply review): the original draft also altered
-- public.roadmaps, but no such relation exists in the live schema (the roadmap
-- surface reads from prds/projects; only roadmap_audit exists) - that line was
-- apply-fatal and is removed. The third artifact type ("roadmap") joins the
-- rewind feature when its real backing table is designated on the PC-10 row.

-- Comment: these columns are set by the application (revertPrdToPrevious, etc.)
-- when capture-on-write happens; they are not auto-managed by triggers.
-- A revert operation: fetches snapshot_before, updates the prd/decision,
-- and creates a new snapshot_before for the reverted artifact (in case revert
-- is reverted). The Trust Ledger captures the action.
