CREATE TABLE IF NOT EXISTS public.school_staff_compensation (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,base_salary NUMERIC(12,2) DEFAULT 0 CHECK(base_salary>=0),
 allowance_amount NUMERIC(12,2) DEFAULT 0 CHECK(allowance_amount>=0),effective_from DATE DEFAULT CURRENT_DATE,
 is_active BOOLEAN DEFAULT TRUE,note TEXT,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW(),UNIQUE(institution_id,profile_id)
);
CREATE TABLE IF NOT EXISTS public.school_finance_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
 entry_date DATE DEFAULT CURRENT_DATE,entry_type TEXT NOT NULL CHECK(entry_type IN ('income','expense')),category TEXT NOT NULL,
 amount NUMERIC(12,2) NOT NULL CHECK(amount>0),payment_method TEXT DEFAULT 'cash'
 CHECK(payment_method IN ('cash','bank','bkash','nagad','rocket','card','other')),reference_type TEXT,reference_id UUID,
 description TEXT,recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,created_at TIMESTAMPTZ DEFAULT NOW()
);
DO $$ DECLARE t TEXT; BEGIN FOREACH t IN ARRAY ARRAY['school_staff_compensation','school_finance_entries'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS "Institution admins manage %s" ON public.%I',t,t);
 EXECUTE format('CREATE POLICY "Institution admins manage %s" ON public.%I FOR ALL TO authenticated USING(public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=%I.institution_id AND m.profile_id=auth.uid() AND m.member_role=''admin'' AND m.is_active)) WITH CHECK(public.get_auth_role()=''super_admin'' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=%I.institution_id AND m.profile_id=auth.uid() AND m.member_role=''admin'' AND m.is_active))',t,t,t,t);
 END LOOP; END $$;
CREATE OR REPLACE FUNCTION public.generate_school_payroll(target_institution_id UUID,target_month DATE)
RETURNS public.school_payroll_runs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.school_payroll_runs%ROWTYPE;
BEGIN
 IF NOT(public.get_auth_role()='super_admin' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=target_institution_id AND m.profile_id=auth.uid() AND m.member_role='admin' AND m.is_active)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 INSERT INTO public.school_payroll_runs(institution_id,payroll_month,status,created_by) VALUES(target_institution_id,DATE_TRUNC('month',target_month)::DATE,'draft',auth.uid())
 ON CONFLICT(institution_id,payroll_month) DO UPDATE SET updated_at=NOW() RETURNING * INTO r;
 INSERT INTO public.school_payroll_entries(payroll_run_id,institution_id,profile_id,base_salary,allowance_amount)
 SELECT r.id,c.institution_id,c.profile_id,c.base_salary,c.allowance_amount FROM public.school_staff_compensation c
 WHERE c.institution_id=target_institution_id AND c.is_active
 ON CONFLICT(payroll_run_id,profile_id) DO UPDATE SET base_salary=EXCLUDED.base_salary,allowance_amount=EXCLUDED.allowance_amount,updated_at=NOW();
 UPDATE public.school_payroll_runs SET total_amount=(SELECT COALESCE(SUM(e.payable_amount),0) FROM public.school_payroll_entries e WHERE e.payroll_run_id=r.id),updated_at=NOW() WHERE id=r.id RETURNING * INTO r;
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.mark_school_payroll_paid(target_payroll_id UUID)
RETURNS public.school_payroll_runs LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r public.school_payroll_runs%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.school_payroll_runs WHERE id=target_payroll_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Payroll not found'; END IF;
 IF NOT(public.get_auth_role()='super_admin' OR EXISTS(SELECT 1 FROM public.institution_memberships m WHERE m.institution_id=r.institution_id AND m.profile_id=auth.uid() AND m.member_role='admin' AND m.is_active)) THEN RAISE EXCEPTION 'Not authorized'; END IF;
 UPDATE public.school_payroll_entries SET payment_status='paid',paid_at=NOW(),updated_at=NOW() WHERE payroll_run_id=r.id;
 UPDATE public.school_payroll_runs SET status='paid',approved_by=auth.uid(),approved_at=NOW(),updated_at=NOW() WHERE id=r.id RETURNING * INTO r;
 INSERT INTO public.school_finance_entries(institution_id,entry_type,category,amount,payment_method,reference_type,reference_id,description,recorded_by)
 SELECT r.institution_id,'expense','staff_payroll',r.total_amount,'bank','school_payroll',r.id,TO_CHAR(r.payroll_month,'YYYY-MM')||' payroll',auth.uid()
 WHERE r.total_amount>0 AND NOT EXISTS(SELECT 1 FROM public.school_finance_entries f WHERE f.reference_type='school_payroll' AND f.reference_id=r.id);
 RETURN r;
END $$;
CREATE OR REPLACE FUNCTION public.validate_school_fee_payment_amount() RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
DECLARE i public.school_fee_invoices%ROWTYPE; BEGIN SELECT * INTO i FROM public.school_fee_invoices WHERE id=NEW.invoice_id FOR UPDATE;
 IF i.id IS NULL OR NEW.student_id<>i.student_id OR NEW.institution_id<>i.institution_id THEN RAISE EXCEPTION 'Payment scope does not match invoice'; END IF;
 IF NEW.amount>GREATEST(i.payable_amount-i.paid_amount,0) THEN RAISE EXCEPTION 'Payment exceeds outstanding amount'; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_validate_school_fee_payment ON public.school_fee_payments;
CREATE TRIGGER trg_validate_school_fee_payment BEFORE INSERT ON public.school_fee_payments FOR EACH ROW EXECUTE FUNCTION public.validate_school_fee_payment_amount();
CREATE OR REPLACE FUNCTION public.log_school_fee_payment_income() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN INSERT INTO public.school_finance_entries(institution_id,entry_date,entry_type,category,amount,payment_method,reference_type,reference_id,description,recorded_by)
 VALUES(NEW.institution_id,NEW.paid_at::DATE,'income','student_fee',NEW.amount,NEW.payment_method,'school_fee_payment',NEW.id,'Fee receipt '||NEW.receipt_no,NEW.received_by); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_school_fee_payment_income ON public.school_fee_payments;
CREATE TRIGGER trg_school_fee_payment_income AFTER INSERT ON public.school_fee_payments FOR EACH ROW EXECUTE FUNCTION public.log_school_fee_payment_income();
REVOKE ALL ON FUNCTION public.generate_school_payroll(UUID,DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_school_payroll_paid(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_school_payroll(UUID,DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_school_payroll_paid(UUID) TO authenticated;
