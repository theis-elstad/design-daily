-- Run this in Supabase SQL Editor to create the apps table

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

INSERT INTO public.apps (name, slug, description, url, icon_url, status, display_order, open_in_new_tab) VALUES
    ('AdGen', 'adgen', 'Static ad creatives generator', 'https://adgen.metric-as.workers.dev/', NULL, 'active', 1, true),
    ('Designer Daily', 'designer-daily', 'Daily submissions and leaderboard', '/submit', NULL, 'active', 2, false),
    ('FashionKilla', 'fashionkilla', 'Fashion/apparel video generator', 'https://fashion-killa.metric-as.workers.dev/', NULL, 'active', 3, true),
    ('Batch Image Generator', 'batch-image-generator', 'Generates many images using product CSV file', 'https://product-prompt-composer.replit.app/', NULL, 'active', 4, true);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apps_select_visible" ON public.apps
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND deleted_at IS NULL
        AND status != 'hidden'
    );

CREATE POLICY "apps_select_admin" ON public.apps
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "apps_insert_admin" ON public.apps
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "apps_update_admin" ON public.apps
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "apps_delete_admin" ON public.apps
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
