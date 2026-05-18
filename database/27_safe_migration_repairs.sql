-- DigiGram safe migration repairs
-- Run after 24, 25, and 26.
-- These functions only repair deterministic matches.

CREATE OR REPLACE FUNCTION public.repair_household_location_village_links()
RETURNS VOID AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.repair_household_creator_links()
RETURNS VOID AS $$
BEGIN
    UPDATE households h
    SET added_by_user_id = p.id
    FROM volunteers v
    JOIN profiles p
      ON p.role = 'volunteer'
     AND p.phone = v.phone
    WHERE h.added_by_volunteer_id = v.id
      AND h.added_by_user_id IS NULL
      AND (
        SELECT COUNT(*)
        FROM profiles p2
        WHERE p2.role = 'volunteer'
          AND p2.phone = v.phone
      ) = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.repair_household_location_village_links() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_household_creator_links() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.repair_household_location_village_links() TO service_role;
GRANT EXECUTE ON FUNCTION public.repair_household_creator_links() TO service_role;
