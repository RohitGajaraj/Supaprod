-- Four investor demo accounts, one isolated workspace each (founder ruling 2026-07-25).
--
-- WHY ISOLATION. explore@ and ember@ are both admins of the ONE shared Helio Labs
-- workspace (20260722211500). That is fine for two internal accounts and wrong for
-- investors: the demo's signature beat is approving a pending gate, and an approval
-- is a write. The first VC to click Approve would empty the queue for everyone else,
-- so VC number four opens a dead room. Each account therefore owns its own workspace,
-- seeded identically, at its own uuid prefix.
--
-- THE PREFIX SCHEME. Every Helio seed row lives under the uuid prefix 10000000-.
-- Each workspace claims its own first group, so a row can be cloned by swapping
-- the first eight hex characters and nothing else:
--     voyage   -> 20000000-        compass  -> 30000000-
--     meridian -> 40000000-        lantern  -> 50000000-
--     harbor   -> 60000000-        (the founder's rehearsal copy, not for a firm)
-- The workspace id itself follows the same rule (Helio is 10000000-0000-4000-8000-
-- 000000000000), so the clone in 20260725140000 remaps it for free.
-- Identity rows sit in the reserved ffff second group, which no seed row uses.
--
-- NAMING. Single evocative words matching the existing explore@ / ember@ convention.
-- Deliberately NOT demo1/demo2: these are shared with named investors, and the
-- account name is how the founder tracks which firm is looking. The mapping of
-- account to firm lives in docs/operations/demo-credentials.md, not here.
--
-- PROVISIONING. Inserting into auth.users fires handle_new_user, which creates the
-- profile, a default "My Workspace", the agent roster and the tool grants. We drop
-- that default workspace: an investor who lands in an empty room has seen nothing,
-- and one workspace per account makes product resolution unambiguous at /m.
-- Inserting a workspace with a NULL account_id fires set_workspace_account, which
-- calls ensure_user_default_account and provisions accounts + account_credits.
--
-- Idempotent: re-running resets passwords, re-marks profiles onboarded, and every
-- insert is guarded. Safe to run repeatedly.
DO $$
DECLARE
  -- email, password, display name, uuid prefix, workspace name
  --
  -- Four investor logins plus harbor@, the founder's own rehearsal copy. harbor@
  -- exists so practising the walkthrough, and any agent testing, burns approvals
  -- in a workspace nobody is being shown. Deciding a gate is a write: rehearsing
  -- on a login that later goes to a firm hands them an already-empty queue.
  v_rows text[][] := ARRAY[
    ARRAY['voyage@supaprod.ai',   'Supaprod!Voyage2026',   'Maya Ruiz', '20000000', 'Helio Labs'],
    ARRAY['compass@supaprod.ai',  'Supaprod!Compass2026',  'Maya Ruiz', '30000000', 'Helio Labs'],
    ARRAY['meridian@supaprod.ai', 'Supaprod!Meridian2026', 'Maya Ruiz', '40000000', 'Helio Labs'],
    ARRAY['lantern@supaprod.ai',  'Supaprod!Lantern2026',  'Maya Ruiz', '50000000', 'Helio Labs'],
    ARRAY['harbor@supaprod.ai',   'Supaprod!Harbor2026',   'Maya Ruiz', '60000000', 'Helio Labs']
  ];
  v_email text;
  v_password text;
  v_display text;
  v_prefix text;
  v_ws_name text;
  v_user_id uuid;
  v_ws_id uuid;
  v_account_id uuid;
  i int;
BEGIN
  FOR i IN 1..array_length(v_rows, 1) LOOP
    v_email    := v_rows[i][1];
    v_password := v_rows[i][2];
    v_display  := v_rows[i][3];
    v_prefix   := v_rows[i][4];
    v_ws_name  := v_rows[i][5];

    v_user_id := (v_prefix || '-ffff-4000-8000-000000000001')::uuid;
    v_ws_id   := (v_prefix || '-0000-4000-8000-000000000000')::uuid;

    -- ---------------------------------------------------------------- identity
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
      -- Reuse the address if it was ever created with a different id, so a
      -- partial earlier run cannot wedge this migration on the unique email.
      DELETE FROM auth.users WHERE email = v_email AND id <> v_user_id;

      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id, 'authenticated', 'authenticated', v_email,
        crypt(v_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_display),
        now(), now(), '', '', '', ''
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
        'email', v_user_id::text, now(), now(), now()
      );
    ELSE
      UPDATE auth.users
         SET encrypted_password = crypt(v_password, gen_salt('bf')),
             email_confirmed_at = COALESCE(email_confirmed_at, now()),
             updated_at = now()
       WHERE id = v_user_id;
    END IF;

    -- The room shows this name against decisions and the approval queue. It must
    -- read as the person in the demo story, never as "Supaprod Demo": the moment
    -- the voiceover says Maya and the screen disagrees, the story breaks.
    INSERT INTO public.profiles (id, display_name, full_name, onboarded)
    VALUES (v_user_id, v_display, v_display, true)
    ON CONFLICT (id) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          full_name    = EXCLUDED.full_name,
          onboarded    = true,
          updated_at   = now();

    -- --------------------------------------------------- drop the auto workspace
    -- handle_new_user created an empty "My Workspace". Remove it before inserting
    -- the real one, both so the investor cannot land somewhere empty and so the
    -- free-tier workspace limit does not reject the insert below.
    DELETE FROM public.workspace_members wm
     USING public.workspaces w
     WHERE wm.workspace_id = w.id
       AND w.owner_id = v_user_id
       AND w.id <> v_ws_id;

    DELETE FROM public.workspaces w
     WHERE w.owner_id = v_user_id
       AND w.id <> v_ws_id;

    -- ------------------------------------------------------------- the workspace
    -- account_id left NULL on purpose: set_workspace_account fills it via
    -- ensure_user_default_account, which also creates accounts + account_credits.
    INSERT INTO public.workspaces (id, owner_id, name)
    VALUES (v_ws_id, v_user_id, v_ws_name)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_ws_id, v_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- ----------------------------------------------------------------- credits
    -- A cost-guard toast during an investor's first Ask is an unforced error, so
    -- fund each workspace well past anything a browse can spend. Mirrors the
    -- standing 1,000-credit grant precedent in docs/operations/demo-credentials.md.
    SELECT account_id INTO v_account_id FROM public.workspaces WHERE id = v_ws_id;
    IF v_account_id IS NOT NULL THEN
      INSERT INTO public.account_credits (account_id, balance_credits, monthly_grant_credits)
      VALUES (v_account_id, 5000, 5000)
      ON CONFLICT (account_id) DO UPDATE
        SET balance_credits = GREATEST(public.account_credits.balance_credits, 5000),
            monthly_grant_credits = GREATEST(public.account_credits.monthly_grant_credits, 5000),
            updated_at = now();
    END IF;

    RAISE NOTICE 'investor demo account ready: % -> workspace % (account %)', v_email, v_ws_id, v_account_id;
  END LOOP;
END $$;

-- The founder's own recording account carries the same person's name, so the
-- story reads identically whether he films on explore@ or hands over a VC login.
UPDATE public.profiles p
   SET display_name = 'Maya Ruiz', full_name = 'Maya Ruiz', updated_at = now()
  FROM auth.users u
 WHERE u.id = p.id
   AND u.email IN ('explore@supaprod.ai', 'ember@supaprod.ai');
