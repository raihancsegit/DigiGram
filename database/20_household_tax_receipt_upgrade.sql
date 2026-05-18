-- DigiGram household tax receipt upgrade
-- Adds bill breakdown and payment receipt history so one bill can have multiple receipts.

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
