-- DigiGram: Fix Donation Service RLS Policies
-- Run this in Supabase SQL Editor if you want to use direct client calls.

-- 1. Donation Projects
DROP POLICY IF EXISTS "Chairmen can manage their union's projects" ON donation_projects;
CREATE POLICY "Chairmen can manage their union's projects"
ON donation_projects FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
    )
);

-- 2. Donation Ledger (Admins/Chairmen can verify)
DROP POLICY IF EXISTS "Admins and chairmen can manage ledger" ON donation_ledger;
CREATE POLICY "Admins and chairmen can manage ledger"
ON donation_ledger FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND project_id IN (
            SELECT id FROM donation_projects 
            WHERE union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND project_id IN (
            SELECT id FROM donation_projects 
            WHERE union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
        )
    )
);

-- 3. Donation Settings
DROP POLICY IF EXISTS "Chairmen can manage their union's settings" ON donation_settings;
CREATE POLICY "Chairmen can manage their union's settings"
ON donation_settings FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_slug = (SELECT slug FROM locations WHERE id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid()))
    )
);
