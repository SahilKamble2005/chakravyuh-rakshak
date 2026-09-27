-- ============================================================
-- Chakravyuh Rakshak — Initial Schema Migration
-- PostgreSQL + PostGIS (Canonical Storage SRID EPSG:4326)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ANALYST', 'AUTHORITY', 'ADMIN')),
    preferred_language VARCHAR(10) DEFAULT 'en',
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geometry geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_locations_geometry ON locations USING GIST(geometry);

-- 3. Ocean Basin Polygons Table
CREATE TABLE IF NOT EXISTS ocean_basin_polygons (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ocean_basin_geom ON ocean_basin_polygons USING GIST(geom);

-- 4. Saved Locations Table
CREATE TABLE IF NOT EXISTS saved_locations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    geom geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_saved_locations_geom ON saved_locations USING GIST(geom);

-- 5. GIS Layers Table
CREATE TABLE IF NOT EXISTS gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) CHECK (layer_type IN ('VECTOR', 'RASTER')),
    source_format VARCHAR(50) CHECK (source_format IN ('GEOJSON', 'SHAPEFILE', 'GEOTIFF', 'WMS', 'WFS')),
    geom geometry(Geometry, 4326),
    style_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gis_layers_geom ON gis_layers USING GIST(geom);

-- 6. Risk Grid Cells Table
CREATE TABLE IF NOT EXISTS risk_grid_cells (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    geom geometry(Polygon, 4326) NOT NULL,
    probability DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_grid_cells_geom ON risk_grid_cells USING GIST(geom);

-- 7. Environmental Data Table
CREATE TABLE IF NOT EXISTS environmental_data (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    sea_surface_temp DOUBLE PRECISION NOT NULL,
    wind_shear DOUBLE PRECISION NOT NULL,
    cloud_top_temp DOUBLE PRECISION NOT NULL,
    rainfall DOUBLE PRECISION NOT NULL,
    humidity DOUBLE PRECISION NOT NULL,
    ocean_heat_content DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    pattern VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    probability DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    confidence DOUBLE PRECISION NOT NULL,
    model_version VARCHAR(50) DEFAULT 'v2.1.0',
    data_hash VARCHAR(64) NOT NULL,
    blockchain_status VARCHAR(20) DEFAULT 'PENDING' CHECK (blockchain_status IN ('PENDING', 'SUBMITTED', 'CONFIRMED', 'VERIFIED', 'FAILED')),
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number INT,
    blockchain_contract_address VARCHAR(42),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Risk History Table
CREATE TABLE IF NOT EXISTS risk_history (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    probability DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    probability DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('MODERATE', 'HIGH', 'CRITICAL')),
    trigger VARCHAR(255) NOT NULL,
    audio_status VARCHAR(50) DEFAULT 'INACTIVE',
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    data_hash VARCHAR(64) NOT NULL,
    blockchain_status VARCHAR(20) DEFAULT 'PENDING',
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Blockchain Records Table
CREATE TABLE IF NOT EXISTS blockchain_records (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    location_id INT REFERENCES locations(id) ON DELETE CASCADE,
    record_type VARCHAR(50) NOT NULL CHECK (record_type IN ('PREDICTION', 'ALERT', 'ENVIRONMENT', 'VERIFICATION')),
    data_hash VARCHAR(64) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number INT,
    contract_address VARCHAR(42),
    network VARCHAR(50) DEFAULT 'localhost',
    status VARCHAR(20) DEFAULT 'PENDING',
    issuer VARCHAR(255) DEFAULT 'SYSTEM',
    ipfs_cid VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    audio_enabled BOOLEAN DEFAULT TRUE,
    moderate_channels JSONB DEFAULT '["in_app", "push"]'::jsonb,
    high_channels JSONB DEFAULT '["push", "sms", "in_app"]'::jsonb,
    critical_channels JSONB DEFAULT '["push", "sms", "in_app", "audio"]'::jsonb
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    alert_id INT REFERENCES alerts(id) ON DELETE CASCADE,
    channel VARCHAR(20) CHECK (channel IN ('SMS', 'PUSH', 'WEBSOCKET')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED')),
    provider_message_id VARCHAR(255),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    detected_language VARCHAR(10) DEFAULT 'en',
    response_language VARCHAR(10) DEFAULT 'en',
    referenced_record_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    scope VARCHAR(50) DEFAULT 'GLOBAL',
    updated_by VARCHAR(255) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Initial Feature Flags Seed Data
INSERT INTO feature_flags (key, enabled, scope) VALUES
    ('demo_mode.satellite_data', TRUE, 'GLOBAL'),
    ('demo_mode.geocoding', TRUE, 'GLOBAL'),
    ('demo_mode.blockchain', TRUE, 'GLOBAL'),
    ('demo_mode.sms', TRUE, 'GLOBAL'),
    ('gis.wms_wfs_service', TRUE, 'GLOBAL'),
    ('chatbot.voice_io', FALSE, 'GLOBAL')
ON CONFLICT (key) DO NOTHING;
