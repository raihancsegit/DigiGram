-- Persistent school pilot UAT checklist and sign-off audit trail.
CREATE TABLE IF NOT EXISTS public.school_pilot_signoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL CHECK (item_key IN (
        'teacher_login',
        'student_login',
        'guardian_verify',
        'attendance',
        'fee_receipt',
        'result_card',
        'website_mobile'
    )),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (institution_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_school_pilot_signoffs_institution
    ON public.school_pilot_signoffs(institution_id, completed);

ALTER TABLE public.school_pilot_signoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Institution admins manage pilot signoffs" ON public.school_pilot_signoffs;
CREATE POLICY "Institution admins manage pilot signoffs"
    ON public.school_pilot_signoffs
    FOR ALL TO authenticated
    USING (
        public.get_auth_role() = 'super_admin'
        OR EXISTS (
            SELECT 1
            FROM public.institution_memberships membership
            WHERE membership.institution_id = school_pilot_signoffs.institution_id
              AND membership.profile_id = auth.uid()
              AND membership.member_role = 'admin'
              AND membership.is_active
        )
    )
    WITH CHECK (
        public.get_auth_role() = 'super_admin'
        OR EXISTS (
            SELECT 1
            FROM public.institution_memberships membership
            WHERE membership.institution_id = school_pilot_signoffs.institution_id
              AND membership.profile_id = auth.uid()
              AND membership.member_role = 'admin'
              AND membership.is_active
        )
    );
