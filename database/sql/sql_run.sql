\set ON_ERROR_STOP on

-- Safe deploy script — creates missing tables and inserts seed data without dropping anything.
-- Safe to rerun on an existing database: uses IF NOT EXISTS and ON CONFLICT DO NOTHING.
-- For a full reset (drop + recreate), use sql_reset.sql instead.
-- Example usage: psql -f sql_run.sql
-- Database: PostgreSQL (Docker)
    
\ir clinic_schema.sql
\ir clinic_seed.sql