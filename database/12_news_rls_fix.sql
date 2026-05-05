-- =========================================================================
-- 12. FIX LOCAL NEWS RLS — Super Admin + Chairman Access
-- =========================================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can update their own local news" ON local_news;
DROP POLICY IF EXISTS "Users can delete their own local news" ON local_news;
DROP POLICY IF EXISTS "Users can insert their own local news" ON local_news;
DROP POLICY IF EXISTS "Authenticated users can insert news" ON local_news;
DROP POLICY IF EXISTS "Authors and admins can update news" ON local_news;
DROP POLICY IF EXISTS "Authors and admins can delete news" ON local_news;
DROP POLICY IF EXISTS "Chairmen can manage their union news" ON local_news;

-- ── INSERT ─────────────────────────────────────────────────────────────────
-- Super Admin can insert any news
-- Chairman can insert news for their own union
-- Ward member can insert news for their own location
CREATE POLICY "Authenticated users can insert news"
ON local_news FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = author_id
    AND (
        public.get_auth_role() = 'super_admin'
        OR public.get_auth_role() = 'chairman'
        OR public.get_auth_role() = 'ward_member'
    )
);

-- ── UPDATE ─────────────────────────────────────────────────────────────────
-- Super Admin: can update ANY news
-- Chairman: can update news belonging to their union (regardless of author)
-- Author: can update their own news
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

-- ── DELETE ─────────────────────────────────────────────────────────────────
-- Super Admin: can delete ANY news
-- Chairman: can delete news belonging to their union
-- Author: can delete their own news
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

-- ── Verify ─────────────────────────────────────────────────────────────────
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'local_news';
