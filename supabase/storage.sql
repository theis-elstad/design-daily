-- Design Daily Storage Setup
-- Run this SQL in your Supabase SQL Editor AFTER creating the storage bucket

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
-- Note: First create the "submissions" bucket via Supabase Dashboard:
-- 1. Go to Storage in your Supabase project
-- 2. Create a new bucket called "submissions"
-- 3. Set it as a PRIVATE bucket
-- 4. Set file size limit to 50MB (for videos)
-- 5. Set allowed MIME types to: image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime
-- 6. Then run the SQL below

-- Users can upload to their own folder (user_id/filename)
CREATE POLICY "submissions_upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'submissions'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can view their own files
CREATE POLICY "submissions_select_own" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'submissions'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admins can view all files
CREATE POLICY "submissions_select_admin" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'submissions'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can delete their own files
CREATE POLICY "submissions_delete_own" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'submissions'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Admins can delete any files
CREATE POLICY "submissions_delete_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'submissions'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
