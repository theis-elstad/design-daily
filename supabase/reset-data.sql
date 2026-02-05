-- Design Daily Database Reset
-- Run this in your Supabase SQL Editor to remove all test data and submissions
-- WARNING: This will delete ALL submissions, assets, and ratings, plus test users

-- ============================================
-- RESET ALL DATA
-- ============================================

-- Delete all ratings first (due to foreign key constraints)
DELETE FROM public.ratings;

-- Delete all assets
DELETE FROM public.assets;

-- Delete all submissions
DELETE FROM public.submissions;

-- Delete test users from auth.users (this will cascade to profiles via the foreign key)
-- Only delete users with @test.com emails
DELETE FROM auth.users
WHERE email LIKE '%@test.com';

-- Verify cleanup
SELECT 'Remaining profiles:' as info, COUNT(*) as count FROM public.profiles;
SELECT 'Remaining submissions:' as info, COUNT(*) as count FROM public.submissions;
SELECT 'Remaining assets:' as info, COUNT(*) as count FROM public.assets;
SELECT 'Remaining ratings:' as info, COUNT(*) as count FROM public.ratings;
