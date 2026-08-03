-- School operations foundation: sessions, routines, fees, attendance and payroll.
CREATE TABLE IF NOT EXISTS public.school_academic_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 name TEXT NOT NULL, starts_on DATE NOT NULL, ends_on DATE NOT NULL, is_current BOOLEAN NOT NULL DEFAULT FALSE,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','closed','archived')),
 created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
 CHECK(ends_on>=starts_on), UNIQUE(institution_id,name)
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_school_current_session ON public.school_academic_sessions(institution_id) WHERE is_current;

CREATE TABLE IF NOT EXISTS public.school_routine_periods (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 session_id UUID REFERENCES public.school_academic_sessions(id) ON DELETE CASCADE, class_id UUID NOT NULL REFERENCES public.school_classes(id) ON DELETE CASCADE,
 subject_id UUID REFERENCES public.school_subjects(id) ON DELETE SET NULL, teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
 weekday SMALLINT NOT NULL CHECK(weekday BETWEEN 0 AND 6), period_no SMALLINT NOT NULL CHECK(period_no BETWEEN 1 AND 20),
 starts_at TIME NOT NULL, ends_at TIME NOT NULL, room_label TEXT, activity_type TEXT NOT NULL DEFAULT 'class'
 CHECK(activity_type IN ('class','assembly','break','prayer','lab','activity')), note TEXT, is_active BOOLEAN DEFAULT TRUE,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), CHECK(ends_at>starts_at), UNIQUE(class_id,weekday,period_no)
);

CREATE TABLE IF NOT EXISTS public.school_fee_types (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 name TEXT NOT NULL, code TEXT, amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(amount>=0),
 frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(frequency IN ('one_time','monthly','quarterly','half_yearly','yearly')),
 class_id UUID REFERENCES public.school_classes(id) ON DELETE CASCADE, is_optional BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(institution_id,name,class_id)
);
CREATE TABLE IF NOT EXISTS public.school_fee_invoices (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 session_id UUID REFERENCES public.school_academic_sessions(id) ON DELETE SET NULL, student_id UUID NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
 class_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL,
 invoice_no TEXT NOT NULL UNIQUE DEFAULT ('SF-'||TO_CHAR(NOW(),'YYYYMMDD')||'-'||UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT,'-','') FROM 1 FOR 8))),
 billing_month DATE, due_date DATE, subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(subtotal>=0),
 discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(discount_amount>=0), fine_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(fine_amount>=0),
 payable_amount NUMERIC(12,2) GENERATED ALWAYS AS (GREATEST(subtotal-discount_amount+fine_amount,0)) STORED,
 paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(paid_amount>=0), status TEXT NOT NULL DEFAULT 'due'
 CHECK(status IN ('draft','due','partial','paid','waived','cancelled')), line_items JSONB NOT NULL DEFAULT '[]', note TEXT,
 created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.school_fee_payments (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 invoice_id UUID NOT NULL REFERENCES public.school_fee_invoices(id) ON DELETE CASCADE, student_id UUID NOT NULL REFERENCES public.school_students(id) ON DELETE CASCADE,
 receipt_no TEXT NOT NULL UNIQUE DEFAULT ('SR-'||TO_CHAR(NOW(),'YYYYMMDD')||'-'||UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT,'-','') FROM 1 FOR 8))),
 amount NUMERIC(12,2) NOT NULL CHECK(amount>0), payment_method TEXT NOT NULL DEFAULT 'cash'
 CHECK(payment_method IN ('cash','bank','bkash','nagad','rocket','card','other')), transaction_reference TEXT, paid_at TIMESTAMPTZ DEFAULT NOW(),
 received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.school_staff_attendance (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, attendance_date DATE NOT NULL,
 status TEXT NOT NULL DEFAULT 'present' CHECK(status IN ('present','absent','late','leave','half_day')),
 check_in_at TIMESTAMPTZ, check_out_at TIMESTAMPTZ, note TEXT, marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(institution_id,profile_id,attendance_date)
);
CREATE TABLE IF NOT EXISTS public.school_payroll_runs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 payroll_month DATE NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','paid','cancelled')),
 total_amount NUMERIC(12,2) DEFAULT 0 CHECK(total_amount>=0), approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
 approved_at TIMESTAMPTZ, created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(institution_id,payroll_month)
);
CREATE TABLE IF NOT EXISTS public.school_payroll_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), payroll_run_id UUID NOT NULL REFERENCES public.school_payroll_runs(id) ON DELETE CASCADE,
 institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE, profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 base_salary NUMERIC(12,2) DEFAULT 0 CHECK(base_salary>=0), allowance_amount NUMERIC(12,2) DEFAULT 0 CHECK(allowance_amount>=0),
 deduction_amount NUMERIC(12,2) DEFAULT 0 CHECK(deduction_amount>=0),
 payable_amount NUMERIC(12,2) GENERATED ALWAYS AS (GREATEST(base_salary+allowance_amount-deduction_amount,0)) STORED,
 payment_status TEXT DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','partial','paid','held')), paid_at TIMESTAMPTZ, note TEXT,
 created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(payroll_run_id,profile_id)
);

DO $$ DECLARE t TEXT; BEGIN
 FOREACH t IN ARRAY ARRAY['school_academic_sessions','school_routine_periods','school_fee_types','school_fee_invoices','school_fee_payments','school_staff_attendance','school_payroll_runs','school_payroll_entries']
 LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('DROP POLICY IF EXISTS "Institution admins manage %s" ON public.%I',t,t);
  EXECUTE format('CREATE POLICY "Institution admins manage %s" ON public.%I FOR ALL TO authenticated USING (public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships im WHERE im.institution_id=%I.institution_id AND im.profile_id=auth.uid() AND im.member_role=''admin'' AND im.is_active)) WITH CHECK (public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships im WHERE im.institution_id=%I.institution_id AND im.profile_id=auth.uid() AND im.member_role=''admin'' AND im.is_active))',t,t,t,t);
 END LOOP;
END $$;

DROP POLICY IF EXISTS "Institution members read school routines" ON public.school_routine_periods;
CREATE POLICY "Institution members read school routines"
 ON public.school_routine_periods FOR SELECT TO authenticated
 USING (
  public.get_auth_role()='super_admin'
  OR EXISTS(
   SELECT 1 FROM public.institution_memberships m
   WHERE m.institution_id=school_routine_periods.institution_id
    AND m.profile_id=auth.uid() AND m.is_active
  )
 );

DROP POLICY IF EXISTS "Students read own fee invoices" ON public.school_fee_invoices;
CREATE POLICY "Students read own fee invoices"
 ON public.school_fee_invoices FOR SELECT TO authenticated
 USING (
  EXISTS(
   SELECT 1 FROM public.school_students s
   WHERE s.id=school_fee_invoices.student_id AND s.profile_id=auth.uid()
  )
 );

DROP POLICY IF EXISTS "Students read own fee payments" ON public.school_fee_payments;
CREATE POLICY "Students read own fee payments"
 ON public.school_fee_payments FOR SELECT TO authenticated
 USING (
  EXISTS(
   SELECT 1 FROM public.school_students s
   WHERE s.id=school_fee_payments.student_id AND s.profile_id=auth.uid()
  )
 );

CREATE OR REPLACE FUNCTION public.record_school_fee_payment(target_invoice_id UUID,payment_amount NUMERIC,payment_method_name TEXT DEFAULT 'cash',transaction_ref TEXT DEFAULT NULL,payment_note TEXT DEFAULT NULL)
RETURNS public.school_fee_payments LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.school_fee_invoices%ROWTYPE; p public.school_fee_payments%ROWTYPE; n NUMERIC;
BEGIN
 SELECT * INTO i FROM public.school_fee_invoices WHERE id=target_invoice_id FOR UPDATE;
 IF i.id IS NULL THEN RAISE EXCEPTION 'Fee invoice not found'; END IF;
 IF NOT(public.get_auth_role()='super_admin' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=i.institution_id AND m.profile_id=auth.uid() AND m.member_role='admin' AND m.is_active)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 IF payment_amount<=0 OR i.status IN ('paid','waived','cancelled') THEN RAISE EXCEPTION 'Payment cannot be recorded'; END IF;
 INSERT INTO public.school_fee_payments(institution_id,invoice_id,student_id,amount,payment_method,transaction_reference,received_by,note)
 VALUES(i.institution_id,i.id,i.student_id,payment_amount,payment_method_name,transaction_ref,auth.uid(),payment_note) RETURNING * INTO p;
 n:=i.paid_amount+payment_amount;
 UPDATE public.school_fee_invoices SET paid_amount=n,status=CASE WHEN n>=payable_amount THEN 'paid' ELSE 'partial' END,updated_at=NOW() WHERE id=i.id;
 RETURN p;
END $$;
REVOKE ALL ON FUNCTION public.record_school_fee_payment(UUID,NUMERIC,TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_school_fee_payment(UUID,NUMERIC,TEXT,TEXT,TEXT) TO authenticated;
