-- Migration: Product Research Cache for AdGen
-- Mirrors adgen_brand_research structure, keyed by product URL

CREATE TABLE IF NOT EXISTS adgen_product_research (
  id           TEXT PRIMARY KEY,
  product_url  TEXT NOT NULL,
  product_name TEXT,
  research     JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_url)
);

CREATE INDEX IF NOT EXISTS adgen_product_research_url_idx
  ON adgen_product_research(product_url);

CREATE TRIGGER adgen_product_research_updated_at
  BEFORE UPDATE ON adgen_product_research
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
