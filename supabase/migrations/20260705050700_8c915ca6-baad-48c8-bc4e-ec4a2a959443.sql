-- SAMPLE-SEED: comprehensive product-showcase seed (from 20260705120000_sample_workspace_seed.sql).
CREATE OR REPLACE FUNCTION public.seed_sample_workspace(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  ws_id uuid;
  a_strat uuid; a_research uuid; a_eng uuid; a_qa uuid; a_release uuid; a_builder uuid;
  hp uuid;
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
  pp uuid;
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
  IF EXISTS (SELECT 1 FROM agent_memory WHERE user_id = _user_id AND metadata->>'seed' = 'sample-workspace-v1') THEN
    SELECT id INTO ws_id FROM workspaces WHERE owner_id = _user_id AND name = 'Sample workspace' LIMIT 1;
    RETURN ws_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM workspace_members WHERE user_id = _user_id) THEN
    INSERT INTO workspaces (owner_id, name) VALUES (_user_id, 'My workspace') RETURNING id INTO ws_id;
    INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (ws_id, _user_id, 'owner');
  END IF;

  v_slug := 'sample-' || substr(_user_id::text, 1, 8);
  IF EXISTS (SELECT 1 FROM workspaces WHERE slug = v_slug) THEN v_slug := NULL; END IF;

  INSERT INTO workspaces (owner_id, name, slug) VALUES (_user_id, 'Sample workspace', v_slug) RETURNING id INTO ws_id;
  INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (ws_id, _user_id, 'owner');

  PERFORM seed_default_agents(_user_id);
  SELECT id INTO a_strat    FROM agents WHERE user_id=_user_id AND slug='strategist' LIMIT 1;
  SELECT id INTO a_research FROM agents WHERE user_id=_user_id AND slug='researcher'  LIMIT 1;
  SELECT id INTO a_eng      FROM agents WHERE user_id=_user_id AND slug='engineer'    LIMIT 1;
  SELECT id INTO a_qa       FROM agents WHERE user_id=_user_id AND slug='qa'          LIMIT 1;
  SELECT id INTO a_release  FROM agents WHERE user_id=_user_id AND slug='release'     LIMIT 1;
  SELECT id INTO a_builder  FROM agents WHERE user_id=_user_id AND slug='builder'     LIMIT 1;

  -- Prism project
  INSERT INTO projects (user_id, workspace_id, name, status, north_star, target_date)
  VALUES (_user_id, ws_id, 'Prism', 'active',
    'Get 40% of active users to a funded savings goal within 30 days of signup.',
    (CURRENT_DATE + INTERVAL '75 days')::date) RETURNING id INTO hp;

  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (_user_id, ws_id, hp, 'Bank-link drop-off at activation','New users stall at the "connect your bank" step. 38% who reach the Plaid link screen never finish; most cite a failed or confusing connection.',22,5,0.88,'active',now()-INTERVAL '120 days') RETURNING id INTO h_th_activation;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (_user_id, ws_id, hp, 'Fraud false positives erode trust','The fraud model blocks legitimate transactions. Support sees "my card was declined at the grocery store" weekly; each one risks a churn.',17,5,0.90,'at_risk',now()-INTERVAL '95 days') RETURNING id INTO h_th_trust;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (_user_id, ws_id, hp, 'Premium value is unclear','Users do not understand what Prism Plus gives them. Trial-to-paid is soft and the paywall lands before the value does.',13,3,0.79,'active',now()-INTERVAL '70 days') RETURNING id INTO h_th_premium;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (_user_id, ws_id, hp, 'Word-of-mouth growth is untapped','Happy users tell friends manually. There is no in-app referral, and 3 of 5 interviewed users said they had already recommended Prism.',9,2,0.72,'active',now()-INTERVAL '55 days') RETURNING id INTO h_th_growth;
  INSERT INTO themes (user_id, workspace_id, project_id, title, summary, frequency, severity, confidence, status, created_at) VALUES
    (_user_id, ws_id, hp, 'Balance sync lag on real-time spend','Transactions take up to 90s to appear. Users double-check their bank app, which undermines the "one calm view of money" promise.',11,3,0.81,'confirmed',now()-INTERVAL '40 days') RETURNING id INTO h_th_reliability;

  INSERT INTO signals (user_id, workspace_id, project_id, theme_id, source, title, content, sentiment, tags, created_at) VALUES
    (_user_id, ws_id, hp, h_th_activation, 'app-store', 'App Store 2 star · "Could not link my bank"', '"Loved the design but it just spun forever when I tried to connect my credit union. Gave up after three tries." · iOS, 2 stars.', 'negative', ARRAY['activation','bank-link','ios'], now()-INTERVAL '18 days'),
    (_user_id, ws_id, hp, h_th_activation, 'analytics', 'Funnel: 38% drop at bank-link step', 'Of users who reach the Plaid link screen, 38% abandon. Median time-on-step before drop is 2m40s. Small banks fail 3x more than the top 5.', 'negative', ARRAY['activation','funnel','plaid'], now()-INTERVAL '20 days'),
    (_user_id, ws_id, hp, h_th_activation, 'support', 'Support · repeat bank-link failures', '31 tickets this week on failed bank connections. Common thread: OAuth flow returns to a blank screen for a subset of regional banks.', 'negative', ARRAY['activation','support','oauth'], now()-INTERVAL '9 days'),
    (_user_id, ws_id, hp, h_th_trust, 'support', 'Card declined at grocery store · legit purchase', 'User: "Prism blocked my $84 grocery run as fraud. Embarrassing at the register. This is the second time." Fraud score fired on an in-pattern purchase.', 'negative', ARRAY['fraud','false-positive','trust'], now()-INTERVAL '6 days'),
    (_user_id, ws_id, hp, h_th_trust, 'analytics', 'Fraud false-positive rate at 4.1%', 'The fraud model blocks 4.1% of legitimate transactions (target < 1%). Precision fell after the last threshold change tuned for recall.', 'negative', ARRAY['fraud','precision','model'], now()-INTERVAL '11 days'),
    (_user_id, ws_id, hp, h_th_trust, 'churn-call', 'Lost user · "It kept declining my card"', '"I could not trust it to just work when I needed it. Switched back to my old bank." Churned after 2 false declines in a month.', 'negative', ARRAY['fraud','churn','trust'], now()-INTERVAL '14 days'),
    (_user_id, ws_id, hp, h_th_premium, 'analytics', 'Prism Plus trial-to-paid at 9%', 'Trial-to-paid conversion for Plus is 9% (benchmark 15-20%). The paywall appears on day 1 before users have felt the budgeting value.', 'negative', ARRAY['premium','conversion','paywall'], now()-INTERVAL '22 days'),
    (_user_id, ws_id, hp, h_th_premium, 'interview', 'Users cannot name a Plus benefit', '4 of 6 interviewed paying users could not say what Plus unlocked beyond "no ads". The savings-automation feature had near-zero awareness.', 'mixed', ARRAY['premium','awareness','interview'], now()-INTERVAL '16 days'),
    (_user_id, ws_id, hp, h_th_premium, 'sales-call', 'Design partner wants family accounts in Plus', 'A power user (household of 4) would pay double for shared goals and allowances. Suggests a family tier above Plus.', 'positive', ARRAY['premium','family','expansion'], now()-INTERVAL '13 days'),
    (_user_id, ws_id, hp, h_th_growth, 'interview', 'Users already recommend Prism manually', '"I have told at least five friends to get it." 3 of 5 interviewees had referred someone with no incentive. Clear untapped loop.', 'positive', ARRAY['growth','referral','word-of-mouth'], now()-INTERVAL '25 days'),
    (_user_id, ws_id, hp, h_th_growth, 'market', 'Competitor launched a $10 referral bonus', 'A neobank competitor now pays $10 per referral both ways. Our organic referral has no reward and no share affordance.', 'neutral', ARRAY['growth','competitor','referral'], now()-INTERVAL '30 days'),
    (_user_id, ws_id, hp, h_th_reliability, 'app-store', 'Review · "Balance is always behind"', '"I buy a coffee and the app shows it two minutes later, so I never quite trust the number." 4 stars, would be 5 if real-time.', 'mixed', ARRAY['reliability','sync','latency'], now()-INTERVAL '8 days'),
    (_user_id, ws_id, hp, h_th_reliability, 'analytics', 'p95 transaction-appear latency 88s', 'p95 time from swipe to in-app appearance is 88s. The webhook from the card processor batches every 60s; polling would cut it to under 10s.', 'negative', ARRAY['reliability','latency','webhook'], now()-INTERVAL '10 days'),
    (_user_id, ws_id, hp, NULL, 'feature-request', 'Round-up savings like the old-school jars', 'Repeated request: round every purchase up to the nearest dollar and sweep the difference into a savings goal. High emotional pull in interviews.', 'positive', ARRAY['savings','round-up','feature'], now()-INTERVAL '27 days'),
    (_user_id, ws_id, hp, NULL, 'market', 'Regulator guidance on overdraft transparency', 'New guidance requires clearer overdraft disclosure. Opportunity to lead on trust: show the exact fee before an action, not after.', 'neutral', ARRAY['compliance','trust','overdraft'], now()-INTERVAL '35 days');

  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, h_th_activation, 'Streamlined bank-link with a manual fallback', 'EU/regional-bank users hit a dead OAuth screen and abandon at 38%. The single-provider link has no fallback.', 'New users connecting a non-top-5 bank', 'Adding a second aggregator plus a manual account-number fallback lifts bank-link completion from 62% to 85% and D1 activation with it.', 9, 8, 6, 'committed', now()-INTERVAL '60 days') RETURNING id INTO h_op_banklink;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, h_th_trust, 'Precision-tuned fraud scoring', 'The fraud model blocks 4.1% of legitimate transactions. Each false decline is a trust event and a churn risk.', 'All Prism cardholders', 'Retuning the model for precision with a per-user spend baseline drops false positives below 1% without raising true-fraud leakage.', 10, 8, 5, 'committed', now()-INTERVAL '50 days') RETURNING id INTO h_op_fraud;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, h_th_premium, 'Value-first Plus paywall', 'Plus converts at 9% because the paywall lands on day 1, before users feel the budgeting value.', 'Trial users in their first 14 days', 'Delaying the paywall until after the first "you saved $X this week" moment lifts trial-to-paid from 9% to 16%.', 8, 7, 7, 'discovery', now()-INTERVAL '30 days') RETURNING id INTO h_op_plus;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, NULL, 'Round-up savings goals', 'Users emotionally want the "spare change jar". No automated way to fund a goal from everyday spend.', 'Users with at least one savings goal', 'Round-up sweeps raise funded-goal rate (our north star) by pulling savings from spend the user does not miss.', 9, 7, 6, 'committed', now()-INTERVAL '45 days') RETURNING id INTO h_op_goals;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, h_th_growth, 'In-app referral loop', 'Users refer manually with no reward or share affordance while a competitor pays $10 both ways.', 'Activated users past day 14', 'A two-sided referral reward with a one-tap share raises referral-driven signups to 15% of new users.', 7, 6, 7, 'backlog', now()-INTERVAL '28 days') RETURNING id INTO h_op_referral;
  INSERT INTO opportunities (user_id, workspace_id, project_id, theme_id, title, problem, target_user, hypothesis, impact, confidence, ease, status, created_at) VALUES
    (_user_id, ws_id, hp, NULL, 'In-app crypto wallet (parity bet)', 'Two neobank competitors added crypto buy/sell. Feared table-stakes gap.', 'Younger users who also hold crypto', 'Adding a crypto wallet closes the perceived gap and retains crypto-curious users.', 4, 3, 3, 'killed', now()-INTERVAL '52 days') RETURNING id INTO h_op_crypto;

  RETURN ws_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.seed_sample_workspace(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_sample_workspace(uuid) TO service_role;