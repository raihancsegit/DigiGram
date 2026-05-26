-- DigiGram SMS templates and campaign engine
-- Safe to run more than once after 48_sms_wallet_recharge_business.sql.

CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key TEXT UNIQUE,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    owner_type TEXT CHECK (owner_type IN ('global', 'location', 'institution')) DEFAULT 'global',
    owner_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES sms_wallets(id) ON DELETE SET NULL,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('location', 'institution')),
    owner_id UUID NOT NULL,
    template_id UUID REFERENCES sms_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    target_type TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('draft', 'queued', 'sent', 'failed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_campaigns_owner_created
    ON sms_campaigns(owner_type, owner_id, created_at DESC);

ALTER TABLE sms_messages
    ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign_id
    ON sms_messages(campaign_id);

INSERT INTO sms_templates (template_key, title, category, body, variables)
VALUES
    ('union_notice_general', 'ইউনিয়ন সাধারণ নোটিশ', 'notice', 'DigiGram: {name}, আপনার ইউনিয়ন থেকে নতুন নোটিশ প্রকাশিত হয়েছে। বিস্তারিত জানতে portal দেখুন।', '["name"]'::jsonb),
    ('tax_due_reminder', 'কর/বিল বকেয়া রিমাইন্ডার', 'tax', 'DigiGram: {name}, আপনার হোল্ডিং/বিল বকেয়া আছে। দ্রুত ইউনিয়ন পরিষদে যোগাযোগ করুন।', '["name"]'::jsonb),
    ('service_ready', 'সেবা প্রস্তুত', 'service', 'DigiGram: {name}, আপনার আবেদন প্রস্তুত। ইউনিয়ন পরিষদ থেকে সংগ্রহ করুন।', '["name"]'::jsonb),
    ('school_absent_guardian', 'স্কুল অনুপস্থিতি', 'school', 'DigiGram: {name}, আপনার শিক্ষার্থী আজ অনুপস্থিত। প্রয়োজন হলে প্রতিষ্ঠানের সাথে যোগাযোগ করুন।', '["name"]'::jsonb),
    ('school_result_published', 'ফলাফল প্রকাশ', 'school', 'DigiGram: {name}, শিক্ষার্থীর ফলাফল প্রকাশিত হয়েছে। Student/Guardian portal দেখুন।', '["name"]'::jsonb)
ON CONFLICT (template_key) DO NOTHING;
