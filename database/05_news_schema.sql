-- =========================================================================
-- 6. LOCAL NEWS & UPDATES
-- =========================================================================
-- Stores local news published by Ward Members or Union Chairmans

CREATE TABLE local_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR NOT NULL,
    image_url VARCHAR,
    
    -- Which location this news belongs to (Ward or Union)
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    
    -- Which user created this news
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Flags
    is_global BOOLEAN DEFAULT false, -- If true, show across the whole union
    status VARCHAR DEFAULT 'published', -- 'draft', 'published', 'archived'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_local_news_location_id ON local_news(location_id);
CREATE INDEX idx_local_news_created_at ON local_news(created_at DESC);

ALTER TABLE local_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Local news are publicly readable" ON local_news FOR SELECT USING (true);

-- Allow ward members to insert news for their specific location
CREATE POLICY "Users can insert their own local news" ON local_news FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own news
CREATE POLICY "Users can update their own local news" ON local_news FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own news
CREATE POLICY "Users can delete their own local news" ON local_news FOR DELETE USING (auth.uid() = author_id);
