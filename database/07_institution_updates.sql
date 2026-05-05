-- DigiGram: Final Institution & Transaction Schema (Super Admin Restricted)
-- Run this in Supabase SQL Editor.

-- =========================================================================
-- 1. EXTEND INSTITUTIONS TABLE
-- =========================================================================

-- Add village column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='institutions' AND COLUMN_NAME='village') THEN
        ALTER TABLE institutions ADD COLUMN village TEXT;
    END IF;
END $$;

-- =========================================================================
-- 2. CREATE TRANSACTIONS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS institution_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL, -- 'income', 'expense'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_inst_tx_id ON institution_transactions(institution_id);

-- =========================================================================
-- 3. STORAGE POLICIES (Fix for Avatar Policy Error)
-- =========================================================================

-- Safely recreate the Avatar Public View policy for storage objects
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
CREATE POLICY "Avatar Public View" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
CREATE POLICY "Avatar Upload Policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- =========================================================================
-- 4. RLS POLICIES (SUPER ADMIN ONLY FOR MANAGEMENT)
-- =========================================================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_transactions ENABLE ROW LEVEL SECURITY;

-- 4.1 SELECT (Everyone can see institution basic info)
DROP POLICY IF EXISTS "Institutions are publicly readable" ON institutions;
CREATE POLICY "Institutions are publicly readable" ON institutions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transactions are publicly readable" ON institution_transactions;
CREATE POLICY "Transactions are publicly readable" ON institution_transactions FOR SELECT USING (true);

-- 4.2 MANAGEMENT (ONLY Super Admin can Create/Update/Delete Institutions)
DROP POLICY IF EXISTS "Super admins can manage institutions" ON institutions;
CREATE POLICY "Super admins can manage institutions" 
ON institutions FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

-- 4.3 TRANSACTIONS (Super Admin OR the Institution's Admin can manage)
DROP POLICY IF EXISTS "Manage institution transactions" ON institution_transactions;
CREATE POLICY "Manage institution transactions" 
ON institution_transactions FOR ALL 
TO authenticated 
USING (
    public.get_auth_role() = 'super_admin' 
    OR (
        public.get_auth_role() = 'institution_admin' 
        AND institution_id = (SELECT access_scope_id FROM profiles WHERE id = auth.uid())
    )
);
