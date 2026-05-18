-- DigiGram service request scope security
-- Purpose:
-- 1. Prevent one union from reading or processing another union's requests
-- 2. Let ward members read only requests belonging to their own ward
-- 3. Keep public household-profile application submission working

CREATE OR REPLACE FUNCTION public.get_auth_scope_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT access_scope_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit service requests" ON service_requests;
CREATE POLICY "Public can submit service requests"
ON service_requests FOR INSERT
WITH CHECK (
    household_id IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM households h
        WHERE h.id = service_requests.household_id
    )
);

DROP POLICY IF EXISTS "Scoped officers can read service requests" ON service_requests;
CREATE POLICY "Scoped officers can read service requests"
ON service_requests FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = service_requests.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
            WHERE h.id = service_requests.household_id
              AND h.ward_id = village_scope.parent_id
        )
    )
);

DROP POLICY IF EXISTS "Scoped chairmen can update service requests" ON service_requests;
CREATE POLICY "Scoped chairmen can update service requests"
ON service_requests FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_households_ward_id
    ON households(ward_id);

CREATE INDEX IF NOT EXISTS idx_locations_parent_type
    ON locations(parent_id, type);
