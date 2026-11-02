-- Existing databases created before the region column.
-- Fresh installs from schema.sql already have this column; if ALTER reports a duplicate column, continue with schema-migrate-region-data.sql.
ALTER TABLE stores ADD COLUMN region TEXT NOT NULL DEFAULT 'all';
