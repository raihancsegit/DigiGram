-- DigiGram: Emergency Services & Hotline Schema
-- Run this in Supabase SQL Editor.

-- =========================================================================
-- 1. ADD MASTER SERVICE
-- =========================================================================

INSERT INTO services (name, slug, features)
VALUES ('জরুরি সেবা ও হটলাইন', 'emergency-hotline', '["ambulance", "fire_service", "police", "doctor"]')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- =========================================================================
-- 2. CREATE EMERGENCY CONTACTS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Ambulance', 'Fire Service', 'Police', 'Doctor', etc.
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by union/location
CREATE INDEX IF NOT EXISTS idx_emergency_loc_id ON emergency_contacts(location_id);

-- =========================================================================
-- 3. RLS POLICIES
-- =========================================================================

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Select: Publicly readable
DROP POLICY IF EXISTS "Emergency contacts are publicly readable" ON emergency_contacts;
CREATE POLICY "Emergency contacts are publicly readable" ON emergency_contacts FOR SELECT USING (true);

-- Management: Super Admin OR Union Chairman
DROP POLICY IF EXISTS "Super admins can manage emergency contacts" ON emergency_contacts;
CREATE POLICY "Super admins can manage emergency contacts" 
ON emergency_contacts FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' )
WITH CHECK ( public.get_auth_role() = 'super_admin' );

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
