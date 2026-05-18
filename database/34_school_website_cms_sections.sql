-- DigiGram school website CMS sections
-- Safe to run more than once after 33_institution_portal_master.sql.

ALTER TABLE institution_pages
    ADD COLUMN IF NOT EXISTS notice_ticker JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS about_highlights JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS class_sections JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS public_teachers JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS admission_features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS footer_links JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS established_year TEXT,
    ADD COLUMN IF NOT EXISTS approval_text TEXT,
    ADD COLUMN IF NOT EXISTS office_hours TEXT;

UPDATE institution_pages p
SET
    notice_ticker = CASE
        WHEN p.notice_ticker = '[]'::jsonb THEN
            '[
                "নতুন শিক্ষাবর্ষে ভর্তি কার্যক্রম চলছে",
                "পরীক্ষার ফলাফল প্রকাশিত হয়েছে",
                "অভিভাবক সমাবেশের সময়সূচি নোটিশ বোর্ডে দেখুন"
            ]'::jsonb
        ELSE p.notice_ticker
    END,
    stats = CASE
        WHEN p.stats = '[]'::jsonb THEN
            '[
                {"value":"২৫+","label":"বছরের অভিজ্ঞতা"},
                {"value":"১২০০+","label":"শিক্ষার্থী"},
                {"value":"৯৫%","label":"পাসের হার"},
                {"value":"৪০+","label":"শিক্ষক"}
            ]'::jsonb
        ELSE p.stats
    END,
    about_highlights = CASE
        WHEN p.about_highlights = '[]'::jsonb THEN
            '[
                "অভিজ্ঞ ও প্রশিক্ষিত শিক্ষকমণ্ডলী",
                "নিয়মিত অভিভাবক যোগাযোগ",
                "ডিজিটাল উপস্থিতি ও ফলাফল ব্যবস্থাপনা",
                "সহ-পাঠ্যক্রমিক কার্যক্রম"
            ]'::jsonb
        ELSE p.about_highlights
    END,
    class_sections = CASE
        WHEN p.class_sections = '[]'::jsonb THEN
            '[
                {"title":"প্রাথমিক বিভাগ","description":"ভিত্তি মজবুত করার পাঠক্রম","badge":"১ম-৫ম"},
                {"title":"নিম্ন মাধ্যমিক","description":"বিজ্ঞান, গণিত ও ভাষা দক্ষতা","badge":"৬ষ্ঠ-৮ম"},
                {"title":"মাধ্যমিক বিভাগ","description":"SSC প্রস্তুতি ও ফলাফল ট্র্যাকিং","badge":"৯ম-১০ম"}
            ]'::jsonb
        ELSE p.class_sections
    END,
    public_teachers = CASE
        WHEN p.public_teachers = '[]'::jsonb THEN
            '[
                {"name":"প্রধান শিক্ষক","subject":"প্রশাসন","experience":"অভিজ্ঞ নেতৃত্ব"},
                {"name":"শ্রেণি শিক্ষক","subject":"উপস্থিতি ও অগ্রগতি","experience":"দৈনিক ফলো-আপ"},
                {"name":"বিষয় শিক্ষক","subject":"পাঠ ও মূল্যায়ন","experience":"ফলাফল পর্যবেক্ষণ"}
            ]'::jsonb
        ELSE p.public_teachers
    END,
    facilities = CASE
        WHEN p.facilities = '[]'::jsonb THEN
            '[
                {"title":"ডিজিটাল ক্লাসরুম","description":"স্মার্ট পাঠদান ও attendance tracking"},
                {"title":"লাইব্রেরি","description":"বই ও শেখার সহায়ক রিসোর্স"},
                {"title":"পরীক্ষা ব্যবস্থাপনা","description":"ফলাফল প্রকাশ ও guardian SMS"},
                {"title":"অভিভাবক যোগাযোগ","description":"নোটিশ ও অগ্রগতি বার্তা"}
            ]'::jsonb
        ELSE p.facilities
    END,
    admission_features = CASE
        WHEN p.admission_features = '[]'::jsonb THEN
            '[
                "অনলাইন প্রাথমিক আবেদন",
                "সকল শ্রেণির তথ্য এক জায়গায়",
                "অভিভাবকের সাথে দ্রুত যোগাযোগ"
            ]'::jsonb
        ELSE p.admission_features
    END,
    footer_links = CASE
        WHEN p.footer_links = '{}'::jsonb THEN
            '{
                "quick_links":["আমাদের সম্পর্কে","শ্রেণি","শিক্ষকমণ্ডলী","নোটিশ বোর্ড"],
                "academic_links":["ভর্তি নির্দেশিকা","পরীক্ষা","ফলাফল","ফি তথ্য"]
            }'::jsonb
        ELSE p.footer_links
    END,
    established_year = COALESCE(p.established_year, '২০২৫'),
    approval_text = COALESCE(p.approval_text, 'বাংলাদেশ শিক্ষা ব্যবস্থার সাথে সামঞ্জস্যপূর্ণ'),
    office_hours = COALESCE(p.office_hours, 'শনিবার-বৃহস্পতিবার: সকাল ৮টা - বিকেল ৪টা')
FROM institutions i
WHERE i.id = p.institution_id
  AND i.category IN ('primary_school', 'high_school', 'college', 'alim_madrasa', 'kindergarten');
