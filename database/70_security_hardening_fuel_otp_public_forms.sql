-- DigiGram security hardening: fuel operator, OTP, and public forms
-- Run after database/03_service_schema.sql and database/50_citizen_inbox_complaint_blood.sql.
-- Safe to run more than once.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
    pgcrypto_schema TEXT;
BEGIN
    SELECT namespace.nspname
    INTO pgcrypto_schema
    FROM pg_extension extension
    JOIN pg_namespace namespace ON namespace.oid = extension.extnamespace
    WHERE extension.extname = 'pgcrypto';

    IF pgcrypto_schema IS DISTINCT FROM 'extensions' THEN
        EXECUTE 'ALTER EXTENSION pgcrypto SET SCHEMA extensions';
    END IF;
END;
$$;

-- Fuel operator PINs are stored as bcrypt hashes.
ALTER TABLE public.fuel_pump_settings
    ADD COLUMN IF NOT EXISTS access_password_hash TEXT;

UPDATE public.fuel_pump_settings
SET access_password_hash = extensions.crypt(
        access_password::TEXT,
        extensions.gen_salt('bf'::TEXT)
    )
WHERE access_password IS NOT NULL
  AND access_password <> ''
  AND access_password_hash IS NULL;

UPDATE public.fuel_pump_settings
SET access_password = NULL
WHERE access_password_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.verify_fuel_operator_password(
    target_union_slug TEXT,
    candidate_password TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    SELECT COALESCE(
        (
            SELECT access_password_hash IS NOT NULL
               AND extensions.crypt(
                    candidate_password::TEXT,
                    access_password_hash::TEXT
               ) = access_password_hash
            FROM public.fuel_pump_settings
            WHERE union_slug = target_union_slug
        ),
        FALSE
    );
$$;

CREATE OR REPLACE FUNCTION public.set_fuel_operator_password(
    target_union_slug TEXT,
    new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF new_password !~ '^[0-9]{4,8}$' THEN
        RAISE EXCEPTION 'Fuel operator PIN must contain 4 to 8 digits';
    END IF;

    UPDATE public.fuel_pump_settings
    SET access_password_hash = extensions.crypt(
            new_password::TEXT,
            extensions.gen_salt('bf'::TEXT)
        ),
        access_password = NULL,
        updated_at = NOW()
    WHERE union_slug = target_union_slug;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fuel settings not found for union';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_fuel_operator_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_fuel_operator_password(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_fuel_operator_password(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_fuel_operator_password(TEXT, TEXT) TO service_role;

-- Remove legacy demo policies that allowed direct anonymous mutation.
DROP POLICY IF EXISTS "Public can view tokens" ON public.fuel_tokens;
DROP POLICY IF EXISTS "Anyone can issue token" ON public.fuel_tokens;
DROP POLICY IF EXISTS "Anyone can upsert refill log" ON public.fuel_refill_logs;
DROP POLICY IF EXISTS "Fuel settings are readable by everyone" ON public.fuel_pump_settings;
DROP POLICY IF EXISTS "Anyone can upsert vehicle" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can upsert docs" ON public.vehicle_docs;
DROP POLICY IF EXISTS "Public can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public can view vehicle docs" ON public.vehicle_docs;

REVOKE ALL ON public.fuel_tokens FROM anon, authenticated;
REVOKE ALL ON public.fuel_refill_logs FROM anon, authenticated;
REVOKE ALL ON public.fuel_pump_settings FROM anon, authenticated;
REVOKE ALL ON public.fuel_activity_logs FROM anon, authenticated;
REVOKE ALL ON public.vehicles FROM anon, authenticated;
REVOKE ALL ON public.vehicle_docs FROM anon, authenticated;

-- OTP cleanup and lookup indexes support single-use verification and throttling.
CREATE INDEX IF NOT EXISTS idx_citizen_otps_active_lookup
    ON public.citizen_otps(phone, purpose, otp_code, expires_at DESC)
    WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_complaints_phone_created
    ON public.market_complaints(complainant_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admission_phone_created
    ON public.school_admission_applications(institution_id, guardian_phone, created_at DESC);

COMMENT ON FUNCTION public.verify_fuel_operator_password(TEXT, TEXT) IS
    'Service-role-only bcrypt verification for signed fuel operator sessions.';
