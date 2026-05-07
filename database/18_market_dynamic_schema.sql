-- DigiGram: Dynamic Market & Hat-Bazar Schema
-- Step 18: Run this in Supabase SQL Editor.

-- 1. Update profile_role Enum (If not exists)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values easily, 
-- we check and add if missing using an anonymous block.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'profile_role' AND e.enumlabel = 'market_manager') THEN
        ALTER TYPE profile_role ADD VALUE 'market_manager';
    END IF;
END $$;

-- 2. Master Commodities Table
CREATE TABLE IF NOT EXISTS market_commodities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL, -- e.g. 'নাজিরশাইল চাল'
    category VARCHAR NOT NULL, -- e.g. 'চাল'
    unit VARCHAR NOT NULL, -- e.g. 'কেজি', 'লিটার'
    icon VARCHAR, -- Emoji or Lucide name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Markets Table
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL, -- e.g. 'ভবানীপুর হাট'
    type VARCHAR DEFAULT 'সাপ্তাহিক', -- 'সাপ্তাহিক', 'প্রতিদিন', 'পশু হাট'
    days VARCHAR[], -- e.g. ['Sunday', 'Thursday']
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE, -- Link to Union
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Link to 'market_manager'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Market Prices Table
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    commodity_id UUID REFERENCES market_commodities(id) ON DELETE CASCADE,
    price DECIMAL NOT NULL,
    prev_price DECIMAL, -- To calculate trend
    trend VARCHAR DEFAULT 'stable', -- 'up', 'down', 'stable'
    supply VARCHAR DEFAULT 'Normal', -- 'Low', 'Normal', 'High'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id),
    
    UNIQUE(market_id, commodity_id)
);

-- 5. Enable RLS
ALTER TABLE market_commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Public Read access
CREATE POLICY "Public can view commodities" ON market_commodities FOR SELECT USING (true);
CREATE POLICY "Public can view markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public can view prices" ON market_prices FOR SELECT USING (true);

-- Super Admin: Full Control
CREATE POLICY "Admins have full access on commodities" ON market_commodities FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Admins have full access on markets" ON markets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Chairman: Manage markets in their union
CREATE POLICY "Chairmen can manage markets in their union" ON markets FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman' AND access_scope_id = markets.location_id)
);

-- Market Manager: Update prices for their assigned market
CREATE POLICY "Managers can update prices for assigned markets" ON market_prices FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM markets WHERE id = market_prices.market_id AND manager_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM markets WHERE id = market_prices.market_id AND manager_id = auth.uid())
);

-- 7. Initial Seed Data

-- Commodities
INSERT INTO market_commodities (name, category, unit, icon) VALUES
('নাজিরশাইল চাল', 'চাল', 'কেজি', '🌾'),
('আটা (প্যাকেট)', 'শস্য', 'কেজি', '🍞'),
('সয়াবিন তেল', 'তেল', 'লিটার', '🫗'),
('দেশি পেঁয়াজ', 'সবজি', 'কেজি', '🧅'),
('আলু (বগুড়া)', 'সবজি', 'কেজি', '🥔'),
('রুই মাছ', 'মাছ', 'কেজি', '🐟'),
('ব্রয়লার মুরগি', 'মাংস', 'কেজি', '🍗'),
('গরুর মাংস', 'মাংস', 'কেজি', '🥩'),
('ডিম (ফার্ম)', 'ডিম', 'হালি', '🥚'),
('কাঁচা মরিচ', 'সবজি', 'কেজি', '🌶️')
ON CONFLICT DO NOTHING;

-- Note: Markets and Prices will be created via UI by Chairman/Admin
