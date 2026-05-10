-- 1. Add missing columns to villages table for Data Sync
ALTER TABLE villages 
ADD COLUMN IF NOT EXISTS survey_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS real_stats JSONB DEFAULT '{"total_houses":0, "total_members":0, "males":0, "females":0, "voters":0}'::jsonb;

-- 2. Add missing columns to locations table for Data Sync (Ward & Union aggregation)
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS survey_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS real_stats JSONB DEFAULT '{"total_houses":0, "total_members":0, "males":0, "females":0, "voters":0}'::jsonb;

-- 3. Fix RLS Policies for villages table so Data Sync can read/write
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON villages;
CREATE POLICY "Enable read access for all users" ON villages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON villages;
CREATE POLICY "Enable insert for authenticated users" ON villages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON villages;
CREATE POLICY "Enable update for authenticated users" ON villages FOR UPDATE USING (auth.role() = 'authenticated');
