-- Migration: Add admin DELETE policies for submissions, assets, and storage
-- Run this SQL in your Supabase SQL Editor

-- Allow admins to delete any submission
CREATE POLICY "submissions_delete_admin" ON public.submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow admins to delete any asset row
CREATE POLICY "assets_delete_admin" ON public.assets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow admins to delete any storage file in the submissions bucket
CREATE POLICY "submissions_delete_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'submissions'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
