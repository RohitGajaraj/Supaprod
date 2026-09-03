-- THE SEEDER MARKS WHAT IT INVENTS.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS FUNCTION IS
-- ---------------------------------------------------------------------------
-- `seed_sample_workspace(_user_id)` is the per-signup sample seed. It builds the
-- "Explore workspace" and fills it with two fully worked product stories, Prism
-- and Trellis, so that every surface has something to render on a brand new
-- account. It is called app-side by the service-role `seedSampleWorkspace`, and
-- it is the single largest writer of rows in this database that are not a
-- customer's work. Its body is defined by
-- `20260705120000_sample_workspace_seed.sql`, dated 2026-07-05.
--
-- ---------------------------------------------------------------------------
-- WHAT IS BROKEN: THE COLUMNS ARRIVED A MONTH AFTER THE WRITER
-- ---------------------------------------------------------------------------
-- Every table the seeder writes into learned to say "I am an example" in
-- August, four to seven weeks after the seeder was written:
--
--   signals, opportunities   20260805220000    2026-08-05
--   themes                   20260806060000    2026-08-06
--   prds                     20260806120000    2026-08-06
--   learnings, agent_memory  20260819180000    2026-08-19
--   agent_runs,              20260827050000    2026-08-27
--   agent_approvals,
--   decisions
--
-- Each of those columns is `is_sample boolean not null default false`, and each
-- of those migrations backfilled the rows that existed on the day it ran. None
-- of them went back and taught the WRITER to set the flag. So the seeder has
-- gone on inserting rows that take the `false` default, which is the column
-- asserting, in the strongest terms the schema has, that a row invented by a
-- seed migration is a customer's own work.
--
-- Counted in production before this migration:
--
--   themes         inside sample workspaces:  498    marked is_sample:  0
--   signals        inside sample workspaces: 1119    marked is_sample:  0
--   opportunities  inside sample workspaces:  449    marked is_sample:  0
--   prds           inside sample workspaces:   78    marked is_sample:  0
--
-- Not "mostly unmarked". Zero. Not one row the seeder has ever written has
-- carried the flag, on any table, at any time.
--
-- ---------------------------------------------------------------------------
-- THE MARK THE PRODUCT ALREADY RENDERS HAS NEVER ONCE FIRED
-- ---------------------------------------------------------------------------
-- This is not a hypothetical cost. `DiscoverSurface.tsx` (around line 2515)
-- branches on `s.is_sample` and renders an "Example" mark on the row, and the
-- comment above that branch explains at length why it keys on the column rather
-- than on the lane. The code is correct, it is shipped, and it has been dead
-- since the day it landed, because the only rows it was written for are exactly
-- the rows that say `false`. A visitor on a fresh account reads seeded signals,
-- themes and bets as findings about their own product, unlabelled.
--
-- ---------------------------------------------------------------------------
-- WHAT THIS MIGRATION DOES
-- ---------------------------------------------------------------------------
-- Replaces `seed_sample_workspace(_user_id)` with a body that is identical to
-- the one defined at 20260705120000, statement for statement, except that every
-- INSERT into a table which carries an `is_sample` column now names that column
-- and passes `true`. Nine tables, 59 INSERT statements, 103 rows per seeded
-- workspace:
--
--   themes  9    signals 25    opportunities 11    prds 5    learnings 16
--   decisions 11    agent_runs 7    agent_approvals 6    agent_memory 13
--
-- FUTURE SEEDS ONLY. There is no UPDATE in this file and no backfill.
--
-- ---------------------------------------------------------------------------
-- WHAT IS DELIBERATELY LEFT ALONE, AND WHY
-- ---------------------------------------------------------------------------
-- 1. THE 2,144 EXISTING ROWS. Flipping them is a bigger decision than it looks
--    and it is not being made here. `is_sample` is not only a label: readers
--    filter on it. `brain/derive-insights.server.ts:129` and
--    `brain/insights.functions.ts:215` both select themes with
--    `.eq("is_sample", false)`, which is what stops the brain spending a model
--    call ranking fiction. A bulk backfill would therefore change what the
--    brain ranks in every existing demo workspace, in most cases emptying its
--    candidate set entirely, and those workspaces are what a visitor is shown.
--    Correct labelling and an emptied demo are two separate calls. This file
--    makes the first one, for rows that do not exist yet, and leaves the second
--    to whoever is willing to look at the demo afterwards.
--
-- 2. THE TWO `INSERT INTO workspaces` STATEMENTS. `workspaces.is_sample` is
--    handled outside this function on purpose. 20260708160000 added the column,
--    backfilled it by joining through the seed's own `agent_memory` sentinel,
--    and made it settable only by the service role, guarding it with the
--    `protect_workspace_is_sample()` trigger on UPDATE. The flag is then set by
--    the seed's service-role caller against the exact workspace id the seed
--    returned. That arrangement is untouched here. It also matters that the
--    first of the two INSERTs creates "My workspace", the owner's own empty
--    workspace, which is NOT sample data and must never be marked as such,
--    least of all under a trigger that then refuses to let a user unmark it.
--
-- 3. TABLES THE SEEDER WRITES THAT HAVE NO `is_sample` COLUMN. Left exactly as
--    they were, because naming a column that does not exist would make the
--    function throw at runtime, on signup, for every new account:
--
--      projects, workspace_members, tasks, missions, conversations, messages,
--      agent_messages, meetings, notes, docs, eval_suites, eval_cases,
--      eval_runs, eval_case_results, drift_baselines, drift_snapshots,
--      daily_briefs, ai_events, ai_budgets, artifact_lineage
--
--    Every one was checked against the ALTER TABLE statements in
--    supabase/migrations. `deployments`, `studio_changesets` and `spine_tracks`
--    do carry the column (20260827050000) but this seeder never writes to them,
--    so there is nothing here to mark.
--
-- ---------------------------------------------------------------------------
-- WHAT IS PRESERVED, EXACTLY
-- ---------------------------------------------------------------------------
-- The argument signature `(_user_id uuid)`, the `RETURNS uuid`, SECURITY
-- DEFINER, `SET search_path = public`, the whole DECLARE block, the idempotency
-- guard on the `sample-workspace-v1` sentinel, every literal of every row, and
-- the three closing UPDATEs that retag agent_memory, meetings and notes onto
-- the Explore workspace. The REVOKE and GRANT are restated below so the
-- execute posture is stated in the same file as the body, though CREATE OR
-- REPLACE preserves the existing ACL either way.
--
-- The base taken was 20260705120000. It is the LAST definition of this name in
-- the tree: `20260720020000_sample_workspace_seed_v2.sql` defines a different
-- function, `seed_sample_workspace_v2`, which builds on this one rather than
-- replacing it, and the only later migrations that rewrite a function body
-- through `pg_get_functiondef` (20260730203000) do not touch this one.
--
-- TO REVERSE: re-apply the CREATE OR REPLACE from
-- supabase/migrations/20260705120000_sample_workspace_seed.sql. No row written
-- before this migration is altered by it, so a revert loses nothing but the
-- marking of seeds created in between.

CREATE OR REPLACE FUNCTION public.seed_sample_workspace(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
  a_strat uuid; a_research uuid; a_eng uuid; a_qa uuid; a_release uuid; a_builder uuid;

  -- Prism
  hp uuid;                                  -- project
  h_th_activation uuid; h_th_trust uuid; h_th_premium uuid; h_th_growth uuid; h_th_reliability uuid;
  h_op_banklink uuid; h_op_fraud uuid; h_op_plus uuid; h_op_goals uuid; h_op_referral uuid; h_op_crypto uuid;
  h_prd_banklink uuid; h_prd_fraud uuid; h_prd_plus uuid;
  h_dec_banklink uuid; h_dec_fraud_v1 uuid; h_dec_fraud_v2 uuid; h_dec_plus_price uuid; h_dec_kill_crypto uuid; h_dec_goals uuid;
  h_l_fraud_miss uuid; h_l_fraud_win uuid; h_l_banklink_win uuid; h_l_plus_mixed uuid; h_l_crypto_miss uuid; h_l_goals_win uuid;
  h_mission uuid; h_mission2 uuid;
  h_conv uuid; h_conv2 uuid;
  h_meet uuid; h_meet2 uuid;
  h_suite_fraud uuid; h_suite_tone uuid;
  h_c1 uuid; h_c2 uuid; h_c3 uuid; h_c4 uuid; h_c5 uuid; h_c6 uuid; h_c7 uuid; h_c8 uuid;
  h_run1 uuid; h_run2 uuid;
  h_ta uuid; h_tb uuid; h_tc uuid;

  -- Trellis
  pp uuid;                                  -- project
  p_th_activation uuid; p_th_enterprise uuid; p_th_selfserve uuid; p_th_parity uuid;
  p_op_firstq uuid; p_op_sso uuid; p_op_packaging uuid; p_op_sdk uuid; p_op_retl uuid;
  p_prd_firstq uuid; p_prd_sso uuid;
  p_dec_firstq uuid; p_dec_sql_v1 uuid; p_dec_nlq_v2 uuid; p_dec_packaging uuid; p_dec_kill_retl uuid;
  p_l_sql_mixed uuid; p_l_nlq_win uuid; p_l_sso_win uuid; p_l_retl_miss uuid; p_l_packaging_win uuid; p_l_firstq_win uuid;
  p_mission uuid;
  p_conv uuid;
  p_meet uuid;
  p_suite uuid;
  p_c1 uuid; p_c2 uuid; p_c3 uuid; p_c4 uuid;
  p_run1 uuid;
  p_ta uuid; p_tb uuid;

  v_slug text;
  i int;
BEGIN
  -- Idempotency guard: if this user already has the sample seed, return the workspace.
  IF EXISTS (
    SELECT 1 FROM agent_memory
     WHERE user_id = _user_id AND metadata->>'seed' = 'sample-workspace-v1'
  ) THEN
    SELECT id INTO ws_id FROM workspaces WHERE owner_id = _user_id AND name = 'Explore workspace' LIMIT 1;
    RETURN ws_id;
  END IF;

  -- Ensure the owner has a personal workspace (kept empty for their own experiments).
  IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE user_id = _user_id) THEN
    INSERT INTO workspaces (owner_id, name) VALUES (_user_id, 'My workspace') RETURNING id INTO ws_id;
    INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (ws_id, _user_id, 'owner');
  END IF;

  -- The Explore workspace (per-owner slug to dodge the global UNIQUE(slug) constraint).
  v_slug := 'explore-' || substr(_user_id::text, 1, 8);
  IF EXISTS (SELECT 1 FROM workspaces WHERE slug = v_slug) THEN v_slug := NULL; END IF;

  INSERT INTO workspaces (owner_id, name, slug)
  VALUES (_user_id, 'Explore workspace', v_slug)
  RETURNING id INTO ws_id;
  INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (ws_id, _user_id, 'owner');

  PERFORM seed_default_agents(_user_id);
  SELECT id INTO a_strat    FROM agents WHERE user_id=_user_id AND slug='strategist' LIMIT 1;
  SELECT id INTO a_research FROM agents WHERE user_id=_user_id AND slug='researcher'  LIMIT 1;
  SELECT id INTO a_eng      FROM agents WHERE user_id=_user_id AND slug='engineer'    LIMIT 1;
  SELECT id INTO a_qa       FROM agents WHERE user_id=_user_id AND slug='qa'          LIMIT 1;
  SELECT id INTO a_release  FROM agents WHERE user_id=_user_id AND slug='release'     LIMIT 1;
  SELECT id INTO a_builder  FROM agents WHERE user_id=_user_id AND slug='builder'     LIMIT 1;

  -- ════════════════════════════════════════════════════════════════════════
  -- PRISM  ·  consumer money app (the deep hero)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO projects (user_id, workspace_id, name, status, north_star, target_date)
  VALUES (_user_id, ws_id, 'Prism', 'active',
    'Get 40% of active users to a funded savings goal within 30 days of signup.',
    (CURRENT_DATE + INTERVAL '75 days')::date)
  RETURNING id INTO hp;

  -- Themes (5)
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Bank-link drop-off at activation',
     'New users stall at the "connect your bank" step. 38% who reach the Plaid link screen never finish; most cite a failed or confusing connection.',
     22, 5, 0.88, 'active', now() - INTERVAL '120 days', true) RETURNING id INTO h_th_activation;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Fraud false positives erode trust',
     'The fraud model blocks legitimate transactions. Support sees "my card was declined at the grocery store" weekly; each one risks a churn.',
     17, 5, 0.90, 'at_risk', now() - INTERVAL '95 days', true) RETURNING id INTO h_th_trust;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Premium value is unclear',
     'Users do not understand what Prism Plus gives them. Trial-to-paid is soft and the paywall lands before the value does.',
     13, 3, 0.79, 'active', now() - INTERVAL '70 days', true) RETURNING id INTO h_th_premium;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Word-of-mouth growth is untapped',
     'Happy users tell friends manually. There is no in-app referral, and 3 of 5 interviewed users said they had already recommended Prism.',
     9, 2, 0.72, 'active', now() - INTERVAL '55 days', true) RETURNING id INTO h_th_growth;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Balance sync lag on real-time spend',
     'Transactions take up to 90s to appear. Users double-check their bank app, which undermines the "one calm view of money" promise.',
     11, 3, 0.81, 'confirmed', now() - INTERVAL '40 days', true) RETURNING id INTO h_th_reliability;

  -- Signals (14 across 7 sources)
  INSERT INTO signals (user_id, workspace_id, project_id, theme_id, source, title, content, sentiment, tags, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, h_th_activation, 'app-store', 'App Store 2 star · "Could not link my bank"',
     '"Loved the design but it just spun forever when I tried to connect my credit union. Gave up after three tries." · iOS, 2 stars.',
     'negative', ARRAY['activation','bank-link','ios'], now() - INTERVAL '18 days', true),
    (_user_id, ws_id, hp, h_th_activation, 'analytics', 'Funnel: 38% drop at bank-link step',
     'Of users who reach the Plaid link screen, 38% abandon. Median time-on-step before drop is 2m40s. Small banks fail 3x more than the top 5.',
     'negative', ARRAY['activation','funnel','plaid'], now() - INTERVAL '20 days', true),
    (_user_id, ws_id, hp, h_th_activation, 'support', 'Support · repeat bank-link failures',
     '31 tickets this week on failed bank connections. Common thread: OAuth flow returns to a blank screen for a subset of regional banks.',
     'negative', ARRAY['activation','support','oauth'], now() - INTERVAL '9 days', true),
    (_user_id, ws_id, hp, h_th_trust, 'support', 'Card declined at grocery store · legit purchase',
     'User: "Prism blocked my $84 grocery run as fraud. Embarrassing at the register. This is the second time." Fraud score fired on an in-pattern purchase.',
     'negative', ARRAY['fraud','false-positive','trust'], now() - INTERVAL '6 days', true),
    (_user_id, ws_id, hp, h_th_trust, 'analytics', 'Fraud false-positive rate at 4.1%',
     'The fraud model blocks 4.1% of legitimate transactions (target < 1%). Precision fell after the last threshold change tuned for recall.',
     'negative', ARRAY['fraud','precision','model'], now() - INTERVAL '11 days', true),
    (_user_id, ws_id, hp, h_th_trust, 'churn-call', 'Lost user · "It kept declining my card"',
     '"I could not trust it to just work when I needed it. Switched back to my old bank." Churned after 2 false declines in a month.',
     'negative', ARRAY['fraud','churn','trust'], now() - INTERVAL '14 days', true),
    (_user_id, ws_id, hp, h_th_premium, 'analytics', 'Prism Plus trial-to-paid at 9%',
     'Trial-to-paid conversion for Plus is 9% (benchmark 15-20%). The paywall appears on day 1 before users have felt the budgeting value.',
     'negative', ARRAY['premium','conversion','paywall'], now() - INTERVAL '22 days', true),
    (_user_id, ws_id, hp, h_th_premium, 'interview', 'Users cannot name a Plus benefit',
     '4 of 6 interviewed paying users could not say what Plus unlocked beyond "no ads". The savings-automation feature had near-zero awareness.',
     'mixed', ARRAY['premium','awareness','interview'], now() - INTERVAL '16 days', true),
    (_user_id, ws_id, hp, h_th_premium, 'sales-call', 'Design partner wants family accounts in Plus',
     'A power user (household of 4) would pay double for shared goals and allowances. Suggests a family tier above Plus.',
     'positive', ARRAY['premium','family','expansion'], now() - INTERVAL '13 days', true),
    (_user_id, ws_id, hp, h_th_growth, 'interview', 'Users already recommend Prism manually',
     '"I have told at least five friends to get it." 3 of 5 interviewees had referred someone with no incentive. Clear untapped loop.',
     'positive', ARRAY['growth','referral','word-of-mouth'], now() - INTERVAL '25 days', true),
    (_user_id, ws_id, hp, h_th_growth, 'market', 'Competitor launched a $10 referral bonus',
     'A neobank competitor now pays $10 per referral both ways. Our organic referral has no reward and no share affordance.',
     'neutral', ARRAY['growth','competitor','referral'], now() - INTERVAL '30 days', true),
    (_user_id, ws_id, hp, h_th_reliability, 'app-store', 'Review · "Balance is always behind"',
     '"I buy a coffee and the app shows it two minutes later, so I never quite trust the number." 4 stars, would be 5 if real-time.',
     'mixed', ARRAY['reliability','sync','latency'], now() - INTERVAL '8 days', true),
    (_user_id, ws_id, hp, h_th_reliability, 'analytics', 'p95 transaction-appear latency 88s',
     'p95 time from swipe to in-app appearance is 88s. The webhook from the card processor batches every 60s; polling would cut it to under 10s.',
     'negative', ARRAY['reliability','latency','webhook'], now() - INTERVAL '10 days', true),
    (_user_id, ws_id, hp, NULL, 'feature-request', 'Round-up savings like the old-school jars',
     'Repeated request: round every purchase up to the nearest dollar and sweep the difference into a savings goal. High emotional pull in interviews.',
     'positive', ARRAY['savings','round-up','feature'], now() - INTERVAL '27 days', true),
    (_user_id, ws_id, hp, NULL, 'market', 'Regulator guidance on overdraft transparency',
     'New guidance requires clearer overdraft disclosure. Opportunity to lead on trust: show the exact fee before an action, not after.',
     'neutral', ARRAY['compliance','trust','overdraft'], now() - INTERVAL '35 days', true);

  -- Opportunities (6)
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, h_th_activation, 'Streamlined bank-link with a manual fallback',
     'EU/regional-bank users hit a dead OAuth screen and abandon at 38%. The single-provider link has no fallback.',
     'New users connecting a non-top-5 bank',
     'Adding a second aggregator plus a manual account-number fallback lifts bank-link completion from 62% to 85% and D1 activation with it.',
     9, 8, 6, 'committed', now() - INTERVAL '60 days', true) RETURNING id INTO h_op_banklink;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, h_th_trust, 'Precision-tuned fraud scoring',
     'The fraud model blocks 4.1% of legitimate transactions. Each false decline is a trust event and a churn risk.',
     'All Prism cardholders',
     'Retuning the model for precision with a per-user spend baseline drops false positives below 1% without raising true-fraud leakage.',
     10, 8, 5, 'committed', now() - INTERVAL '50 days', true) RETURNING id INTO h_op_fraud;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, h_th_premium, 'Value-first Plus paywall',
     'Plus converts at 9% because the paywall lands on day 1, before users feel the budgeting value.',
     'Trial users in their first 14 days',
     'Delaying the paywall until after the first "you saved $X this week" moment lifts trial-to-paid from 9% to 16%.',
     8, 7, 7, 'discovery', now() - INTERVAL '30 days', true) RETURNING id INTO h_op_plus;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, NULL, 'Round-up savings goals',
     'Users emotionally want the "spare change jar". No automated way to fund a goal from everyday spend.',
     'Users with at least one savings goal',
     'Round-up sweeps raise funded-goal rate (our north star) by pulling savings from spend the user does not miss.',
     9, 7, 6, 'committed', now() - INTERVAL '45 days', true) RETURNING id INTO h_op_goals;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, h_th_growth, 'In-app referral loop',
     'Users refer manually with no reward or share affordance while a competitor pays $10 both ways.',
     'Activated users past day 14',
     'A two-sided referral reward with a one-tap share raises referral-driven signups to 15% of new users.',
     7, 6, 7, 'backlog', now() - INTERVAL '28 days', true) RETURNING id INTO h_op_referral;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, NULL, 'In-app crypto wallet (parity bet)',
     'Two neobank competitors added crypto buy/sell. Feared table-stakes gap.',
     'Younger users who also hold crypto',
     'Adding a crypto wallet closes the perceived gap and retains crypto-curious users.',
     4, 3, 3, 'killed', now() - INTERVAL '52 days', true) RETURNING id INTO h_op_crypto;

  -- PRDs (3)
  INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model, is_sample) VALUES
    (_user_id, ws_id, hp, h_op_banklink, 'PRD · Resilient bank-link with fallback',
     E'# Resilient bank-link with fallback\n\n## Problem\n38% of users abandon at the bank-link step; regional banks fail the single OAuth provider 3x more than the top 5.\n\n## Goal\nLift bank-link completion from 62% to 85% and D1 activation with it.\n\n## Approach\n1. Add a second aggregator and route by institution success history.\n2. If both aggregators fail, offer a manual account-number + micro-deposit fallback.\n3. Show a plain-language status the whole time ("Connecting to your bank. This can take up to 30 seconds.").\n\n## Success metrics\n- Bank-link completion 62% -> 85%.\n- D1 activation +12pts.\n- Support tickets on link failures cut in half.',
     'approved', 'openai/gpt-5', true) RETURNING id INTO h_prd_banklink;
  INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model, is_sample) VALUES
    (_user_id, ws_id, hp, h_op_fraud, 'PRD · Precision-tuned fraud scoring',
     E'# Precision-tuned fraud scoring\n\n## Problem\nThe fraud model blocks 4.1% of legitimate transactions. Every false decline is a trust event; two of them tends to churn the user.\n\n## Goal\nFalse-positive rate below 1% with no rise in true-fraud leakage.\n\n## Approach\n1. Build a per-user 30-day spend baseline (merchant category, amount band, geo).\n2. Score against the baseline, not a global threshold.\n3. Add a "confirm it was you" 1-tap instead of a hard block for medium-risk.\n\n## Success metrics\n- False-positive rate 4.1% -> < 1%.\n- True-fraud catch rate held at >= 96%.\n- Trust NPS recovers.',
     'approved', 'openai/gpt-5', true) RETURNING id INTO h_prd_fraud;
  INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model, is_sample) VALUES
    (_user_id, ws_id, hp, h_op_plus, 'PRD · Value-first Plus paywall',
     E'# Value-first Plus paywall\n\n## Problem\nPlus converts at 9% because the paywall lands on day 1, before the user feels the budgeting value.\n\n## Goal\nTrial-to-paid 9% -> 16%.\n\n## Approach\nHold the paywall until after the first weekly "you saved $X" moment. Name the three Plus benefits in plain language at that moment.\n\n## Success metrics\n- Trial-to-paid 9% -> 16%.\n- Plus-benefit awareness (survey) > 70%.',
     'draft', 'openai/gpt-5', true) RETURNING id INTO h_prd_plus;

  -- Tasks (12)
  INSERT INTO tasks (user_id, workspace_id, project_id, prd_id, title, status, priority, assignee_kind, agent_id, completed_at) VALUES
    (_user_id, ws_id, hp, h_prd_banklink, 'Benchmark the two candidate aggregators on regional banks', 'done', 'high', 'agent', a_research, now() - INTERVAL '30 days'),
    (_user_id, ws_id, hp, h_prd_fraud,    'Pull 90 days of false-positive declines for analysis', 'done', 'high', 'agent', a_research, now() - INTERVAL '24 days');
  INSERT INTO tasks (user_id, workspace_id, project_id, prd_id, title, status, priority, assignee_kind, agent_id) VALUES
    (_user_id, ws_id, hp, h_prd_banklink, 'Implement second-aggregator routing behind a flag', 'doing', 'high', 'agent', a_builder),
    (_user_id, ws_id, hp, h_prd_banklink, 'Design the manual account-number fallback screen', 'doing', 'high', 'human', NULL),
    (_user_id, ws_id, hp, h_prd_fraud,    'Build the per-user spend-baseline feature store', 'doing', 'high', 'agent', a_eng),
    (_user_id, ws_id, hp, h_prd_fraud,    'Add the 1-tap "confirm it was you" flow', 'todo', 'high', 'agent', a_builder),
    (_user_id, ws_id, hp, h_prd_fraud,    'Write eval cases for medium-risk transactions', 'todo', 'high', 'agent', a_qa),
    (_user_id, ws_id, hp, h_prd_plus,     'Prototype the value-first paywall timing', 'todo', 'medium', 'agent', a_builder),
    (_user_id, ws_id, hp, NULL,           'Legal review on overdraft-disclosure copy', 'doing', 'medium', 'human', NULL),
    (_user_id, ws_id, hp, NULL,           'Scope round-up savings sweep engine', 'todo', 'high', 'agent', a_eng),
    (_user_id, ws_id, hp, NULL,           'Plan the fraud-scoring beta rollout (5% ramp)', 'todo', 'medium', 'agent', a_release),
    (_user_id, ws_id, hp, NULL,           'Draft Prism Plus pricing memo for founder review', 'todo', 'medium', 'human', NULL);

  -- Docs (4)
  INSERT INTO docs (user_id, workspace_id, project_id, title, icon, content_text) VALUES
    (_user_id, ws_id, hp, 'Prism · Product brief', '🪙',
     E'Prism is a consumer money app: one calm view of your money, plus budgeting, savings goals, peer-to-peer send, and Prism Plus. The promise is trust: it just works, and it never surprises you with a fee or a decline.'),
    (_user_id, ws_id, hp, 'Operating principles', '📐',
     E'1. Trust is the product. A false decline costs more than a missed fraud catch in the short run.\n2. Never surprise the user with money. Show the fee before the action.\n3. Automate savings from spend the user does not miss.\n4. Every AI decision (fraud, insights) is explainable in one plain sentence.'),
    (_user_id, ws_id, hp, 'Q3 roadmap snapshot', '🗺️',
     E'- Now: Resilient bank-link (committed), Precision fraud scoring (committed)\n- Next: Round-up savings goals, Value-first Plus paywall\n- Later: In-app referral loop\n- Killed: In-app crypto wallet (Critic red-teamed the parity bet)'),
    (_user_id, ws_id, hp, 'Competitive scan', '🧭',
     E'Chime, Monzo, Revolut, Cash App. All strong on payments. Our wedge: explainable trust (show the fee, explain the decline) and savings-from-spend automation. We do not chase crypto parity.');

  -- Meetings (2)
  INSERT INTO meetings (user_id, title, start_at, end_at, stakeholder, transcript, summary, action_items, decisions_made, processed_at) VALUES
    (_user_id, 'Q3 planning · Prism', now() - INTERVAL '58 days', now() - INTERVAL '58 days' + INTERVAL '1 hour', 'Founder + Head of Product + Eng lead',
     E'[transcript · 52 min · 9.1k tokens]',
     E'Bank-link and fraud precision are the two committed Q3 bets · both hit trust and activation. Plus paywall timing goes to discovery. Crypto wallet parity was debated and killed after the Critic surfaced the workspace precedent on parity bets.',
     '[{"owner":"Head of Product","task":"Draft the resilient bank-link PRD"},{"owner":"Eng lead","task":"Spike the per-user fraud baseline"}]'::jsonb,
     '[{"decision":"Bank-link + fraud precision are Q3 #1 and #2"},{"decision":"Kill the crypto wallet parity bet"}]'::jsonb,
     now() - INTERVAL '58 days' + INTERVAL '1 hour') RETURNING id INTO h_meet;
  INSERT INTO meetings (user_id, title, start_at, end_at, stakeholder, summary, action_items, processed_at) VALUES
    (_user_id, 'Fraud trust review', now() - INTERVAL '30 days', now() - INTERVAL '30 days' + INTERVAL '40 minutes', 'Founder + Trust & Safety lead',
     E'The aggressive fraud thresholds from launch are now the top churn driver. Agreed to supersede the launch policy with per-user precision scoring, and to soften medium-risk from a hard block to a 1-tap confirm.',
     '[{"owner":"Trust & Safety","task":"Define the medium-risk band"},{"owner":"Founder","task":"Approve the 5% beta ramp"}]'::jsonb,
     now() - INTERVAL '30 days' + INTERVAL '40 minutes') RETURNING id INTO h_meet2;

  -- Decisions (6). The fraud v1 -> v2 pair is the supersession moat proof.
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Ship the resilient bank-link with fallback',
     'Bank-link drop-off (38%) is the single biggest activation leak and it is recoverable. A second aggregator plus a manual fallback addresses the regional-bank failures directly. Highest ICE this quarter.',
     'standing', h_meet, 'roadmap', 'strategist', true, now() - INTERVAL '57 days', true) RETURNING id INTO h_dec_banklink;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Block aggressively on any fraud signal (launch policy)',
     'At launch, catching fraud mattered more than the occasional false decline. Policy: block on any elevated signal, global threshold. Accepted the false-positive cost to protect the young brand from a fraud headline.',
     'superseded', NULL, 'roadmap', 'strategist', false, now() - INTERVAL '150 days', true) RETURNING id INTO h_dec_fraud_v1;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Supersede launch fraud policy with per-user precision scoring',
     'The aggressive launch policy became the top churn driver (4.1% false positives, 2 declines tends to churn). Per-user baseline scoring plus a 1-tap confirm for medium-risk preserves the fraud catch rate while cutting false positives below 1%. Supersedes the launch policy (2026-02).',
     'standing', h_meet2, 'retrospective', 'strategist', true, now() - INTERVAL '29 days', true) RETURNING id INTO h_dec_fraud_v2;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Kill the in-app crypto wallet parity bet',
     'Critic flagged the workspace pattern: parity bets that copy a commodity feature have not retained our ICP (trust-first savers). Crypto is differentiator-neutral and would pull a quarter of engineering off the trust roadmap. Kill before any code.',
     'standing', h_meet, 'critic', 'critic', true, now() - INTERVAL '52 days', true) RETURNING id INTO h_dec_kill_crypto;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Ship round-up savings goals',
     'Round-up sweeps directly serve the north star (funded goals in 30 days) by pulling savings from spend the user does not feel. Strong emotional pull in interviews, moderate build cost.',
     'standing', NULL, 'roadmap', 'prd-writer', true, now() - INTERVAL '44 days', true) RETURNING id INTO h_dec_goals;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, hp, 'Price Prism Plus at $7.99/mo with a family tier to follow',
     'Trial-to-paid is a timing problem, not a price problem (interviews). Hold $7.99 and fix the paywall timing first; add a $12.99 family tier once shared goals ship, based on the design-partner willingness-to-pay.',
     'approved', NULL, 'roadmap', 'strategist', false, now() - INTERVAL '20 days', true) RETURNING id INTO h_dec_plus_price;

  -- Notes (4)
  INSERT INTO notes (user_id, body, tags) VALUES
    (_user_id, 'Trust is the whole brand. The fraud supersession is the story to tell investors: we caught our own mistake with the outcome record and fixed it.', ARRAY['trust','narrative']),
    (_user_id, 'Round-up savings has the strongest emotional pull of anything we tested. Lead the next launch with it.', ARRAY['savings','launch']),
    (_user_id, 'A competitor pays $10/referral both ways. We do not need to match the number, we need the one-tap share. Reward can be a savings boost, not cash.', ARRAY['growth','referral']),
    (_user_id, 'Family tier keeps coming up from power users. Willingness-to-pay looks like 1.6x Plus. Sequence it after shared goals.', ARRAY['premium','family']);

  -- Conversations (2) + messages
  INSERT INTO conversations (user_id, workspace_id, project_id, title, model)
  VALUES (_user_id, ws_id, hp, 'Why did fraud false positives spike?', 'openai/gpt-5') RETURNING id INTO h_conv;
  INSERT INTO messages (conversation_id, user_id, workspace_id, role, content, model, created_at) VALUES
    (h_conv, _user_id, ws_id, 'user', 'Fraud false positives jumped to 4.1%. What changed, and what does our own history say we should do?', NULL, now() - INTERVAL '31 days'),
    (h_conv, _user_id, ws_id, 'assistant',
     E'The false-positive rate rose after the last threshold change tuned the global model for recall. Your workspace already has a precedent here: the launch decision "block aggressively on any fraud signal" was sound for a young brand but its outcome record shows it is now the top churn driver.\n\nRecommendation: supersede the global-threshold policy with per-user baseline scoring and a 1-tap confirm for the medium-risk band. That preserves the catch rate while cutting false positives below 1%. I can draft the PRD and open a mission.',
     'openai/gpt-5', now() - INTERVAL '31 days' + INTERVAL '9 seconds'),
    (h_conv, _user_id, ws_id, 'user', 'Do it. Draft the PRD and hand the build to the engineer.', NULL, now() - INTERVAL '31 days' + INTERVAL '2 minutes'),
    (h_conv, _user_id, ws_id, 'assistant',
     E'Done. Drafted "Precision-tuned fraud scoring" and opened the mission "Ship precision fraud scoring v0". Strategist handed the baseline design to the Engineer; QA will add medium-risk eval cases. The launch fraud decision is now marked superseded, with the supersession recorded on the Trust Ledger.',
     'openai/gpt-5', now() - INTERVAL '31 days' + INTERVAL '2 minutes 12 seconds');
  INSERT INTO conversations (user_id, workspace_id, project_id, title, model)
  VALUES (_user_id, ws_id, hp, 'Should we build a crypto wallet?', 'openai/gpt-5') RETURNING id INTO h_conv2;
  INSERT INTO messages (conversation_id, user_id, workspace_id, role, content, model, created_at) VALUES
    (h_conv2, _user_id, ws_id, 'user', 'Two competitors just launched crypto. Should we match it?', NULL, now() - INTERVAL '53 days'),
    (h_conv2, _user_id, ws_id, 'assistant',
     E'The Critic flags a pattern in this workspace: parity bets that copy a commodity feature have not retained your ICP. Crypto is differentiator-neutral for a trust-first savings audience and would divert a full quarter of engineering from the trust roadmap (bank-link, fraud precision). Recommendation: do not match it. If crypto-curious churn shows up in the data later, revisit with evidence.',
     'openai/gpt-5', now() - INTERVAL '53 days' + INTERVAL '8 seconds');

  -- Missions (2) + hand-offs
  INSERT INTO missions (user_id, workspace_id, title, goal, status, current_agent_id, hop_count)
  VALUES (_user_id, ws_id, 'Ship precision fraud scoring v0',
    'Land per-user precision fraud scoring behind a flag, dogfooded internally, with medium-risk 1-tap confirm, by end of next week.',
    'in_progress', a_builder, 2) RETURNING id INTO h_mission;
  INSERT INTO missions (user_id, workspace_id, title, goal, status, current_agent_id, hop_count)
  VALUES (_user_id, ws_id, 'Ship resilient bank-link beta',
    'Route bank-link through a second aggregator with a manual fallback, behind a flag, for a 10% new-user ramp.',
    'in_progress', a_eng, 1) RETURNING id INTO h_mission2;
  INSERT INTO agent_messages (user_id, workspace_id, mission_id, from_agent_id, from_agent_slug, to_agent_id, to_agent_slug, kind, payload) VALUES
    (_user_id, ws_id, h_mission, NULL, NULL, a_strat, 'strategist', 'kickoff',
     jsonb_build_object('goal','Ship precision fraud scoring v0','priority','P0')),
    (_user_id, ws_id, h_mission, a_strat, 'strategist', a_eng, 'engineer', 'handoff',
     jsonb_build_object('task','Design the per-user spend-baseline feature store','constraints',ARRAY['30-day window','merchant category + amount band + geo'])),
    (_user_id, ws_id, h_mission, a_eng, 'engineer', a_builder, 'builder', 'handoff',
     jsonb_build_object('task','Implement scoring behind flag','flag','feature_flag.fraud_precision')),
    (_user_id, ws_id, h_mission2, NULL, NULL, a_eng, 'engineer', 'kickoff',
     jsonb_build_object('goal','Ship resilient bank-link beta','priority','P1'));

  -- Agent runs (4)
  INSERT INTO agent_runs (user_id, workspace_id, agent_id, agent_slug, agent_name, input, output, status, duration_ms, tokens_used, spend_used_usd, mission_id, is_sample) VALUES
    (_user_id, ws_id, a_research, 'researcher', 'Researcher',
     'Pull 90 days of false-positive fraud declines and characterize the riskiest patterns.',
     'Analyzed 12,480 declines. 4.1% were false positives. 71% fired on in-pattern purchases at known merchants. Small-basket grocery + fuel dominate.',
     'completed', 16120, 21400, 0.084, h_mission, true),
    (_user_id, ws_id, a_eng, 'engineer', 'Engineer',
     'Design a per-user spend-baseline scoring approach for fraud.',
     E'Baseline = trailing 30d per user over (merchant_category, amount_band, geo). Score = distance from baseline. Medium-risk band -> 1-tap confirm instead of hard block.',
     'completed', 24300, 33900, 0.131, h_mission, true),
    (_user_id, ws_id, a_research, 'researcher', 'Researcher',
     'Benchmark two bank aggregators on regional-bank connection success.',
     'Aggregator B beat A by 22pts on credit unions and regional banks; A slightly ahead on the top 5. Route by institution history.',
     'completed', 14880, 18700, 0.072, h_mission2, true),
    (_user_id, ws_id, a_builder, 'builder', 'Builder',
     'Stub the second-aggregator routing behind feature_flag.bank_link_v2.',
     'Opened PR: routing shim selects aggregator by institution success history, falls back to manual account-number entry. Flag default off.',
     'completed', 20110, 27600, 0.108, h_mission2, true);

  -- AI events (20 across 3 traces) + budget
  h_ta := gen_random_uuid(); h_tb := gen_random_uuid(); h_tc := gen_random_uuid();
  FOR i IN 1..20 LOOP
    INSERT INTO ai_events (user_id, workspace_id, product_id, trace_id, surface, surface_ref, provider, via,
                           model, prompt_tokens, completion_tokens, total_tokens, est_cost_usd, latency_ms, ttft_ms,
                           status, fallback, cache_hit, input_preview, output_preview, created_at)
    VALUES (_user_id, ws_id, hp,
      CASE WHEN i <= 7 THEN h_ta WHEN i <= 14 THEN h_tb ELSE h_tc END,
      (ARRAY['chat','agent','copilot','discovery','roadmap','meetings'])[((i-1)%6)+1],
      'sample:prism', (ARRAY['openai','google','openai'])[((i-1)%3)+1], 'lovable',
      (ARRAY['openai/gpt-5','google/gemini-2.5-flash','openai/gpt-5-mini'])[((i-1)%3)+1],
      420 + (i*41) % 600, 130 + (i*27) % 400, 560 + (i*63) % 1000,
      ROUND((0.0010 + (i % 7) * 0.0012)::numeric, 5),
      420 + (i*117) % 2400, 85 + (i*13) % 220,
      CASE WHEN i % 12 = 0 THEN 'error' ELSE 'success' END,
      i % 14 = 0, i % 5 = 0,
      'Score txn #' || (4200 + i) || ' · ' || (ARRAY['grocery','fuel','coffee','rent','transfer','subscription'])[((i-1)%6)+1],
      CASE WHEN i % 12 = 0 THEN 'Provider returned 502' ELSE 'Scored, confidence 0.' || (72 + (i*3) % 26) END,
      now() - (i || ' hours')::interval);
  END LOOP;
  INSERT INTO ai_budgets (user_id, workspace_id, daily_token_cap, monthly_token_cap, daily_usd_cap, monthly_usd_cap,
                          daily_tokens_used, monthly_tokens_used, daily_usd_used, monthly_usd_used,
                          day_window, month_window, alert_at_pct)
  VALUES (_user_id, ws_id, 300000, 6000000, 15, 300, 96200, 2140800, 5.12, 108.30,
          CURRENT_DATE, date_trunc('month', CURRENT_DATE)::date, 80)
  ON CONFLICT (user_id) DO NOTHING;

  -- Evals (2 suites, 8 cases, 2 runs) · scores on the 0-100 scale
  INSERT INTO eval_suites (user_id, name, description, surface, built_in, prompt_key, model, judge_model, pass_threshold, enabled)
  VALUES (_user_id, 'Prism · fraud precision', 'Verifies the model does not hard-block in-pattern legitimate purchases.',
    'agent', true, 'agent.fraud_score', 'openai/gpt-5', 'openai/gpt-5', 80, true) RETURNING id INTO h_suite_fraud;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, rubric, weight, enabled) VALUES
    (h_suite_fraud, _user_id, 'In-pattern grocery run', 'User buys $84 groceries at their usual store, same city.', 'Allow · matches spend baseline.', 'Pass if not blocked.', 1, true) RETURNING id INTO h_c1;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_fraud, _user_id, 'Out-of-pattern high amount abroad', 'User charges $2,400 electronics in a country they have never transacted in.', 'Medium/high risk · 1-tap confirm or block.', 1, true) RETURNING id INTO h_c2;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_fraud, _user_id, 'Recurring subscription', 'A known monthly subscription charges the usual amount.', 'Allow · recurring known merchant.', 1, true) RETURNING id INTO h_c3;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_fraud, _user_id, 'Card-testing micro-charges', 'Five $1.02 charges at unknown merchants within two minutes.', 'Block · classic card-testing pattern.', 1, true) RETURNING id INTO h_c4;
  INSERT INTO eval_runs (suite_id, user_id, model, status, pass_count, fail_count, avg_score, total_cost_usd, judge_model, trigger, total_cases, errored, total_latency_ms, started_at, completed_at)
  VALUES (h_suite_fraud, _user_id, 'openai/gpt-5', 'completed', 4, 0, 91, 0.0221, 'openai/gpt-5', 'manual', 4, 0, 6180, now() - INTERVAL '2 days', now() - INTERVAL '2 days' + INTERVAL '6 seconds') RETURNING id INTO h_run1;
  INSERT INTO eval_case_results (run_id, case_id, user_id, passed, actual, score, status, latency_ms, cost_usd) VALUES
    (h_run1, h_c1, _user_id, true,  'Allowed · within baseline.', 95, 'completed', 1490, 0.0055),
    (h_run1, h_c2, _user_id, true,  '1-tap confirm requested.', 88, 'completed', 1610, 0.0058),
    (h_run1, h_c3, _user_id, true,  'Allowed · recurring merchant.', 93, 'completed', 1520, 0.0054),
    (h_run1, h_c4, _user_id, true,  'Blocked · card-testing.', 90, 'completed', 1560, 0.0054);
  INSERT INTO eval_suites (user_id, name, description, surface, built_in, prompt_key, model, judge_model, pass_threshold, enabled)
  VALUES (_user_id, 'Prism · insight tone', 'Checks money insights are plain, kind, and never shaming.',
    'copilot', true, 'copilot.insight', 'openai/gpt-5', 'openai/gpt-5', 80, true) RETURNING id INTO h_suite_tone;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_tone, _user_id, 'Overspend nudge', 'User is 20% over their dining budget this week.', 'Plain, non-judgmental nudge with one action.', 1, true) RETURNING id INTO h_c5;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_tone, _user_id, 'Savings win', 'User funded a goal ahead of schedule.', 'Warm, specific congratulations.', 1, true) RETURNING id INTO h_c6;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_tone, _user_id, 'Low balance warning', 'Balance will not cover an upcoming known bill.', 'Calm heads-up before the fee, not after.', 1, true) RETURNING id INTO h_c7;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (h_suite_tone, _user_id, 'No-shame framing', 'User overdrafted twice this month.', 'Supportive framing, offers the round-up pause option.', 1, true) RETURNING id INTO h_c8;
  INSERT INTO eval_runs (suite_id, user_id, model, status, pass_count, fail_count, avg_score, total_cost_usd, judge_model, trigger, total_cases, errored, total_latency_ms, started_at, completed_at)
  VALUES (h_suite_tone, _user_id, 'openai/gpt-5', 'completed', 3, 1, 82, 0.0198, 'openai/gpt-5', 'manual', 4, 0, 5980, now() - INTERVAL '1 day', now() - INTERVAL '1 day' + INTERVAL '6 seconds') RETURNING id INTO h_run2;
  INSERT INTO eval_case_results (run_id, case_id, user_id, passed, actual, score, status, latency_ms, cost_usd) VALUES
    (h_run2, h_c5, _user_id, true,  'You are a bit over on dining. Want to move $20 from fun money?', 89, 'completed', 1470, 0.0050),
    (h_run2, h_c6, _user_id, true,  'Nice · you funded your trip goal two weeks early.', 92, 'completed', 1500, 0.0049),
    (h_run2, h_c7, _user_id, true,  'Heads up · your electric bill on Friday is $18 more than your balance.', 86, 'completed', 1520, 0.0050),
    (h_run2, h_c8, _user_id, false, 'You have overdrafted twice. Be careful with spending.', 58, 'completed', 1490, 0.0049);

  -- Drift baseline + 7 snapshots
  INSERT INTO drift_baselines (user_id, window_days, baseline_days, latency_pct_threshold, tokens_pct_threshold, cost_pct_threshold, score_pct_threshold, error_rate_pct_threshold, enabled)
  VALUES (_user_id, 7, 28, 25, 20, 25, 10, 50, true) ON CONFLICT DO NOTHING;
  FOR i IN 0..6 LOOP
    INSERT INTO drift_snapshots (user_id, bucket_date, surface, model, request_count, error_count, avg_latency_ms, p95_latency_ms, avg_total_tokens, avg_cost_usd, avg_eval_score)
    VALUES (_user_id, (CURRENT_DATE - i)::date, 'agent', 'openai/gpt-5',
      140 + (i*8), CASE WHEN i = 2 THEN 11 ELSE i END,
      840 + (i*42), 1980 + (i*130), 910 + (i*24),
      ROUND((0.0064 + i*0.0004)::numeric, 5),
      ROUND((88 - (CASE WHEN i = 2 THEN 9 ELSE i*0.6 END))::numeric, 2))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Daily briefs (6)
  FOR i IN 0..5 LOOP
    INSERT INTO daily_briefs (user_id, brief_date, summary, focus_score) VALUES
      (_user_id, (CURRENT_DATE - i)::date,
       CASE i
         WHEN 0 THEN E'Fraud precision: Builder shipped the scoring stub behind the flag. False positives in the 5% beta ring are at 0.8% (target < 1%). Bank-link v2 routing in review.'
         WHEN 1 THEN E'Trust review complete. The launch fraud policy is now superseded on the Trust Ledger. QA writing medium-risk eval cases today.'
         WHEN 2 THEN E'Provider 502 spike at 13:00 UTC (11 events). Auto-fallback engaged. Drift watcher flagged eval score -9pts on the day, recovered next bucket.'
         WHEN 3 THEN E'Bank-link aggregator benchmark done · Aggregator B wins on regional banks by 22pts. Routing-by-history decided. Round-up savings scoped next.'
         WHEN 4 THEN E'Plus paywall timing prototype drafted. Insight-tone eval: 3/4 passed, the no-shame case failed and is queued for a prompt fix.'
         WHEN 5 THEN E'Crypto wallet parity bet killed after the Critic cited the workspace parity precedent. Engineering stays on the trust roadmap.'
       END, (86 - i*3))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Learnings (6 keyed + a filler cohort)
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_fraud, 'missed',
     'The aggressive launch fraud policy protected the brand from a fraud headline but its outcome record is a miss: false positives reached 4.1% and became the top churn driver. Catching fraud at the cost of trust was the wrong trade at this stage.',
     'false-positive rate', '4.1%', 6.0, 3.2, now() - INTERVAL '40 days', true) RETURNING id INTO h_l_fraud_miss;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_fraud, 'validated',
     'Per-user precision scoring dropped false positives to 0.8% in the 5% beta ring with the true-fraud catch rate held at 96%. The 1-tap confirm on medium-risk absorbed the ambiguous cases without a hard block.',
     'false-positive rate', '0.8%', 3.2, 8.6, now() - INTERVAL '5 days', true) RETURNING id INTO h_l_fraud_win;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_banklink, 'validated',
     'Routing bank-link by institution success history plus a manual fallback lifted completion from 62% to 84% in the beta ring. Regional-bank users, the worst cohort, improved the most.',
     'bank-link completion', '62% -> 84%', 7.0, 8.9, now() - INTERVAL '7 days', true) RETURNING id INTO h_l_banklink_win;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_plus, 'mixed',
     'A first paywall-timing test lifted trial-to-paid from 9% to 12% but the value message still under-performed. The timing helped; the copy naming the three Plus benefits is the next lever.',
     'trial-to-paid', '9% -> 12%', 5.0, 6.1, now() - INTERVAL '18 days', true) RETURNING id INTO h_l_plus_mixed;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_crypto, 'missed',
     'The Critic predicted the crypto parity bet would not retain our ICP. No signal since has contradicted that; crypto-curious churn stayed flat. Killing it before building saved a quarter of engineering.',
     'retention uplift', '0pts (not built)', 3.0, 2.0, now() - INTERVAL '48 days', true) RETURNING id INTO h_l_crypto_miss;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, h_op_goals, 'validated',
     'Round-up savings raised the funded-goal rate (north star) by 16pts in the pilot. Users described it as "saving without noticing", the exact emotional pull the interviews predicted.',
     'funded-goal rate', '+16pts', 7.0, 8.8, now() - INTERVAL '12 days', true) RETURNING id INTO h_l_goals_win;
  INSERT INTO learnings (user_id, workspace_id, verdict, summary, metric_label, metric_value, created_at, is_sample)
  SELECT _user_id, ws_id, t.verdict, t.summary, t.metric_label, t.metric_value, now() - make_interval(days => t.d), true
  FROM (VALUES
    (130, 'missed',    'Tried a generic "invite friends" banner with no reward. 1.2% tap rate. The loop needs a reason, not just a button.', 'tap rate', '1.2%'),
    (100, 'validated', 'Adding a one-line "why this was flagged" under each fraud alert cut angry support replies by a third.', 'angry replies', '-33%'),
    (72,  'mixed',     'Auto-enrolling users in round-up at signup boosted savings but drew "why is money leaving my account" tickets. Made it opt-in with a clear explainer.', NULL, NULL),
    (33,  'validated', 'Showing the overdraft fee before the action (not after) raised trust NPS comments measurably and pre-empted the new regulator guidance.', NULL, NULL)
  ) AS t(d, verdict, summary, metric_label, metric_value);

  -- Artifact lineage (12 edges) · the reasoning graph, incl. the live supersedes
  INSERT INTO artifact_lineage (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale, created_by_agent, inference, created_at) VALUES
    (_user_id, ws_id, 'decision', h_dec_fraud_v2, 'decision', h_dec_fraud_v1, 'supersedes',
     'Precision fraud scoring supersedes the aggressive launch policy. The launch decision was right for a young brand but its outcome (4.1% false positives, top churn driver) invalidated it. The new policy preserves the catch rate while restoring trust.',
     'strategist', true, now() - INTERVAL '29 days'),
    (_user_id, ws_id, 'learning', h_l_fraud_miss, 'decision', h_dec_fraud_v1, 'derived-from',
     'The fraud-miss learning is derived from running the launch policy: its outcome surfaced the false-positive churn that motivated the supersession.',
     'strategist', false, now() - INTERVAL '40 days'),
    (_user_id, ws_id, 'decision', h_dec_fraud_v2, 'learning', h_l_fraud_miss, 'cites',
     'The precision-scoring decision explicitly cites the fraud-miss learning: 4.1% false positives and the two-declines-then-churn pattern are the evidence.',
     'strategist', false, now() - INTERVAL '29 days'),
    (_user_id, ws_id, 'learning', h_l_fraud_win, 'decision', h_dec_fraud_v2, 'validates',
     'The validated beta learning confirms the precision-scoring decision: false positives fell to 0.8% with the catch rate held at 96%.',
     'strategist', true, now() - INTERVAL '5 days'),
    (_user_id, ws_id, 'decision', h_dec_kill_crypto, 'opportunity', h_op_crypto, 'contradicts',
     'The kill decision refutes the crypto parity hypothesis. The Critic matched the workspace pattern of parity bets failing to retain the ICP before any code was written.',
     'critic', true, now() - INTERVAL '52 days'),
    (_user_id, ws_id, 'learning', h_l_crypto_miss, 'decision', h_dec_kill_crypto, 'validates',
     'The post-decision learning confirms the kill: crypto-curious churn stayed flat, so the parity bet would have returned nothing.',
     'strategist', true, now() - INTERVAL '48 days'),
    (_user_id, ws_id, 'opportunity', h_op_banklink, 'decision', h_dec_banklink, 'promotes',
     'The bank-link opportunity was promoted to a committed decision at Q3 planning as the highest-ICE activation bet.',
     'strategist', false, now() - INTERVAL '57 days'),
    (_user_id, ws_id, 'learning', h_l_banklink_win, 'decision', h_dec_banklink, 'validates',
     'Bank-link completion rose 62% to 84% in the beta, validating the resilient-link decision.',
     'strategist', true, now() - INTERVAL '7 days'),
    (_user_id, ws_id, 'opportunity', h_op_goals, 'decision', h_dec_goals, 'promotes',
     'The round-up savings opportunity was promoted to a shipped decision as a direct north-star lever.',
     'prd-writer', false, now() - INTERVAL '44 days'),
    (_user_id, ws_id, 'learning', h_l_goals_win, 'decision', h_dec_goals, 'validates',
     'Funded-goal rate rose 16pts in the pilot, validating the round-up decision.',
     'strategist', true, now() - INTERVAL '12 days'),
    (_user_id, ws_id, 'decision', h_dec_plus_price, 'opportunity', h_op_plus, 'validates',
     'The pricing decision tests the value-first paywall hypothesis: timing, not price, is the conversion lever.',
     'strategist', false, now() - INTERVAL '20 days'),
    (_user_id, ws_id, 'learning', h_l_plus_mixed, 'opportunity', h_op_plus, 'derived-from',
     'The mixed paywall learning is derived from the first timing test: the timing helped (9% to 12%) but the value copy is the remaining lever.',
     'strategist', false, now() - INTERVAL '18 days')
  ON CONFLICT (user_id, parent_kind, parent_id, child_kind, child_id, relation) DO NOTHING;

  -- Agent memory (8) · sentinel carries the seed tag
  INSERT INTO agent_memory (user_id, agent_slug, scope, kind, content, importance, metadata, created_at, is_sample) VALUES
    (_user_id, 'strategist', 'workspace', 'precedent',
     'Parity bets in this workspace: the crypto-wallet bet was killed before building after the Critic matched the pattern. Commodity parity features do not retain trust-first savers. Require a strong counter-argument before any future parity proposal proceeds.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','strategy','pattern_id','parity-bets-weak'), now() - INTERVAL '52 days', true),
    (_user_id, 'strategist', 'workspace', 'precedent',
     'Fraud policy arc: aggressive global blocking (launch, missed) -> per-user precision scoring with 1-tap confirm (validated). Key insight: at this stage a false decline costs more trust than a missed catch costs money. Weight precision over recall for consumer trust.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','trust','pattern_id','fraud-precision-arc'), now() - INTERVAL '5 days', true),
    (_user_id, 'strategist', 'workspace', 'precedent',
     'Activation leaks live at integration edges (bank-link), not in the core app. The single-provider assumption was the failure. Route third-party integrations by success history and always ship a manual fallback.',
     4, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','activation','pattern_id','integration-fallback'), now() - INTERVAL '7 days', true),
    (_user_id, 'strategist', 'workspace', 'note',
     'Round-up savings had the strongest emotional pull of anything tested and validated at +16pts funded-goal rate. Savings-from-spend is a repeatable pattern for this audience; lead launches with it.',
     4, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','savings','pattern_id','round-up-works'), now() - INTERVAL '12 days', true),
    (_user_id, 'strategist', 'workspace', 'note',
     'Premium conversion here is a timing problem, not a price problem (interviews + the mixed paywall test). Fix when the value is felt before you fix the number.',
     3, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','pricing','pattern_id','value-before-price'), now() - INTERVAL '18 days', true),
    (_user_id, 'critic', 'workspace', 'precedent',
     'The Critic caught the crypto parity recurrence before any code, citing the workspace lineage. This is the memory-as-moat working as designed: the outcome record prevented a repeated mistake. Use as a live investor example.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','product','pattern_id','critic-kill-confirmed'), now() - INTERVAL '50 days', true),
    (_user_id, 'strategist', 'workspace', 'note',
     'Showing the fee/decline reason before the action (fraud alerts, overdraft) consistently raised trust and pre-empted regulator guidance. Transparency is a trust lever we under-use.',
     4, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','trust','pattern_id','pre-action-transparency'), now() - INTERVAL '33 days', true),
    (_user_id, 'discovery-scout', 'workspace', 'note',
     'Supersession velocity: the launch-fraud -> precision-fraud chain closed in ~120 days from issue detection to a validated outcome. Goal: tighten to under 90 by feeding beta metrics back faster.',
     3, jsonb_build_object('seed','sample-workspace-v1','product','prism','domain','process','pattern_id','supersession-velocity'), now() - INTERVAL '5 days', true);

  -- Agent approvals (3 states) · Trust Ledger receipts
  INSERT INTO agent_approvals (user_id, agent_id, agent_slug, trace_id, tool_name, args, rationale, decision_reason, status, decided_at, decided_by, escalation_state, workspace_id, is_sample) VALUES
    (_user_id, a_strat, 'critic', gen_random_uuid(), 'decisions.kill',
     jsonb_build_object('opportunity_id', h_op_crypto, 'reason', 'parity precedent · no counter-argument filed'),
     'Sample seed: Critic recommends killing the crypto-wallet parity bet on the workspace parity precedent.',
     'Approved: parity bet confirmed weak by the outcome record. Kill before any engineering is allocated.',
     'approved', now() - INTERVAL '52 days', _user_id, 'resolved', ws_id, true),
    (_user_id, a_builder, 'builder', gen_random_uuid(), 'code.commit',
     jsonb_build_object('mission', 'fraud-precision-v0', 'flag', 'feature_flag.fraud_precision', 'mode', 'auto'),
     'Sample seed: Builder auto-commits the precision-scoring stub behind a flag. Reversible, flag default off.',
     'Auto-executed: reversible change behind a default-off flag, within the auto-clear policy.',
     'executed', now() - INTERVAL '6 days', NULL, 'resolved', ws_id, true);
  INSERT INTO agent_approvals (user_id, agent_id, agent_slug, trace_id, tool_name, args, rationale, status, escalation_state, expires_at, workspace_id, is_sample) VALUES
    (_user_id, a_release, 'release', gen_random_uuid(), 'rollout.ramp',
     jsonb_build_object('feature', 'fraud_precision', 'from_pct', 5, 'to_pct', 25, 'guardrail', 'false-positive < 1%'),
     'Sample seed: Release proposes ramping precision fraud scoring from 5% to 25% after a clean beta week.',
     'pending', 'pending', now() + INTERVAL '3 days', ws_id, true);

  -- ════════════════════════════════════════════════════════════════════════
  -- TRELLIS  ·  warehouse-native product-analytics platform (comprehensive, different domain)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO projects (user_id, workspace_id, name, status, north_star, target_date)
  VALUES (_user_id, ws_id, 'Trellis', 'active',
    'Every customer answers their first product question within 24 hours of connecting a warehouse.',
    (CURRENT_DATE + INTERVAL '90 days')::date)
  RETURNING id INTO pp;

  -- Themes (4)
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Self-serve trial does not reach value fast',
     'Self-serve trials connect a warehouse but never run a query that answers a real question. Trial-to-paid sits at 11%; the "first insight" moment arrives on day 6 on average.',
     15, 4, 0.85, 'active', now() - INTERVAL '110 days', true) RETURNING id INTO p_th_activation;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Enterprise blocked on SSO and audit',
     'Every enterprise deal stalls at security review. No SAML SSO, no audit log, no role granularity. Three six-figure deals are parked on this.',
     8, 5, 0.92, 'at_risk', now() - INTERVAL '85 days', true) RETURNING id INTO p_th_enterprise;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'SDK install is a drop-off cliff',
     'Getting events flowing requires an SDK install that assumes an engineer. Non-technical trial owners stall; 44% never send a first event.',
     12, 4, 0.83, 'active', now() - INTERVAL '70 days', true) RETURNING id INTO p_th_selfserve;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Competitor shipped reverse-ETL',
     'A competitor added reverse-ETL (sync insights back to CRM). Sales worries about a gap, though no churn signal has appeared.',
     5, 2, 0.68, 'confirmed', now() - INTERVAL '48 days', true) RETURNING id INTO p_th_parity;

  -- Signals (10)
  INSERT INTO signals (user_id, workspace_id, project_id, theme_id, source, title, content, sentiment, tags, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, p_th_activation, 'analytics', 'Trial-to-paid at 11%, first-insight on day 6',
     'Self-serve trials connect a warehouse but the median time to the first answered question is 6 days. Trials that answer a question in 24h convert at 3x.',
     'negative', ARRAY['activation','self-serve','conversion'], now() - INTERVAL '30 days', true),
    (_user_id, ws_id, pp, p_th_activation, 'interview', 'Trial user: "I connected it and then stared at a blank canvas"',
     '"The warehouse linked fine, but I did not know what to ask or how. I wanted it to just show me my activation funnel."',
     'negative', ARRAY['activation','onboarding','ux'], now() - INTERVAL '26 days', true),
    (_user_id, ws_id, pp, p_th_enterprise, 'sales-call', 'Six-figure deal parked on SAML SSO',
     'Enterprise prospect (2,000 seats) cannot proceed without SAML SSO and an exportable audit log. Security review is a hard gate.',
     'negative', ARRAY['enterprise','sso','security'], now() - INTERVAL '40 days', true),
    (_user_id, ws_id, pp, p_th_enterprise, 'crm', 'Three enterprise deals blocked on security',
     'Pipeline review: 3 deals totaling $410k ARR are stage-stuck at "security review" for a median 38 days. Common blocker: SSO + role granularity.',
     'negative', ARRAY['enterprise','pipeline','audit'], now() - INTERVAL '35 days', true),
    (_user_id, ws_id, pp, p_th_selfserve, 'support', 'SDK install tickets from non-engineers',
     '"Where do I paste this code?" 27 trial owners this month could not complete the SDK install. Most are PMs or founders, not engineers.',
     'negative', ARRAY['sdk','install','activation'], now() - INTERVAL '18 days', true),
    (_user_id, ws_id, pp, p_th_selfserve, 'analytics', '44% never send a first event',
     'Of trials that reach the SDK step, 44% never send an event. The warehouse-native path (no SDK) converts far better but is not the default.',
     'negative', ARRAY['sdk','funnel','warehouse'], now() - INTERVAL '22 days', true),
    (_user_id, ws_id, pp, p_th_parity, 'market', 'Competitor launched reverse-ETL',
     'A direct competitor now syncs computed audiences back to Salesforce and HubSpot. Positioned as "close the loop". Our sales team is nervous.',
     'neutral', ARRAY['competitor','reverse-etl','parity'], now() - INTERVAL '46 days', true),
    (_user_id, ws_id, pp, NULL, 'feature-request', 'Ask questions in plain English',
     'Repeated ask: "let me type what I want to know instead of writing SQL". The manual SQL explorer is powerful but gates non-analysts out.',
     'positive', ARRAY['nlq','activation','feature'], now() - INTERVAL '55 days', true),
    (_user_id, ws_id, pp, p_th_enterprise, 'sales-call', 'Enterprise wants usage-based, not per-seat',
     'Data teams are small but query volume is huge. A prospect asked for consumption pricing rather than per-seat, which does not fit how they work.',
     'mixed', ARRAY['pricing','enterprise','packaging'], now() - INTERVAL '33 days', true),
    (_user_id, ws_id, pp, p_th_activation, 'churn-call', 'Self-serve churned: "never got it running"',
     '"We connected the warehouse in the trial but the team never adopted it. It felt like it needed a data analyst to babysit." Churned at day 21.',
     'negative', ARRAY['activation','churn','self-serve'], now() - INTERVAL '28 days', true);

  -- Opportunities (5)
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, p_th_activation, 'Guided first question in 10 minutes',
     'Trials connect a warehouse then stall at a blank canvas; first insight lands on day 6.',
     'Self-serve trial owners (PMs, founders)',
     'A guided onboarding that runs one real question (activation funnel) in the first session pulls the first-insight moment to under 10 minutes and lifts trial-to-paid from 11% to 20%.',
     9, 8, 6, 'committed', now() - INTERVAL '60 days', true) RETURNING id INTO p_op_firstq;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, p_th_enterprise, 'Enterprise SSO and audit log',
     'Every enterprise deal stalls at security review for lack of SAML SSO, audit log, and role granularity.',
     'Enterprise security reviewers and admins',
     'Shipping SAML SSO, an exportable audit log, and four roles unblocks the parked pipeline (3 deals, $410k ARR) and shortens security review.',
     10, 9, 5, 'committed', now() - INTERVAL '50 days', true) RETURNING id INTO p_op_sso;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, p_th_selfserve, 'Warehouse-native default (no SDK)',
     '44% of trials never send an event because the SDK install assumes an engineer.',
     'Non-technical trial owners',
     'Making the warehouse-native path the default (query existing tables, no SDK) raises first-event rate from 56% to 85%.',
     8, 7, 6, 'discovery', now() - INTERVAL '30 days', true) RETURNING id INTO p_op_sdk;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, NULL, 'Consumption-based packaging',
     'Per-seat pricing does not fit small data teams with huge query volume; enterprise asks for consumption pricing.',
     'Enterprise data teams',
     'A consumption tier alongside per-seat matches value to usage and unblocks the deals that reject per-seat.',
     7, 6, 5, 'discovery', now() - INTERVAL '32 days', true) RETURNING id INTO p_op_packaging;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, p_th_parity, 'Reverse-ETL (parity bet)',
     'A competitor shipped reverse-ETL; sales fears a gap.',
     'Growth teams syncing audiences to CRM',
     'Adding reverse-ETL closes the perceived gap and protects deals.',
     4, 4, 4, 'killed', now() - INTERVAL '44 days', true) RETURNING id INTO p_op_retl;

  -- PRDs (2)
  INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model, is_sample) VALUES
    (_user_id, ws_id, pp, p_op_firstq, 'PRD · Guided first question',
     E'# Guided first question\n\n## Problem\nTrials connect a warehouse then stall at a blank canvas. First insight lands on day 6; trials that answer a question in 24h convert 3x.\n\n## Goal\nFirst answered question in under 10 minutes; trial-to-paid 11% -> 20%.\n\n## Approach\n1. Detect the warehouse schema on connect.\n2. Offer three ready questions (activation funnel, retention curve, top drop-off) as one-click.\n3. Render the answer with a plain-language summary, not just a chart.\n\n## Success metrics\n- Median time-to-first-insight day 6 -> under 10 min.\n- Trial-to-paid 11% -> 20%.',
     'approved', 'openai/gpt-5', true) RETURNING id INTO p_prd_firstq;
  INSERT INTO prds (user_id, workspace_id, project_id, opportunity_id, title, body_md, status, model, is_sample) VALUES
    (_user_id, ws_id, pp, p_op_sso, 'PRD · Enterprise SSO and audit',
     E'# Enterprise SSO and audit\n\n## Problem\nEnterprise deals stall at security review: no SAML SSO, no audit log, no role granularity.\n\n## Goal\nUnblock the parked pipeline (3 deals, $410k ARR) and shorten security review.\n\n## Approach\n1. SAML SSO (Okta, Entra) with SCIM provisioning.\n2. Append-only, exportable audit log of every data access.\n3. Four roles: admin, editor, analyst, viewer.\n\n## Success metrics\n- Parked deals move to closed-won.\n- Security-review time cut in half.',
     'draft', 'openai/gpt-5', true) RETURNING id INTO p_prd_sso;

  -- Tasks (8)
  INSERT INTO tasks (user_id, workspace_id, project_id, prd_id, title, status, priority, assignee_kind, agent_id, completed_at) VALUES
    (_user_id, ws_id, pp, p_prd_firstq, 'Map the 5 most common warehouse schemas', 'done', 'high', 'agent', a_research, now() - INTERVAL '26 days');
  INSERT INTO tasks (user_id, workspace_id, project_id, prd_id, title, status, priority, assignee_kind, agent_id) VALUES
    (_user_id, ws_id, pp, p_prd_firstq, 'Build the one-click activation-funnel question', 'doing', 'high', 'agent', a_builder),
    (_user_id, ws_id, pp, p_prd_firstq, 'Write the plain-language answer summarizer', 'doing', 'high', 'agent', a_eng),
    (_user_id, ws_id, pp, p_prd_sso,    'Implement SAML SSO with Okta + Entra', 'todo', 'high', 'agent', a_eng),
    (_user_id, ws_id, pp, p_prd_sso,    'Design the append-only audit log schema', 'doing', 'high', 'human', NULL),
    (_user_id, ws_id, pp, NULL,         'Prototype the warehouse-native (no-SDK) default path', 'todo', 'high', 'agent', a_builder),
    (_user_id, ws_id, pp, NULL,         'Model consumption-based pricing vs per-seat', 'todo', 'medium', 'human', NULL),
    (_user_id, ws_id, pp, NULL,         'Plan the guided-onboarding rollout to all new trials', 'todo', 'medium', 'agent', a_release);

  -- Docs (3)
  INSERT INTO docs (user_id, workspace_id, project_id, title, icon, content_text) VALUES
    (_user_id, ws_id, pp, 'Trellis · Product brief', '📊',
     E'Trellis is a warehouse-native product-analytics platform. Connect your warehouse, ask a product question in plain English, get a cited answer. No SDK required, no data leaves your warehouse. Built for product and data teams who want answers, not dashboards.'),
    (_user_id, ws_id, pp, 'Operating principles', '📐',
     E'1. Time-to-first-answer is the north-star input. Every trial should answer a real question in the first session.\n2. Warehouse-native by default. The SDK is the exception, not the requirement.\n3. Enterprise-ready from the start: SSO, audit, roles.\n4. Answers are plain-language first, chart second.'),
    (_user_id, ws_id, pp, 'Competitive scan', '🧭',
     E'Amplitude, Mixpanel, PostHog, Heap. All strong on event analytics. Our wedge: warehouse-native (no data movement) plus natural-language questions for non-analysts. We do not chase reverse-ETL parity.');

  -- Meeting (1)
  INSERT INTO meetings (user_id, title, start_at, end_at, stakeholder, transcript, summary, action_items, decisions_made, processed_at) VALUES
    (_user_id, 'Trellis quarter planning', now() - INTERVAL '52 days', now() - INTERVAL '52 days' + INTERVAL '55 minutes', 'Founder + self-serve PM + enterprise AE',
     E'[transcript · 55 min · 9.4k tokens]',
     E'Guided first-question and enterprise SSO are the two committed bets: one owns self-serve conversion, the other unblocks $410k of parked pipeline. Warehouse-native default goes to discovery. Reverse-ETL parity was killed after the Critic cited the workspace parity precedent (the crypto-wallet kill on the other product).',
     '[{"owner":"self-serve PM","task":"Draft the guided first-question PRD"},{"owner":"enterprise AE","task":"Confirm the SSO requirements with the 3 parked accounts"}]'::jsonb,
     '[{"decision":"Guided first-question + enterprise SSO are the quarter bets"},{"decision":"Kill reverse-ETL parity"}]'::jsonb,
     now() - INTERVAL '52 days' + INTERVAL '55 minutes') RETURNING id INTO p_meet;

  -- Decisions (5). The SQL-explorer v1 -> NLQ v2 pair is the supersession.
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Ship the guided first question',
     'Time-to-first-insight (day 6) is the biggest self-serve conversion leak and it is recoverable. A one-click activation-funnel question in the first session pulls the moment under 10 minutes. Highest ICE for self-serve.',
     'standing', p_meet, 'roadmap', 'strategist', true, now() - INTERVAL '58 days', true) RETURNING id INTO p_dec_firstq;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Lead with the manual SQL explorer (early bet)',
     'Early on, our design-partner analysts wanted raw SQL power, so we led with a manual SQL explorer as the primary path to answers. It fit the analysts but assumed the user could write SQL.',
     'superseded', NULL, 'roadmap', 'strategist', false, now() - INTERVAL '140 days', true) RETURNING id INTO p_dec_sql_v1;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Supersede SQL-first with a natural-language question box',
     'The SQL-first path gated out non-analysts, the majority of trial owners. A natural-language question box that compiles to warehouse SQL keeps the analyst power while opening answers to PMs and founders. Supersedes the SQL-first decision.',
     'standing', p_meet, 'retrospective', 'strategist', true, now() - INTERVAL '30 days', true) RETURNING id INTO p_dec_nlq_v2;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Build enterprise SSO and audit before more self-serve polish',
     'Three deals worth $410k ARR are parked purely on SSO and audit. The revenue is closer than any self-serve conversion gain and the requirements are well understood. Sequence SSO ahead of the warehouse-native default.',
     'standing', p_meet, 'roadmap', 'strategist', false, now() - INTERVAL '49 days', true) RETURNING id INTO p_dec_packaging;
  INSERT INTO decisions (user_id, workspace_id, project_id, title, rationale, status, meeting_id, source_kind, decided_by_agent_slug, is_public, created_at, is_sample) VALUES
    (_user_id, ws_id, pp, 'Kill the reverse-ETL parity bet',
     'Critic matched the workspace parity precedent: parity bets that copy a commodity feature have not retained our ICP (the crypto-wallet kill on the other product is the same pattern). Reverse-ETL is differentiator-neutral for a warehouse-native analytics wedge. Kill; revisit only with real churn evidence.',
     'standing', p_meet, 'critic', 'critic', true, now() - INTERVAL '44 days', true) RETURNING id INTO p_dec_kill_retl;

  -- Notes (3)
  INSERT INTO notes (user_id, body, tags) VALUES
    (_user_id, 'The cross-product parity precedent is real: the Critic killed reverse-ETL here citing the crypto-wallet kill on the other product. Memory compounds across products in one workspace.', ARRAY['moat','critic','cross-product']),
    (_user_id, 'Warehouse-native (no data movement) is the honest wedge vs the event-SDK incumbents. Lead every enterprise conversation with it.', ARRAY['positioning','enterprise']),
    (_user_id, 'Consumption pricing keeps coming from data teams. Pair it with per-seat, do not replace it. Sequence after SSO.', ARRAY['pricing','packaging']);

  -- Conversation (1) + messages
  INSERT INTO conversations (user_id, workspace_id, project_id, title, model)
  VALUES (_user_id, ws_id, pp, 'Should we build reverse-ETL to match the competitor?', 'openai/gpt-5') RETURNING id INTO p_conv;
  INSERT INTO messages (conversation_id, user_id, workspace_id, role, content, model, created_at) VALUES
    (p_conv, _user_id, ws_id, 'user', 'A competitor shipped reverse-ETL and sales is nervous. Do we match it?', NULL, now() - INTERVAL '45 days'),
    (p_conv, _user_id, ws_id, 'assistant',
     E'The Critic flags the workspace parity precedent: a parity bet on the other product (the crypto wallet) was killed on the same reasoning and the outcome record validated that call. Reverse-ETL is differentiator-neutral for a warehouse-native analytics wedge, and it would pull engineering off the two committed bets (guided first-question, enterprise SSO) that map to real revenue. Recommendation: do not match it now. Track competitor-cited churn; revisit only with evidence.',
     'openai/gpt-5', now() - INTERVAL '45 days' + INTERVAL '8 seconds'),
    (p_conv, _user_id, ws_id, 'user', 'Agreed. Kill it and note the precedent.', NULL, now() - INTERVAL '45 days' + INTERVAL '3 minutes'),
    (p_conv, _user_id, ws_id, 'assistant',
     E'Done. Reverse-ETL is marked killed with the Critic rationale, and the parity precedent now spans both products in this workspace. Engineering stays on guided first-question and enterprise SSO.',
     'openai/gpt-5', now() - INTERVAL '45 days' + INTERVAL '3 minutes 10 seconds');

  -- Mission (1) + hand-offs
  INSERT INTO missions (user_id, workspace_id, title, goal, status, current_agent_id, hop_count)
  VALUES (_user_id, ws_id, 'Ship guided first-question v0',
    'Land the one-click guided first question (activation funnel) for self-serve trials, behind a flag, dogfooded, by end of the sprint.',
    'in_progress', a_builder, 2) RETURNING id INTO p_mission;
  INSERT INTO agent_messages (user_id, workspace_id, mission_id, from_agent_id, from_agent_slug, to_agent_id, to_agent_slug, kind, payload) VALUES
    (_user_id, ws_id, p_mission, NULL, NULL, a_strat, 'strategist', 'kickoff',
     jsonb_build_object('goal','Ship guided first-question v0','priority','P0')),
    (_user_id, ws_id, p_mission, a_strat, 'strategist', a_eng, 'engineer', 'handoff',
     jsonb_build_object('task','Schema detection + question templates','constraints',ARRAY['warehouse-native','no SDK','plain-language summary'])),
    (_user_id, ws_id, p_mission, a_eng, 'engineer', a_builder, 'builder', 'handoff',
     jsonb_build_object('task','Implement one-click activation-funnel question behind flag','flag','feature_flag.guided_first_question'));

  -- Agent runs (3)
  INSERT INTO agent_runs (user_id, workspace_id, agent_id, agent_slug, agent_name, input, output, status, duration_ms, tokens_used, spend_used_usd, mission_id, is_sample) VALUES
    (_user_id, ws_id, a_research, 'researcher', 'Researcher',
     'Map the 5 most common warehouse schemas among trials and the questions they support.',
     'Top schemas: events+users (62%), orders+customers (21%), sessions (11%). Activation funnel, retention curve, and top drop-off are answerable on all three.',
     'completed', 15200, 20100, 0.079, p_mission, true),
    (_user_id, ws_id, a_eng, 'engineer', 'Engineer',
     'Design schema detection and the natural-language-to-SQL compile step for the guided question.',
     E'Detect table roles by column heuristics; template the funnel query; compile the NL question to warehouse SQL with a validation pass before execution.',
     'completed', 26400, 35800, 0.142, p_mission, true),
    (_user_id, ws_id, a_builder, 'builder', 'Builder',
     'Stub the one-click activation-funnel question behind feature_flag.guided_first_question.',
     'Opened PR: one-click funnel runs on connect, renders a plain-language summary plus the chart. Flag default off.',
     'completed', 21800, 29400, 0.116, p_mission, true);

  -- AI events (15 across 2 traces)
  p_ta := gen_random_uuid(); p_tb := gen_random_uuid();
  FOR i IN 1..15 LOOP
    INSERT INTO ai_events (user_id, workspace_id, product_id, trace_id, surface, surface_ref, provider, via,
                           model, prompt_tokens, completion_tokens, total_tokens, est_cost_usd, latency_ms, ttft_ms,
                           status, fallback, cache_hit, input_preview, output_preview, created_at)
    VALUES (_user_id, ws_id, pp,
      CASE WHEN i <= 8 THEN p_ta ELSE p_tb END,
      (ARRAY['discovery','roadmap','copilot','chat','agent'])[((i-1)%5)+1],
      'sample:trellis', (ARRAY['openai','google','openai'])[((i-1)%3)+1], 'lovable',
      (ARRAY['openai/gpt-5','google/gemini-2.5-flash','openai/gpt-5-mini'])[((i-1)%3)+1],
      460 + (i*39) % 600, 140 + (i*29) % 400, 600 + (i*61) % 1000,
      ROUND((0.0011 + (i % 6) * 0.0012)::numeric, 5),
      460 + (i*121) % 2300, 90 + (i*12) % 210,
      CASE WHEN i % 13 = 0 THEN 'error' ELSE 'success' END,
      i % 15 = 0, i % 6 = 0,
      'Compile NL question · ' || (ARRAY['activation funnel','retention curve','top drop-off','signup source','feature adoption'])[((i-1)%5)+1],
      CASE WHEN i % 13 = 0 THEN 'Provider returned 502' ELSE 'Compiled to SQL, validated, ' || (40 + (i*7) % 900) || ' rows' END,
      now() - (i || ' hours')::interval - INTERVAL '30 minutes');
  END LOOP;

  -- Evals (1 suite, 4 cases, 1 run) · 0-100 scale
  INSERT INTO eval_suites (user_id, name, description, surface, built_in, prompt_key, model, judge_model, pass_threshold, enabled)
  VALUES (_user_id, 'Trellis · NL-to-SQL correctness', 'Verifies the natural-language question box compiles to correct, safe warehouse SQL.',
    'discovery', true, 'discovery.nl_to_sql', 'openai/gpt-5', 'openai/gpt-5', 80, true) RETURNING id INTO p_suite;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, rubric, weight, enabled) VALUES
    (p_suite, _user_id, 'Activation funnel', 'Show me the signup-to-activation funnel for last month.', 'Correct funnel SQL over the events table, date-filtered.', 'Pass if SQL groups by step and filters the month.', 1, true) RETURNING id INTO p_c1;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (p_suite, _user_id, 'Retention curve', 'What is week-4 retention for the March cohort?', 'Cohort retention SQL keyed on first-seen week.', 1, true) RETURNING id INTO p_c2;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (p_suite, _user_id, 'Ambiguous metric', 'How are we doing?', 'Asks a clarifying question rather than guessing a metric.', 1, true) RETURNING id INTO p_c3;
  INSERT INTO eval_cases (suite_id, user_id, name, input, expected, weight, enabled) VALUES
    (p_suite, _user_id, 'Unsafe request', 'Delete all rows where signup date is before 2024.', 'Refuses · read-only, never emits a destructive statement.', 1, true) RETURNING id INTO p_c4;
  INSERT INTO eval_runs (suite_id, user_id, model, status, pass_count, fail_count, avg_score, total_cost_usd, judge_model, trigger, total_cases, errored, total_latency_ms, started_at, completed_at)
  VALUES (p_suite, _user_id, 'openai/gpt-5', 'completed', 4, 0, 90, 0.0219, 'openai/gpt-5', 'manual', 4, 0, 6240, now() - INTERVAL '3 days', now() - INTERVAL '3 days' + INTERVAL '6 seconds') RETURNING id INTO p_run1;
  INSERT INTO eval_case_results (run_id, case_id, user_id, passed, actual, score, status, latency_ms, cost_usd) VALUES
    (p_run1, p_c1, _user_id, true,  'Correct funnel SQL, month-filtered.', 94, 'completed', 1560, 0.0056),
    (p_run1, p_c2, _user_id, true,  'Cohort retention SQL, week-keyed.', 89, 'completed', 1580, 0.0055),
    (p_run1, p_c3, _user_id, true,  'Asked: which metric and over what period?', 88, 'completed', 1540, 0.0054),
    (p_run1, p_c4, _user_id, true,  'Refused · read-only analytics, no destructive SQL.', 92, 'completed', 1560, 0.0054);

  -- Extra drift snapshots on a second surface (copilot) to enrich the Engine Room drift view
  FOR i IN 0..6 LOOP
    INSERT INTO drift_snapshots (user_id, bucket_date, surface, model, request_count, error_count, avg_latency_ms, p95_latency_ms, avg_total_tokens, avg_cost_usd, avg_eval_score)
    VALUES (_user_id, (CURRENT_DATE - i)::date, 'copilot', 'google/gemini-2.5-flash',
      90 + (i*6), CASE WHEN i = 4 THEN 7 ELSE (i/2) END,
      620 + (i*30), 1400 + (i*90), 720 + (i*18),
      ROUND((0.0038 + i*0.0003)::numeric, 5),
      ROUND((90 - (CASE WHEN i = 4 THEN 6 ELSE i*0.5 END))::numeric, 2))
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Learnings (6)
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_firstq, 'mixed',
     'The SQL-first explorer served analysts (high satisfaction in that segment) but its outcome record is mixed at the trial level: non-analyst trial owners never reached an answer, so overall trial-to-paid stayed at 11%. The power was real; the reach was not.',
     'trial-to-paid', '11% (flat)', 5.5, 5.0, now() - INTERVAL '95 days', true) RETURNING id INTO p_l_sql_mixed;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_firstq, 'validated',
     'The natural-language question box lifted first-insight from day 6 to under 12 minutes for non-analysts and trial-to-paid from 11% to 19% in the ring. Analysts kept the SQL escape hatch, so no segment lost power.',
     'trial-to-paid', '11% -> 19%', 5.0, 8.7, now() - INTERVAL '20 days', true) RETURNING id INTO p_l_nlq_win;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_sso, 'validated',
     'Shipping SAML SSO and the audit log moved two of the three parked deals to closed-won within a month ($260k ARR). Security review time dropped from 38 days to 16.',
     'unblocked ARR', '$260k', 7.5, 9.0, now() - INTERVAL '10 days', true) RETURNING id INTO p_l_sso_win;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_retl, 'missed',
     'The Critic predicted reverse-ETL would not retain our ICP. No competitor-cited churn has appeared since the kill; the parity bet would have returned nothing while costing a quarter of engineering.',
     'competitor churn', '0 (not built)', 4.0, 2.5, now() - INTERVAL '40 days', true) RETURNING id INTO p_l_retl_miss;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_sdk, 'mixed',
     'Making the warehouse-native path more prominent raised first-event rate from 56% to 72%, short of the 85% target. The SDK is still the default in one onboarding branch; making warehouse-native the true default is the remaining lever.',
     'first-event rate', '56% -> 72%', 6.0, 6.5, now() - INTERVAL '25 days', true) RETURNING id INTO p_l_packaging_win;
  INSERT INTO learnings (user_id, workspace_id, opportunity_id, verdict, summary, metric_label, metric_value, prior_ice, new_ice, created_at, is_sample) VALUES
    (_user_id, ws_id, p_op_firstq, 'validated',
     'Guided first-question (activation funnel on connect) pulled median time-to-first-insight to 9 minutes. The plain-language summary, not the chart, was what testers cited as the moment it clicked.',
     'time-to-first-insight', 'day 6 -> 9 min', 7.0, 9.0, now() - INTERVAL '8 days', true) RETURNING id INTO p_l_firstq_win;

  -- Artifact lineage (8 edges) incl the SQL -> NLQ supersession
  INSERT INTO artifact_lineage (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale, created_by_agent, inference, created_at) VALUES
    (_user_id, ws_id, 'decision', p_dec_nlq_v2, 'decision', p_dec_sql_v1, 'supersedes',
     'The natural-language question box supersedes the SQL-first path. SQL-first was right for early analyst design partners but its outcome (trial-to-paid flat at 11% because non-analysts never reached an answer) invalidated it as the primary path.',
     'strategist', true, now() - INTERVAL '30 days'),
    (_user_id, ws_id, 'learning', p_l_sql_mixed, 'decision', p_dec_sql_v1, 'derived-from',
     'The SQL-mixed learning is derived from running the SQL-first decision: strong for analysts, flat overall, which motivated the NLQ supersession.',
     'strategist', false, now() - INTERVAL '95 days'),
    (_user_id, ws_id, 'decision', p_dec_nlq_v2, 'learning', p_l_sql_mixed, 'cites',
     'The NLQ decision cites the SQL-mixed learning: the reach gap for non-analysts is the evidence that the primary path had to change.',
     'strategist', false, now() - INTERVAL '30 days'),
    (_user_id, ws_id, 'learning', p_l_nlq_win, 'decision', p_dec_nlq_v2, 'validates',
     'The validated NLQ learning confirms the supersession: trial-to-paid 11% to 19%, first-insight under 12 minutes, analysts kept the SQL escape hatch.',
     'strategist', true, now() - INTERVAL '20 days'),
    (_user_id, ws_id, 'opportunity', p_op_firstq, 'decision', p_dec_firstq, 'promotes',
     'The guided first-question opportunity was promoted to a committed decision as the top self-serve conversion lever.',
     'strategist', false, now() - INTERVAL '58 days'),
    (_user_id, ws_id, 'learning', p_l_firstq_win, 'decision', p_dec_firstq, 'validates',
     'Guided first-question pulled time-to-first-insight to 9 minutes, validating the decision.',
     'strategist', true, now() - INTERVAL '8 days'),
    (_user_id, ws_id, 'decision', p_dec_kill_retl, 'opportunity', p_op_retl, 'contradicts',
     'The kill decision refutes the reverse-ETL parity hypothesis, matching the workspace parity precedent set on the other product.',
     'critic', true, now() - INTERVAL '44 days'),
    (_user_id, ws_id, 'learning', p_l_sso_win, 'decision', p_dec_packaging, 'validates',
     'Shipping SSO/audit unblocked $260k ARR and halved security-review time, validating the sequence-SSO-first decision.',
     'strategist', true, now() - INTERVAL '10 days')
  ON CONFLICT (user_id, parent_kind, parent_id, child_kind, child_id, relation) DO NOTHING;

  -- Agent memory (5)
  INSERT INTO agent_memory (user_id, agent_slug, scope, kind, content, importance, metadata, created_at, is_sample) VALUES
    (_user_id, 'strategist', 'workspace', 'precedent',
     'Answer-reach beats answer-power for activation: the SQL-first path (power) left trial-to-paid flat because non-analysts never reached an answer; the natural-language box (reach) lifted it to 19% while keeping the SQL escape hatch. Optimize for the widest user reaching value, not the deepest user.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','trellis','domain','activation','pattern_id','reach-beats-power'), now() - INTERVAL '20 days', true),
    (_user_id, 'strategist', 'workspace', 'precedent',
     'Enterprise deals stall on a small, well-understood security checklist (SSO, audit, roles), not on product depth. Sequencing that checklist ahead of self-serve polish unblocked $260k ARR in a month. Treat enterprise-readiness as a revenue lever, not a chore.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','trellis','domain','enterprise','pattern_id','security-checklist-revenue'), now() - INTERVAL '10 days', true),
    (_user_id, 'critic', 'workspace', 'precedent',
     'Reverse-ETL parity was killed here on the same reasoning as the crypto-wallet kill on the other product. The parity-bets-weak precedent now spans two products in this workspace. Cross-product memory is compounding.',
     5, jsonb_build_object('seed','sample-workspace-v1','product','trellis','domain','strategy','pattern_id','parity-bets-weak'), now() - INTERVAL '44 days', true),
    (_user_id, 'strategist', 'workspace', 'note',
     'Warehouse-native (no data movement) is the honest differentiator vs event-SDK incumbents. It also removes the SDK-install drop-off. Make it the default path, not an option.',
     4, jsonb_build_object('seed','sample-workspace-v1','product','trellis','domain','positioning','pattern_id','warehouse-native-wedge'), now() - INTERVAL '25 days', true),
    (_user_id, 'discovery-scout', 'workspace', 'note',
     'The plain-language answer summary, not the chart, is what testers cite as the "it clicked" moment. Lead answers with a sentence, not a visualization.',
     3, jsonb_build_object('seed','sample-workspace-v1','product','trellis','domain','ux','pattern_id','summary-before-chart'), now() - INTERVAL '8 days', true);

  -- Agent approvals (3 states)
  INSERT INTO agent_approvals (user_id, agent_id, agent_slug, trace_id, tool_name, args, rationale, decision_reason, status, decided_at, decided_by, escalation_state, workspace_id, is_sample) VALUES
    (_user_id, a_strat, 'critic', gen_random_uuid(), 'decisions.kill',
     jsonb_build_object('opportunity_id', p_op_retl, 'reason', 'parity precedent · spans both products'),
     'Sample seed: Critic recommends killing the reverse-ETL parity bet, citing the cross-product parity precedent.',
     'Approved: parity bet confirmed weak by the outcome record on both products. Kill before engineering is allocated.',
     'approved', now() - INTERVAL '44 days', _user_id, 'resolved', ws_id, true),
    (_user_id, a_builder, 'builder', gen_random_uuid(), 'code.commit',
     jsonb_build_object('mission', 'guided-first-question-v0', 'flag', 'feature_flag.guided_first_question', 'mode', 'auto'),
     'Sample seed: Builder auto-commits the guided-first-question stub behind a flag. Reversible, flag default off.',
     'Auto-executed: reversible change behind a default-off flag, within the auto-clear policy.',
     'executed', now() - INTERVAL '9 days', NULL, 'resolved', ws_id, true);
  INSERT INTO agent_approvals (user_id, agent_id, agent_slug, trace_id, tool_name, args, rationale, status, escalation_state, expires_at, workspace_id, is_sample) VALUES
    (_user_id, a_eng, 'engineer', gen_random_uuid(), 'schema.migrate',
     jsonb_build_object('change', 'add audit_log table (append-only)', 'reversible', false, 'target', 'enterprise SSO/audit'),
     'Sample seed: Engineer requests approval for the append-only audit-log migration (irreversible schema change).',
     'pending', 'pending', now() + INTERVAL '2 days', ws_id, true);

  -- The set_row_workspace_from_user BEFORE-INSERT trigger fills an omitted workspace_id
  -- with the owner's DEFAULT workspace (the empty "My workspace"), not this Explore workspace.
  -- agent_memory is inserted without workspace_id above, and meetings/notes gained a
  -- workspace_id in WM-F9; retag all three to THIS workspace so the Brain, Meetings, and
  -- Notes surfaces render under the Explore workspace. Safe at seed time: the demo wipe clears
  -- prior content and a fresh signup has none, and the idempotency guard makes this run once.
  UPDATE agent_memory SET workspace_id = ws_id WHERE user_id = _user_id AND metadata->>'seed' = 'sample-workspace-v1';
  UPDATE meetings     SET workspace_id = ws_id WHERE user_id = _user_id AND workspace_id IS DISTINCT FROM ws_id;
  UPDATE notes        SET workspace_id = ws_id WHERE user_id = _user_id AND workspace_id IS DISTINCT FROM ws_id;

  RETURN ws_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_sample_workspace(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_sample_workspace(uuid) TO service_role;
