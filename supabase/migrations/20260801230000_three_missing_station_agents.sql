-- THE THREE SEATS THE LOOP WAS MISSING (founder ruling 2026-08-01: "what are
-- the necessary agents that is going to get attached to each station... if there
-- is any gap that we need to create a new agent, please go ahead and create
-- that, so that the entire loop for each seven sections does the entire job
-- completely").
--
-- WHAT THE ROSTER AUDIT FOUND. Thirteen active cast agents existed and the
-- driver dispatched seven: it took the FIRST agent registered for a station and
-- ignored the rest. So `researcher`, `customer-insights`, `critic`,
-- `sprint-planner` and `qa` were fully defined, named, coloured, given relay
-- verbs, seeded into every user's roster, and called by nothing. Nothing failed,
-- because an agent that is never dispatched raises no error; the station simply
-- did part of its job forever. `stationCrew` in src/lib/spine/driver.ts now runs
-- the whole crew, and driver.test.ts fails the build if an active agent is left
-- out of one.
--
-- THREE GENUINE GAPS remained after that, where the roster had nobody to run:
--
--   04 Design was the ONLY station with a single seat, so nothing read the
--      design back before it was handed to Build. Every other station already
--      paired a maker with a reader (Decide has Challenge, Build has Review).
--      -> design-critic.
--
--   06 Ship is the one station whose action cannot be undone from inside the
--      product, and nothing stood between arriving at Ship and publishing.
--      `release.publish` sits at a hard review floor, so a PERSON was the only
--      readiness check that existed, which is the gate doing a job that policy
--      should have done first (GOVERNANCE-PRINCIPLE.md: the gate is the
--      exception, not the loop).
--      -> release-verifier, and it runs BEFORE release, which is the point.
--
--   07 Learn graded one outcome and nothing carried the grade forward. The
--      investor canon is explicit that the brain is never storage, that it
--      compounds and warns before you repeat what went wrong; a station that
--      only writes a `learnings` row is storage.
--      -> insight-keeper, which promotes the verdict into memory the next
--         track's Decide and Plan stations actually read.
--
-- Added to `seed_default_agents` rather than a fourth seed function, on purpose.
-- The migration immediately before this one replaced six competing agent_tools
-- seeds with one authority; adding another one-shot here would rebuild the exact
-- structure that caused that defect. This function is already idempotent
-- (ON CONFLICT DO UPDATE) so replacing it and re-running it for everyone is safe.

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

    -- 04 Design, second seat. Reads the design back; never draws the first one.
    (_user_id, 'design-critic', 'Critique', 'Design review against the system',
      'You read a design back against the standing design system and against the spec it '
      'came from. Name what does not conform and what the spec asked for that the design '
      'does not do. Be specific about which rule is broken, never a general impression. '
      'Say plainly when it is sound; a review that always finds something is not a review.',
      'fuchsia', true),

    -- 06 Ship, and it runs first. The only seat in the loop whose job is to say no.
    (_user_id, 'release-verifier', 'Verify', 'Release readiness',
      'You decide whether a change is ready to go out, before it goes out. Check it against '
      'the spec it was built from and against what review found. Shipping cannot be undone '
      'from inside this product, so the burden is on the change to prove it is ready, not on '
      'you to prove it is not. Say no when it is not ready and say exactly what is missing.',
      'slate', true),

    -- 07 Learn, second seat. Makes the compounding claim true.
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

  -- Demo-seed FK compatibility only, always disabled (seed_sample_workspace
  -- looks up slug='engineer' for ~12 FK columns).
  INSERT INTO public.agents (user_id, slug, name, role, system_prompt, color, enabled) VALUES
    (_user_id, 'engineer', 'Engineer', 'Deprecated alias of Builder',
      'Deprecated - kept only for demo-seed FK compatibility, never active.', 'blue', false)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET enabled = false;

  PERFORM public.seed_orchestrator_agent(_user_id);
END;
$function$;

-- Backfill every existing roster. Without this the three new seats exist in the
-- catalog and in stationCrew but have no row to dispatch, so Design, Ship and
-- Learn would each throw "agent not found in your roster" on the next tick.
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
