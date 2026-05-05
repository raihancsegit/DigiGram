/*
  DigiGram: Advanced RLS Policies (Fixed Recursion)
  Run this script in your Supabase SQL Editor to fix the login issue.
*/

-- 1. Create a helper function to safely check role without recursion
-- SECURITY DEFINER allows the function to bypass RLS for this specific check.
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS profile_role AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Locations Table Policies
DROP POLICY IF EXISTS "Super admins can manage locations" ON locations;
CREATE POLICY "Super admins can manage locations" 
ON locations FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

DROP POLICY IF EXISTS "Locations are publicly readable" ON locations;
CREATE POLICY "Locations are publicly readable" 
ON locations FOR SELECT 
USING (true);

-- 3. Profiles Table Policies
-- SELECT: Everyone can see profiles
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON profiles;
CREATE POLICY "Profiles are readable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- ALL: Only Super Admins can manage all profiles
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
CREATE POLICY "Super admins can manage all profiles" 
ON profiles FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

-- UPDATE: Users can update their own data
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 4. Services Table Policies
DROP POLICY IF EXISTS "Super admins can manage services" ON services;
CREATE POLICY "Super admins can manage services" 
ON services FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

DROP POLICY IF EXISTS "Services are publicly readable" ON services;
CREATE POLICY "Services are publicly readable" 
ON services FOR SELECT 
USING (true);

-- 5. Location Services Table Policies
DROP POLICY IF EXISTS "Super admins can manage location services" ON location_services;
CREATE POLICY "Super admins can manage location services" 
ON location_services FOR ALL 
TO authenticated 
USING ( public.get_auth_role() = 'super_admin' );

DROP POLICY IF EXISTS "Location services are publicly readable" ON location_services;
CREATE POLICY "Location services are publicly readable" 
ON location_services FOR SELECT 
USING (true);
