-- Update Leaderboard Function to include all users (designers + admins)
-- Run this in your Supabase SQL Editor to update the leaderboard function
-- This replaces the previous version that only included users with role='designer'

CREATE OR REPLACE FUNCTION public.get_leaderboard(time_range TEXT DEFAULT 'all')
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    total_submissions BIGINT,
    avg_total_score NUMERIC,
    avg_productivity NUMERIC,
    avg_quality NUMERIC,
    rank BIGINT
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
    SELECT
        p.id,
        p.full_name,
        COUNT(DISTINCT s.id)::BIGINT,
        ROUND(COALESCE(AVG(r.productivity + r.quality), 0), 2),
        ROUND(COALESCE(AVG(r.productivity), 0), 2),
        ROUND(COALESCE(AVG(r.quality), 0), 2),
        DENSE_RANK() OVER (ORDER BY COALESCE(AVG(r.productivity + r.quality), 0) DESC)::BIGINT
    FROM public.profiles p
    LEFT JOIN public.submissions s ON s.user_id = p.id AND s.submission_date >= start_date AND s.submission_date <= end_date
    LEFT JOIN public.ratings r ON r.submission_id = s.id
    WHERE p.role IN ('designer', 'admin')
    GROUP BY p.id, p.full_name
    HAVING COUNT(DISTINCT s.id) > 0
    ORDER BY avg_total_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function works
SELECT 'Updated leaderboard function to include all roles (designer + admin):' as info;
SELECT * FROM public.get_leaderboard('week') LIMIT 5;
