-- ============================================
-- FEEDBACK FEATURES MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add comment column to ratings (judge feedback text)
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS comment TEXT;

-- 2. Add duration column to assets (video duration in seconds, null for images)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS duration NUMERIC;

-- 3. Add asset_type column to assets if not present
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'video'));

-- 4. Create ai_summaries table
CREATE TABLE IF NOT EXISTS public.ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('judge_context', 'designer_feedback', 'admin_weekly')),
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_summaries_target
    ON public.ai_summaries(target_user_id, type, created_at DESC);

-- 5. RLS for ai_summaries
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_summaries_select_own" ON public.ai_summaries
    FOR SELECT USING (auth.uid() = target_user_id);

CREATE POLICY "ai_summaries_select_admin" ON public.ai_summaries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "ai_summaries_insert_admin" ON public.ai_summaries
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "ai_summaries_insert_own" ON public.ai_summaries
    FOR INSERT WITH CHECK (auth.uid() = target_user_id);

CREATE POLICY "ai_summaries_delete_admin" ON public.ai_summaries
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Allow designers to read ratings on their OWN submissions (for feedback page)
CREATE POLICY "ratings_select_own_feedback" ON public.ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.submissions
            WHERE id = submission_id AND user_id = auth.uid()
        )
    );
