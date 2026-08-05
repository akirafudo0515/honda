-- Add multi-image support to existing DBs (safe to re-run on fresh schema if column already exists via manual check)
-- For fresh installs, schema.sql already includes image_urls.

UPDATE stores
SET image_urls = CASE
  WHEN image_urls IS NOT NULL AND image_urls != '' AND image_urls != '[]' THEN image_urls
  WHEN image_url IS NOT NULL AND image_url != '' THEN '["' || replace(image_url, '"', '\"') || '"]'
  ELSE '[]'
END
WHERE image_urls IS NULL OR image_urls = '' OR image_urls = '[]';
