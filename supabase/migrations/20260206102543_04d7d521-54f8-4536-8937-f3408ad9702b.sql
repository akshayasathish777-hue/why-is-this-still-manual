-- Create saved_searches table for bookmarked searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_type TEXT NOT NULL CHECK (search_type IN ('solver', 'builder')),
  query TEXT NOT NULL,
  sources JSONB NOT NULL DEFAULT '["reddit"]',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  alert_enabled BOOLEAN DEFAULT false,
  alert_frequency TEXT CHECK (alert_frequency IN ('daily', 'weekly', 'never')) DEFAULT 'never'
);

-- Create indexes for performance
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_alerts ON saved_searches(user_id, alert_enabled) WHERE alert_enabled = true;

-- Enable RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved searches
CREATE POLICY "Users can view own saved searches"
ON saved_searches FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saved searches
CREATE POLICY "Users can create own saved searches"
ON saved_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
ON saved_searches FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
ON saved_searches FOR DELETE
USING (auth.uid() = user_id);

-- Add sentiment column to curated_problems
ALTER TABLE curated_problems ADD COLUMN IF NOT EXISTS sentiment JSONB;