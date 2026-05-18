-- DigiGram security + role + volunteer hardening
-- Safe to run more than once.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep role enum aligned with roles already exposed by the app.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'profile_role'
          AND e.enumlabel = 'market_manager'
    ) THEN
        ALTER TYPE profile_role ADD VALUE 'market_manager';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'profile_role'
          AND e.enumlabel = 'school_admin'
    ) THEN
        ALTER TYPE profile_role ADD VALUE 'school_admin';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'profile_role'
          AND e.enumlabel = 'mosque_admin'
    ) THEN
        ALTER TYPE profile_role ADD VALUE 'mosque_admin';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'profile_role'
          AND e.enumlabel = 'clinic_admin'
    ) THEN
        ALTER TYPE profile_role ADD VALUE 'clinic_admin';
    END IF;
END $$;

-- Canonical author link for households created by profile-based volunteers/officers.
ALTER TABLE households
    ADD COLUMN IF NOT EXISTS added_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS locker_pin_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_households_added_by_user_id
    ON households(added_by_user_id);

-- Backfill existing plain PINs into hashes, then keep new writes hashed.
UPDATE households
SET locker_pin_hash = crypt(locker_pin, gen_salt('bf'))
WHERE locker_pin IS NOT NULL
  AND locker_pin <> ''
  AND locker_pin_hash IS NULL;

UPDATE households
SET locker_pin = NULL
WHERE locker_pin_hash IS NOT NULL
  AND locker_pin IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_household_locker_pin(
    target_household_id UUID,
    raw_pin TEXT
)
RETURNS VOID AS $$
BEGIN
    IF raw_pin IS NULL OR raw_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'Locker PIN must be exactly 4 digits';
    END IF;

    UPDATE households
    SET locker_pin_hash = crypt(raw_pin, gen_salt('bf')),
        locker_pin = NULL,
        updated_at = NOW()
    WHERE id = target_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.verify_household_locker_pin(
    lookup_value TEXT,
    candidate_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT locker_pin_hash
    INTO stored_hash
    FROM households
    WHERE id::text = lookup_value
       OR qr_code_id = lookup_value
    LIMIT 1;

    RETURN stored_hash IS NOT NULL
       AND crypt(candidate_pin, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.set_household_locker_pin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_household_locker_pin(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.verify_household_locker_pin(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_household_locker_pin(TEXT, TEXT) TO anon, authenticated;

-- Profiles should not be publicly readable because they include private contact data.
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND (
            access_scope_id = public.get_auth_scope_id()
            OR EXISTS (
                SELECT 1
                FROM locations scoped_location
                WHERE scoped_location.id = profiles.access_scope_id
                  AND (
                    scoped_location.parent_id = public.get_auth_scope_id()
                    OR EXISTS (
                        SELECT 1
                        FROM locations parent_location
                        WHERE parent_location.id = scoped_location.parent_id
                          AND parent_location.parent_id = public.get_auth_scope_id()
                    )
                  )
            )
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND (
            access_scope_id = public.get_auth_scope_id()
            OR EXISTS (
                SELECT 1
                FROM locations scoped_location
                WHERE scoped_location.id = profiles.access_scope_id
                  AND scoped_location.parent_id = public.get_auth_scope_id()
            )
        )
    )
);

-- Public portals can still show elected/officer contact cards without exposing all profiles.
CREATE OR REPLACE VIEW public_officer_profiles AS
SELECT
    id,
    first_name,
    last_name,
    phone,
    avatar_url,
    access_scope_id,
    role
FROM profiles
WHERE role IN ('chairman', 'ward_member');

GRANT SELECT ON public_officer_profiles TO anon, authenticated;
