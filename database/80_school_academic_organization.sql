ALTER TABLE public.school_classes
 ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.school_academic_sessions(id) ON DELETE SET NULL,
 ADD COLUMN IF NOT EXISTS group_name TEXT, ADD COLUMN IF NOT EXISTS shift_name TEXT,
 ADD COLUMN IF NOT EXISTS room_label TEXT, ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK(capacity IS NULL OR capacity>0),
 ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE, ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_school_classes_session ON public.school_classes(institution_id,session_id,is_active);
CREATE OR REPLACE FUNCTION public.activate_school_academic_session(target_session_id UUID)
RETURNS public.school_academic_sessions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.school_academic_sessions%ROWTYPE;
BEGIN
 SELECT * INTO s FROM public.school_academic_sessions WHERE id=target_session_id;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Academic session not found'; END IF;
 IF NOT(public.get_auth_role()='super_admin' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=s.institution_id AND m.profile_id=auth.uid() AND m.member_role='admin' AND m.is_active)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 UPDATE public.school_academic_sessions SET is_current=FALSE,updated_at=NOW() WHERE institution_id=s.institution_id AND is_current;
 UPDATE public.school_academic_sessions SET is_current=TRUE,status='active',updated_at=NOW() WHERE id=s.id RETURNING * INTO s;
 RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.activate_school_academic_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_school_academic_session(UUID) TO authenticated;
