-- DigiGram: Lost and Found Schema
-- Run this in Supabase SQL Editor.

-- =========================================================================
-- 1. ADD MASTER SERVICE
-- =========================================================================

INSERT INTO services (name, slug, features)
VALUES ('হারানো ও প্রাপ্তি', 'lost-found', '["reporting", "searching", "gd_verification"]')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 2. CREATE LOST AND FOUND POSTS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS lost_found_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'lost', 'found'
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TEXT, 
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'resolved'
    image_url TEXT,
    reward_amount TEXT,
    gd_number TEXT,
    last_seen_area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by union/location
CREATE INDEX IF NOT EXISTS idx_lost_found_loc_id ON lost_found_posts(location_id);

-- =========================================================================
-- 3. RLS POLICIES
-- =========================================================================

ALTER TABLE lost_found_posts ENABLE ROW LEVEL SECURITY;

-- Select: Publicly readable
DROP POLICY IF EXISTS "Lost found posts are publicly readable" ON lost_found_posts;
CREATE POLICY "Lost found posts are publicly readable" ON lost_found_posts FOR SELECT USING (true);

-- Management: Super Admin OR Union Chairman
DROP POLICY IF EXISTS "Super admins can manage lost found posts" ON lost_found_posts;
CREATE POLICY "Super admins can manage lost found posts" 
ON lost_found_posts FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' )
WITH CHECK ( public.get_auth_role() = 'super_admin' );

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
