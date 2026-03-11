-- Migration: Update adgen_library to match actual generation pipeline output
-- The original schema was designed pre-implementation. This aligns it with
-- the real data shape from the unified pipeline.

-- Drop old columns and add new ones
ALTER TABLE adgen_library
  ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS product_url  TEXT,
  ADD COLUMN IF NOT EXISTS idea         JSONB,           -- full AdIdea object
  ADD COLUMN IF NOT EXISTS copy         JSONB,           -- full AdCopy object (headlines, primaryTexts, descriptions)
  ADD COLUMN IF NOT EXISTS image_prompt TEXT,
  ADD COLUMN IF NOT EXISTS generated_by TEXT,             -- model name (e.g. gemini-2.0-flash)
  ADD COLUMN IF NOT EXISTS image_base64 TEXT,             -- base64 encoded image
  ADD COLUMN IF NOT EXISTS mime_type    TEXT DEFAULT 'image/png';

-- Index by user for library listing
CREATE INDEX IF NOT EXISTS adgen_library_user_id_idx
  ON adgen_library(user_id);

-- RLS: users can only read/write their own library entries
ALTER TABLE adgen_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own library entries"
  ON adgen_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own library entries"
  ON adgen_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own library entries"
  ON adgen_library FOR DELETE
  USING (auth.uid() = user_id);
