-- Publicly verifiable certificate number for approved school pilots.
ALTER TABLE public.school_pilot_approvals
    ADD COLUMN IF NOT EXISTS certificate_no TEXT;

UPDATE public.school_pilot_approvals
SET certificate_no = 'DGP-' || TO_CHAR(approved_at, 'YYYY') || '-' ||
    UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 12))
WHERE certificate_no IS NULL;

ALTER TABLE public.school_pilot_approvals
    ALTER COLUMN certificate_no SET DEFAULT (
        'DGP-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
        UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 12))
    ),
    ALTER COLUMN certificate_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_school_pilot_certificate_no
    ON public.school_pilot_approvals(certificate_no);
