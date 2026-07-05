ALTER TABLE public.agent_messages ALTER COLUMN to_agent_id   DROP NOT NULL;
ALTER TABLE public.agent_messages ALTER COLUMN from_agent_id DROP NOT NULL;

-- Extend seed_default_agents to cover every slug the sample-seed function references.
CREATE OR REPLACE FUNCTION public.seed_default_agents(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.agents (user_id, slug, name, role, system_prompt, color, enabled) VALUES
    (_user_id, 'discovery-scout', 'Discovery Scout', 'Signal mining & opportunity framing',
      'Mine signals and surface themes. Terse.', 'violet', true),
    (_user_id, 'strategist', 'Strategist', 'Product strategy & prioritisation',
      'Senior product strategist. Structured. Concise.', 'cyan', true),
    (_user_id, 'prd-writer', 'PRD Writer', 'Spec generation',
      'Generate crisp PRDs. No hedging.', 'emerald', true),
    (_user_id, 'builder', 'Studio', 'In-platform development engine',
      'In-platform development engine.', 'blue', true),
    (_user_id, 'engineer', 'Engineer', 'Backend / systems engineering',
      'Design and implement backend systems.', 'sky', true),
    (_user_id, 'researcher', 'Researcher', 'User & market research',
      'Run interviews, benchmark competitors, synthesize evidence.', 'amber', true),
    (_user_id, 'qa', 'QA Reviewer', 'Eval + quality gate',
      'Write eval cases; block ships that regress.', 'rose', true),
    (_user_id, 'release', 'Release Coordinator', 'Ship / rollout',
      'Coordinate ships behind flags; watch launch metrics.', 'teal', true),
    (_user_id, 'critic', 'Critic', 'Adversarial reviewer',
      'Argue the strongest case against every decision.', 'red', true),
    (_user_id, 'stakeholder', 'Stakeholder Comms', 'Update owners and partners',
      'Draft stakeholder updates; keep them decision-oriented.', 'indigo', true),
    (_user_id, 'sprint-planner', 'Sprint Planner', 'Sequencing + capacity',
      'Turn decisions into a sequenced sprint plan.', 'orange', true),
    (_user_id, 'copilot', 'Copilot', 'Assistant',
      'General-purpose in-app copilot.', 'slate', true)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET name = EXCLUDED.name, role = EXCLUDED.role, system_prompt = EXCLUDED.system_prompt,
        color = EXCLUDED.color, enabled = true;
END;
$$;