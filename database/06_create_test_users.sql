DO $$
DECLARE
  new_chairman_id uuid := gen_random_uuid();
  new_member_id uuid := gen_random_uuid();
  v_union_id uuid;
  v_ward_id uuid;
BEGIN
  -- ১. আগে যদি test_chairman@test.com বা test_member@test.com থেকে থাকে, মুছে ফেলুন
  DELETE FROM public.profiles WHERE email IN ('test_chairman@test.com', 'test_member@test.com');
  DELETE FROM auth.identities WHERE provider_id IN (
    SELECT id::text FROM auth.users WHERE email IN ('test_chairman@test.com', 'test_member@test.com')
  );
  DELETE FROM auth.users WHERE email IN ('test_chairman@test.com', 'test_member@test.com');

  -- ২. ইউনিয়ন এবং ওয়ার্ড খুঁজে বের করা
  SELECT id INTO v_union_id FROM public.locations WHERE type = 'union' LIMIT 1;
  SELECT id INTO v_ward_id FROM public.locations WHERE type = 'ward' AND parent_id = v_union_id LIMIT 1;

  IF v_union_id IS NULL OR v_ward_id IS NULL THEN
    RAISE EXCEPTION 'কমপক্ষে একটি ইউনিয়ন এবং একটি ওয়ার্ড ডাটাবেসে থাকতে হবে!';
  END IF;

  -- ৩. চেয়ারম্যান তৈরি (Email: test_chairman@test.com / Password: password123)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (new_chairman_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_chairman@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');
  
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at) 
  VALUES (new_chairman_id, new_chairman_id::text, new_chairman_id, format('{"sub":"%s","email":"%s"}', new_chairman_id::text, 'test_chairman@test.com')::jsonb, 'email', now(), now());

  INSERT INTO public.profiles (id, first_name, last_name, role, access_scope_id)
  VALUES (new_chairman_id, 'Test', 'Chairman', 'chairman', v_union_id);

  -- ৪. ওয়ার্ড মেম্বার তৈরি (Email: test_member@test.com / Password: password123)
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
  VALUES (new_member_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_member@test.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at) 
  VALUES (new_member_id, new_member_id::text, new_member_id, format('{"sub":"%s","email":"%s"}', new_member_id::text, 'test_member@test.com')::jsonb, 'email', now(), now());

  INSERT INTO public.profiles (id, first_name, last_name, role, access_scope_id)
  VALUES (new_member_id, 'Test', 'Member', 'ward_member', v_ward_id);

END;
$$;
