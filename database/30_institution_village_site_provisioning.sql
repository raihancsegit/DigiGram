-- DigiGram institution village + site provisioning upgrade
-- Safe to run more than once after institution profile migration.

ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS village_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS custom_domain TEXT,
    ADD COLUMN IF NOT EXISTS website_status TEXT DEFAULT 'active'
        CHECK (website_status IN ('active', 'paused')),
    ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_institutions_subdomain
    ON institutions (lower(subdomain))
    WHERE subdomain IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_institutions_custom_domain
    ON institutions (lower(custom_domain))
    WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_institutions_village_location_id
    ON institutions(village_location_id);
