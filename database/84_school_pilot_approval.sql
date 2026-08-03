-- Final approval record after operational readiness and UAT sign-off.
CREATE TABLE IF NOT EXISTS public.school_pilot_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL UNIQUE REFERENCES public.institutions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'revoked')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.school_pilot_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins manage pilot approvals" ON public.school_pilot_approvals;
CREATE POLICY "Super admins manage pilot approvals"
    ON public.school_pilot_approvals FOR ALL TO authenticated
    USING (public.get_auth_role() = 'super_admin')
    WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Institution admins read pilot approvals" ON public.school_pilot_approvals;
CREATE POLICY "Institution admins read pilot approvals"
    ON public.school_pilot_approvals FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.institution_memberships membership
            WHERE membership.institution_id = school_pilot_approvals.institution_id
              AND membership.profile_id = auth.uid()
              AND membership.member_role = 'admin'
              AND membership.is_active
        )
    );
