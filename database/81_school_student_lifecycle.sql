ALTER TABLE public.school_students
 ADD COLUMN IF NOT EXISTS admission_no TEXT, ADD COLUMN IF NOT EXISTS date_of_birth DATE,
 ADD COLUMN IF NOT EXISTS gender TEXT CHECK(gender IS NULL OR gender IN ('male','female','other')),
 ADD COLUMN IF NOT EXISTS birth_registration_no TEXT, ADD COLUMN IF NOT EXISTS blood_group TEXT,
 ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS academic_group TEXT,
 ADD COLUMN IF NOT EXISTS admission_date DATE, ADD COLUMN IF NOT EXISTS completion_date DATE,
 ADD COLUMN IF NOT EXISTS transfer_date DATE, ADD COLUMN IF NOT EXISTS care_profile JSONB NOT NULL DEFAULT '{}',
 ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS uniq_school_student_admission_no ON public.school_students(institution_id,admission_no) WHERE admission_no IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.school_student_documents (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 student_id UUID NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
 document_type TEXT NOT NULL CHECK(document_type IN ('photo','birth_registration','previous_certificate','guardian_id','transfer_certificate','medical','other')),
 title TEXT NOT NULL,file_url TEXT,document_number TEXT,issued_on DATE,expires_on DATE,
 verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending','verified','rejected')),
 verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,verified_at TIMESTAMPTZ,note TEXT,
 created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.school_student_transitions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 student_id UUID NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
 transition_type TEXT NOT NULL CHECK(transition_type IN ('admitted','promoted','repeated','transferred','completed','dropped','restored')),
 from_class_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL,to_class_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL,
 effective_date DATE DEFAULT CURRENT_DATE,certificate_no TEXT,reason TEXT,metadata JSONB DEFAULT '{}',
 performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['school_student_documents','school_student_transitions'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS "Institution admins manage %s" ON public.%I',t,t);
 EXECUTE format('CREATE POLICY "Institution admins manage %s" ON public.%I FOR ALL TO authenticated USING(public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=%I.institution_id AND m.profile_id=auth.uid() AND m.member_role=''admin'' AND m.is_active)) WITH CHECK(public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=%I.institution_id AND m.profile_id=auth.uid() AND m.member_role=''admin'' AND m.is_active))',t,t,t,t);
 END LOOP; END $$;
DROP POLICY IF EXISTS "Students read own documents" ON public.school_student_documents;
CREATE POLICY "Students read own documents"
 ON public.school_student_documents FOR SELECT TO authenticated
 USING (
  EXISTS(
   SELECT 1 FROM public.school_students s
   WHERE s.id=school_student_documents.student_id AND s.profile_id=auth.uid()
  )
 );
DROP POLICY IF EXISTS "Students read own transitions" ON public.school_student_transitions;
CREATE POLICY "Students read own transitions"
 ON public.school_student_transitions FOR SELECT TO authenticated
 USING (
  EXISTS(
   SELECT 1 FROM public.school_students s
   WHERE s.id=school_student_transitions.student_id AND s.profile_id=auth.uid()
  )
 );
CREATE OR REPLACE FUNCTION public.transition_school_student(target_student_id UUID,transition_name TEXT,target_class_id UUID DEFAULT NULL,transition_reason TEXT DEFAULT NULL,transition_date DATE DEFAULT CURRENT_DATE)
RETURNS public.school_students LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.school_students%ROWTYPE; ns TEXT; cert TEXT;
BEGIN
 SELECT * INTO s FROM public.school_students WHERE id=target_student_id FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Student not found'; END IF;
 IF NOT(public.get_auth_role()='super_admin' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=s.institution_id AND m.profile_id=auth.uid() AND m.member_role='admin' AND m.is_active)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF transition_name NOT IN ('promoted','repeated','transferred','completed','dropped','restored') THEN RAISE EXCEPTION 'Invalid transition'; END IF;
 IF transition_name IN ('promoted','repeated') AND target_class_id IS NULL THEN RAISE EXCEPTION 'Target class is required'; END IF;
 IF target_class_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.school_classes c WHERE c.id=target_class_id AND c.institution_id=s.institution_id) THEN RAISE EXCEPTION 'Target class is outside this institution'; END IF;
 ns:=CASE WHEN transition_name IN ('promoted','repeated','restored') THEN 'studying' WHEN transition_name='transferred' THEN 'transferred' WHEN transition_name='completed' THEN 'completed' ELSE 'dropped' END;
 cert:=CASE WHEN transition_name='transferred' THEN 'TC-'||TO_CHAR(NOW(),'YYYYMMDD')||'-'||UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT,'-','') FROM 1 FOR 6)) END;
 INSERT INTO public.school_student_transitions(institution_id,student_id,transition_type,from_class_id,to_class_id,effective_date,certificate_no,reason,performed_by)
 VALUES(s.institution_id,s.id,transition_name,s.class_id,target_class_id,transition_date,cert,transition_reason,auth.uid());
 UPDATE public.school_students SET class_id=COALESCE(target_class_id,class_id),enrollment_status=ns,active=(ns='studying'),
 transfer_date=CASE WHEN transition_name='transferred' THEN transition_date ELSE transfer_date END,
 completion_date=CASE WHEN transition_name='completed' THEN transition_date ELSE completion_date END,updated_at=NOW()
 WHERE id=s.id RETURNING * INTO s;
 IF s.resident_id IS NOT NULL THEN
  UPDATE public.residents SET
   student_status=CASE
    WHEN ns='studying' THEN 'studying'
    WHEN ns='completed' THEN 'completed'
    WHEN ns='dropped' THEN 'dropped'
    ELSE 'not_student'
   END,
   current_institution_id=CASE WHEN ns='studying' THEN s.institution_id ELSE NULL END
  WHERE id=s.resident_id;
 END IF;
 RETURN s;
END $$;
REVOKE ALL ON FUNCTION public.transition_school_student(UUID,TEXT,UUID,TEXT,DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_school_student(UUID,TEXT,UUID,TEXT,DATE) TO authenticated;
