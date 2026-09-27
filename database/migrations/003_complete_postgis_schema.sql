-- ============================================================
-- Chakravyuh Rakshak — Complete PostGIS Schema & Master Setup
-- SRID 4326 (WGS 84)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ANALYST' CHECK (role IN ('USER', 'ANALYST', 'AUTHORITY', 'ADMIN')),
    preferred_language VARCHAR(10) DEFAULT 'en',
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    preferred_basin VARCHAR(100) DEFAULT 'Bay of Bengal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Ocean Basins Table
CREATE TABLE IF NOT EXISTS ocean_basins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    basin_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ocean_basins_geom ON ocean_basins USING GIST(geom);

-- 3. Coastal Districts Table
CREATE TABLE IF NOT EXISTS coastal_districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    basin VARCHAR(100) DEFAULT 'Bay of Bengal',
    population INT DEFAULT 1000000,
    risk_weight DOUBLE PRECISION DEFAULT 1.0,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coastal_districts_geom ON coastal_districts USING GIST(geom);

-- 4. Land Polygons Table
CREATE TABLE IF NOT EXISTS land_polygons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_land_polygons_geom ON land_polygons USING GIST(geom);

-- 5. Cyclonic Systems Table
CREATE TABLE IF NOT EXISTS cyclonic_systems (
    id SERIAL PRIMARY KEY,
    system_code VARCHAR(50) UNIQUE NOT NULL,
    basin VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'weakening', 'dissipated', 'post_landfall')),
    current_category VARCHAR(100) NOT NULL,
    current_wind_kmh DOUBLE PRECISION NOT NULL,
    current_pressure_hpa DOUBLE PRECISION NOT NULL,
    current_lat DOUBLE PRECISION NOT NULL,
    current_lon DOUBLE PRECISION NOT NULL,
    movement_dir VARCHAR(20) DEFAULT 'NNW',
    movement_speed_kmh DOUBLE PRECISION DEFAULT 15.0,
    genesis_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dissipation_time TIMESTAMP WITH TIME ZONE,
    peak_category VARCHAR(100),
    is_live BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Detections Table (Satellite Frame Detections)
CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    source_sensors TEXT[] NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lon DOUBLE PRECISION NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    is_cyclone BOOLEAN DEFAULT TRUE,
    detection_method VARCHAR(100) DEFAULT 'IR+WV Multi-Spectral Segmentation',
    raw_satellite_meta JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Classifications Table (Intensity & Structure)
CREATE TABLE IF NOT EXISTS classifications (
    id SERIAL PRIMARY KEY,
    detection_id INT REFERENCES detections(id) ON DELETE SET NULL,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    wind_kmh DOUBLE PRECISION NOT NULL,
    wind_kt DOUBLE PRECISION NOT NULL,
    pressure_hpa DOUBLE PRECISION NOT NULL,
    ci_number_equivalent DOUBLE PRECISION NOT NULL,
    t_number DOUBLE PRECISION NOT NULL,
    eye_present BOOLEAN DEFAULT FALSE,
    eye_diameter_km DOUBLE PRECISION,
    structure_notes TEXT,
    symmetry_index DOUBLE PRECISION DEFAULT 0.85,
    confidence DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Track Forecasts Table
CREATE TABLE IF NOT EXISTS track_forecasts (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    lead_h INT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    uncertainty_km DOUBLE PRECISION NOT NULL,
    category VARCHAR(100) NOT NULL,
    wind_kmh DOUBLE PRECISION NOT NULL,
    wind_kt DOUBLE PRECISION NOT NULL,
    pressure_hpa DOUBLE PRECISION NOT NULL,
    ri_probability DOUBLE PRECISION DEFAULT 0.0
);

-- 9. GIS Track Geometry Table (LineStrings, Polygons)
CREATE TABLE IF NOT EXISTS gis_track_geometry (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    geom_type VARCHAR(50) NOT NULL CHECK (geom_type IN ('track_past', 'track_forecast', 'cone', 'wind_radii_34', 'wind_radii_50', 'wind_radii_64')),
    geom geometry(Geometry, 4326) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gis_track_geom ON gis_track_geometry USING GIST(geom);

-- 10. Landfall Estimates Table
CREATE TABLE IF NOT EXISTS landfall_estimates (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    district_id INT REFERENCES coastal_districts(id) ON DELETE CASCADE,
    district_name VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    probability DOUBLE PRECISION NOT NULL,
    eta_window_start TIMESTAMP WITH TIME ZONE,
    eta_window_end TIMESTAMP WITH TIME ZONE,
    surge_height_m DOUBLE PRECISION DEFAULT 1.5,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Environmental Data Table (NWP / Reanalysis Fields)
CREATE TABLE IF NOT EXISTS environmental_data (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    sea_surface_temp DOUBLE PRECISION NOT NULL,
    wind_shear DOUBLE PRECISION NOT NULL,
    mid_level_rh DOUBLE PRECISION NOT NULL,
    steering_flow_speed DOUBLE PRECISION NOT NULL,
    steering_flow_dir DOUBLE PRECISION NOT NULL,
    cloud_top_temp DOUBLE PRECISION NOT NULL,
    ocean_heat_content DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL CHECK (level IN ('WATCH', 'WARNING', 'SEVERE')),
    category VARCHAR(100) NOT NULL,
    wind_kmh DOUBLE PRECISION NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    affected_districts TEXT[] DEFAULT ARRAY[]::TEXT[],
    channels_dispatched TEXT[] DEFAULT ARRAY['WEBSOCKET', 'PUSH']::TEXT[],
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    sha256_hash VARCHAR(64) NOT NULL,
    blockchain_tx_ref VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bulletins Table
CREATE TABLE IF NOT EXISTS bulletins (
    id SERIAL PRIMARY KEY,
    bulletin_number VARCHAR(100) UNIQUE NOT NULL,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    wind_kmh DOUBLE PRECISION NOT NULL,
    pressure_hpa DOUBLE PRECISION NOT NULL,
    landfall_summary TEXT NOT NULL,
    warning_signals VARCHAR(255) DEFAULT 'Great Danger Signal No. 10 (Local Ports)',
    fishermen_warning TEXT NOT NULL,
    full_text TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    blockchain_tx_ref VARCHAR(66),
    block_number INT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Blockchain Records Table
CREATE TABLE IF NOT EXISTS blockchain_records (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    ref_table VARCHAR(50) NOT NULL,
    ref_id INT,
    data_hash VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number INT,
    contract_address VARCHAR(42),
    network VARCHAR(50) DEFAULT 'Hardhat Local / Ethereum L2',
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    issuer VARCHAR(255) DEFAULT 'CHAKRAVYUH_CORE_ORACLE',
    anchored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. GIS Layers Table
CREATE TABLE IF NOT EXISTS gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layer_key VARCHAR(100) UNIQUE NOT NULL,
    layer_type VARCHAR(50) DEFAULT 'VECTOR',
    style_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    detected_language VARCHAR(10) DEFAULT 'en',
    response_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
