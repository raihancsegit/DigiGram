-- DigiGram: household edit scope hardening
-- Safe to run more than once in Supabase SQL Editor.
--
-- Goal:
-- - Chairman/super_admin can still read scoped household data through existing
--   SELECT policies, but client-side edit/delete is limited to:
--   1. the ward member of the household ward
--   2. the volunteer assigned to the exact village/location of the household
-- - Server-side service_role maintenance can still bypass RLS when needed.

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.household_is_in_auth_village(
    target_ward_id UUID,
    target_village_id UUID,
    target_location_village_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    IF target_location_village_id IS NOT NULL THEN
        RETURN target_location_village_id = public.get_auth_scope_id();
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM villages hv
        JOIN locations lv
          ON lv.parent_id = target_ward_id
         AND lv.type = 'village'
         AND lv.id = public.get_auth_scope_id()
        WHERE hv.id = target_village_id
          AND (
            hv.bn_name = lv.name_bn
            OR hv.name = lv.name_en
            OR hv.name = lv.name_bn
          )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.household_is_in_auth_village(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.household_is_in_auth_village(UUID, UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Scoped officers can manage households" ON households;
CREATE POLICY "Scoped officers can manage households"
ON households FOR ALL
TO authenticated
USING (
    (
        public.get_auth_role() = 'ward_member'
        AND households.ward_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND public.household_is_in_auth_village(
            households.ward_id,
            households.village_id,
            households.location_village_id
        )
    )
)
WITH CHECK (
    (
        public.get_auth_role() = 'ward_member'
        AND households.ward_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'volunteer'
        AND public.household_is_in_auth_village(
            households.ward_id,
            households.village_id,
            households.location_village_id
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
        WHERE h.id = residents.household_id
          AND (
            (
                public.get_auth_role() = 'ward_member'
                AND h.ward_id = public.get_auth_scope_id()
            )
            OR (
                public.get_auth_role() = 'volunteer'
                AND public.household_is_in_auth_village(
                    h.ward_id,
                    h.village_id,
                    h.location_village_id
                )
            )
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM households h
        WHERE h.id = residents.household_id
          AND (
            (
                public.get_auth_role() = 'ward_member'
                AND h.ward_id = public.get_auth_scope_id()
            )
            OR (
                public.get_auth_role() = 'volunteer'
                AND public.household_is_in_auth_village(
                    h.ward_id,
                    h.village_id,
                    h.location_village_id
                )
            )
          )
    )
);

COMMENT ON POLICY "Scoped officers can manage households" ON households IS
    'Only the household ward member or exact village volunteer can insert/update/delete households from client sessions.';

COMMENT ON POLICY "Scoped officers can manage residents" ON residents IS
    'Resident edits follow the parent household ward/village edit scope.';
