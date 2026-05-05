-- শুধু "লোকাল নিউজ ও আপডেট" সার্ভিসটি যোগ করুন
INSERT INTO services (name, slug, features)
VALUES ('লোকাল নিউজ ও আপডেট', 'news-updates', '["publish", "edit", "delete"]')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Verify
SELECT id, name, slug FROM services ORDER BY name;
