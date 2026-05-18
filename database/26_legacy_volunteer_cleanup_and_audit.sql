-- DigiGram legacy volunteer cleanup + migration audit
-- Safe to run more than once after 24 and 25.

-- Keep a compact database-side snapshot for later checking in Supabase.
CREATE OR REPLACE VIEW public.admin_migration_audit_summary AS
SELECT
    (SELECT COUNT(*) FROM volunteers) AS legacy_volunteer_rows,
    (SELECT COUNT(*) FROM households WHERE location_village_id IS NULL) AS households_missing_location_village,
    (SELECT COUNT(*) FROM households WHERE added_by_volunteer_id IS NOT NULL) AS households_using_legacy_volunteer,
    (SELECT COUNT(*) FROM households WHERE added_by_user_id IS NULL) AS households_missing_creator,
    (SELECT COUNT(*) FROM household_documents WHERE file_path IS NULL) AS documents_missing_private_path,
    (
        SELECT COUNT(*)
        FROM profiles p
        LEFT JOIN locations l ON l.id = p.access_scope_id
        WHERE p.role = 'volunteer'
          AND l.type IS DISTINCT FROM 'village'::location_type
    ) AS volunteers_without_village_scope;

-- Super admins can inspect this directly from Supabase or future admin screens.
GRANT SELECT ON public.admin_migration_audit_summary TO authenticated;

COMMENT ON VIEW public.admin_migration_audit_summary IS
    'Counts legacy volunteer and migration leftovers that should trend toward zero.';
