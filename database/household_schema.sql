-- DigiGram Advanced Features Database Schema
-- Location: E:\Project\digigram-script\database\household_schema.sql

-- 1. Villages Table (Linked to Ward/Location)
CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bn_name TEXT,
    para_name TEXT, -- Neighborhood/Para
    total_estimated_houses INTEGER DEFAULT 0,
    survey_status TEXT DEFAULT 'pending', -- pending, verified
    real_stats JSONB DEFAULT '{"total_houses":0, "total_members":0, "males":0, "females":0, "voters":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Volunteers Table
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    assigned_village_id UUID REFERENCES villages(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, suspended
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Households Table
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    village_id UUID REFERENCES villages(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    added_by_volunteer_id UUID REFERENCES volunteers(id),
    house_no TEXT, -- Holding Number or House ID
    owner_name TEXT NOT NULL,
    phone TEXT,
    lat DECIMAL, -- Map Pin (Latitude)
    lng DECIMAL, -- Map Pin (Longitude)
    electricity_meter BOOLEAN DEFAULT FALSE,
    meter_no TEXT,
    latrine_status TEXT, -- hygienic, unhygienic
    water_source TEXT, -- tube-well, tap, etc
    housing_type TEXT, -- Kacha, Paka, Semi-Paka, Tin-shed
    economic_status TEXT, -- lower, middle, upper
    religion TEXT,
    locker_pin TEXT, -- 4-digit PIN for self-service digital locker
    qr_code_id TEXT UNIQUE,
    stats JSONB DEFAULT '{"total_members":0, "voters":0, "males":0, "females":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Residents Table
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bn_name TEXT,
    gender TEXT, -- Male, Female, Other
    relation_with_head TEXT, -- self, wife, son, daughter, etc.
    dob DATE,
    nid TEXT UNIQUE,
    birth_reg_no TEXT UNIQUE,
    blood_group TEXT,
    marital_status TEXT,
    education_level TEXT,
    occupation TEXT,
    disability_status TEXT,
    is_voter BOOLEAN DEFAULT FALSE,
    is_dead BOOLEAN DEFAULT FALSE,
    death_date DATE,
    digital_locker JSONB DEFAULT '{"nid_url": null, "birth_cert_url": null, "other_docs": []}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Citizen Service Requests (Birth/Death Certificates, etc.)
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL, -- birth_registration, death_certificate, electric_meter, etc
    data JSONB, -- Form data as JSON
    status TEXT DEFAULT 'pending', -- pending, verified, processing, ready, completed
    appointment_date TIMESTAMPTZ,
    union_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Volunteer Activity Logs for Oversight
CREATE TABLE IF NOT EXISTS volunteer_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID REFERENCES volunteers(id),
    action TEXT, -- e.g., 'added_house', 'updated_resident'
    target_id UUID,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
