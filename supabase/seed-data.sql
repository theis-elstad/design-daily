-- Design Daily Test Data
-- Run this in your Supabase SQL Editor to populate test data for the leaderboard
--
-- This script creates test users in auth.users (which triggers profile creation)
-- then adds submissions and ratings for them.

-- ============================================
-- CREATE TEST USERS IN AUTH.USERS
-- ============================================
DO $$
DECLARE
    designer1_id UUID := gen_random_uuid();
    designer2_id UUID := gen_random_uuid();
    designer3_id UUID := gen_random_uuid();
    designer4_id UUID := gen_random_uuid();
    designer5_id UUID := gen_random_uuid();
    sub1_id UUID;
    sub2_id UUID;
    sub3_id UUID;
    sub4_id UUID;
    sub5_id UUID;
    sub6_id UUID;
    sub7_id UUID;
    sub8_id UUID;
    sub9_id UUID;
    sub10_id UUID;
    sub11_id UUID;
    sub12_id UUID;
    sub13_id UUID;
    sub14_id UUID;
    sub15_id UUID;
    sub16_id UUID;
    admin_id UUID;
BEGIN
    -- Get an admin user ID for ratings
    SELECT id INTO admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;

    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'No admin user found. Please create an admin user first by signing up and updating your role to admin.';
    END IF;

    -- Insert test users into auth.users
    -- These are fake users that cannot log in (no valid password hash)
    -- The trigger will auto-create their profiles

    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES
        (
            designer1_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alice.tester@test.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'Alice Tester'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ),
        (
            designer2_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'bob.tester@test.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'Bob Tester'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ),
        (
            designer3_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'carol.tester@test.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'Carol Tester'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ),
        (
            designer4_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'david.tester@test.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'David Tester'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ),
        (
            designer5_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'emma.tester@test.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', 'Emma Tester'),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

    RAISE NOTICE 'Created 5 test users in auth.users';

    -- Wait a moment for triggers to create profiles
    -- (profiles are created by the on_auth_user_created trigger)

    -- ============================================
    -- SUBMISSIONS (spread over the last 30 days)
    -- ============================================

    -- Alice's submissions (very active - 5 submissions, high performer)
    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer1_id, CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    RETURNING id INTO sub1_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer1_id, CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '3 days')
    RETURNING id INTO sub2_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer1_id, CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '5 days')
    RETURNING id INTO sub3_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer1_id, CURRENT_DATE - INTERVAL '10 days', NOW() - INTERVAL '10 days')
    RETURNING id INTO sub4_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer1_id, CURRENT_DATE - INTERVAL '15 days', NOW() - INTERVAL '15 days')
    RETURNING id INTO sub5_id;

    -- Bob's submissions (4 submissions, good performer)
    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer2_id, CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '2 days')
    RETURNING id INTO sub6_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer2_id, CURRENT_DATE - INTERVAL '4 days', NOW() - INTERVAL '4 days')
    RETURNING id INTO sub7_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer2_id, CURRENT_DATE - INTERVAL '8 days', NOW() - INTERVAL '8 days')
    RETURNING id INTO sub8_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer2_id, CURRENT_DATE - INTERVAL '20 days', NOW() - INTERVAL '20 days')
    RETURNING id INTO sub9_id;

    -- Carol's submissions (3 submissions, excellent quality)
    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer3_id, CURRENT_DATE - INTERVAL '1 day', NOW() - INTERVAL '1 day')
    RETURNING id INTO sub10_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer3_id, CURRENT_DATE - INTERVAL '6 days', NOW() - INTERVAL '6 days')
    RETURNING id INTO sub11_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer3_id, CURRENT_DATE - INTERVAL '12 days', NOW() - INTERVAL '12 days')
    RETURNING id INTO sub12_id;

    -- David's submissions (2 submissions, average performer)
    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer4_id, CURRENT_DATE - INTERVAL '7 days', NOW() - INTERVAL '7 days')
    RETURNING id INTO sub13_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer4_id, CURRENT_DATE - INTERVAL '14 days', NOW() - INTERVAL '14 days')
    RETURNING id INTO sub14_id;

    -- Emma's submissions (2 submissions, improving)
    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer5_id, CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '3 days')
    RETURNING id INTO sub15_id;

    INSERT INTO public.submissions (id, user_id, submission_date, created_at)
    VALUES (gen_random_uuid(), designer5_id, CURRENT_DATE - INTERVAL '9 days', NOW() - INTERVAL '9 days')
    RETURNING id INTO sub16_id;

    RAISE NOTICE 'Created 16 submissions';

    -- ============================================
    -- RATINGS (varying scores for each submission)
    -- ============================================

    -- Alice's ratings (high performer - avg ~8.2)
    INSERT INTO public.ratings (submission_id, rated_by, productivity, quality, convertability) VALUES
        (sub1_id, admin_id, 3, 3, 3),  -- 9 total
        (sub2_id, admin_id, 3, 3, 2),  -- 8 total
        (sub3_id, admin_id, 3, 2, 3),  -- 8 total
        (sub4_id, admin_id, 2, 3, 3),  -- 8 total
        (sub5_id, admin_id, 3, 3, 2);  -- 8 total

    -- Bob's ratings (good performer - avg ~7.0)
    INSERT INTO public.ratings (submission_id, rated_by, productivity, quality, convertability) VALUES
        (sub6_id, admin_id, 3, 2, 2),  -- 7 total
        (sub7_id, admin_id, 2, 3, 2),  -- 7 total
        (sub8_id, admin_id, 2, 2, 3),  -- 7 total
        (sub9_id, admin_id, 3, 2, 2);  -- 7 total

    -- Carol's ratings (excellent quality - avg ~7.67)
    INSERT INTO public.ratings (submission_id, rated_by, productivity, quality, convertability) VALUES
        (sub10_id, admin_id, 2, 3, 3), -- 8 total
        (sub11_id, admin_id, 2, 3, 3), -- 8 total
        (sub12_id, admin_id, 2, 3, 2); -- 7 total

    -- David's ratings (average performer - avg ~6.0)
    INSERT INTO public.ratings (submission_id, rated_by, productivity, quality, convertability) VALUES
        (sub13_id, admin_id, 2, 2, 2), -- 6 total
        (sub14_id, admin_id, 2, 2, 2); -- 6 total

    -- Emma's ratings (improving - avg ~6.5)
    INSERT INTO public.ratings (submission_id, rated_by, productivity, quality, convertability) VALUES
        (sub15_id, admin_id, 3, 2, 2), -- 7 total (recent, better)
        (sub16_id, admin_id, 2, 2, 2); -- 6 total (older)

    RAISE NOTICE 'Created ratings for all submissions';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Test data created successfully!';
    RAISE NOTICE 'Expected leaderboard ranking:';
    RAISE NOTICE '1. Alice Tester - avg 8.2 (5 submissions)';
    RAISE NOTICE '2. Carol Tester - avg 7.67 (3 submissions)';
    RAISE NOTICE '3. Bob Tester - avg 7.0 (4 submissions)';
    RAISE NOTICE '4. Emma Tester - avg 6.5 (2 submissions)';
    RAISE NOTICE '5. David Tester - avg 6.0 (2 submissions)';
END $$;

-- Verify the data
SELECT 'Users created:' as info, COUNT(*) as count FROM public.profiles WHERE email LIKE '%tester@test.com';
SELECT 'Submissions created:' as info, COUNT(*) as count FROM public.submissions;
SELECT 'Ratings created:' as info, COUNT(*) as count FROM public.ratings;

-- Show leaderboard
SELECT '--- LEADERBOARD (Last 30 days) ---' as info;
SELECT * FROM public.get_leaderboard('month');
