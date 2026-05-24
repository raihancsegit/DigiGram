-- DigiGram institution website draft + publish workflow
-- Safe to run more than once after 34_school_website_cms_sections.sql.
--
-- Draft edits stay in draft_content/draft_theme until an institution admin
-- explicitly publishes them. Existing page columns stay as live fallback
-- for websites that were created before this migration.

ALTER TABLE institution_pages
    ADD COLUMN IF NOT EXISTS draft_content JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS draft_theme JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS published_content JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_draft_saved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE institution_pages p
SET
    draft_content = CASE
        WHEN COALESCE(p.draft_content, '{}'::jsonb) = '{}'::jsonb THEN
            jsonb_strip_nulls(jsonb_build_object(
                'hero_title', p.hero_title,
                'hero_subtitle', p.hero_subtitle,
                'about_text', p.about_text,
                'principal_message', p.principal_message,
                'admission_text', p.admission_text,
                'result_text', p.result_text,
                'contact_phone', p.contact_phone,
                'contact_email', p.contact_email,
                'address', p.address,
                'banner_image_url', p.banner_image_url,
                'logo_url', p.logo_url,
                'notice_ticker', p.notice_ticker,
                'stats', p.stats,
                'about_highlights', p.about_highlights,
                'class_sections', p.class_sections,
                'public_teachers', p.public_teachers,
                'facilities', p.facilities,
                'admission_features', p.admission_features,
                'footer_links', p.footer_links,
                'established_year', p.established_year,
                'approval_text', p.approval_text,
                'office_hours', p.office_hours
            ))
        ELSE p.draft_content
    END,
    draft_theme = CASE
        WHEN COALESCE(p.draft_theme, '{}'::jsonb) = '{}'::jsonb THEN
            COALESCE(i.theme, '{}'::jsonb)
        ELSE p.draft_theme
    END,
    published_content = CASE
        WHEN COALESCE(p.published_content, '{}'::jsonb) = '{}'::jsonb THEN
            jsonb_strip_nulls(jsonb_build_object(
                'hero_title', p.hero_title,
                'hero_subtitle', p.hero_subtitle,
                'about_text', p.about_text,
                'principal_message', p.principal_message,
                'admission_text', p.admission_text,
                'result_text', p.result_text,
                'contact_phone', p.contact_phone,
                'contact_email', p.contact_email,
                'address', p.address,
                'banner_image_url', p.banner_image_url,
                'logo_url', p.logo_url,
                'notice_ticker', p.notice_ticker,
                'stats', p.stats,
                'about_highlights', p.about_highlights,
                'class_sections', p.class_sections,
                'public_teachers', p.public_teachers,
                'facilities', p.facilities,
                'admission_features', p.admission_features,
                'footer_links', p.footer_links,
                'established_year', p.established_year,
                'approval_text', p.approval_text,
                'office_hours', p.office_hours
            ))
        ELSE p.published_content
    END,
    last_draft_saved_at = COALESCE(p.last_draft_saved_at, p.updated_at, p.created_at),
    published_at = COALESCE(p.published_at, p.updated_at, p.created_at)
FROM institutions i
WHERE i.id = p.institution_id;

CREATE INDEX IF NOT EXISTS idx_institution_pages_published_at
    ON institution_pages(published_at DESC);
