-- Household certificate service upgrade
-- Adds fee defaults and indexes for family-tree based certificate applications.

CREATE TABLE IF NOT EXISTS public.service_fee_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    default_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_required BOOLEAN NOT NULL DEFAULT TRUE,
    required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS applicant_relation TEXT;

CREATE INDEX IF NOT EXISTS idx_service_requests_contact_payment
    ON public.service_requests(contact_phone, payment_status)
    WHERE fee_amount IS NOT NULL AND fee_amount > 0;

CREATE INDEX IF NOT EXISTS idx_service_requests_type_status_payment
    ON public.service_requests(request_type, status, payment_status);

INSERT INTO public.service_fee_settings (
    request_type,
    title,
    default_fee,
    payment_required,
    required_documents
) VALUES
    (
        'birth_registration',
        'জন্ম নিবন্ধন আবেদন',
        50,
        TRUE,
        '["জন্ম তারিখ", "পিতা-মাতার নাম", "আবেদনকারীর মোবাইল"]'::jsonb
    ),
    (
        'death_certificate',
        'মৃত্যু সনদ আবেদন',
        50,
        TRUE,
        '["মৃত ব্যক্তির নাম", "মৃত্যুর তারিখ", "মৃত্যুর স্থান", "আবেদনকারীর মোবাইল"]'::jsonb
    ),
    (
        'warish_certificate',
        'ওয়ারিশ সনদ আবেদন',
        150,
        TRUE,
        '["যার ওয়ারিশ সনদ", "ওয়ারিশদের নাম", "সম্পর্ক", "আবেদনকারীর মোবাইল"]'::jsonb
    )
ON CONFLICT (request_type) DO UPDATE SET
    title = EXCLUDED.title,
    default_fee = EXCLUDED.default_fee,
    payment_required = EXCLUDED.payment_required,
    required_documents = EXCLUDED.required_documents,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION public.get_household_locker_service_requests(
    lookup_value TEXT,
    candidate_pin TEXT
)
RETURNS JSONB AS $$
DECLARE
    target_household households%ROWTYPE;
BEGIN
    IF NOT public.verify_household_locker_pin(lookup_value, candidate_pin) THEN
        RAISE EXCEPTION 'Invalid locker PIN';
    END IF;

    SELECT *
    INTO target_household
    FROM households
    WHERE id::text = lookup_value
       OR qr_code_id = lookup_value
    LIMIT 1;

    IF target_household.id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(to_jsonb(sr) ORDER BY sr.created_at DESC)
        FROM service_requests sr
        WHERE sr.household_id = target_household.id
    ), '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_household_locker_service_requests(TEXT, TEXT) TO anon, authenticated;
