-- Create Household Documents Table
CREATE TABLE IF NOT EXISTS household_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- nid, birth_cert, tax, etc.
    title TEXT,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE household_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON household_documents;
CREATE POLICY "Enable read access for all users" ON household_documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON household_documents;
CREATE POLICY "Enable insert for authenticated users" ON household_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON household_documents;
CREATE POLICY "Enable delete for authenticated users" ON household_documents FOR DELETE USING (auth.role() = 'authenticated');
