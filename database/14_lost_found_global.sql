-- =========================================================================
-- 14. LOST AND FOUND GLOBAL SUPPORT
-- =========================================================================

-- Add is_global column to lost_found_posts if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='lost_found_posts' AND column_name='is_global') THEN
        ALTER TABLE lost_found_posts ADD COLUMN is_global BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update RLS if needed (management is already restricted to union or super_admin)
-- The existing policies allow Super Admins to manage everything.
-- Chairmen can already manage posts where location_id matches their union.
-- No change needed to management policies, as they are already restrictive.
