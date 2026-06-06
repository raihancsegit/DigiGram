-- DigiGram role + RLS security hardening and diagnostics
-- Safe to run more than once in Supabase SQL Editor.
-- Run after 58_household_edit_scope_hardening.sql.

-- -------------------------------------------------------------------------
-- 1. Remove legacy permissive policies
-- -------------------------------------------------------------------------
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.villages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.villages;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.villages;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.household_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.household_documents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.household_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.household_documents;

-- Village names and summary statistics are public, but only the responsible
-- ward member or a super admin can change the village record.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.villages;
CREATE POLICY "Villages are publicly readable"
ON public.villages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Scoped officers can manage villages" ON public.villages;
CREATE POLICY "Scoped officers can manage villages"
ON public.villages FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'ward_member'
        AND ward_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'ward_member'
        AND ward_id = public.get_auth_scope_id()
    )
);

-- Recreate the private document metadata policy explicitly.
DROP POLICY IF EXISTS "Scoped officers can read household documents" ON public.household_documents;
CREATE POLICY "Scoped officers can read household documents"
ON public.household_documents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.households h
        JOIN public.locations w ON w.id = h.ward_id
        WHERE h.id = household_documents.household_id
          AND (
              public.get_auth_role() = 'super_admin'
              OR (
                  public.get_auth_role() = 'chairman'
                  AND w.parent_id = public.get_auth_scope_id()
              )
              OR (
                  public.get_auth_role() = 'ward_member'
                  AND h.ward_id = public.get_auth_scope_id()
              )
              OR (
                  public.get_auth_role() = 'volunteer'
                  AND public.household_is_in_auth_village(
                      h.ward_id,
                      h.village_id,
                      h.location_village_id
                  )
              )
          )
    )
);

-- -------------------------------------------------------------------------
-- 2. Protect SECURITY DEFINER locker PIN mutation
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_household_locker_pin(
    target_household_id UUID,
    raw_pin TEXT
)
RETURNS VOID AS $$
DECLARE
    target_household public.households%ROWTYPE;
    allowed BOOLEAN := FALSE;
BEGIN
    IF raw_pin IS NULL OR raw_pin !~ '^[0-9]{4}$' THEN
        RAISE EXCEPTION 'Locker PIN must be exactly 4 digits';
    END IF;

    SELECT *
    INTO target_household
    FROM public.households
    WHERE id = target_household_id;

    IF target_household.id IS NULL THEN
        RAISE EXCEPTION 'Household not found';
    END IF;

    allowed := public.get_auth_role() = 'super_admin'
        OR (
            public.get_auth_role() = 'ward_member'
            AND target_household.ward_id = public.get_auth_scope_id()
        )
        OR (
            public.get_auth_role() = 'volunteer'
            AND public.household_is_in_auth_village(
                target_household.ward_id,
                target_household.village_id,
                target_household.location_village_id
            )
        );

    IF NOT allowed THEN
        RAISE EXCEPTION 'Household is outside your assigned scope';
    END IF;

    UPDATE public.households
    SET locker_pin_hash = crypt(raw_pin, gen_salt('bf')),
        locker_pin = NULL,
        updated_at = NOW()
    WHERE id = target_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.set_household_locker_pin(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_household_locker_pin(UUID, TEXT) TO authenticated;

-- -------------------------------------------------------------------------
-- 3. Database-side diagnostics for Super Admin / SQL Editor
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_rls_security_audit AS
WITH critical_tables(table_name) AS (
    VALUES
        ('profiles'),
        ('households'),
        ('residents'),
        ('household_documents'),
        ('service_requests'),
        ('household_taxes'),
        ('household_tax_payments'),
        ('institution_memberships'),
        ('school_students'),
        ('school_attendance'),
        ('school_lessons'),
        ('school_results'),
        ('markets'),
        ('market_prices'),
        ('data_quality_tasks')
),
table_state AS (
    SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
),
policy_state AS (
    SELECT
        tablename AS table_name,
        COUNT(*)::INTEGER AS policy_count,
        COUNT(*) FILTER (
            WHERE COALESCE(qual, '') ~* '(^|[^a-z])(true|auth\.role\(\)\s*=\s*''authenticated'')([^a-z]|$)'
               OR COALESCE(with_check, '') ~* '(^|[^a-z])(true|auth\.role\(\)\s*=\s*''authenticated'')([^a-z]|$)'
        )::INTEGER AS permissive_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
)
SELECT
    ct.table_name,
    COALESCE(ts.rls_enabled, FALSE) AS rls_enabled,
    COALESCE(ts.force_rls, FALSE) AS force_rls,
    COALESCE(ps.policy_count, 0) AS policy_count,
    COALESCE(ps.permissive_policy_count, 0) AS permissive_policy_count,
    CASE
        WHEN ts.table_name IS NULL THEN 'missing_table'
        WHEN NOT ts.rls_enabled THEN 'rls_disabled'
        WHEN COALESCE(ps.policy_count, 0) = 0 THEN 'no_policy'
        WHEN COALESCE(ps.permissive_policy_count, 0) > 0
            AND ct.table_name NOT IN ('markets') THEN 'review_permissive_policy'
        ELSE 'ok'
    END AS status
FROM critical_tables ct
LEFT JOIN table_state ts ON ts.table_name = ct.table_name
LEFT JOIN policy_state ps ON ps.table_name = ct.table_name
ORDER BY ct.table_name;

REVOKE ALL ON public.admin_rls_security_audit FROM PUBLIC;
GRANT SELECT ON public.admin_rls_security_audit TO authenticated;

COMMENT ON VIEW public.admin_rls_security_audit IS
    'Critical DigiGram tables, RLS state, policy count and permissive-policy warnings.';

