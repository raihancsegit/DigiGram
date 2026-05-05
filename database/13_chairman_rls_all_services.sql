-- =========================================================================
-- 13. RE-APPLY CHAIRMAN RLS FOR ALL SERVICES
-- Run this if Chairman cannot edit/delete from any service
-- =========================================================================

-- ── EMERGENCY CONTACTS ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Chairmen can manage their union's emergency contacts" ON emergency_contacts;
CREATE POLICY "Chairmen can manage their union's emergency contacts"
ON emergency_contacts FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'chairman'
    AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    public.get_auth_role() = 'chairman'
    AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
);

-- ── LOST & FOUND ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Chairmen can manage their union's lost found posts" ON lost_found_posts;
CREATE POLICY "Chairmen can manage their union's lost found posts"
ON lost_found_posts FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'chairman'
    AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    public.get_auth_role() = 'chairman'
    AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
);

-- ── LOCAL NEWS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins and chairmen can update news" ON local_news;
DROP POLICY IF EXISTS "Admins and chairmen can delete news" ON local_news;

CREATE POLICY "Admins and chairmen can update news"
ON local_news FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
    )
    OR auth.uid() = author_id
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
    )
    OR auth.uid() = author_id
);

CREATE POLICY "Admins and chairmen can delete news"
ON local_news FOR DELETE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND location_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
    )
    OR auth.uid() = author_id
);

-- ── Verify all policies ────────────────────────────────────────────────────
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('local_news', 'emergency_contacts', 'lost_found_posts')
ORDER BY tablename, cmd;
