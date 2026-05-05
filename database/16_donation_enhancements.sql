-- DigiGram: Enhance Donation Service
-- Add is_global and updated_at to donation_projects

ALTER TABLE donation_projects ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE donation_projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to update projects raised_amount
-- This is better done in the API bridge for flexibility, but we could use a trigger too.
-- For now, we'll handle it in the API bridge to ensure business logic consistency.
