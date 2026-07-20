DO $$
DECLARE
  v_owner   uuid;
  v_member2 uuid;
  v_member3 uuid;
  ws            uuid := '10000000-0000-4000-8000-000000000000';
  p_atlas       uuid := '10000000-0000-4000-8000-0000000000a1';
  p_relay       uuid := '10000000-0000-4000-8000-0000000000a2';
  p_comet       uuid := '10000000-0000-4000-8000-0000000000a3';
  p_beacon      uuid := '10000000-0000-4000-8000-0000000000a4';
  prd_atlas1    uuid := '10000000-0001-4000-8000-000000000001';
  prd_atlas2    uuid := '10000000-0001-4000-8000-000000000002';
  prd_atlas3    uuid := '10000000-0001-4000-8000-000000000003';
  prd_relay1    uuid := '10000000-0001-4000-8000-000000000011';
  prd_relay2    uuid := '10000000-0001-4000-8000-000000000012';
  prd_comet1    uuid := '10000000-0001-4000-8000-000000000021';
  prd_beacon1   uuid := '10000000-0001-4000-8000-000000000031';
  th_relay      uuid := '10000000-0002-4000-8000-000000000001';
  op_relay      uuid := '10000000-0003-4000-8000-000000000001';
  sg1 uuid := '10000000-0004-4000-8000-000000000001';
  sg2 uuid := '10000000-0004-4000-8000-000000000002';
  sg3 uuid := '10000000-0004-4000-8000-000000000003';
  sg4 uuid := '10000000-0004-4000-8000-000000000004';
  sg5 uuid := '10000000-0004-4000-8000-000000000005';
  sg6 uuid := '10000000-0004-4000-8000-000000000006';
  sg7 uuid := '10000000-0004-4000-8000-000000000007';
  sg8 uuid := '10000000-0004-4000-8000-000000000008';
  sg9 uuid := '10000000-0004-4000-8000-000000000009';
  m_atlas       uuid := '10000000-0005-4000-8000-000000000001';
  m_relay       uuid := '10000000-0005-4000-8000-000000000002';
  m_beacon      uuid := '10000000-0005-4000-8000-000000000003';
  cs_atlas      uuid := '10000000-0006-4000-8000-000000000001';
  cs_relay      uuid := '10000000-0006-4000-8000-000000000002';
  cs_beacon     uuid := '10000000-0006-4000-8000-000000000003';
  dep_atlas     uuid := '10000000-0007-4000-8000-000000000001';
  lp_atlas      uuid := '10000000-0008-4000-8000-000000000001';
  ln_atlas1     uuid := '10000000-0009-4000-8000-000000000001';
  ln_atlas2     uuid := '10000000-0009-4000-8000-000000000002';
  dec_relay     uuid := '10000000-000a-4000-8000-000000000001';
  aa_relay      uuid := '10000000-000b-4000-8000-000000000001';
  ar_atlas1     uuid := '10000000-000c-4000-8000-000000000001';
  ar_atlas2     uuid := '10000000-000c-4000-8000-000000000002';
  ar_relay1     uuid := '10000000-000c-4000-8000-000000000011';
  ar_relay2     uuid := '10000000-000c-4000-8000-000000000012';
  ar_relay3     uuid := '10000000-000c-4000-8000-000000000013';
  ar_relay4     uuid := '10000000-000c-4000-8000-000000000014';
  ar_relay5     uuid := '10000000-000c-4000-8000-000000000015';
  ar_relay6     uuid := '10000000-000c-4000-8000-000000000016';
  ar_comet1     uuid := '10000000-000c-4000-8000-000000000021';
  ar_comet2     uuid := '10000000-000c-4000-8000-000000000022';
  ar_beacon1    uuid := '10000000-000c-4000-8000-000000000031';
  ar_beacon2    uuid := '10000000-000c-4000-8000-000000000032';
  mem1 uuid := '10000000-000d-4000-8000-000000000001';
  mem2 uuid := '10000000-000d-4000-8000-000000000002';
  mem3 uuid := '10000000-000d-4000-8000-000000000003';
  mem4 uuid := '10000000-000d-4000-8000-000000000004';
  mc1 uuid := '10000000-000e-4000-8000-000000000001';
BEGIN
  SELECT id INTO v_owner FROM auth.users WHERE email = 'demo@redcadence.app' LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE NOTICE 'helio-labs-demo-seed: demo@redcadence.app not found, skipping.';
    RETURN;
  END IF;
  SELECT id INTO v_member2 FROM auth.users WHERE email = 'demo2@redcadence.app' LIMIT 1;
  SELECT id INTO v_member3 FROM auth.users
   WHERE email NOT IN ('demo@redcadence.app', 'demo2@redcadence.app')
   ORDER BY created_at ASC LIMIT 1;

  INSERT INTO public.workspaces (id, owner_id, name, slug, is_sample)
  VALUES (ws, v_owner, 'Helio Labs', 'helio-labs-demo', true) ON CONFLICT DO NOTHING;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws, v_owner, 'owner') ON CONFLICT DO NOTHING;
  IF v_member2 IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (ws, v_member2, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  IF v_member3 IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (ws, v_member3, 'member') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.projects (id, user_id, workspace_id, name, status, north_star, target_date, created_at) VALUES
    (p_atlas, v_owner, ws, 'Atlas', 'active', 'Every installer finishes the job in one visit, checklist complete, without a call back.', NULL, now() - interval '42 days'),
    (p_relay, v_owner, ws, 'Relay', 'active', 'Every homeowner understands their energy use at a glance and never fights the app to get there.', (now() + interval '20 days')::date, now() - interval '35 days'),
    (p_comet, v_owner, ws, 'Comet', 'active', 'Prove a fifteen minute planning habit that people actually keep doing.', NULL, now() - interval '1 day'),
    (p_beacon, v_owner, ws, 'Beacon', 'active', 'Keep the legacy billing site trustworthy while SSO removes the last shared password workaround.', (now() + interval '10 days')::date, now() - interval '14 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.themes (id, user_id, workspace_id, project_id, product_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (th_relay, v_owner, ws, p_relay, p_relay, 'Checkout and notification friction in the homeowner app', 'Homeowners stall at checkout when adding a second monitor or an add on, and they mute notifications entirely once alerts arrive one at a time instead of grouped.', 9, 4, 0.78, 'active', now() - interval '25 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.signals (id, user_id, workspace_id, project_id, product_id, theme_id, source, source_kind, title, content, sentiment, tags, created_at) VALUES
    (sg1, v_owner, ws, p_relay, p_relay, th_relay, 'app-store', 'manual', 'App Store review, three stars, checkout confusion', 'I wanted to add a second monitor for the garage and the checkout screen asked me to confirm the same address three times. I gave up and called support instead.', 'negative', ARRAY['checkout','friction'], now() - interval '20 days'),
    (sg2, v_owner, ws, p_relay, p_relay, th_relay, 'support', 'manual', 'Support ticket, homeowner stuck at checkout', 'Customer tried to buy the outdoor sensor add on and the payment step kept resetting the cart. Reproduced on two browsers.', 'negative', ARRAY['checkout','bug'], now() - interval '18 days'),
    (sg3, v_owner, ws, p_relay, p_relay, th_relay, 'analytics', 'pull_connector', 'Funnel: 34 percent drop at the checkout confirmation step', 'Of homeowners who reach the checkout confirmation screen, 34 percent leave without finishing. The step asks for address confirmation even when nothing changed.', 'negative', ARRAY['checkout','funnel'], now() - interval '19 days'),
    (sg4, v_owner, ws, p_relay, p_relay, th_relay, 'interview', 'manual', 'Interview: homeowner turned off all notifications', 'She said every alert came in as its own text message, so she turned notifications off entirely after the third day. She still wants to know about real problems, just not one at a time.', 'mixed', ARRAY['notifications','engagement'], now() - interval '16 days'),
    (sg5, v_owner, ws, p_relay, p_relay, th_relay, 'support', 'manual', 'Support ticket, notification volume complaint', 'Customer asked how to stop getting five texts a day. Wants a single daily summary instead.', 'negative', ARRAY['notifications','volume'], now() - interval '15 days'),
    (sg6, v_owner, ws, p_relay, p_relay, th_relay, 'analytics', 'pull_connector', 'Notification opt out rate at 41 percent within the first month', '41 percent of new homeowners turn off push notifications within their first month, most within the first week after receiving more than two alerts in a day.', 'negative', ARRAY['notifications','retention'], now() - interval '14 days'),
    (sg7, v_owner, ws, p_relay, p_relay, th_relay, 'app-store', 'manual', 'App Store review, four stars, wants fewer alerts', 'Love seeing my usage but please let me choose one summary a day instead of a new alert every time a monitor updates.', 'mixed', ARRAY['notifications','feature-request'], now() - interval '12 days'),
    (sg8, v_owner, ws, p_relay, p_relay, th_relay, 'interview', 'manual', 'Interview: checkout felt like it did not trust the address on file', 'He had already entered his address during signup and was annoyed the checkout asked again. Said it felt like the app did not trust its own records.', 'negative', ARRAY['checkout','trust'], now() - interval '10 days'),
    (sg9, v_owner, ws, p_relay, p_relay, th_relay, 'support', 'manual', 'Support ticket, duplicate charge from a stuck checkout', 'Homeowner was charged twice after the checkout screen appeared to fail and they tried again. Refunded, but the underlying retry bug is still open.', 'negative', ARRAY['checkout','billing'], now() - interval '7 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.opportunities (id, user_id, workspace_id, project_id, product_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (op_relay, v_owner, ws, p_relay, p_relay, th_relay, 'Simplify checkout and calm the notification noise', 'Homeowners abandon checkout over a redundant address confirmation, and over 40 percent of new homeowners mute notifications within a month because every alert arrives as its own message.', 'Homeowners buying a second monitor or an add on, and any homeowner in their first month', 'Skipping the address re confirmation when nothing changed, and grouping notifications into one daily digest with an urgent only override, lifts checkout completion and cuts the 41 percent opt out rate.', 8, 7, 6, 'committed', now() - interval '20 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.prds (id, user_id, workspace_id, project_id, product_id, opportunity_id, title, body_md, status, model, created_at, updated_at) VALUES
    (prd_atlas1, v_owner, ws, p_atlas, p_atlas, NULL, 'Offline mode for the install checklist',
     E'# Offline mode for the install checklist\n\n## Problem\nInstallers lose the job checklist when the site has no cell signal, common in basements and rural properties.\n\n## Goal\nKeep the checklist working with no signal, then sync automatically once it returns.\n\n## Approach\n1. Cache the checklist locally on the installer tablet.\n2. Queue photo and signature uploads for later sync.\n3. Sync automatically the moment signal returns, with a visible pending count.\n\n## Success metrics\nZero lost checklists across the next 90 days of jobs.',
     'approved', 'openai/gpt-5', now() - interval '40 days', now() - interval '40 days'),
    (prd_atlas2, v_owner, ws, p_atlas, p_atlas, NULL, 'Job handoff checklist for the homeowner',
     E'# Job handoff checklist for the homeowner\n\n## Problem\nHomeowners do not know what to check after an install, so small issues turn into support calls.\n\n## Goal\nHand the homeowner a short checklist at the end of the visit.\n\n## Approach\nThe installer taps done, the homeowner gets a text with three things to check in the first week.\n\n## Success metrics\nFewer than 5 percent of new installs open a support ticket in week one.',
     'approved', 'openai/gpt-5', now() - interval '30 days', now() - interval '30 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.prds (id, user_id, workspace_id, project_id, product_id, opportunity_id, title, body_md, status, model, created_at, updated_at, shipped_at, outcome) VALUES
    (prd_atlas3, v_owner, ws, p_atlas, p_atlas, NULL, 'Batch firmware push to monitors already in the field',
     E'# Batch firmware push to monitors already in the field\n\n## Problem\nFirmware updates go out one monitor at a time today, so a fix can take months to reach every home.\n\n## Goal\nPush firmware to a chosen group of monitors at once, by install date or region.\n\n## Approach\n1. Batch scheduler with a group picker.\n2. Staged rollout that halts automatically if the failure rate rises above 1 percent.\n3. One click rollback to the prior version.\n\n## Success metrics\nA fleet wide update in under two weeks instead of six months.',
     'approved', 'openai/gpt-5', now() - interval '20 days', now() - interval '9 days', now() - interval '9 days',
     jsonb_build_object('verdict','validated','summary','The batch push reached the full fleet in 9 days with a failure rate of 0.4 percent, well under the 1 percent halt line. No rollback was needed.','metric_label','fleet rollout time','metric_value','9 days','checked_at', (now() - interval '5 days')))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.prds (id, user_id, workspace_id, project_id, product_id, opportunity_id, title, body_md, status, model, created_at, updated_at) VALUES
    (prd_relay1, v_owner, ws, p_relay, p_relay, op_relay, 'Simplify checkout in the homeowner app',
     E'# Simplify checkout in the homeowner app\n\n## Problem\n34 percent of homeowners abandon checkout at the address confirmation step, which asks them to reconfirm an address that has not changed.\n\n## Goal\nCollapse checkout to one screen whenever nothing has changed.\n\n## Approach\nSkip the address confirmation step when the address on file matches the last order. Show it only when something is actually different.\n\n## Success metrics\nCheckout completion up from the current 66 percent.',
     'approved', 'openai/gpt-5', now() - interval '18 days', now() - interval '3 days'),
    (prd_relay2, v_owner, ws, p_relay, p_relay, op_relay, 'A daily notification digest instead of one at a time',
     E'# A daily notification digest instead of one at a time\n\n## Problem\nOver 40 percent of new homeowners mute notifications within their first month after receiving more than two alerts in a day.\n\n## Goal\nGroup routine alerts into one daily digest, with an urgent only override for real problems.\n\n## Approach\nAn in-app grouped view first, then a push notification batching pass once the grouping is proven safe.\n\n## Success metrics\nNotification opt out rate down from 41 percent within the first month.',
     'approved', 'openai/gpt-5', now() - interval '10 days', now() - interval '20 hours'),
    (prd_comet1, v_owner, ws, p_comet, p_comet, NULL, 'Comet: a focus timer that plans your day',
     E'# Comet: a focus timer that plans your day\n\n## Idea\nA short morning ritual: pick three things to get done, set a timer for each, and let the app nudge you back on track if a browser tab or a notification pulls you away.\n\n## Scope\nThis is a small side experiment outside the energy monitoring line, kept deliberately small.\n\n## Open question\nWhether a fifteen minute planning habit is one people actually keep doing past the first week.',
     'draft', 'openai/gpt-5', now() - interval '20 hours', now() - interval '20 hours'),
    (prd_beacon1, v_owner, ws, p_beacon, p_beacon, NULL, 'Add SSO to the billing site',
     E'# Add SSO to the billing site\n\n## Problem\nSeveral accounts share one login because Beacon has no single sign on, which makes it hard to tell who changed what on a billing account.\n\n## Goal\nLet a company log in with its own identity provider.\n\n## Approach\nSAML based SSO, starting with Okta and Google Workspace. The existing password login stays available during the transition.\n\n## Success metrics\nNo shared logins remain on any account that turns SSO on.',
     'approved', 'openai/gpt-5', now() - interval '12 days', now() - interval '12 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.missions (id, user_id, workspace_id, title, goal, status, hop_count, created_at, updated_at, completed_at) VALUES
    (m_atlas, v_owner, ws, 'Ship the batch firmware push', 'Land the batch firmware scheduler behind a flag, roll it out to 10 percent of the fleet, then to everyone once the failure rate holds under 1 percent.', 'completed', 3, now() - interval '15 days', now() - interval '9 days', now() - interval '9 days'),
    (m_relay, v_owner, ws, 'Ship the checkout and notification pass', 'Simplify the checkout flow and land the notification digest for the homeowner app, starting with the in-app grouped view.', 'running', 2, now() - interval '4 days', now() - interval '3 hours', NULL),
    (m_beacon, v_owner, ws, 'Ship SSO login for Beacon', 'Add SAML based SSO login to the Beacon billing site, keeping the existing password login available during the transition.', 'running', 1, now() - interval '3 days', now() - interval '5 hours', NULL)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.studio_changesets (id, user_id, workspace_id, product_id, mission_id, prd_id, repo, branch, status, title, summary, pr_url, pr_number, release_notes, release_notes_at, created_at, updated_at) VALUES
    (cs_atlas, v_owner, ws, p_atlas, m_atlas, prd_atlas3, 'helio-labs/atlas-installer-portal', 'firmware-batch-push', 'merged', 'Batch firmware push scheduler', 'Adds a scheduler that pushes firmware to a chosen group of monitors, with an automatic halt above a 1 percent failure rate and one click rollback.', 'https://github.com/helio-labs/atlas-installer-portal/pull/128', 128, 'Firmware can now be pushed to a group of monitors at once instead of one at a time. A failed push stops on its own and can be rolled back with one click.', now() - interval '9 days', now() - interval '14 days', now() - interval '9 days'),
    (cs_relay, v_owner, ws, p_relay, m_relay, prd_relay1, 'helio-labs/relay-homeowner-app', 'checkout-and-digest', 'pr_open', 'Simplify checkout flow', 'Removes the redundant address confirmation when the address on file has not changed, and collapses confirmation to one screen.', 'https://github.com/helio-labs/relay-homeowner-app/pull/57', 57, NULL, NULL, now() - interval '3 days', now() - interval '6 hours'),
    (cs_beacon, v_owner, ws, p_beacon, m_beacon, prd_beacon1, 'helio-labs/beacon-billing', 'add-sso', 'staged', 'Add SSO login', 'Adds SAML based SSO as a login option alongside the existing password login, starting with Okta and Google Workspace.', NULL, NULL, NULL, NULL, now() - interval '2 days', now() - interval '5 hours')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.agent_runs (id, user_id, workspace_id, mission_id, agent_slug, agent_name, input, output, status, duration_ms, tokens_used, spend_used_usd, created_at) VALUES
    (ar_atlas1, v_owner, ws, m_atlas, 'strategist', 'Strategist', 'Rank the batch firmware push against the rest of the Atlas backlog.', 'A fleet wide firmware fix that today takes six months is the highest leverage item open. Ranked it above the other three items given the build cost and the direct hit on the installer callback rate.', 'completed', 15200, 19800, 0.078, now() - interval '15 days'),
    (ar_atlas2, v_owner, ws, m_atlas, 'builder', 'Builder', 'Implement the batch firmware scheduler with a staged rollout and an automatic halt above 1 percent failures.', 'Opened pull request 128. Scheduler groups monitors by install date or region, halts automatically above the failure threshold, and supports one click rollback to the prior firmware version.', 'completed', 26100, 34200, 0.132, now() - interval '11 days'),
    (ar_relay1, v_owner, ws, m_relay, 'strategist', 'Strategist', 'Rank the checkout and notification opportunities for Relay against the current backlog.', 'Checkout friction and notification opt outs trace back to the same theme. Ranked the combined opportunity above the other three open items given the low build cost and the direct hit on activation and retention.', 'completed', 14100, 17600, 0.069, now() - interval '47 hours'),
    (ar_relay2, v_owner, ws, m_relay, 'prd-writer', 'PRD Writer', 'Draft the checkout simplification spec.', 'Drafted "Simplify checkout in the homeowner app", scoped to skipping the address re confirmation and collapsing the flow to one screen. Cited the funnel drop off signal and two support tickets.', 'completed', 19800, 24300, 0.095, now() - interval '40 hours'),
    (ar_relay3, v_owner, ws, m_relay, 'sprint-planner', 'Sprint Planner', 'Break the checkout and notification work into an ordered task list.', 'Ordered the checkout change first since it is the smaller, safer change. Split the notification batching into its own follow up task pending a scope decision.', 'completed', 11200, 14100, 0.052, now() - interval '30 hours'),
    (ar_relay4, v_owner, ws, m_relay, 'builder', 'Builder', 'Implement the one screen checkout, skipping address re confirmation when the address is unchanged.', 'Opened pull request 57. Address confirmation now only appears when the address on file actually changed since the last order.', 'completed', 23400, 29700, 0.114, now() - interval '20 hours'),
    (ar_relay5, v_owner, ws, m_relay, 'qa', 'QA', 'Review pull request 57 against the checkout spec.', 'Confirmed the skip logic only triggers on an unchanged address, and that the duplicate charge issue from support is unrelated to this change. Clear to merge once the human gate clears.', 'completed', 9800, 11200, 0.041, now() - interval '10 hours'),
    (ar_relay6, v_owner, ws, m_relay, 'builder', 'Builder', 'Request the merge for pull request 57 now that QA has signed off.', NULL, 'waiting_approval', NULL, 0, 0, now() - interval '3 hours'),
    (ar_comet1, v_owner, ws, NULL, 'prd-writer', 'PRD Writer', 'Draft a first pass spec for a focus timer that plans your day.', 'Drafted a three item morning ritual: pick three tasks, set a timer for each, nudge back on track after a distraction. Scoped small on purpose since this sits outside the energy monitoring line.', 'completed', 12300, 15400, 0.058, now() - interval '18 hours'),
    (ar_comet2, v_owner, ws, NULL, 'strategist', 'Strategist', 'Sanity check the focus timer idea against what Helio already builds.', 'No overlap with Atlas, Relay, or Beacon. Recommend keeping it a small, separate experiment rather than folding it into an existing product, and revisiting after a couple weeks of real use.', 'completed', 8900, 10100, 0.039, now() - interval '15 hours'),
    (ar_beacon1, v_owner, ws, m_beacon, 'researcher', 'Research', 'Check which identity providers Beacon existing customers already use.', 'Most current customers use either Okta or Google Workspace as their identity provider. Recommend supporting both first, then widening the list based on support requests.', 'completed', 13400, 16200, 0.063, now() - interval '2 days'),
    (ar_beacon2, v_owner, ws, m_beacon, 'builder', 'Builder', 'Wire SAML based SSO into the Beacon billing site login flow, starting with Okta and Google Workspace.', NULL, 'running', NULL, 0, 0, now() - interval '5 hours')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.decisions (id, user_id, workspace_id, project_id, product_id, title, rationale, status, prd_id, mission_id, source_kind, decided_by_agent_slug, is_public, created_at) VALUES
    (dec_relay, v_owner, ws, p_relay, p_relay, 'Split the notification digest work into two passes', 'The in-app grouped view is ready and safe to ship on its own. Push notification batching needs its own pass with a short beta so we can watch for any real alert that gets delayed, before it becomes the default for every homeowner. Splitting keeps the in-app change shippable this week.', 'pending', prd_relay2, m_relay, 'mission', 'orchestrator', false, now() - interval '20 hours')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.agent_approvals (id, user_id, agent_slug, tool_name, args, rationale, status, mission_id, run_id, workspace_id, expires_at, created_at) VALUES
    (aa_relay, v_owner, 'builder', 'studio.pr.merge', jsonb_build_object('repo','helio-labs/relay-homeowner-app','pr_number',57,'branch','checkout-and-digest'), 'QA approved the checkout simplification. Ready to merge into main.', 'pending', m_relay, ar_relay6, ws, now() + interval '5 days', now() - interval '3 hours')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.deployments (id, user_id, workspace_id, product_id, changeset_id, provider, environment, status, commit_sha, deploy_url, triggered_by, deployed_at, created_at) VALUES
    (dep_atlas, v_owner, ws, p_atlas, cs_atlas, 'github', 'production', 'success', 'e4f2a91', 'https://atlas.helio-labs.example.com', 'release', now() - interval '9 days', now() - interval '9 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.launch_plans (id, workspace_id, prd_id, positioning, checklist, success_metric, check_by, created_at, updated_at) VALUES
    (lp_atlas, ws, prd_atlas3, 'Batch firmware push means a fix reaches every monitor in the field in under two weeks instead of six months. It is the difference between a known issue and a known issue that is already gone.',
     jsonb_build_array(
       jsonb_build_object('label','Channel copy drafted (changelog, announcement)','done',true),
       jsonb_build_object('label','Positioning reviewed','done',true),
       jsonb_build_object('label','Success metric defined','done',true),
       jsonb_build_object('label','Outcome check scheduled','done',true),
       jsonb_build_object('label','Stakeholders notified','done',false)),
     'Fleet wide firmware rollout time, target under two weeks', now() + interval '21 days', now() - interval '9 days', now() - interval '9 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.learnings (id, user_id, workspace_id, prd_id, mission_id, verdict, summary, metric_label, metric_value, recorded_by_agent_slug, created_at) VALUES
    (ln_atlas1, v_owner, ws, prd_atlas3, m_atlas, 'validated', 'The batch push reached the full fleet in 9 days with a failure rate of 0.4 percent, well under the 1 percent halt line. No rollback was needed.', 'fleet rollout time', '9 days', 'data-analyst', now() - interval '5 days'),
    (ln_atlas2, v_owner, ws, prd_atlas1, m_atlas, 'validated', 'Lost checklists dropped from 11 percent of jobs to under 2 percent in the four weeks after offline mode shipped. Installers in low signal areas reported the biggest change.', 'lost checklist rate', '11 percent to 2 percent', 'data-analyst', now() - interval '3 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.agent_memory (id, user_id, workspace_id, agent_slug, scope, kind, content, importance, created_at) VALUES
    (mem1, v_owner, ws, 'strategist', 'workspace', 'reflection', 'Helio customers care about installer speed more than feature count. Every Atlas change should shave minutes off a job, not add a screen.', 4, now() - interval '25 days'),
    (mem2, v_owner, ws, 'discovery-scout', 'workspace', 'reflection', 'Cell signal drops out at a lot of install sites, basements especially. Offline first is the baseline for the installer app, not an extra.', 4, now() - interval '35 days'),
    (mem3, v_owner, ws, 'data-analyst', 'workspace', 'reflection', 'Homeowners abandon checkout the moment it asks them to reconfirm something it already knows. Keep the Relay checkout to one screen whenever the data has not changed.', 4, now() - interval '15 days'),
    (mem4, v_owner, ws, 'critic', 'workspace', 'reflection', 'Beacon customers are slow to change how they log in. Roll out SSO as opt in first, never force a switch in the middle of a billing cycle.', 3, now() - interval '10 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.memory_candidates (id, user_id, workspace_id, source_kind, scope, kind, content, importance, status, created_at) VALUES
    (mc1, v_owner, ws, 'agent', 'workspace', 'preference', 'Helio prefers concise release notes', 3, 'pending', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'helio-labs-demo-seed: applied for workspace %', ws;
END $$;

DO $$
DECLARE
  v_owner uuid;
  ws uuid := '10000000-0000-4000-8000-000000000000';
  p_relay uuid := '10000000-0000-4000-8000-0000000000a2';
  th_relay uuid := '10000000-0002-4000-8000-000000000001';
  dec_wtb uuid := '10000000-000a-4000-8000-000000000002';
  ins_relay uuid := '10000000-000f-4000-8000-000000000001';
BEGIN
  SELECT id INTO v_owner FROM auth.users WHERE email = 'demo@redcadence.app' LIMIT 1;
  IF v_owner IS NULL THEN RETURN; END IF;
  INSERT INTO public.decisions (id, user_id, workspace_id, project_id, product_id, title, rationale, status, source_kind, decided_by_agent_slug, is_public, created_at) VALUES
    (dec_wtb, v_owner, ws, p_relay, p_relay, 'Build next: fix checkout before anything else on Relay', 'Nine signals this week point at the same two frictions: homeowners abandon checkout over a redundant address confirmation (a 34 percent drop at that step), and 41 percent mute notifications in their first month. Fixing checkout first recovers paying customers now; the notification digest follows in the same theme. Nothing else in the Relay backlog touches revenue this directly.', 'pending', 'mission', 'strategist', false, now() - interval '26 hours')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.insights (id, user_id, workspace_id, product_id, theme_id, kind, headline, detail, evidence, recommended_action, score, confidence, status, dedup_key, created_at, updated_at, digest) VALUES
    (ins_relay, v_owner, ws, p_relay, th_relay, 'next_best_action', 'Nine signals point at checkout friction on Relay. The fix is scoped and waiting for your call.', 'Support tickets, app store reviews, and the funnel all point at the same checkout step. A scoped proposal is in Approvals.',
     jsonb_build_array('34 percent drop at the checkout confirmation step', 'two support tickets and two reviews this month name the same step'),
     jsonb_build_object('agent_slug','strategist','goal','Open the checkout proposal in Approvals'),
     0.9, 0.82, 'open', 'helio-relay-checkout-wtb', now() - interval '20 hours', now() - interval '20 hours', false)
  ON CONFLICT DO NOTHING;
END $$;