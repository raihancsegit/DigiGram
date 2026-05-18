-- DigiGram household service workflow upgrade
-- Purpose:
-- 1. Link each service request to a resident
-- 2. Store structured preview/application data
-- 3. Support duplicate-pending prevention, collection workflow, and richer auditability

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

-- Optional event history table for a future detailed workflow/audit timeline.
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
