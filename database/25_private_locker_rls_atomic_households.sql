-- DigiGram private locker + scoped household access + atomic identifiers
-- Run after 24_security_role_volunteer_hardening.sql

ALTER TABLE household_documents
    ADD COLUMN IF NOT EXISTS file_path TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE household_documents
    ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE households
    ADD COLUMN IF NOT EXISTS location_village_id UUID REFERENCES locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_households_location_village_id
    ON households(location_village_id);

UPDATE households h
SET location_village_id = lv.id
FROM villages v
JOIN locations lv
  ON lv.parent_id = v.ward_id
 AND lv.type = 'village'
 AND (
    lv.name_bn = v.bn_name
    OR lv.name_en = v.name
    OR lv.name_bn = v.name
 )
WHERE h.village_id = v.id
  AND h.location_village_id IS NULL;

UPDATE storage.buckets
SET public = false
WHERE id = 'household_documents';

-- Private document metadata. Actual public locker access now goes through signed-url APIs.
ALTER TABLE household_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON household_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON household_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON household_documents;

CREATE POLICY "Scoped officers can read household documents"
ON household_documents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM households h
        LEFT JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
        LEFT JOIN locations ward_scope ON ward_scope.id = h.ward_id
        WHERE h.id = household_documents.household_id
          AND (
            public.get_auth_role() = 'super_admin'
            OR (public.get_auth_role() = 'chairman' AND ward_scope.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND h.location_village_id = public.get_auth_scope_id()
            )
          )
    )
);

-- Public data access should go through explicit RPC functions, not raw table reads.
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scoped officers can read households" ON households;
CREATE POLICY "Scoped officers can read households"
ON households FOR SELECT
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND EXISTS (
            SELECT 1
            FROM locations w
            WHERE w.id = households.ward_id
              AND w.parent_id = public.get_auth_scope_id()
        )
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND households.ward_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND households.location_village_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage households" ON households;
CREATE POLICY "Scoped officers can manage households"
ON households FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'ward_member'
        AND households.ward_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND households.location_village_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'ward_member'
        AND households.ward_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND households.location_village_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Scoped officers can read residents" ON residents;
CREATE POLICY "Scoped officers can read residents"
ON residents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM households h
        LEFT JOIN locations w ON w.id = h.ward_id
        LEFT JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
        WHERE h.id = residents.household_id
          AND (
            public.get_auth_role() = 'super_admin'
            OR (public.get_auth_role() = 'chairman' AND w.parent_id = public.get_auth_scope_id())
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND h.location_village_id = public.get_auth_scope_id()
            )
          )
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage residents" ON residents;
CREATE POLICY "Scoped officers can manage residents"
ON residents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM households h
        LEFT JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
        WHERE h.id = residents.household_id
          AND (
            public.get_auth_role() = 'super_admin'
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND h.location_village_id = public.get_auth_scope_id()
            )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM households h
        LEFT JOIN locations village_scope ON village_scope.id = public.get_auth_scope_id()
        WHERE h.id = residents.household_id
          AND (
            public.get_auth_role() = 'super_admin'
            OR (public.get_auth_role() = 'ward_member' AND h.ward_id = public.get_auth_scope_id())
            OR (
                public.get_auth_role() = 'volunteer'
                AND h.location_village_id = public.get_auth_scope_id()
            )
          )
    )
);

CREATE OR REPLACE FUNCTION public.get_public_household_profile(lookup_value TEXT)
RETURNS JSONB AS $$
DECLARE
    target_household households%ROWTYPE;
BEGIN
    SELECT *
    INTO target_household
    FROM households
    WHERE id::text = lookup_value
       OR qr_code_id = lookup_value
    LIMIT 1;

    IF target_household.id IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jsonb_build_object(
        'id', target_household.id,
        'village_id', target_household.village_id,
        'ward_id', target_household.ward_id,
        'house_no', target_household.house_no,
        'owner_name', target_household.owner_name,
        'qr_code_id', target_household.qr_code_id,
        'stats', target_household.stats,
        'village', (
            SELECT jsonb_build_object('name', v.name, 'bn_name', v.bn_name)
            FROM villages v
            WHERE v.id = target_household.village_id
        ),
        'residents_summary', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'gender', r.gender,
                'blood_group', r.blood_group,
                'is_voter', r.is_voter
            ))
            FROM residents r
            WHERE r.household_id = target_household.id
        ), '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_full_household_profile(
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
        RETURN NULL;
    END IF;

    RETURN to_jsonb(target_household) - 'locker_pin' - 'locker_pin_hash'
        || jsonb_build_object(
            'village', (
                SELECT jsonb_build_object('name', v.name, 'bn_name', v.bn_name)
                FROM villages v
                WHERE v.id = target_household.village_id
            ),
            'residents', COALESCE((
                SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at)
                FROM residents r
                WHERE r.household_id = target_household.id
            ), '[]'::jsonb)
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_household_profile(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_full_household_profile(TEXT, TEXT) TO anon, authenticated;

-- Public blood bank uses a deliberately limited view instead of raw resident rows.
CREATE OR REPLACE VIEW public_blood_donors AS
SELECT
    r.id,
    r.name,
    r.gender,
    r.blood_group,
    r.dob,
    h.id AS household_id,
    h.phone,
    h.house_no,
    h.village_id,
    h.ward_id,
    v.name AS village_name,
    v.bn_name AS village_bn_name,
    w.name_en AS ward_name_en,
    w.name_bn AS ward_name_bn,
    u.id AS union_id,
    u.name_en AS union_name_en,
    u.name_bn AS union_name_bn
FROM residents r
JOIN households h ON h.id = r.household_id
LEFT JOIN villages v ON v.id = h.village_id
LEFT JOIN locations w ON w.id = h.ward_id
LEFT JOIN locations u ON u.id = w.parent_id
WHERE r.blood_group IS NOT NULL
  AND r.blood_group <> ''
  AND r.blood_group <> 'Unknown';

GRANT SELECT ON public_blood_donors TO anon, authenticated;

-- Collision-safe household numbering.
CREATE TABLE IF NOT EXISTS household_serial_counters (
    village_id UUID PRIMARY KEY REFERENCES villages(id) ON DELETE CASCADE,
    last_serial INTEGER NOT NULL DEFAULT 0
);

INSERT INTO household_serial_counters (village_id, last_serial)
SELECT village_id, COUNT(*)::INTEGER
FROM households
WHERE village_id IS NOT NULL
GROUP BY village_id
ON CONFLICT (village_id)
DO UPDATE SET last_serial = GREATEST(
    household_serial_counters.last_serial,
    EXCLUDED.last_serial
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_households_village_house_no
    ON households(village_id, house_no)
    WHERE house_no IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reserve_household_identifiers(
    target_ward_id UUID,
    target_village_id UUID,
    target_location_village_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    union_slug TEXT;
    ward_number TEXT;
    village_label TEXT;
    union_prefix TEXT;
    village_prefix TEXT;
    next_serial INTEGER;
BEGIN
    SELECT parent.slug, COALESCE(NULLIF(regexp_replace(w.name_en, '\D', '', 'g'), ''), '1')
    INTO union_slug, ward_number
    FROM locations w
    LEFT JOIN locations parent ON parent.id = w.parent_id
    WHERE w.id = target_ward_id;

    SELECT COALESCE(lv.name_en, lv.slug, v.name, v.bn_name, 'VILL')
    INTO village_label
    FROM villages v
    LEFT JOIN locations lv ON lv.id = target_location_village_id
    WHERE v.id = target_village_id;

    union_prefix := upper(left(regexp_replace(COALESCE(union_slug, 'UNK'), '[^A-Za-z0-9]', '', 'g'), 3));
    village_prefix := upper(left(regexp_replace(COALESCE(village_label, 'VILL'), '\s+', '', 'g'), 4));

    INSERT INTO household_serial_counters (village_id, last_serial)
    VALUES (target_village_id, 1)
    ON CONFLICT (village_id)
    DO UPDATE SET last_serial = household_serial_counters.last_serial + 1
    RETURNING last_serial INTO next_serial;

    RETURN jsonb_build_object(
        'serial', next_serial,
        'house_no', format('%s-W%s-%s', village_prefix, lpad(ward_number, 2, '0'), lpad(next_serial::text, 3, '0')),
        'qr_code_id', format('%s-W%s-%s-%s', union_prefix, lpad(ward_number, 2, '0'), village_prefix, lpad(next_serial::text, 3, '0'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reserve_household_identifiers(UUID, UUID, UUID) TO authenticated;
