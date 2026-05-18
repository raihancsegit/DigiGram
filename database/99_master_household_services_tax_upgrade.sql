-- DigiGram master household service + tax upgrade
-- Safe to run more than once in Supabase SQL Editor.
-- Includes:
-- 1. service request workflow upgrade
-- 2. service request scope security
-- 3. household tax schema + receipt upgrade
-- 4. tax scope security

-- -------------------------------------------------------------------------
-- Shared helper functions
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_auth_scope_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT access_scope_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------
-- Service request workflow upgrade
-- -------------------------------------------------------------------------
ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS resident_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS applicant_name TEXT,
    ADD COLUMN IF NOT EXISTS applicant_nid TEXT,
    ADD COLUMN IF NOT EXISTS applicant_birth_reg TEXT,
    ADD COLUMN IF NOT EXISTS applicant_dob DATE,
    ADD COLUMN IF NOT EXISTS applicant_gender TEXT,
    ADD COLUMN IF NOT EXISTS applicant_address TEXT,
    ADD COLUMN IF NOT EXISTS father_name TEXT,
    ADD COLUMN IF NOT EXISTS father_nid TEXT,
    ADD COLUMN IF NOT EXISTS mother_name TEXT,
    ADD COLUMN IF NOT EXISTS mother_nid TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS death_date DATE,
    ADD COLUMN IF NOT EXISTS place_of_death TEXT,
    ADD COLUMN IF NOT EXISTS contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS details TEXT,
    ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS collection_date DATE,
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS certificate_no TEXT,
    ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS collected_by TEXT;

CREATE INDEX IF NOT EXISTS idx_service_requests_resident_id
    ON service_requests(resident_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_household_id
    ON service_requests(household_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_household_status
    ON service_requests(household_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_service_request_per_resident
    ON service_requests(resident_id, request_type)
    WHERE resident_id IS NOT NULL
      AND status IN ('pending', 'processing', 'ready');

CREATE UNIQUE INDEX IF NOT EXISTS uniq_service_request_certificate_no
    ON service_requests(certificate_no)
    WHERE certificate_no IS NOT NULL;

ALTER TABLE residents
    ADD COLUMN IF NOT EXISTS name_en TEXT,
    ADD COLUMN IF NOT EXISTS father_name TEXT,
    ADD COLUMN IF NOT EXISTS mother_name TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS father_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS mother_id UUID REFERENCES residents(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS spouse_id UUID REFERENCES residents(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS service_request_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    household_document_id UUID REFERENCES household_documents(id) ON DELETE SET NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_documents_request_id
    ON service_request_documents(service_request_id);

CREATE TABLE IF NOT EXISTS service_request_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    actor_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_events_request_id
    ON service_request_events(service_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_households_ward_id
    ON households(ward_id);

CREATE INDEX IF NOT EXISTS idx_locations_parent_type
    ON locations(parent_id, type);

CREATE INDEX IF NOT EXISTS idx_residents_household_id
    ON residents(household_id);

CREATE INDEX IF NOT EXISTS idx_residents_dob
    ON residents(dob);

CREATE INDEX IF NOT EXISTS idx_residents_nid_null
    ON residents(household_id)
    WHERE nid IS NULL;

CREATE INDEX IF NOT EXISTS idx_residents_birth_reg_null
    ON residents(household_id)
    WHERE birth_reg_no IS NULL;

CREATE INDEX IF NOT EXISTS idx_residents_blood_group_null
    ON residents(household_id)
    WHERE blood_group IS NULL;

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit service requests" ON service_requests;
CREATE POLICY "Public can submit service requests"
ON service_requests FOR INSERT
WITH CHECK (
    household_id IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM households h
        WHERE h.id = service_requests.household_id
    )
);

DROP POLICY IF EXISTS "Scoped officers can read service requests" ON service_requests;
CREATE POLICY "Scoped officers can read service requests"
ON service_requests FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = service_requests.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
            WHERE h.id = service_requests.household_id
              AND h.ward_id = village_scope.parent_id
        )
    )
);

DROP POLICY IF EXISTS "Scoped chairmen can update service requests" ON service_requests;
CREATE POLICY "Scoped chairmen can update service requests"
ON service_requests FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = service_requests.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
);

-- -------------------------------------------------------------------------
-- Household tax + receipt schema
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS household_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    due_date DATE,
    paid_date DATE,
    receipt_no TEXT,
    status TEXT DEFAULT 'due' CHECK (status IN ('due', 'partial', 'paid')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_household_taxes_household_id
    ON household_taxes(household_id);

CREATE INDEX IF NOT EXISTS idx_household_taxes_year
    ON household_taxes(year);

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

CREATE OR REPLACE FUNCTION update_tax_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tax_timestamp ON household_taxes;
CREATE TRIGGER trigger_update_tax_timestamp
    BEFORE UPDATE ON household_taxes
    FOR EACH ROW EXECUTE FUNCTION update_tax_updated_at();

-- -------------------------------------------------------------------------
-- Tax scope security
-- -------------------------------------------------------------------------
ALTER TABLE household_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_tax_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read household taxes" ON household_taxes;
CREATE POLICY "Scoped officers can read household taxes"
ON household_taxes FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = village_scope.parent_id
        )
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage household taxes" ON household_taxes;
CREATE POLICY "Scoped officers can manage household taxes"
ON household_taxes FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
);

DROP POLICY IF EXISTS "Scoped officers can read tax payments" ON household_tax_payments;
CREATE POLICY "Scoped officers can read tax payments"
ON household_tax_payments FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM household_taxes t
        JOIN households h ON h.id = t.household_id
        JOIN locations w ON w.id = h.ward_id
        WHERE t.id = household_tax_payments.tax_id
          AND (
            (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND EXISTS (
                    SELECT 1
                    FROM locations village_scope
                    WHERE village_scope.id = public.get_auth_scope_id()
                      AND h.ward_id = village_scope.parent_id
                )
            )
          )
    )
);

DROP POLICY IF EXISTS "Scoped officers can insert tax payments" ON household_tax_payments;
CREATE POLICY "Scoped officers can insert tax payments"
ON household_tax_payments FOR INSERT
TO authenticated
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM household_taxes t
        JOIN households h ON h.id = t.household_id
        JOIN locations w ON w.id = h.ward_id
        WHERE t.id = household_tax_payments.tax_id
          AND (
            (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
          )
    )
);
