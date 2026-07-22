DO $$
DECLARE
  v_pairs text[][] := ARRAY[
    ARRAY['explore@supaprod.ai', 'Supaprod!Explore2026'],
    ARRAY['ember@supaprod.ai',   'Supaprod!Ember2026']
  ];
  v_helio uuid := '10000000-0000-4000-8000-000000000000';
  v_email text;
  v_password text;
  v_user_id uuid;
  i int;
BEGIN
  FOR i IN 1..array_length(v_pairs, 1) LOOP
    v_email := v_pairs[i][1];
    v_password := v_pairs[i][2];

    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      v_user_id := gen_random_uuid();
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_user_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(),
        now(),
        '', '', '', ''
      );

      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
        'email',
        v_user_id::text,
        now(), now(), now()
      );
    ELSE
      UPDATE auth.users
         SET encrypted_password = crypt(v_password, gen_salt('bf')),
             email_confirmed_at = COALESCE(email_confirmed_at, now()),
             updated_at = now()
       WHERE id = v_user_id;
    END IF;

    INSERT INTO public.profiles (id, display_name, onboarded)
    VALUES (v_user_id, 'Supaprod Demo', true)
    ON CONFLICT (id) DO UPDATE SET onboarded = true, updated_at = now();

    BEGIN
      PERFORM public.seed_sample_workspace(v_user_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'sample-workspace seed failed for %: %', v_email, SQLERRM;
    END;

    IF EXISTS (SELECT 1 FROM public.workspaces WHERE id = v_helio) THEN
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (v_helio, v_user_id, 'admin')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;