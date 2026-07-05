-- Demo-only location cleanup and Bengali label repair.
-- Run this in development/demo databases when the area selector should only show demo data.

UPDATE public.locations
SET name_bn = CASE
    WHEN type = 'district' THEN 'ডেমো জেলা'
    WHEN type = 'upazila' THEN 'ডেমো উপজেলা'
    WHEN type = 'union' THEN 'ডেমো ইউনিয়ন'
    WHEN type = 'ward' THEN 'ডেমো ওয়ার্ড ১'
    WHEN type = 'village' AND slug ILIKE '%village-b%' THEN 'ডেমো গ্রাম খ'
    WHEN type = 'village' THEN 'ডেমো গ্রাম ক'
    ELSE name_bn
END
WHERE slug ILIKE 'demo-%';

UPDATE public.villages
SET bn_name = CASE
    WHEN name ILIKE '%Village B%' OR bn_name ILIKE '%Village B%' THEN 'ডেমো গ্রাম খ'
    WHEN name ILIKE '%Village A%' OR bn_name ILIKE '%Village A%' THEN 'ডেমো গ্রাম ক'
    ELSE bn_name
END
WHERE name ILIKE 'Demo Village%' OR bn_name ILIKE 'Demo Village%';

UPDATE public.households
SET owner_name = CASE
    WHEN owner_name LIKE 'à¦®à§‹à¦ƒ%' THEN 'মোঃ রহিম উদ্দিন'
    WHEN owner_name LIKE 'à¦®à§‹à¦›à¦¾à¦ƒ%' THEN 'মোছাঃ সালমা বেগম'
    WHEN owner_name LIKE 'à¦†à¦¬à¦¦à§à¦²%' THEN 'আব্দুল করিম'
    WHEN owner_name LIKE 'à¦°à§‹à¦•à§‡à§Ÿà¦¾%' THEN 'রোকেয়া খাতুন'
    ELSE owner_name
END
WHERE house_no ILIKE 'DEMO-%';

UPDATE public.residents
SET
    name = CASE
        WHEN name LIKE 'à¦¡à§‡à¦®à§‹ à¦¸à¦¦à¦¸à§à¦¯%' THEN replace(replace(name, 'à¦¡à§‡à¦®à§‹ à¦¸à¦¦à¦¸à§à¦¯', 'ডেমো সদস্য'), 'à§¨', '২')
        WHEN name LIKE 'à¦¡à§‡à¦®à§‹ à¦¶à¦¿à¦¶à§%' THEN replace(name, 'à¦¡à§‡à¦®à§‹ à¦¶à¦¿à¦¶à§', 'ডেমো শিশু')
        ELSE name
    END,
    bn_name = CASE
        WHEN bn_name LIKE 'à¦¡à§‡à¦®à§‹ à¦¸à¦¦à¦¸à§à¦¯%' THEN replace(replace(bn_name, 'à¦¡à§‡à¦®à§‹ à¦¸à¦¦à¦¸à§à¦¯', 'ডেমো সদস্য'), 'à§¨', '২')
        WHEN bn_name LIKE 'à¦¡à§‡à¦®à§‹ à¦¶à¦¿à¦¶à§%' THEN replace(bn_name, 'à¦¡à§‡à¦®à§‹ à¦¶à¦¿à¦¶à§', 'ডেমো শিশু')
        ELSE bn_name
    END
WHERE household_id IN (
    SELECT id FROM public.households WHERE house_no ILIKE 'DEMO-%'
);

-- Remove known non-demo seed hierarchy that made the selector show "রাজশাহী" beside demo.
-- Parent/child relations on locations use ON DELETE CASCADE, so deleting parents removes their children.
DELETE FROM public.locations
WHERE slug = 'rajshahi'
   OR slug = 'poba-upazila'
   OR slug = 'poba'
   OR slug ILIKE 'poba-ward-%'
   OR slug ILIKE 'test-union-%';
