-- DigiGram school website professional demo defaults
-- Safe to run more than once after institution website CMS migrations.

INSERT INTO institution_pages (institution_id)
SELECT i.id
FROM institutions i
WHERE i.category IN (
    'school',
    'primary_school',
    'high_school',
    'college',
    'dakhil_madrasa',
    'alim_madrasa',
    'kindergarten'
)
ON CONFLICT (institution_id) DO NOTHING;

UPDATE institution_pages p
SET
    hero_title = COALESCE(NULLIF(p.hero_title, ''), i.name),
    hero_subtitle = COALESCE(NULLIF(p.hero_subtitle, ''), 'শৃঙ্খলা, ফলাফল, উপস্থিতি এবং ভবিষ্যৎ প্রস্তুতির পূর্ণ ডিজিটাল শিক্ষা কেন্দ্র।'),
    about_text = COALESCE(NULLIF(p.about_text, ''), i.name || ' ' || COALESCE(NULLIF(i.village, ''), 'আপনার গ্রাম') || '-এর শিক্ষার্থী, শিক্ষক ও অভিভাবকদের জন্য class update, result, notice এবং portal সুবিধা একসাথে দিচ্ছে।'),
    principal_message = COALESCE(NULLIF(p.principal_message, ''), 'ভর্তি, ফলাফল, উপস্থিতি এবং প্রতিটি শিক্ষার্থীর অগ্রগতি নিয়মিত জানাতে আমাদের office ও digital portal পাশে আছে।'),
    admission_text = COALESCE(NULLIF(p.admission_text, ''), 'নতুন শিক্ষাবর্ষে ভর্তি চলছে। প্রাথমিক আবেদন জমা দিলে office পরবর্তী ধাপ জানাবে।'),
    approval_text = COALESCE(NULLIF(p.approval_text, ''), 'শিক্ষা, শৃঙ্খলা ও যত্নের সমন্বিত পরিবেশ'),
    contact_phone = COALESCE(NULLIF(p.contact_phone, ''), '01711000000'),
    contact_email = COALESCE(NULLIF(p.contact_email, ''), 'school@example.com'),
    address = COALESCE(NULLIF(p.address, ''), COALESCE(NULLIF(i.village, ''), 'আপনার গ্রাম') || ', ডিজিগ্রাম ইউনিয়ন'),
    office_hours = COALESCE(NULLIF(p.office_hours, ''), 'শনি-বৃহস্পতিবার: সকাল ৮টা - বিকেল ৪টা'),
    notice_ticker = CASE
        WHEN COALESCE(jsonb_array_length(p.notice_ticker), 0) < 3 THEN
            '["নতুন শিক্ষাবর্ষে ভর্তি আবেদন চলছে","Notice Board-এ পরীক্ষার সময়সূচি ও জরুরি ঘোষণা দেখুন","অভিভাবক সভা: মাসিক অগ্রগতি পর্যালোচনা","Student portal-এ topic, homework ও quiz update প্রকাশিত হচ্ছে","বকেয়া তথ্য ও ফলাফল সংক্রান্ত SMS service প্রস্তুত"]'::jsonb
        ELSE p.notice_ticker
    END,
    stats = CASE
        WHEN COALESCE(jsonb_array_length(p.stats), 0) < 4 THEN
            '[{"value":"২৫+","label":"বছরের অভিজ্ঞতা"},{"value":"১২০০+","label":"শিক্ষার্থী"},{"value":"৪০+","label":"শিক্ষক"},{"value":"৯৮%","label":"পাসের হার"}]'::jsonb
        ELSE p.stats
    END,
    about_highlights = CASE
        WHEN COALESCE(jsonb_array_length(p.about_highlights), 0) < 4 THEN
            '["অভিজ্ঞ শিক্ষক ও class-wise academic care","নিয়মিত উপস্থিতি, homework ও lesson progress tracking","অভিভাবকের জন্য result, notice ও student update","শিক্ষা, শৃঙ্খলা, সহশিক্ষা ও নিরাপদ পরিবেশ"]'::jsonb
        ELSE p.about_highlights
    END,
    class_sections = CASE
        WHEN COALESCE(jsonb_array_length(p.class_sections), 0) < 4 THEN
            '[{"title":"প্রাক-প্রাথমিক ও প্রাথমিক","description":"ভাষা, সংখ্যা, আচরণ ও ভিত্তি গঠনের যত্নশীল পাঠক্রম।","badge":"Play-5"},{"title":"নিম্ন মাধ্যমিক","description":"৬ষ্ঠ থেকে ৮ম শ্রেণিতে বিষয়ভিত্তিক foundation ও নিয়মিত মূল্যায়ন।","badge":"৬-৮"},{"title":"মাধ্যমিক","description":"SSC প্রস্তুতি, class test, topic review ও ফলাফল বিশ্লেষণ।","badge":"৯-১০"},{"title":"উচ্চ মাধ্যমিক","description":"কলেজ প্রস্তুতি, বিভাগভিত্তিক পাঠ ও career guidance।","badge":"১১-১২"},{"title":"Language & ICT","description":"বাংলা, ইংরেজি, presentation ও digital skill practice।","badge":"Skill"},{"title":"Clubs & Activities","description":"বিজ্ঞান, পাঠাগার, খেলাধুলা ও সাংস্কৃতিক অংশগ্রহণ।","badge":"Club"}]'::jsonb
        ELSE p.class_sections
    END,
    public_teachers = CASE
        WHEN COALESCE(jsonb_array_length(p.public_teachers), 0) < 3 THEN
            '[{"name":"অধ্যাপক আহমেদ হোসেন","subject":"প্রধান শিক্ষক","experience":"প্রশাসন ও academic leadership"},{"name":"ফারহানা বেগম","subject":"বাংলা ও ভাষা শিক্ষা","experience":"পাঠাভ্যাস ও লিখন দক্ষতা"},{"name":"মোঃ রফিকুল ইসলাম","subject":"গণিত","experience":"Problem solving ও quiz care"},{"name":"সুমাইয়া নূর","subject":"ইংরেজি","experience":"Grammar, speaking ও reading"},{"name":"নাসরিন সুলতানা","subject":"বিজ্ঞান","experience":"Practical ও project-based learning"},{"name":"মোস্তফা কামাল","subject":"ICT ও skill support","experience":"Digital class ও student guidance"}]'::jsonb
        ELSE p.public_teachers
    END,
    facilities = CASE
        WHEN COALESCE(jsonb_array_length(p.facilities), 0) < 4 THEN
            '[{"title":"ডিজিটাল ক্লাসরুম","description":"Lesson topic, resource এবং smart attendance support।"},{"title":"পাঠাগার","description":"বই, reference material এবং reading habit তৈরি।"},{"title":"Science ও ICT Lab","description":"প্র্যাকটিক্যাল, project ও প্রযুক্তি শেখার সুযোগ।"},{"title":"অভিভাবক ডেস্ক","description":"ভর্তি, ফলাফল, attendance এবং নিয়মিত যোগাযোগ।"},{"title":"নিরাপদ ক্যাম্পাস","description":"শৃঙ্খলাপূর্ণ পরিবেশ, দায়িত্বশীল শিক্ষক ও supervision।"},{"title":"সহশিক্ষা কার্যক্রম","description":"খেলা, debate, culture ও leadership practice।"}]'::jsonb
        ELSE p.facilities
    END,
    admission_features = CASE
        WHEN COALESCE(jsonb_array_length(p.admission_features), 0) < 3 THEN
            '["অনলাইন প্রাথমিক ভর্তি আবেদন","প্রয়োজনীয় কাগজপত্র ও office যোগাযোগ","শ্রেণি অনুযায়ী seat availability review","অভিভাবকের ফোনে follow-up update"]'::jsonb
        ELSE p.admission_features
    END,
    footer_links = COALESCE(p.footer_links, '{}'::jsonb) || jsonb_build_object(
        'site_name', COALESCE(NULLIF(p.footer_links->>'site_name', ''), i.name),
        'footer_description', COALESCE(NULLIF(p.footer_links->>'footer_description', ''), i.name || ' এখন DigiGram-এর মাধ্যমে website, portal, attendance, lesson progress এবং result management একসাথে ব্যবহার করছে।'),
        'quick_links', COALESCE(NULLIF(p.footer_links->'quick_links', '[]'::jsonb), '["ভর্তি তথ্য","নোটিশ বোর্ড","অভিভাবক আপডেট","যোগাযোগ"]'::jsonb),
        'academic_links', COALESCE(NULLIF(p.footer_links->'academic_links', '[]'::jsonb), '["শ্রেণি ও বিভাগ","শিক্ষকমণ্ডলী","ফলাফল","সহশিক্ষা কার্যক্রম"]'::jsonb),
        'extra_sections', COALESCE(NULLIF(p.footer_links->'extra_sections', '{}'::jsonb), '{
            "achievements":[{"title":"বোর্ড ফলাফল","value":"৯৮%","description":"সাম্প্রতিক পাবলিক পরীক্ষায় ধারাবাহিক সাফল্য।"},{"title":"মেধা সহায়তা","value":"১২০+","description":"বৃত্তি, পরামর্শ ও দুর্বল শিক্ষার্থীর আলাদা care।"},{"title":"উপস্থিতি ট্র্যাকিং","value":"Daily","description":"ক্লাস উপস্থিতি ও অভিভাবক আপডেট নিয়মিত রাখা হয়।"},{"title":"ডিজিটাল পাঠ","value":"Smart","description":"Topic, homework, quiz এবং lesson progress একই জায়গায়।"}],
            "events":[{"title":"অভিভাবক সভা","date":"প্রতি মাসে","description":"শিক্ষার্থী অগ্রগতি, উপস্থিতি ও ফলাফল নিয়ে আলোচনা।"},{"title":"বিজ্ঞান ও বইমেলা","date":"বার্ষিক","description":"Project, reading habit এবং উপস্থাপনা দক্ষতার আয়োজন।"},{"title":"ক্রীড়া ও সংস্কৃতি","date":"Seasonal","description":"খেলাধুলা, বিতর্ক, আবৃত্তি ও সাংস্কৃতিক অংশগ্রহণ।"}],
            "programs":[{"title":"Class-wise Academic Care","description":"শ্রেণি, বিষয়, শিক্ষক ও topic অনুযায়ী পড়াশোনা গুছিয়ে রাখা।"},{"title":"Guardian Progress Desk","description":"হোমওয়ার্ক, উপস্থিতি ও ফলাফলের আপডেট অভিভাবকের কাছে পৌঁছানো।"},{"title":"Result & Merit Review","description":"পরীক্ষার ফলাফল বিশ্লেষণ করে পরবর্তী প্রস্তুতি ঠিক করা।"}],
            "gallery":[{"title":"ক্লাসরুম","image_url":"","caption":"শিক্ষক, পাঠ এবং lesson progress-এর যত্নশীল পরিবেশ।"},{"title":"লাইব্রেরি","image_url":"","caption":"পাঠাভ্যাস, reference বই এবং quiet study support।"},{"title":"ল্যাব","image_url":"","caption":"Science, ICT এবং হাতে-কলমে শেখার সুযোগ।"}],
            "faqs":[{"question":"ভর্তি আবেদন কোথা থেকে করা যাবে?","answer":"ভর্তি page থেকে প্রাথমিক আবেদন জমা দিন। Office review শেষে যোগাযোগ করবে।"},{"question":"অভিভাবক কীভাবে update দেখবেন?","answer":"Guardian update page-এ class, roll এবং ফোন যাচাই করে lesson, attendance ও result দেখা যাবে।"},{"question":"নোটিশ কোথায় দেখব?","answer":"Notice ticker এবং Notice Board page-এ সর্বশেষ ঘোষণা প্রকাশিত থাকে।"}],
            "downloads":[{"title":"ভর্তি নির্দেশিকা","url":"","note":"কাগজপত্র, বয়সসীমা ও office যোগাযোগ।"},{"title":"Academic calendar","url":"","note":"পরীক্ষা, ছুটি ও গুরুত্বপূর্ণ কার্যক্রমের তালিকা।"}],
            "cta":{"title":"ভর্তি, ফলাফল ও অগ্রগতির তথ্য এক জায়গায়","text":"Office-এর সাথে যোগাযোগ করুন অথবা online application দিন।","button":"যোগাযোগ করুন"}
        }'::jsonb)
    ),
    updated_at = NOW()
FROM institutions i
WHERE i.id = p.institution_id
  AND i.category IN (
      'school',
      'primary_school',
      'high_school',
      'college',
      'dakhil_madrasa',
      'alim_madrasa',
      'kindergarten'
  );

UPDATE institution_pages p
SET
    draft_content = COALESCE(NULLIF(p.draft_content, '{}'::jsonb), '{}'::jsonb) || jsonb_build_object(
        'notice_ticker', p.notice_ticker,
        'stats', p.stats,
        'about_highlights', p.about_highlights,
        'class_sections', p.class_sections,
        'public_teachers', p.public_teachers,
        'facilities', p.facilities,
        'admission_features', p.admission_features,
        'footer_links', p.footer_links
    ),
    published_content = COALESCE(NULLIF(p.published_content, '{}'::jsonb), '{}'::jsonb) || jsonb_build_object(
        'hero_title', p.hero_title,
        'hero_subtitle', p.hero_subtitle,
        'about_text', p.about_text,
        'principal_message', p.principal_message,
        'admission_text', p.admission_text,
        'approval_text', p.approval_text,
        'contact_phone', p.contact_phone,
        'contact_email', p.contact_email,
        'address', p.address,
        'office_hours', p.office_hours,
        'notice_ticker', p.notice_ticker,
        'stats', p.stats,
        'about_highlights', p.about_highlights,
        'class_sections', p.class_sections,
        'public_teachers', p.public_teachers,
        'facilities', p.facilities,
        'admission_features', p.admission_features,
        'footer_links', p.footer_links
    ),
    published_at = COALESCE(p.published_at, NOW()),
    updated_at = NOW()
FROM institutions i
WHERE i.id = p.institution_id
  AND i.category IN (
      'school',
      'primary_school',
      'high_school',
      'college',
      'dakhil_madrasa',
      'alim_madrasa',
      'kindergarten'
  );

INSERT INTO institution_notices (institution_id, title, body, audience, is_pinned)
SELECT
    i.id,
    demo.title,
    demo.body,
    'public',
    demo.is_pinned
FROM institutions i
CROSS JOIN (
    VALUES
        ('ডেমো: ভর্তি কার্যক্রম চলছে', 'নতুন শিক্ষাবর্ষের ভর্তি আবেদন website ও office থেকে নেওয়া হচ্ছে।', TRUE),
        ('ডেমো: ফলাফল প্রকাশ', 'প্রকাশিত ফলাফল student portal এবং guardian update view-তে দেখা যাবে।', FALSE),
        ('ডেমো: বিজ্ঞান ও সাংস্কৃতিক সপ্তাহ', 'Project, debate ও সাংস্কৃতিক অংশগ্রহণের registration চলছে।', FALSE)
) AS demo(title, body, is_pinned)
WHERE i.category IN (
      'school',
      'primary_school',
      'high_school',
      'college',
      'dakhil_madrasa',
      'alim_madrasa',
      'kindergarten'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM institution_notices n
      WHERE n.institution_id = i.id
        AND n.title = demo.title
  );
