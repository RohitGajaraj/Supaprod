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
alter table public.prds add column snapshot_before jsonb default null;
alter table public.decisions add column snapshot_before jsonb default null;
alter table public.roadmaps add column snapshot_before jsonb default null;

-- Comment: these columns are set by the application (revertPrdToPrevious, etc.)
-- when capture-on-write happens; they are not auto-managed by triggers.
-- A revert operation: fetches snapshot_before, updates the prd/decision/roadmap,
-- and creates a new snapshot_before for the reverted artifact (in case revert
-- is reverted). The Trust Ledger captures the action.
