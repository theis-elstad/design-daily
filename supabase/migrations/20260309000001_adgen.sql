-- Migration: AdGen tables
-- Clean schema designed for the rewritten AdGen (replaces messy KV-based storage)

-- ─────────────────────────────────────────
-- Brand Research Cache
-- Replaces BRAND_RESEARCH_KV
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adgen_brand_research (
  id           TEXT PRIMARY KEY,           -- nanoid
  brand_url    TEXT NOT NULL,
  brand_name   TEXT,
  research     JSONB NOT NULL,             -- full AI research output
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (brand_url)
);

CREATE INDEX IF NOT EXISTS adgen_brand_research_url_idx
  ON adgen_brand_research(brand_url);

-- ─────────────────────────────────────────
-- Ad Library
-- Replaces LIBRARY_KV
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adgen_library (
  id               TEXT PRIMARY KEY,       -- nanoid
  brand_url        TEXT,
  brand_name       TEXT,
  product_name     TEXT,
  ad_format        TEXT,                   -- image | carousel | video | etc.
  headline         TEXT,
  primary_text     TEXT,
  image_strategy   JSONB,                  -- image generation strategy details
  ai_provider      TEXT,                   -- anthropic | openai | gemini
  full_output      JSONB,                  -- complete generation output
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS adgen_library_brand_url_idx
  ON adgen_library(brand_url);

CREATE INDEX IF NOT EXISTS adgen_library_created_at_idx
  ON adgen_library(created_at DESC);

-- ─────────────────────────────────────────
-- Auto-update trigger (reuses function from fashionkilla migration)
-- ─────────────────────────────────────────
CREATE TRIGGER adgen_brand_research_updated_at
  BEFORE UPDATE ON adgen_brand_research
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
