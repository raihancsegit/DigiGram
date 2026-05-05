-- DigiGram: Add is_global to News and Lost & Found
-- This ensures that global announcements and posts work across all unions.

ALTER TABLE local_news ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE lost_found_posts ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
