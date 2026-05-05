-- DigiGram: Mock Data for Testing API and Routing (Run this after 01_core_schema.sql)

-- 1. Create a dummy Upazila
INSERT INTO locations (id, slug, name_en, name_bn, type, parent_id)
VALUES ('11111111-1111-1111-1111-111111111111', 'poba-upazila', 'Poba Upazila', 'পবা উপজেলা', 'upazila', null)
ON CONFLICT DO NOTHING;

-- 2. Create a dummy Union under that Upazila
INSERT INTO locations (id, slug, name_en, name_bn, type, parent_id)
VALUES ('22222222-2222-2222-2222-222222222222', 'poba', 'Poba Union', 'পবা ইউনিয়ন', 'union', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 3. Create dummy Wards under the Union
INSERT INTO locations (id, slug, name_en, name_bn, type, parent_id)
VALUES 
('33333333-3333-3333-3333-333333333331', 'poba-ward-1', 'Ward 1', 'ওয়ার্ড ১', 'ward', '22222222-2222-2222-2222-222222222222'),
('33333333-3333-3333-3333-333333333332', 'poba-ward-2', 'Ward 2', 'ওয়ার্ড ২', 'ward', '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- 4. Create Master Services (Plugins)
INSERT INTO services (id, name, slug, features)
VALUES 
('44444444-4444-4444-4444-444444444441', 'Smart School', 'school', '["attendance", "sms", "results"]'),
('44444444-4444-4444-4444-444444444442', 'Digi-Fuel', 'fuel', '["quota", "verification"]'),
('44444444-4444-4444-4444-444444444443', 'Smart Agriculture', 'agriculture', '["crop_id", "market_price", "pest_control"]'),
('44444444-4444-4444-4444-444444444444', 'Health Guard', 'health', '["appointments", "telemedicine", "records"]'),
('44444444-4444-4444-4444-444444444445', 'Digital Ledger', 'ledger', '["land_tax", "trade_license", "certificates"]'),
('44444444-4444-4444-4444-444444444446', 'Smart Mosque', 'mosque', '["donations", "prayer_times", "announcements"]')
ON CONFLICT (id) DO UPDATE SET features = EXCLUDED.features;

-- 5. Activate Services for the Union
INSERT INTO location_services (location_id, service_id, is_active)
VALUES 
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444441', true), -- School
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', true), -- Fuel
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', true), -- Agriculture
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', true), -- Health
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444445', false), -- Ledger (Inactive by default)
('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444446', true)  -- Mosque
ON CONFLICT DO NOTHING;

-- 6. Create dummy Institutions
INSERT INTO institutions (id, name, type, location_id, subdomain, custom_domain)
VALUES 
('55555555-5555-5555-5555-555555555555', 'Poba High School', 'school', '33333333-3333-3333-3333-333333333331', 'pobaschool', 'www.pobaschool.edu.bd'),
('55555555-5555-5555-5555-555555555556', 'Poba Central Mosque', 'mosque', '33333333-3333-3333-3333-333333333331', 'pobamosque', null)
ON CONFLICT (id) DO NOTHING;
