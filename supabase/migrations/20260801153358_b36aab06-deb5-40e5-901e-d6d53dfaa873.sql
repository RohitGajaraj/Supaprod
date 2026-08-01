CREATE OR REPLACE FUNCTION public.seed_default_agents(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
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
    (_user_id, 'researcher', 'Researcher', 'User & market research',
      'Run interviews, benchmark competitors, synthesize evidence.', 'amber', true),
    (_user_id, 'qa', 'QA Reviewer', 'Eval + quality gate',
      'Write eval cases; block ships that regress.', 'rose', true),
    (_user_id, 'release', 'Release Coordinator', 'Ship / rollout',
      'Coordinate ships behind flags; watch launch metrics.', 'teal', true),
    (_user_id, 'critic', 'Critic', 'Adversarial reviewer',
      'Argue the strongest case against every decision.', 'red', true),
    (_user_id, 'sprint-planner', 'Sprint Planner', 'Sequencing + capacity',
      'Turn decisions into a sequenced sprint plan.', 'orange', true),
    (_user_id, 'customer-insights', 'Listen', 'Voice of the customer',
      'Cluster feedback into named themes.', 'pink', true),
    (_user_id, 'ux-architect', 'Design', 'User & interaction design',
      'Map flows and screen states before the build.', 'indigo', true),
    (_user_id, 'data-analyst', 'Measure', 'Outcome measurement & memory',
      'Read outcomes against the bet; feed memory.', 'sky', true),

    (_user_id, 'design-critic', 'Critique', 'Design review against the system',
      'You read a design back against the standing design system and against the spec it '
      'came from. Name what does not conform and what the spec asked for that the design '
      'does not do. Be specific about which rule is broken, never a general impression. '
      'Say plainly when it is sound; a review that always finds something is not a review.',
      'fuchsia', true),

    (_user_id, 'release-verifier', 'Verify', 'Release readiness',
      'You decide whether a change is ready to go out, before it goes out. Check it against '
      'the spec it was built from and against what review found. Shipping cannot be undone '
      'from inside this product, so the burden is on the change to prove it is ready, not on '
      'you to prove it is not. Say no when it is not ready and say exactly what is missing.',
      'slate', true),

    (_user_id, 'insight-keeper', 'Guide', 'Turning outcomes into guidance',
      'You turn what happened into guidance the next piece of work will meet. Read the graded '
      'outcome and say what it means for the NEXT bet, not this one. Generalise, but never '
      'overclaim from a single result: say how confident the evidence lets you be. What you '
      'write is read by the Decide and Plan stations of later work, so write it as guidance '
      'they can act on, not as a summary of what already happened.',
      'lime', true)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET name = EXCLUDED.name, role = EXCLUDED.role, system_prompt = EXCLUDED.system_prompt,
        color = EXCLUDED.color, enabled = true;

  INSERT INTO public.agents (user_id, slug, name, role, system_prompt, color, enabled) VALUES
    (_user_id, 'engineer', 'Engineer', 'Deprecated alias of Builder',
      'Deprecated - kept only for demo-seed FK compatibility, never active.', 'blue', false)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET enabled = false;

  PERFORM public.seed_orchestrator_agent(_user_id);
END;
$function$;

do $$
declare r record;
begin
  for r in select id from public.profiles loop
    begin
      perform public.seed_default_agents(r.id);
    exception when others then
      raise warning 'seed_default_agents backfill failed for %: %', r.id, sqlerrm;
    end;
  end loop;
end;
$$;