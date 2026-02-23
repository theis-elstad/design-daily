-- Fix: scores were inflated because the assets JOIN duplicated rating rows.
-- Use CTEs to compute scores and asset counts separately.

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
    CASE time_range
        WHEN 'today' THEN
            start_date := CURRENT_DATE;
            end_date := CURRENT_DATE;
        WHEN 'yesterday' THEN
            start_date := CURRENT_DATE - INTERVAL '1 day';
            end_date := CURRENT_DATE - INTERVAL '1 day';
        WHEN 'last_business_day' THEN
            start_date := CASE EXTRACT(DOW FROM CURRENT_DATE)::INT
                WHEN 0 THEN CURRENT_DATE - 2
                WHEN 1 THEN CURRENT_DATE - 3
                WHEN 6 THEN CURRENT_DATE - 1
                ELSE CURRENT_DATE - 1
            END;
            end_date := start_date;
        WHEN 'weekly' THEN
            start_date := CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::INT - 5 + 7) % 7) + (week_offset * 7);
            end_date := start_date + 6;
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
