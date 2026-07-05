-- DigiGram safe demo data registry
-- Run after database/72_citizen_governance_center.sql.
-- Every generated row is registered so cleanup never touches real data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.demo_data_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('creating', 'active', 'removing', 'removed', 'failed')),
    scope_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.demo_data_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES public.demo_data_batches(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    delete_order INTEGER NOT NULL DEFAULT 100,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, table_name, record_id)
);

CREATE INDEX IF NOT EXISTS idx_demo_data_batches_status
    ON public.demo_data_batches(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demo_data_records_cleanup
    ON public.demo_data_records(batch_id, delete_order DESC, created_at DESC);

ALTER TABLE public.demo_data_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_data_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage demo batches" ON public.demo_data_batches;
CREATE POLICY "Super admins manage demo batches"
ON public.demo_data_batches FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Super admins manage demo records" ON public.demo_data_records;
CREATE POLICY "Super admins manage demo records"
ON public.demo_data_records FOR ALL TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

COMMENT ON TABLE public.demo_data_records IS
    'Exact rows created by one-click demo seeding. Cleanup deletes only these registered IDs.';
