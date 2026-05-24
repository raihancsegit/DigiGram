-- DigiGram institution academic structure defaults
-- Safe to run more than once after 28_service_sms_workflow_and_institution_profiles.sql.
-- Purpose:
-- 1. keep institution category separate from the actual class span it teaches
-- 2. allow madrasa institutions to cover 0-10 or 0-12 without changing the whole portal model

UPDATE institutions
SET operational_settings = COALESCE(operational_settings, '{}'::jsonb) || jsonb_build_object(
    'model',
        CASE
            WHEN category IN ('dakhil_madrasa', 'alim_madrasa') THEN 'madrasa'
            ELSE 'general'
        END,
    'start_grade',
        CASE
            WHEN category = 'primary_school' THEN 1
            WHEN category = 'high_school' THEN 6
            WHEN category = 'college' THEN 11
            WHEN category IN ('dakhil_madrasa', 'alim_madrasa', 'kindergarten') THEN 0
            ELSE COALESCE((operational_settings->>'start_grade')::INTEGER, 1)
        END,
    'end_grade',
        CASE
            WHEN category = 'primary_school' THEN 5
            WHEN category = 'high_school' THEN 10
            WHEN category = 'college' THEN 12
            WHEN category = 'dakhil_madrasa' THEN 10
            WHEN category = 'alim_madrasa' THEN 12
            WHEN category = 'kindergarten' THEN 5
            ELSE COALESCE((operational_settings->>'end_grade')::INTEGER, 10)
        END
)
WHERE type IN ('school', 'college', 'madrasa');
