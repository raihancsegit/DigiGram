-- DigiGram: Household Tax Tracking Schema
-- Run this in Supabase SQL Editor

-- Household Tax Records Table
CREATE TABLE IF NOT EXISTS household_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,                   -- Tax year (e.g. 2024)
    amount_due DECIMAL(10,2) NOT NULL,       -- Total payable amount (in Taka)
    amount_paid DECIMAL(10,2) DEFAULT 0,    -- Amount paid so far
    due_date DATE,                           -- Payment deadline
    paid_date DATE,                          -- Date of last payment
    receipt_no TEXT,                         -- Union council receipt number
    status TEXT DEFAULT 'due' CHECK (status IN ('due', 'partial', 'paid')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by household
CREATE INDEX IF NOT EXISTS idx_household_taxes_household_id ON household_taxes(household_id);
CREATE INDEX IF NOT EXISTS idx_household_taxes_year ON household_taxes(year);

ALTER TABLE household_taxes
    ADD COLUMN IF NOT EXISTS fiscal_year_label TEXT,
    ADD COLUMN IF NOT EXISTS ward_no TEXT,
    ADD COLUMN IF NOT EXISTS holding_no TEXT,
    ADD COLUMN IF NOT EXISTS taxpayer_name TEXT,
    ADD COLUMN IF NOT EXISTS guardian_name TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS previous_due DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS current_tax DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quarter_1 DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quarter_2 DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quarter_3 DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quarter_4 DECIMAL(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS issued_at DATE DEFAULT CURRENT_DATE;

CREATE TABLE IF NOT EXISTS household_tax_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_id UUID NOT NULL REFERENCES household_taxes(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    receipt_no TEXT NOT NULL UNIQUE,
    paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collected_by TEXT,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_tax_payments_tax_id
    ON household_tax_payments(tax_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tax_timestamp
    BEFORE UPDATE ON household_taxes
    FOR EACH ROW EXECUTE FUNCTION update_tax_updated_at();

-- Update service_requests table to include resident reference (if not already exists)
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS collection_date DATE,
    ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Index for service_requests by household
CREATE INDEX IF NOT EXISTS idx_service_requests_household_id ON service_requests(household_id);
