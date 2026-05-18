-- DigiGram household tax scope security
-- Chairman: own union only
-- Ward member: own ward only
-- Volunteer: own assigned ward only

ALTER TABLE household_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_tax_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read household taxes" ON household_taxes;
CREATE POLICY "Scoped officers can read household taxes"
ON household_taxes FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = village_scope.parent_id
        )
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage household taxes" ON household_taxes;
CREATE POLICY "Scoped officers can manage household taxes"
ON household_taxes FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM households h
            JOIN locations w ON w.id = h.ward_id
            WHERE h.id = household_taxes.household_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND EXISTS (
            SELECT 1
            FROM households h
            WHERE h.id = household_taxes.household_id
              AND h.ward_id = public.get_auth_scope_id()
        )
    )
);

DROP POLICY IF EXISTS "Scoped officers can read tax payments" ON household_tax_payments;
CREATE POLICY "Scoped officers can read tax payments"
ON household_tax_payments FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM household_taxes t
        JOIN households h ON h.id = t.household_id
        JOIN locations w ON w.id = h.ward_id
        WHERE t.id = household_tax_payments.tax_id
          AND (
            (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND EXISTS (
                    SELECT 1
                    FROM locations village_scope
                    WHERE village_scope.id = public.get_auth_scope_id()
                      AND h.ward_id = village_scope.parent_id
                )
            )
          )
    )
);

DROP POLICY IF EXISTS "Scoped officers can insert tax payments" ON household_tax_payments;
CREATE POLICY "Scoped officers can insert tax payments"
ON household_tax_payments FOR INSERT
TO authenticated
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR EXISTS (
        SELECT 1
        FROM household_taxes t
        JOIN households h ON h.id = t.household_id
        JOIN locations w ON w.id = h.ward_id
        WHERE t.id = household_tax_payments.tax_id
          AND (
            (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
          )
    )
);
