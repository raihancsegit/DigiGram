-- Distributed, atomic API rate limits for serverless Route Handlers.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    bucket_key TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_expires_at
    ON public.api_rate_limits(expires_at);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
    p_bucket_key TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    retry_after INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    safe_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 1), 1), 10000);
    safe_window INTEGER := LEAST(GREATEST(COALESCE(p_window_seconds, 60), 1), 86400);
    current_time TIMESTAMPTZ := clock_timestamp();
    current_window TIMESTAMPTZ;
    current_count INTEGER;
    reset_time TIMESTAMPTZ;
BEGIN
    IF p_bucket_key IS NULL OR length(p_bucket_key) < 10 OR length(p_bucket_key) > 160 THEN
        RAISE EXCEPTION 'Invalid rate-limit bucket key';
    END IF;

    current_window := to_timestamp(
        floor(extract(epoch FROM current_time) / safe_window) * safe_window
    );
    reset_time := current_window + make_interval(secs => safe_window);

    INSERT INTO public.api_rate_limits (
        bucket_key,
        window_start,
        request_count,
        expires_at
    )
    VALUES (
        p_bucket_key,
        current_window,
        1,
        reset_time
    )
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET
        request_count = public.api_rate_limits.request_count + 1,
        expires_at = EXCLUDED.expires_at
    RETURNING request_count INTO current_count;

    DELETE FROM public.api_rate_limits
    WHERE bucket_key = p_bucket_key
      AND expires_at < current_time - INTERVAL '1 day';

    RETURN QUERY SELECT
        current_count <= safe_limit,
        GREATEST(safe_limit - current_count, 0),
        GREATEST(ceil(extract(epoch FROM (reset_time - current_time)))::INTEGER, 1);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER)
    TO service_role;

COMMENT ON FUNCTION public.consume_api_rate_limit(TEXT, INTEGER, INTEGER) IS
    'Atomically consumes a fixed-window API quota. Bucket identities are SHA-256 hashed by the server.';
