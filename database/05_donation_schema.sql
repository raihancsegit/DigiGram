-- DigiGram: Transparent Donation Schema
-- Step 5: Run this in Supabase SQL Editor.

-- 1. Donation Projects (e.g., Winter Clothes Distribution, Road Repair)
CREATE TABLE IF NOT EXISTS donation_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    union_slug VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    target_amount DECIMAL DEFAULT 0,
    raised_amount DECIMAL DEFAULT 0,
    image_url VARCHAR,
    category VARCHAR, -- 'education', 'health', 'disaster', 'others'
    status VARCHAR DEFAULT 'active', -- 'active', 'completed', 'hidden'
    deadline DATE,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Donation Ledger (Live Tracking of every Taka)
CREATE TABLE IF NOT EXISTS donation_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES donation_projects(id) ON DELETE CASCADE,
    donor_name VARCHAR DEFAULT 'বেনামী',
    amount DECIMAL NOT NULL,
    payment_method VARCHAR, -- 'bkash', 'nagad', 'bank', 'cash'
    transaction_id VARCHAR,
    status VARCHAR DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Union-specific Donation Settings
CREATE TABLE IF NOT EXISTS donation_settings (
    union_slug VARCHAR PRIMARY KEY,
    bkash_number VARCHAR,
    nagad_number VARCHAR,
    bank_details TEXT,
    announcement TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add "Transparent Donation" to Master Services
INSERT INTO services (name, slug, features)
VALUES ('Transparent Donation', 'donation', '["projects", "public_ledger", "online_payment"]')
ON CONFLICT (slug) DO NOTHING;

-- RLS Policies
ALTER TABLE donation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are readable by everyone" ON donation_projects FOR SELECT USING (true);
CREATE POLICY "Ledger is readable by everyone" ON donation_ledger FOR SELECT USING (is_public = true);
CREATE POLICY "Settings are readable by everyone" ON donation_settings FOR SELECT USING (true);
