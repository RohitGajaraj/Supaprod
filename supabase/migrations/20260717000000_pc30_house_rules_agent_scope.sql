-- PC-30/RPT-50: optional per-agent scoping for house rules
-- Lets a self-improvement fix that diagnosed ONE agent (self_improve_proposals
-- kind='agent') apply as a rule that only that agent receives, instead of
-- landing workspace-wide on every agent's system prompt. NULL (the default,
-- and every existing row) keeps the original workspace-wide behavior
-- unchanged -- this is purely additive, no backfill needed.

ALTER TABLE public.house_rules ADD COLUMN IF NOT EXISTS agent_slug text;

CREATE INDEX IF NOT EXISTS idx_house_rules_workspace_agent
  ON public.house_rules(workspace_id, agent_slug)
  WHERE status = 'approved';

-- PC-30: a third capability-change type for the RPT-50 learning inlet (a
-- self-tuned house rule the self-improvement loop applied for one agent),
-- alongside the existing human 'instructions'/'skill_enabled'/'skill_disabled'
-- edits -- reuses the same receipted capability_changes table/history read,
-- no new query path needed.
ALTER TABLE public.capability_changes DROP CONSTRAINT IF EXISTS capability_changes_change_type_check;
ALTER TABLE public.capability_changes ADD CONSTRAINT capability_changes_change_type_check
  CHECK (change_type IN ('instructions', 'skill_enabled', 'skill_disabled', 'self_tuned'));
