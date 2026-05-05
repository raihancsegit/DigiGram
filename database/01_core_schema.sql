-- DigiGram: Core Database Schema (PostgreSQL / Supabase)
-- Step 1: Execute this script in your Supabase SQL Editor.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. TYPE DEFINITIONS
-- =========================================================================
CREATE TYPE location_type AS ENUM ('district', 'upazila', 'union', 'ward', 'village');
CREATE TYPE institution_type AS ENUM ('school', 'college', 'mosque', 'madrasa', 'clinic');
CREATE TYPE profile_role AS ENUM (
  'super_admin', 
  'uno', 
  'chairman', 
  'ward_member', 
  'institution_admin', 
  'teacher', 
  'volunteer', 
  'student'
);

-- =========================================================================
-- 2. CORE HIERARCHY (locations)
-- =========================================================================
-- This table stores the geographic hierarchy from District down to Village.
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR UNIQUE, -- e.g., 'poba', 'mohonpur'
    name_en VARCHAR NOT NULL,
    name_bn VARCHAR NOT NULL,
    type location_type NOT NULL,
    parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    stats JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast tree traversal
CREATE INDEX idx_locations_parent_id ON locations(parent_id);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_slug ON locations(slug);

-- =========================================================================
-- 3. INSTITUTIONS (Schools, Colleges, Mosques)
-- =========================================================================
-- These act as multi-tenant sub-organizations within a location.
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    type institution_type NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    subdomain VARCHAR UNIQUE, -- e.g., pobaschool
    custom_domain VARCHAR UNIQUE, -- e.g., www.pobaschool.edu.bd
    config JSONB DEFAULT '{}'::jsonb, -- Store tenant-specific UI settings or SMS keys
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_institutions_location_id ON institutions(location_id);
CREATE INDEX idx_institutions_subdomain ON institutions(subdomain);
CREATE INDEX idx_institutions_custom_domain ON institutions(custom_domain);

-- =========================================================================
-- 4. PROFILES (RBAC)
-- =========================================================================
-- Maps Supabase auth.users to specific roles and administrative boundaries.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR,
    phone VARCHAR UNIQUE,
    role profile_role NOT NULL DEFAULT 'student',
    
    -- `access_scope_id` restricts the user to a specific boundary.
    -- E.g., A Chairman's access_scope_id is their Union's location_id.
    -- E.g., A Teacher's access_scope_id is their institution_id.
    access_scope_id UUID, 
    
    avatar_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_scope ON profiles(access_scope_id);

-- =========================================================================
-- 5. SERVICES & ADDONS (Plugin Architecture)
-- =========================================================================
-- Master available services configured by the Super Admin
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    features JSONB DEFAULT '[]'::jsonb, -- e.g., ["attendance", "sms", "admission"]
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pivot table enabling specific services for specific locations
CREATE TABLE location_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb, -- Holds API keys or limits for this running service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(location_id, service_id)
);

-- Enable RLS logic basic placeholder (Detailed RLS will be defined strictly later)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_services ENABLE ROW LEVEL SECURITY;

-- Public READ Access Policies
CREATE POLICY "Locations are publicly readable" ON locations FOR SELECT USING (true);
CREATE POLICY "Institutions are publicly readable" ON institutions FOR SELECT USING (true);
CREATE POLICY "Services are publicly readable" ON services FOR SELECT USING (true);
CREATE POLICY "Location services are publicly readable" ON location_services FOR SELECT USING (true);
