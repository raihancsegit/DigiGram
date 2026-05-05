-- =========================================================================
-- 10. LOCAL NEWS DEMO DATA
-- =========================================================================
-- Adds sample news items for testing

-- Assuming the location_id for a union/ward exists, we will use a dummy UUID or 
-- select a union's ID to insert data. Since we don't know the exact UUIDs,
-- we'll dynamically insert for the first union found.
-- Similarly for author_id.

DO $$ 
DECLARE
    v_union_id UUID;
    v_admin_id UUID;
BEGIN
    -- Get the first union ID
    SELECT id INTO v_union_id FROM locations WHERE type = 'union' LIMIT 1;
    
    -- Get the first super_admin or chairman ID
    SELECT id INTO v_admin_id FROM profiles WHERE role IN ('super_admin', 'chairman') LIMIT 1;
    
    IF v_union_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
        INSERT INTO local_news (title, excerpt, content, category, location_id, author_id, is_global, status)
        VALUES 
        (
            'ইউনিয়নে বিনামূল্যে চিকিৎসাসেবা ক্যাম্পেইন',
            'আগামী শুক্রবার ইউনিয়ন পরিষদ প্রাঙ্গণে বিনামূল্যে চিকিৎসাসেবা প্রদান করা হবে।',
            'সবাইকে জানানো যাচ্ছে যে, আগামী শুক্রবার ইউনিয়ন পরিষদ প্রাঙ্গণে বিনামূল্যে চিকিৎসাসেবা প্রদান করা হবে। বিশেষজ্ঞ ডাক্তারগণ সারাদিন রোগীদের দেখবেন এবং বিনামূল্যে ঔষধ বিতরণ করা হবে।',
            'উন্নয়ন',
            v_union_id,
            v_admin_id,
            true,
            'published'
        ),
        (
            'জরুরি সতর্কবার্তা: বন্যা পরিস্থিতি',
            'সাম্প্রতিক ভারী বৃষ্টির কারণে নদীর পানি বিপদসীমার উপর দিয়ে প্রবাহিত হচ্ছে।',
            'সংশ্লিষ্ট সকলকে সতর্ক থাকার নির্দেশ দেওয়া হলো। নদীর পানি বিপদসীমার উপর দিয়ে প্রবাহিত হচ্ছে এবং যেকোনো সময় বন্যা পরিস্থিতি অবনতি হতে পারে। প্রয়োজনে ইউনিয়ন পরিষদে যোগাযোগ করুন।',
            'জরুরি নোটিশ',
            v_union_id,
            v_admin_id,
            true,
            'published'
        ),
        (
            'একটি মোবাইল ফোন পাওয়া গেছে',
            'নওহাটা বাজারের কাছে একটি স্যামসাং মোবাইল ফোন পাওয়া গেছে।',
            'গতকালের বাজারে একটি কালো রঙের স্যামসাং মোবাইল ফোন পাওয়া গেছে। উপযুক্ত প্রমাণ দিয়ে ইউনিয়ন পরিষদ থেকে ফোনটি সংগ্রহ করার জন্য অনুরোধ করা হলো।',
            'হারানো-প্রাপ্তি',
            v_union_id,
            v_admin_id,
            false,
            'published'
        );
    END IF;
END $$;
