CREATE TABLE IF NOT EXISTS website_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid REFERENCES studios(id),
  url text,
  html_hash text,      -- quick cache key
  profile_json jsonb,  -- {title,desc,keywords,colors,services,images[]}
  lighthouse_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- optional index for fast lookup
CREATE INDEX IF NOT EXISTS website_profiles_studio_idx
  ON website_profiles (studio_id);