-- DigiGram institution portal core
-- Safe to run more than once after 30_institution_village_site_provisioning.sql.

CREATE TABLE IF NOT EXISTS institution_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    hero_title TEXT,
    hero_subtitle TEXT,
    about_text TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    banner_image_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id)
);

CREATE TABLE IF NOT EXISTS institution_notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    audience TEXT NOT NULL DEFAULT 'public'
        CHECK (audience IN ('public', 'teachers', 'students', 'guardians')),
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL CHECK (member_role IN ('admin', 'teacher', 'student')),
    title TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(institution_id, profile_id, member_role)
);

ALTER TABLE school_students
    ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_institution_notices_institution_id
    ON institution_notices(institution_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_institution_memberships_institution_id
    ON institution_memberships(institution_id, member_role);

ALTER TABLE institution_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read institution pages" ON institution_pages;
CREATE POLICY "Public can read institution pages"
ON institution_pages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public can read public institution notices" ON institution_notices;
CREATE POLICY "Public can read public institution notices"
ON institution_notices FOR SELECT
USING (audience = 'public');

DROP POLICY IF EXISTS "Scoped institution staff can manage pages" ON institution_pages;
CREATE POLICY "Scoped institution staff can manage pages"
ON institution_pages FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_pages.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_pages.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role = 'admin'
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Scoped institution staff can manage notices" ON institution_notices;
CREATE POLICY "Scoped institution staff can manage notices"
ON institution_notices FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_notices.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM institution_memberships im
        WHERE im.institution_id = institution_notices.institution_id
          AND im.profile_id = auth.uid()
          AND im.member_role IN ('admin', 'teacher')
          AND im.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Users can read own institution memberships" ON institution_memberships;
CREATE POLICY "Users can read own institution memberships"
ON institution_memberships FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid()
    OR public.get_auth_role() = 'super_admin'
);

INSERT INTO institution_pages (institution_id, hero_title, hero_subtitle)
SELECT
    id,
    name,
    CASE
        WHEN category = 'mosque' THEN 'ইবাদত, দান ও স্বচ্ছ হিসাবের ডিজিটাল কেন্দ্র'
        ELSE 'শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য ডিজিটাল শিক্ষা প্ল্যাটফর্ম'
    END
FROM institutions
ON CONFLICT (institution_id) DO NOTHING;
