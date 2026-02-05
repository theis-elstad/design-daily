-- Add Allowed Email Domains Table
-- Run this in your Supabase SQL Editor

-- ============================================
-- ALLOWED DOMAINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.allowed_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_allowed_domains_domain ON public.allowed_domains(domain);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;

-- Everyone can read allowed domains (needed for signup validation)
CREATE POLICY "allowed_domains_select" ON public.allowed_domains
    FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "allowed_domains_insert_admin" ON public.allowed_domains
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "allowed_domains_delete_admin" ON public.allowed_domains
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- SEED INITIAL DOMAINS
-- ============================================
INSERT INTO public.allowed_domains (domain) VALUES
    ('marketer.com'),
    ('marketer.tech'),
    ('vergence.tech')
ON CONFLICT (domain) DO NOTHING;

-- Verify
SELECT 'Allowed domains:' as info;
SELECT * FROM public.allowed_domains ORDER BY domain;
