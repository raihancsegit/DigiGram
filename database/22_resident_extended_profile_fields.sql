-- DigiGram resident extended profile fields
-- Required by the household entry form.

ALTER TABLE residents
    ADD COLUMN IF NOT EXISTS name_en TEXT,
    ADD COLUMN IF NOT EXISTS father_name TEXT,
    ADD COLUMN IF NOT EXISTS mother_name TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT;
