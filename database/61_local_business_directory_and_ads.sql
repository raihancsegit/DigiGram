-- DigiGram: Local Business Directory + Ads
-- Safe to run more than once in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.local_businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    union_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    ward_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    village_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    address TEXT NOT NULL,
    service_area TEXT,
    opening_hours TEXT,
    price_note TEXT,
    logo_url TEXT,
    cover_url TEXT,
    website_url TEXT,
    facebook_url TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    plan TEXT NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'featured', 'premium')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    featured_until TIMESTAMPTZ,
    rejection_reason TEXT,
    view_count BIGINT NOT NULL DEFAULT 0,
    contact_click_count BIGINT NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.business_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.local_businesses(id) ON DELETE CASCADE,
    union_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    target_url TEXT,
    placement TEXT NOT NULL DEFAULT 'directory_top'
        CHECK (placement IN ('directory_top', 'directory_inline', 'union_home')),
    daily_budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_budget NUMERIC(10, 2) NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
    impression_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_local_businesses_union_status
    ON public.local_businesses(union_id, status);
CREATE INDEX IF NOT EXISTS idx_local_businesses_category
    ON public.local_businesses(category);
CREATE INDEX IF NOT EXISTS idx_local_businesses_village
    ON public.local_businesses(village_id);
CREATE INDEX IF NOT EXISTS idx_local_businesses_featured
    ON public.local_businesses(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_business_ads_union_status
    ON public.business_ads(union_id, status, placement);

CREATE OR REPLACE FUNCTION public.touch_local_business_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_touch_local_business ON public.local_businesses;
CREATE TRIGGER trigger_touch_local_business
    BEFORE UPDATE ON public.local_businesses
    FOR EACH ROW EXECUTE FUNCTION public.touch_local_business_updated_at();

DROP TRIGGER IF EXISTS trigger_touch_business_ad ON public.business_ads;
CREATE TRIGGER trigger_touch_business_ad
    BEFORE UPDATE ON public.business_ads
    FOR EACH ROW EXECUTE FUNCTION public.touch_local_business_updated_at();

ALTER TABLE public.local_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved businesses" ON public.local_businesses;
CREATE POLICY "Public can read approved businesses"
ON public.local_businesses FOR SELECT
TO anon, authenticated
USING (
    status = 'approved'
    OR public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND ward_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Public can submit business applications" ON public.local_businesses;
CREATE POLICY "Public can submit business applications"
ON public.local_businesses FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'pending'
    AND is_verified = FALSE
    AND is_featured = FALSE
);

DROP POLICY IF EXISTS "Scoped officers can update businesses" ON public.local_businesses;
CREATE POLICY "Scoped officers can update businesses"
ON public.local_businesses FOR UPDATE
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND ward_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
    OR (
        public.get_auth_role() = 'ward_member'
        AND ward_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Public can read active business ads" ON public.business_ads;
CREATE POLICY "Public can read active business ads"
ON public.business_ads FOR SELECT
TO anon, authenticated
USING (
    (
        status = 'active'
        AND starts_at <= NOW()
        AND (ends_at IS NULL OR ends_at >= NOW())
    )
    OR public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
);

DROP POLICY IF EXISTS "Scoped officers can manage business ads" ON public.business_ads;
CREATE POLICY "Scoped officers can manage business ads"
ON public.business_ads FOR ALL
TO authenticated
USING (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
)
WITH CHECK (
    public.get_auth_role() = 'super_admin'
    OR (
        public.get_auth_role() = 'chairman'
        AND union_id = public.get_auth_scope_id()
    )
);

COMMENT ON TABLE public.local_businesses IS
    'Verified union, ward and village scoped local businesses and service providers.';
COMMENT ON TABLE public.business_ads IS
    'Paid placements for approved DigiGram local businesses.';
