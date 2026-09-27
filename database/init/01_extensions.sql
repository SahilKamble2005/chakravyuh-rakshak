-- ============================================================
-- Chakravyuh Rakshak — PostgreSQL + PostGIS Initialization
-- ============================================================
-- This script runs once when the PostgreSQL container is first created.
-- It enables PostGIS and creates the spatial reference system.
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Verify PostGIS is working
SELECT PostGIS_Version();
