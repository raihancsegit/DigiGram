-- DigiGram: Newsletter Subscribers Schema
-- Step 1: Execute this script in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 1. Policy for insertion: Everyone (including anonymous web visitors) can subscribe.
DROP POLICY IF EXISTS "Allow public insert to newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Allow public insert to newsletter_subscribers"
ON public.newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- 2. Policy for admin management: Only super admins can view, edit, or delete subscribers.
DROP POLICY IF EXISTS "Allow super_admin all on newsletter_subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Allow super_admin all on newsletter_subscribers"
ON public.newsletter_subscribers FOR ALL
TO authenticated
USING ( public.get_auth_role() = 'super_admin' );
