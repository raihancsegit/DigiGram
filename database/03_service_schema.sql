-- DigiGram: Service Layer Schema (Blood Bank & Digi-Fuel)
-- Step 3: Run this in Supabase SQL Editor.

-- =========================================================================
-- 1. BLOOD BANK TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS blood_donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    phone VARCHAR NOT NULL UNIQUE,
    village VARCHAR NOT NULL,
    union_slug VARCHAR NOT NULL, -- Logical link to locations.slug
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexing for fast search
CREATE INDEX idx_donors_blood_group ON blood_donors(blood_group);
CREATE INDEX idx_donors_union_slug ON blood_donors(union_slug);

-- =========================================================================
-- 2. DIGI-FUEL TABLES
-- =========================================================================

-- Daily tokens for queue management
CREATE TABLE IF NOT EXISTS fuel_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_number VARCHAR NOT NULL,
    serial_number INTEGER NOT NULL,
    slot_time VARCHAR NOT NULL,
    union_slug VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rationing Enforcement table
CREATE TABLE IF NOT EXISTS fuel_refill_logs (
    bike_number VARCHAR PRIMARY KEY,
    last_refill_time TIMESTAMP WITH TIME ZONE NOT NULL,
    amount_liters DECIMAL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Administrative settings for pump rationing
CREATE TABLE IF NOT EXISTS fuel_pump_settings (
    union_slug VARCHAR PRIMARY KEY,
    rationing_limit INTEGER DEFAULT 500,
    rationing_days INTEGER DEFAULT 3,
    access_password VARCHAR DEFAULT '1234',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS fuel_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    union_slug VARCHAR NOT NULL,
    action_type VARCHAR NOT NULL, -- e.g., 'TOKEN_ISSUED', 'REFILL_CONFIRMED'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- 3. VEHICLE GUARD (DIGI-BAHAN) TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS vehicles (
    bike_number VARCHAR PRIMARY KEY,
    owner_name VARCHAR,
    phone_number VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bike_number VARCHAR REFERENCES vehicles(bike_number) ON DELETE CASCADE,
    doc_type VARCHAR NOT NULL, -- 'tax_token', 'fitness', 'bluebook'
    expiry_date DATE NOT NULL,
    last_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bike_number, doc_type)
);

-- =========================================================================
-- 4. INITIAL SEED DATA FOR SERVICES
-- =========================================================================

-- Mock Donors
INSERT INTO blood_donors (name, blood_group, phone, village, union_slug, total_donations, is_available)
VALUES 
('ইমরান হাসান', 'A+', '01712000001', 'ভবানীপুর', 'poba', 5, true),
('তুষার আহমেদ', 'O+', '01712000002', 'চকপাড়া', 'poba', 2, true),
('রাহুল দে', 'B+', '01712000003', 'নওহাটা', 'poba', 8, false),
('মেহজাবিন চৌধুরী', 'A-', '01712000004', 'দায়েরপাড়া', 'mohonpur', 1, true)
ON CONFLICT DO NOTHING;

-- Mock Fuel Settings
INSERT INTO fuel_pump_settings (union_slug, rationing_limit, rationing_days)
VALUES 
('poba', 500, 3)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- 4. RLS POLICIES (BASIC)
-- =========================================================================

ALTER TABLE blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_refill_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_pump_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_docs ENABLE ROW LEVEL SECURITY;

-- Select policies
DROP POLICY IF EXISTS "Donors are readable by everyone" ON blood_donors;
CREATE POLICY "Donors are readable by everyone" ON blood_donors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Fuel settings are readable by everyone" ON fuel_pump_settings;
CREATE POLICY "Fuel settings are readable by everyone" ON fuel_pump_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view tokens" ON fuel_tokens;
CREATE POLICY "Public can view tokens" ON fuel_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view vehicles" ON vehicles;
CREATE POLICY "Public can view vehicles" ON vehicles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view vehicle docs" ON vehicle_docs;
CREATE POLICY "Public can view vehicle docs" ON vehicle_docs FOR SELECT USING (true);

-- Insert/Update policies (Allowing for demo/volunteers - In production this should be role-based)
DROP POLICY IF EXISTS "Anyone can register as donor" ON blood_donors;
CREATE POLICY "Anyone can register as donor" ON blood_donors FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can issue token" ON fuel_tokens;
CREATE POLICY "Anyone can issue token" ON fuel_tokens FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can upsert refill log" ON fuel_refill_logs;
CREATE POLICY "Anyone can upsert refill log" ON fuel_refill_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can upsert vehicle" ON vehicles;
CREATE POLICY "Anyone can upsert vehicle" ON vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can upsert docs" ON vehicle_docs;
CREATE POLICY "Anyone can upsert docs" ON vehicle_docs FOR ALL USING (true) WITH CHECK (true);
