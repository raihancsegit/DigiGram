-- DigiGram data quality command center
-- Safe to run more than once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.data_quality_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_type TEXT NOT NULL CHECK (issue_type IN (
        'missing_identity', 'missing_blood_group', 'missing_gps',
        'missing_village', 'missing_creator', 'duplicate_resident', 'custom'
    )),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('household', 'resident', 'profile')),
    entity_id UUID NOT NULL,
    union_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    ward_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    village_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'dismissed')),
    due_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_quality_tasks_status
    ON public.data_quality_tasks(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_quality_tasks_scope
    ON public.data_quality_tasks(union_id, ward_id, village_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_tasks_assigned_to
    ON public.data_quality_tasks(assigned_to, status);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_data_quality_issue
    ON public.data_quality_tasks(issue_type, entity_type, entity_id)
    WHERE status IN ('open', 'assigned', 'in_progress');

CREATE OR REPLACE FUNCTION public.touch_data_quality_task()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved' THEN
        NEW.resolved_at = COALESCE(NEW.resolved_at, NOW());
    ELSIF NEW.status <> 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_data_quality_task ON public.data_quality_tasks;
CREATE TRIGGER trigger_touch_data_quality_task
    BEFORE UPDATE ON public.data_quality_tasks
    FOR EACH ROW EXECUTE FUNCTION public.touch_data_quality_task();

ALTER TABLE public.data_quality_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read data quality tasks" ON public.data_quality_tasks;
CREATE POLICY "Scoped officers can read data quality tasks"
ON public.data_quality_tasks FOR SELECT TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'chairman' AND union_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'ward_member' AND ward_id = public.get_auth_scope_id())
    OR (
        public.get_auth_role() = 'volunteer'
        AND (village_id = public.get_auth_scope_id() OR assigned_to = auth.uid())
    )
);

DROP POLICY IF EXISTS "Scoped officers can create data quality tasks" ON public.data_quality_tasks;
CREATE POLICY "Scoped officers can create data quality tasks"
ON public.data_quality_tasks FOR INSERT TO authenticated
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'chairman' AND union_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'ward_member' AND ward_id = public.get_auth_scope_id())
);

DROP POLICY IF EXISTS "Scoped officers can update data quality tasks" ON public.data_quality_tasks;
CREATE POLICY "Scoped officers can update data quality tasks"
ON public.data_quality_tasks FOR UPDATE TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'chairman' AND union_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'ward_member' AND ward_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'volunteer' AND assigned_to = auth.uid())
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (public.get_auth_role() = 'chairman' AND union_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'ward_member' AND ward_id = public.get_auth_scope_id())
    OR (public.get_auth_role() = 'volunteer' AND assigned_to = auth.uid())
);

COMMENT ON TABLE public.data_quality_tasks IS
    'Officer correction queue for incomplete, duplicate, and unmapped household data.';
