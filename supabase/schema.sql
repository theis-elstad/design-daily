-- Design Daily Database Schema
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'designer' CHECK (role IN ('designer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUBMISSIONS TABLE (one per user per day)
-- ============================================
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT unique_daily_submission UNIQUE (user_id, submission_date)
);

-- ============================================
-- ASSETS TABLE (images for each submission)
-- ============================================
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    asset_type TEXT NOT NULL DEFAULT 'image' CHECK (asset_type IN ('image', 'video')),
    duration NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RATINGS TABLE (1-5 stars on 2 dimensions)
-- ============================================
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    rated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    productivity INTEGER NOT NULL CHECK (productivity BETWEEN 1 AND 5),
    quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_rating UNIQUE (submission_id, rated_by)
);

-- ============================================
-- ALLOWED DOMAINS TABLE (for signup restrictions)
-- ============================================
CREATE TABLE public.allowed_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial domains
INSERT INTO public.allowed_domains (domain) VALUES
    ('marketer.com'),
    ('marketer.tech'),
    ('vergence.tech');

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_submissions_user_date ON public.submissions(user_id, submission_date);
CREATE INDEX idx_submissions_date ON public.submissions(submission_date DESC);
CREATE INDEX idx_assets_submission ON public.assets(submission_id);
CREATE INDEX idx_ratings_submission ON public.ratings(submission_id);
CREATE INDEX idx_ratings_rated_by ON public.ratings(rated_by);
CREATE INDEX idx_allowed_domains_domain ON public.allowed_domains(domain);

-- ============================================
-- LEADERBOARD FUNCTION
-- Supports time_range: 'today', 'yesterday', 'last_business_day', 'weekly', 'week', 'month', 'all'
-- week_offset: only used with 'weekly', 0 = current week, -1 = previous week, etc.
-- ============================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(time_range TEXT DEFAULT 'all', week_offset INT DEFAULT 0)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    total_submissions BIGINT,
    avg_total_score NUMERIC,
    avg_productivity NUMERIC,
    avg_quality NUMERIC,
    cumulative_total_score NUMERIC,
    rank BIGINT,
    static_count BIGINT,
    video_count BIGINT
) AS $$
DECLARE
    start_date DATE;
    end_date DATE;
BEGIN
    -- Calculate date range based on time_range parameter
    CASE time_range
        WHEN 'today' THEN
            start_date := CURRENT_DATE;
            end_date := CURRENT_DATE;
        WHEN 'yesterday' THEN
            start_date := CURRENT_DATE - INTERVAL '1 day';
            end_date := CURRENT_DATE - INTERVAL '1 day';
        WHEN 'last_business_day' THEN
            -- dow: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
            start_date := CASE EXTRACT(DOW FROM CURRENT_DATE)::INT
                WHEN 0 THEN CURRENT_DATE - 2  -- Sunday -> Friday
                WHEN 1 THEN CURRENT_DATE - 3  -- Monday -> Friday
                WHEN 6 THEN CURRENT_DATE - 1  -- Saturday -> Friday
                ELSE CURRENT_DATE - 1         -- Tue-Fri -> previous day
            END;
            end_date := start_date;
        WHEN 'weekly' THEN
            -- Friday-to-Thursday cycle
            -- Find the most recent Friday, then apply week_offset
            start_date := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INT - 5 + 7) % 7) + (week_offset * 7);
            end_date := start_date + 6;
            -- Cap end_date to today if in the future
            IF end_date > CURRENT_DATE THEN
                end_date := CURRENT_DATE;
            END IF;
        WHEN 'week' THEN
            start_date := CURRENT_DATE - INTERVAL '7 days';
            end_date := CURRENT_DATE;
        WHEN 'month' THEN
            start_date := CURRENT_DATE - INTERVAL '30 days';
            end_date := CURRENT_DATE;
        ELSE
            start_date := '1970-01-01'::DATE;
            end_date := CURRENT_DATE;
    END CASE;

    RETURN QUERY
    WITH submission_scores AS (
        -- Get one score per submission (avoid duplication from assets join)
        SELECT
            s.id AS submission_id,
            s.user_id,
            r.productivity,
            r.quality
        FROM public.submissions s
        JOIN public.ratings r ON r.submission_id = s.id
        WHERE s.submission_date >= start_date AND s.submission_date <= end_date
    ),
    asset_counts AS (
        -- Get asset counts per user for the date range
        SELECT
            s.user_id,
            COUNT(DISTINCT CASE WHEN a.asset_type = 'image' THEN a.id END)::BIGINT AS statics,
            COUNT(DISTINCT CASE WHEN a.asset_type = 'video' THEN a.id END)::BIGINT AS videos
        FROM public.submissions s
        LEFT JOIN public.assets a ON a.submission_id = s.id
        WHERE s.submission_date >= start_date AND s.submission_date <= end_date
        GROUP BY s.user_id
    )
    SELECT
        p.id,
        p.full_name,
        COUNT(DISTINCT ss.submission_id)::BIGINT,
        ROUND(COALESCE(AVG(ss.productivity + ss.quality), 0), 2),
        ROUND(COALESCE(AVG(ss.productivity), 0), 2),
        ROUND(COALESCE(AVG(ss.quality), 0), 2),
        ROUND(COALESCE(SUM(ss.productivity + ss.quality), 0), 2),
        DENSE_RANK() OVER (ORDER BY COALESCE(AVG(ss.productivity + ss.quality), 0) DESC)::BIGINT,
        COALESCE(ac.statics, 0)::BIGINT,
        COALESCE(ac.videos, 0)::BIGINT
    FROM public.profiles p
    LEFT JOIN submission_scores ss ON ss.user_id = p.id
    LEFT JOIN asset_counts ac ON ac.user_id = p.id
    WHERE p.role IN ('designer', 'admin')
    GROUP BY p.id, p.full_name, ac.statics, ac.videos
    HAVING COUNT(DISTINCT ss.submission_id) > 0
    ORDER BY avg_total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone can read, users can update own
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Submissions: own + admin can see all
CREATE POLICY "submissions_select_own" ON public.submissions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "submissions_select_admin" ON public.submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "submissions_insert_own" ON public.submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions_update_own" ON public.submissions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "submissions_delete_admin" ON public.submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Assets: own + admin
CREATE POLICY "assets_select_own" ON public.assets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
    );
CREATE POLICY "assets_select_admin" ON public.assets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "assets_insert_own" ON public.assets
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
    );
CREATE POLICY "assets_delete_own" ON public.assets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.submissions
            WHERE id = submission_id
            AND user_id = auth.uid()
            AND submission_date = CURRENT_DATE
        )
    );
CREATE POLICY "assets_delete_admin" ON public.assets
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Ratings: admin only + designers can read own feedback
CREATE POLICY "ratings_select_admin" ON public.ratings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "ratings_select_own_feedback" ON public.ratings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.submissions WHERE id = submission_id AND user_id = auth.uid())
    );
CREATE POLICY "ratings_insert_admin" ON public.ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rated_by
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "ratings_update_admin" ON public.ratings
    FOR UPDATE USING (auth.uid() = rated_by);

-- Allowed domains: everyone can read, only admins can modify
CREATE POLICY "allowed_domains_select" ON public.allowed_domains
    FOR SELECT USING (true);
CREATE POLICY "allowed_domains_insert_admin" ON public.allowed_domains
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
CREATE POLICY "allowed_domains_delete_admin" ON public.allowed_domains
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- APPS TABLE (hub catalog)
-- ============================================
CREATE TABLE public.apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    url TEXT NOT NULL,
    icon_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'beta', 'maintenance', 'hidden')),
    display_order INTEGER NOT NULL DEFAULT 0,
    open_in_new_tab BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_apps_status_order ON public.apps(status, display_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_apps_slug ON public.apps(slug) WHERE deleted_at IS NULL;

-- Seed apps
INSERT INTO public.apps (name, slug, description, url, icon_url, status, display_order, open_in_new_tab) VALUES
    ('AdGen', 'adgen', 'Static ad creatives generator', 'https://adgen.metric-as.workers.dev/', NULL, 'active', 1, true),
    ('Designer Daily', 'designer-daily', 'Daily submissions and leaderboard', '/submit', NULL, 'active', 2, false),
    ('FashionKilla', 'fashionkilla', 'Fashion/apparel video generator', 'https://fashion-killa.metric-as.workers.dev/', NULL, 'active', 3, true),
    ('Batch Image Generator', 'batch-image-generator', 'Generates many images using product CSV file', 'https://product-prompt-composer.replit.app/', NULL, 'active', 4, true);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read visible apps
CREATE POLICY "apps_select_visible" ON public.apps
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND deleted_at IS NULL
        AND status != 'hidden'
    );

-- Admins can read all apps (including hidden/deleted for management)
CREATE POLICY "apps_select_admin" ON public.apps
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can insert
CREATE POLICY "apps_insert_admin" ON public.apps
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can update
CREATE POLICY "apps_update_admin" ON public.apps
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Admins can delete
CREATE POLICY "apps_delete_admin" ON public.apps
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- AI SUMMARIES TABLE (feedback summaries)
-- ============================================
CREATE TABLE public.ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('judge_context', 'designer_feedback', 'admin_weekly')),
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_summaries_target ON public.ai_summaries(target_user_id, type, created_at DESC);

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
