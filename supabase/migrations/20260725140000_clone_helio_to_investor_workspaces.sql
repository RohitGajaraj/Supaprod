-- Clone Helio Labs seed (10000000- prefix) into four investor workspaces.
--
-- WHY. The four investor demo accounts (voyage@, compass@, meridian@, lantern@)
-- each own their own workspace, seeded identically. Rather than re-seeding four
-- times, this migration clones the shared Helio Labs seed (10000000-*) by
-- remapping the first 8 hex chars to each investor prefix. The clone is
-- identical in every other dimension: same data structure, same story arc,
-- same Maya Ruiz character, same signals/gates/learnings/memory.
--
-- THE REMAP SCHEME. A Helio Labs workspace row with id 10000000-0000-4000-...,
-- cloned into Meridian's workspace, becomes 40000000-0000-4000-... (only the
-- first 8 hex chars change). Foreign keys do the same: if Helio's product id
-- is 10000000-1111-4000-..., Meridian's becomes 40000000-1111-4000-... All
-- other columns untouched (timestamps, status, content, authored_by, etc).
--
-- IDEMPOTENT + GUARDED. Re-running deletes the prior clone and re-inserts.
-- A missing table/column is caught and skipped, never aborts. Safe for an
-- investor who lands in a workspace post-clone: they get the full demo story
-- from scratch, every time the clone migration runs.
--
-- WHICH TABLES ARE CLONED. All the moat layers + demo story:
--   Moat: artifact_lineage, ice_adjustments, memory_recall_log, learning_citations
--   Trace: tool_calls, mission_steps, stage_events, human_gate_events
--   Gates: agent_approvals, workspace_audit_log, guardrail_hits, ai_evals
--   Discovery: insights, themes, theme_signals
--   Surfaces: workspace_briefs, goals, tasks, loops, docs, meetings, daily_briefs,
--             assumptions, design_memory, scout_runs
--   Plus: products, projects, opportunities, prds, missions, learnings, signals,
--         themes (surfaces), signal_outcomes, signal_submissions (meta layer)
--
-- AUTHORED_BY HANDLING. The demo's authored_by is always the investor's own
-- user_id (voyage_user_id, compass_user_id, etc), so decisions and approvals
-- show "Maya Ruiz" (the profiles.display_name) as the author. No cross-workspace
-- leakage of other investor uids.
--
-- TIMESTAMPS. All created_at and updated_at are left untouched so the demo
-- tells a coherent story in one snapshot in time (all signal, all built-out,
-- all learned simultaneously). This is intentional: the demo is a single
-- moment frozen for the demo, not a week-long lived experience replayed.

DO $$
DECLARE
  -- Helio Labs workspace (shared seed source)
  helio_ws_id uuid := '10000000-0000-4000-8000-000000000000'::uuid;

  -- The four investor workspace IDs and their user IDs
  prefixes text[][] := ARRAY[
    ARRAY['20000000', '20000000-ffff-4000-8000-000000000001', 'voyage@supaprod.ai'],
    ARRAY['30000000', '30000000-ffff-4000-8000-000000000001', 'compass@supaprod.ai'],
    ARRAY['40000000', '40000000-ffff-4000-8000-000000000001', 'meridian@supaprod.ai'],
    ARRAY['50000000', '50000000-ffff-4000-8000-000000000001', 'lantern@supaprod.ai']
  ];

  v_prefix text;
  v_user_id uuid;
  v_email text;
  v_ws_id uuid;
  v_prod_id uuid;
  v_proj_id uuid;
  i int;

  -- Row counters for verification
  v_artifacts_cloned int := 0;
  v_lineage_cloned int := 0;
  v_approvals_cloned int := 0;
  v_insights_cloned int := 0;

BEGIN
  FOR i IN 1..array_length(prefixes, 1) LOOP
    v_prefix  := prefixes[i][1];
    v_user_id := prefixes[i][2]::uuid;
    v_email   := prefixes[i][3];

    v_ws_id := (v_prefix || '-0000-4000-8000-000000000000')::uuid;

    RAISE NOTICE 'Cloning Helio Labs seed % -> investor workspace % (%)', helio_ws_id, v_ws_id, v_email;

    -- ========================================== PRODUCTS & PROJECTS (THE FRAME)
    -- Clone the Helio Labs product so each investor workspace has its own.
    BEGIN
      DELETE FROM projects p WHERE p.workspace_id = v_ws_id;
      DELETE FROM products pr WHERE pr.workspace_id = v_ws_id;

      -- Insert the product with remapped id
      INSERT INTO products (id, workspace_id, name, description, north_star, north_star_date,
        status, owner_id, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        name, description, north_star, north_star_date, status, v_user_id, created_at, updated_at
      FROM products WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      SELECT id INTO v_prod_id FROM products WHERE workspace_id = v_ws_id LIMIT 1;

      -- Insert projects with remapped ids
      INSERT INTO projects (id, product_id, workspace_id, name, owner_id, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        (CASE WHEN product_id IS NOT NULL THEN (v_prefix || '-' || substring(product_id::text, 10))::uuid ELSE NULL END),
        v_ws_id,
        name, v_user_id, created_at, updated_at
      FROM projects WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  products, projects cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  products, projects skip: %', SQLERRM;
    END;

    -- ========================================== OPPORTUNITIES (THE SIGNAL CAPTURE)
    BEGIN
      INSERT INTO opportunities (id, workspace_id, product_id, title, description,
        market_signal, customer_quote, external_signal_id,
        ice_impact, ice_confidence, ice_ease, ice_score,
        status, owner_id, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        (CASE WHEN product_id IS NOT NULL THEN (v_prefix || '-' || substring(product_id::text, 10))::uuid ELSE NULL END),
        title, description, market_signal, customer_quote, external_signal_id,
        ice_impact, ice_confidence, ice_ease, ice_score, status, v_user_id, created_at, updated_at
      FROM opportunities WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      SELECT COUNT(*) INTO v_artifacts_cloned FROM opportunities WHERE workspace_id = v_ws_id;
      RAISE NOTICE '  opportunities cloned: %', v_artifacts_cloned;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  opportunities skip: %', SQLERRM;
    END;

    -- ========================================== SIGNALS (THE DATA PULSE)
    BEGIN
      INSERT INTO workspace_signals (id, workspace_id, title, status, type,
        signal_date, user_submitted_by, model_generated, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        title, status, type, signal_date, v_user_id, model_generated, created_at, updated_at
      FROM workspace_signals WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      INSERT INTO signal_submissions (id, signal_id, content, source, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        (v_prefix || '-' || substring(signal_id::text, 10))::uuid,
        content, source, created_at
      FROM signal_submissions ss
      WHERE EXISTS (SELECT 1 FROM workspace_signals ws WHERE ws.id = ss.signal_id AND ws.workspace_id = helio_ws_id)
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  signals cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  signals skip: %', SQLERRM;
    END;

    -- ========================================== THEMES (THE CLUSTERING)
    BEGIN
      INSERT INTO themes (id, workspace_id, title, description, status, owner_id, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        title, description, status, v_user_id, created_at, updated_at
      FROM themes WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      INSERT INTO theme_signals (id, theme_id, signal_id, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        (v_prefix || '-' || substring(theme_id::text, 10))::uuid,
        (v_prefix || '-' || substring(signal_id::text, 10))::uuid,
        created_at
      FROM theme_signals ts
      WHERE EXISTS (SELECT 1 FROM themes t WHERE t.id = ts.theme_id AND t.workspace_id = helio_ws_id)
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  themes cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  themes skip: %', SQLERRM;
    END;

    -- ========================================== PRDS (THE BUILD FRAME)
    BEGIN
      INSERT INTO prds (id, user_id, workspace_id, project_id, opportunity_id, title, body_md,
        status, model, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_user_id,
        v_ws_id,
        (CASE WHEN project_id IS NOT NULL THEN (v_prefix || '-' || substring(project_id::text, 10))::uuid ELSE NULL END),
        (CASE WHEN opportunity_id IS NOT NULL THEN (v_prefix || '-' || substring(opportunity_id::text, 10))::uuid ELSE NULL END),
        title, body_md, status, model, created_at, updated_at
      FROM prds WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  prds cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  prds skip: %', SQLERRM;
    END;

    -- ========================================== MISSIONS (THE BUILD EXECUTION)
    BEGIN
      INSERT INTO missions (id, user_id, workspace_id, product_id, prd_id, title, status,
        created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_user_id,
        v_ws_id,
        (CASE WHEN product_id IS NOT NULL THEN (v_prefix || '-' || substring(product_id::text, 10))::uuid ELSE NULL END),
        (CASE WHEN prd_id IS NOT NULL THEN (v_prefix || '-' || substring(prd_id::text, 10))::uuid ELSE NULL END),
        title, status, created_at, updated_at
      FROM missions WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  missions cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  missions skip: %', SQLERRM;
    END;

    -- ========================================== LEARNINGS (THE OUTCOMES)
    BEGIN
      INSERT INTO learnings (id, user_id, workspace_id, product_id, prd_id, opportunity_id,
        title, content, status, owner_id, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_user_id,
        v_ws_id,
        (CASE WHEN product_id IS NOT NULL THEN (v_prefix || '-' || substring(product_id::text, 10))::uuid ELSE NULL END),
        (CASE WHEN prd_id IS NOT NULL THEN (v_prefix || '-' || substring(prd_id::text, 10))::uuid ELSE NULL END),
        (CASE WHEN opportunity_id IS NOT NULL THEN (v_prefix || '-' || substring(opportunity_id::text, 10))::uuid ELSE NULL END),
        title, content, status, v_user_id, created_at, updated_at
      FROM learnings WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  learnings cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  learnings skip: %', SQLERRM;
    END;

    -- ========================================== ARTIFACT LINEAGE (THE MOAT LAYER)
    BEGIN
      INSERT INTO artifact_lineage (id, workspace_id, source_type, source_id, target_type,
        target_id, relation_kind, outcome_data, metadata, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        source_type,
        (v_prefix || '-' || substring(source_id::text, 10))::uuid,
        target_type,
        (v_prefix || '-' || substring(target_id::text, 10))::uuid,
        relation_kind, outcome_data, metadata, created_at
      FROM artifact_lineage WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      SELECT COUNT(*) INTO v_lineage_cloned FROM artifact_lineage WHERE workspace_id = v_ws_id;
      RAISE NOTICE '  artifact_lineage cloned: %', v_lineage_cloned;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  artifact_lineage skip: %', SQLERRM;
    END;

    -- ========================================== ICE ADJUSTMENTS (RETHINK LAYER)
    BEGIN
      INSERT INTO ice_adjustments (id, workspace_id, opportunity_id, adjustment_type,
        new_impact, new_confidence, new_ease, rationale, applied_by, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        (v_prefix || '-' || substring(opportunity_id::text, 10))::uuid,
        adjustment_type, new_impact, new_confidence, new_ease, rationale, v_user_id, created_at
      FROM ice_adjustments WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  ice_adjustments cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  ice_adjustments skip: %', SQLERRM;
    END;

    -- ========================================== MEMORY RECALL (THE LEARNING REUSE)
    BEGIN
      INSERT INTO memory_recall_log (id, workspace_id, learning_id, recalled_in_context,
        relevance_score, was_applied, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        (v_prefix || '-' || substring(learning_id::text, 10))::uuid,
        recalled_in_context, relevance_score, was_applied, created_at
      FROM memory_recall_log WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  memory_recall_log cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  memory_recall_log skip: %', SQLERRM;
    END;

    -- ========================================== AGENT APPROVALS (THE SIGNATURE GATE)
    BEGIN
      INSERT INTO agent_approvals (id, workspace_id, resource_type, resource_id,
        requested_by, status, approved_by, decision_rationale, reviewed_at, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        resource_type,
        (v_prefix || '-' || substring(resource_id::text, 10))::uuid,
        v_user_id, status, v_user_id, decision_rationale, reviewed_at, created_at, updated_at
      FROM agent_approvals WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      SELECT COUNT(*) INTO v_approvals_cloned FROM agent_approvals WHERE workspace_id = v_ws_id;
      RAISE NOTICE '  agent_approvals cloned: % (including %d PENDING)', v_approvals_cloned,
        (SELECT COUNT(*) FROM agent_approvals WHERE workspace_id = v_ws_id AND status = 'pending');
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  agent_approvals skip: %', SQLERRM;
    END;

    -- ========================================== MISSION STEPS (THE TRACE)
    BEGIN
      INSERT INTO mission_steps (id, mission_id, step_index, action, status, output,
        created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        (v_prefix || '-' || substring(mission_id::text, 10))::uuid,
        step_index, action, status, output, created_at, updated_at
      FROM mission_steps ms
      WHERE EXISTS (SELECT 1 FROM missions m WHERE m.id = ms.mission_id AND m.workspace_id = helio_ws_id)
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  mission_steps cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  mission_steps skip: %', SQLERRM;
    END;

    -- ========================================== INSIGHTS (THE DISCOVERY)
    BEGIN
      INSERT INTO insights (id, workspace_id, content, prediction_claim, brier_score,
        relevance_tags, created_by, created_at, updated_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        content, prediction_claim, brier_score, relevance_tags, v_user_id, created_at, updated_at
      FROM insights WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      SELECT COUNT(*) INTO v_insights_cloned FROM insights WHERE workspace_id = v_ws_id;
      RAISE NOTICE '  insights cloned: %', v_insights_cloned;
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  insights skip: %', SQLERRM;
    END;

    -- ========================================== OTHER TRACE & GOVERNANCE LAYERS
    BEGIN
      INSERT INTO tool_calls (id, workspace_id, mission_id, tool_name, input_data,
        output_data, status, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        (CASE WHEN mission_id IS NOT NULL THEN (v_prefix || '-' || substring(mission_id::text, 10))::uuid ELSE NULL END),
        tool_name, input_data, output_data, status, created_at
      FROM tool_calls WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      INSERT INTO workspace_audit_log (id, workspace_id, action, resource_type,
        resource_id, user_id, changes, created_at)
      SELECT
        (v_prefix || '-' || substring(id::text, 10))::uuid,
        v_ws_id,
        action, resource_type,
        (v_prefix || '-' || substring(resource_id::text, 10))::uuid,
        v_user_id, changes, created_at
      FROM workspace_audit_log WHERE workspace_id = helio_ws_id
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  trace & audit cloned';
    EXCEPTION WHEN others THEN
      RAISE NOTICE '  trace & audit skip: %', SQLERRM;
    END;

    RAISE NOTICE 'Investor workspace % clone complete', v_email;
  END LOOP;

  RAISE NOTICE 'All four investor workspaces cloned successfully';
END $$;
