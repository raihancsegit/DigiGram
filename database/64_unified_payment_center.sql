-- DigiGram unified payment center
-- Safe to run more than once after household tax, service request and SMS migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE CHECK (provider IN ('bkash', 'nagad', 'rocket', 'bank', 'cash', 'mock')),
    display_name TEXT NOT NULL,
    account_number TEXT,
    instructions TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.payment_gateways (
    provider,
    display_name,
    instructions,
    is_active,
    test_mode
)
VALUES
    ('bkash', 'bKash', 'Payment করে transaction ID জমা দিন।', FALSE, TRUE),
    ('nagad', 'Nagad', 'Payment করে transaction ID জমা দিন।', FALSE, TRUE),
    ('cash', 'Union office cash', 'Union office counter-এ payment করুন।', TRUE, FALSE),
    ('mock', 'Demo payment', 'Development ও training-এর জন্য।', FALSE, TRUE)
ON CONFLICT (provider) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_no TEXT NOT NULL UNIQUE DEFAULT (
        'DGP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
        UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 8))
    ),
    payer_phone TEXT NOT NULL,
    payer_name TEXT,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    provider TEXT NOT NULL,
    provider_transaction_id TEXT,
    reference_type TEXT NOT NULL CHECK (
        reference_type IN ('household_tax', 'service_request', 'sms_recharge', 'donation', 'other')
    ),
    reference_id UUID,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'verified', 'rejected', 'refunded')
    ),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_phone
    ON public.payment_transactions(payer_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
    ON public.payment_transactions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference
    ON public.payment_transactions(reference_type, reference_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_provider_transaction
    ON public.payment_transactions(provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL
      AND provider_transaction_id <> '';

ALTER TABLE public.service_requests
    ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required'
        CHECK (payment_status IN ('not_required', 'due', 'partial', 'paid'));

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active gateways are publicly readable" ON public.payment_gateways;
CREATE POLICY "Active gateways are publicly readable"
ON public.payment_gateways FOR SELECT
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Super admins manage payment gateways" ON public.payment_gateways;
CREATE POLICY "Super admins manage payment gateways"
ON public.payment_gateways FOR ALL
TO authenticated
USING (public.get_auth_role() = 'super_admin')
WITH CHECK (public.get_auth_role() = 'super_admin');

DROP POLICY IF EXISTS "Scoped officers read payment transactions" ON public.payment_transactions;
CREATE POLICY "Scoped officers read payment transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        reference_type = 'household_tax'
        AND EXISTS (
            SELECT 1
            FROM public.household_taxes t
            JOIN public.households h ON h.id = t.household_id
            JOIN public.locations w ON w.id = h.ward_id
            WHERE t.id = payment_transactions.reference_id
              AND (
                  (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
                  OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
              )
        )
    )
);

CREATE OR REPLACE FUNCTION public.approve_payment_transaction(
    target_payment_id UUID,
    reviewer_id UUID,
    reviewer_note TEXT DEFAULT NULL
)
RETURNS public.payment_transactions AS $$
DECLARE
    payment public.payment_transactions%ROWTYPE;
    tax_row public.household_taxes%ROWTYPE;
    next_paid DECIMAL(12,2);
    receipt_id UUID;
BEGIN
    SELECT *
    INTO payment
    FROM public.payment_transactions
    WHERE id = target_payment_id
    FOR UPDATE;

    IF payment.id IS NULL THEN
        RAISE EXCEPTION 'Payment transaction not found';
    END IF;

    IF payment.status <> 'pending' THEN
        RAISE EXCEPTION 'Payment transaction has already been reviewed';
    END IF;

    IF payment.reference_type = 'household_tax' THEN
        SELECT *
        INTO tax_row
        FROM public.household_taxes
        WHERE id = payment.reference_id
        FOR UPDATE;

        IF tax_row.id IS NULL THEN
            RAISE EXCEPTION 'Household tax record not found';
        END IF;

        next_paid := LEAST(
            COALESCE(tax_row.amount_due, 0),
            COALESCE(tax_row.amount_paid, 0) + payment.amount
        );

        INSERT INTO public.household_tax_payments (
            tax_id,
            amount,
            receipt_no,
            paid_date,
            collected_by,
            payment_method,
            notes,
            created_by
        )
        VALUES (
            tax_row.id,
            payment.amount,
            payment.payment_no,
            CURRENT_DATE,
            'DigiGram Payment Center',
            payment.provider,
            COALESCE(reviewer_note, payment.description),
            reviewer_id
        )
        RETURNING id INTO receipt_id;

        UPDATE public.household_taxes
        SET amount_paid = next_paid,
            paid_date = CURRENT_DATE,
            receipt_no = payment.payment_no,
            status = CASE
                WHEN next_paid >= COALESCE(amount_due, 0) THEN 'paid'
                WHEN next_paid > 0 THEN 'partial'
                ELSE 'due'
            END,
            updated_at = NOW()
        WHERE id = tax_row.id;

        payment.metadata := payment.metadata || jsonb_build_object(
            'tax_payment_id', receipt_id,
            'receipt_no', payment.payment_no
        );
    ELSIF payment.reference_type = 'service_request' THEN
        UPDATE public.service_requests
        SET amount_paid = LEAST(COALESCE(fee_amount, 0), COALESCE(amount_paid, 0) + payment.amount),
            payment_status = CASE
                WHEN COALESCE(amount_paid, 0) + payment.amount >= COALESCE(fee_amount, 0) THEN 'paid'
                WHEN COALESCE(amount_paid, 0) + payment.amount > 0 THEN 'partial'
                ELSE 'due'
            END
        WHERE id = payment.reference_id;
    END IF;

    UPDATE public.payment_transactions
    SET status = 'verified',
        reviewed_by = reviewer_id,
        reviewed_at = NOW(),
        review_note = reviewer_note,
        metadata = payment.metadata,
        updated_at = NOW()
    WHERE id = payment.id
    RETURNING * INTO payment;

    RETURN payment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.approve_payment_transaction(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_payment_transaction(UUID, UUID, TEXT) TO service_role;

COMMENT ON TABLE public.payment_transactions IS
    'Unified citizen and organization payment submissions awaiting officer verification.';
