-- Union-scoped household services, fees and automatic village -> union routing.

CREATE TABLE IF NOT EXISTS public.union_service_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    union_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
    payment_required BOOLEAN NOT NULL DEFAULT FALSE,
    online_payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_days INTEGER NOT NULL DEFAULT 3 CHECK (estimated_days BETWEEN 0 AND 365),
    instructions TEXT,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (union_id, request_type)
);

ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS routed_union_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS routed_ward_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS routed_village_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS service_setting_id UUID REFERENCES public.union_service_settings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS estimated_ready_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_union_service_settings_union_active
    ON public.union_service_settings(union_id, is_active, request_type);
CREATE INDEX IF NOT EXISTS idx_service_requests_routed_union
    ON public.service_requests(routed_union_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.route_household_service_request()
RETURNS TRIGGER AS $$
DECLARE
    target_ward UUID;
    target_village UUID;
    target_union UUID;
    setting public.union_service_settings%ROWTYPE;
BEGIN
    SELECT h.ward_id, h.location_village_id
      INTO target_ward, target_village
      FROM public.households h WHERE h.id = NEW.household_id;

    SELECT parent_id INTO target_union FROM public.locations WHERE id = target_ward;
    NEW.routed_ward_id := target_ward;
    NEW.routed_village_id := target_village;
    NEW.routed_union_id := target_union;

    SELECT * INTO setting
      FROM public.union_service_settings
     WHERE union_id = target_union AND request_type = NEW.request_type AND is_active
     LIMIT 1;

    IF setting.id IS NOT NULL THEN
        NEW.service_setting_id := setting.id;
        NEW.fee_amount := setting.fee_amount;
        NEW.payment_status := CASE
            WHEN setting.payment_required AND setting.fee_amount > 0 THEN 'due'
            ELSE 'not_required'
        END;
        NEW.estimated_ready_at := NOW() + make_interval(days => setting.estimated_days);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_route_household_service_request ON public.service_requests;
CREATE TRIGGER trg_route_household_service_request
BEFORE INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.route_household_service_request();

INSERT INTO public.union_service_settings
    (union_id, request_type, title, fee_amount, payment_required, estimated_days)
SELECT u.id, seed.request_type, seed.title, seed.fee, seed.fee > 0, seed.days
FROM public.locations u
CROSS JOIN (VALUES
    ('birth_registration','জন্ম নিবন্ধন আবেদন',50::numeric,5),
    ('death_certificate','মৃত্যু সনদ আবেদন',50::numeric,3),
    ('warish_certificate','ওয়ারিশ সনদ আবেদন',150::numeric,7),
    ('benefit_support','ভাতা ও সামাজিক সহায়তা',0::numeric,7),
    ('local_problem','এলাকার সমস্যা ও অভিযোগ',0::numeric,3),
    ('emergency_support','জরুরি সহায়তা',0::numeric,1),
    ('document_update','পরিবারের নথি সহায়তা',0::numeric,3),
    ('farmer_support','কৃষক সহায়তা',0::numeric,5),
    ('job_training','কাজ ও প্রশিক্ষণ সহায়তা',0::numeric,7),
    ('health_support','স্বাস্থ্য, মা ও শিশু সহায়তা',0::numeric,2),
    ('education_support','শিক্ষা ও উপবৃত্তি সহায়তা',0::numeric,7),
    ('fee_support','সরকারি ফি ও পেমেন্ট সহায়তা',0::numeric,2)
) AS seed(request_type,title,fee,days)
WHERE u.type = 'union'
ON CONFLICT (union_id, request_type) DO NOTHING;

ALTER TABLE public.union_service_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active union services" ON public.union_service_settings;
CREATE POLICY "Public can read active union services"
ON public.union_service_settings FOR SELECT USING (is_active = TRUE);
GRANT SELECT ON public.union_service_settings TO anon, authenticated;

