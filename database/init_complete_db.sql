-- ============================================================
-- Chakravyuh Rakshak — Complete Clean Database Initialization
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- Drop all existing tables in reverse dependency order
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS blockchain_records CASCADE;
DROP TABLE IF EXISTS bulletins CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS landfall_estimates CASCADE;
DROP TABLE IF EXISTS gis_track_geometry CASCADE;
DROP TABLE IF EXISTS track_forecasts CASCADE;
DROP TABLE IF EXISTS classifications CASCADE;
DROP TABLE IF EXISTS detections CASCADE;
DROP TABLE IF EXISTS environmental_data CASCADE;
DROP TABLE IF EXISTS cyclonic_systems CASCADE;
DROP TABLE IF EXISTS land_polygons CASCADE;
DROP TABLE IF EXISTS coastal_districts CASCADE;
DROP TABLE IF EXISTS ocean_basins CASCADE;
DROP TABLE IF EXISTS ocean_basin_polygons CASCADE;
DROP TABLE IF EXISTS gis_layers CASCADE;
DROP TABLE IF EXISTS risk_history CASCADE;
DROP TABLE IF EXISTS risk_grid_cells CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS saved_locations CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
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
CREATE TABLE ocean_basins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    basin_code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ocean_basins_geom ON ocean_basins USING GIST(geom);

-- 3. Coastal Districts Table
CREATE TABLE coastal_districts (
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
CREATE INDEX idx_coastal_districts_geom ON coastal_districts USING GIST(geom);

-- 4. Land Polygons Table
CREATE TABLE land_polygons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX idx_land_polygons_geom ON land_polygons USING GIST(geom);

-- 5. Cyclonic Systems Table
CREATE TABLE cyclonic_systems (
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

-- 6. Detections Table
CREATE TABLE detections (
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

-- 7. Classifications Table
CREATE TABLE classifications (
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
CREATE TABLE track_forecasts (
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

-- 9. GIS Track Geometry Table
CREATE TABLE gis_track_geometry (
    id SERIAL PRIMARY KEY,
    system_id INT REFERENCES cyclonic_systems(id) ON DELETE CASCADE,
    geom_type VARCHAR(50) NOT NULL,
    geom geometry(Geometry, 4326) NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_gis_track_geom ON gis_track_geometry USING GIST(geom);

-- 10. Landfall Estimates Table
CREATE TABLE landfall_estimates (
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

-- 11. Environmental Data Table
CREATE TABLE environmental_data (
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
CREATE TABLE alerts (
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
    sha256_hash VARCHAR(100) NOT NULL,
    blockchain_tx_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Bulletins Table
CREATE TABLE bulletins (
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
    sha256_hash VARCHAR(100) NOT NULL,
    blockchain_tx_ref VARCHAR(100),
    block_number INT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Blockchain Records Table
CREATE TABLE blockchain_records (
    id SERIAL PRIMARY KEY,
    record_id VARCHAR(100) UNIQUE NOT NULL,
    ref_table VARCHAR(50) NOT NULL,
    ref_id INT,
    data_hash VARCHAR(100) NOT NULL,
    transaction_hash VARCHAR(100),
    block_number INT,
    contract_address VARCHAR(100),
    network VARCHAR(100) DEFAULT 'Hardhat Local / Ethereum L2',
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    issuer VARCHAR(255) DEFAULT 'CHAKRAVYUH_CORE_ORACLE',
    anchored_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. GIS Layers Table
CREATE TABLE gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    layer_key VARCHAR(100) UNIQUE NOT NULL,
    layer_type VARCHAR(50) DEFAULT 'VECTOR',
    style_config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Chat Messages Table
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    detected_language VARCHAR(10) DEFAULT 'en',
    response_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Feature Flags Table
CREATE TABLE feature_flags (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    scope VARCHAR(50) DEFAULT 'GLOBAL',
    updated_by VARCHAR(255) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Notification Preferences Table
CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    audio_enabled BOOLEAN DEFAULT TRUE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Users
INSERT INTO users (id, name, email, password_hash, role, preferred_language, phone_number, phone_verified, preferred_basin)
VALUES
(1, 'Commander Vikram Malhotra', 'admin@chakravyuh.gov.in', '$2b$12$e8xL4s30zT3L8W2u9C6B..vXyM/1dG9G4eE1p6P1U9B8c6I.Xp0pW', 'ADMIN', 'en', '+919876543210', TRUE, 'Bay of Bengal'),
(2, 'Dr. Ananya Ray', 'ananya.ray@imd.gov.in', '$2b$12$e8xL4s30zT3L8W2u9C6B..vXyM/1dG9G4eE1p6P1U9B8c6I.Xp0pW', 'ANALYST', 'en', '+919811223344', TRUE, 'Bay of Bengal'),
(3, 'Disaster Operations Lead', 'ops@disastermgmt.gov.in', '$2b$12$e8xL4s30zT3L8W2u9C6B..vXyM/1dG9G4eE1p6P1U9B8c6I.Xp0pW', 'AUTHORITY', 'hi', '+919876500000', TRUE, 'Arabian Sea');

-- Ocean Basins
INSERT INTO ocean_basins (id, name, basin_code, description, geom) VALUES
(1, 'Bay of Bengal', 'NIO_BOB', 'North Indian Ocean - Bay of Bengal sub-basin', ST_Multi(ST_GeomFromText('POLYGON((80.0 5.0, 95.0 5.0, 98.0 20.0, 92.0 22.5, 88.0 22.0, 84.0 19.0, 80.0 13.0, 80.0 5.0))', 4326))),
(2, 'Arabian Sea', 'NIO_ARB', 'North Indian Ocean - Arabian Sea sub-basin', ST_Multi(ST_GeomFromText('POLYGON((50.0 5.0, 77.0 5.0, 73.0 18.0, 68.0 24.0, 60.0 25.5, 55.0 15.0, 50.0 5.0))', 4326))),
(3, 'Western Pacific Ocean', 'W_PAC', 'Northwest Pacific Basin (Typhoon corridor)', ST_Multi(ST_GeomFromText('POLYGON((110.0 0.0, 160.0 0.0, 155.0 38.0, 120.0 35.0, 110.0 15.0, 110.0 0.0))', 4326))),
(4, 'North Atlantic Ocean', 'N_ATL', 'North Atlantic Basin (Hurricane corridor)', ST_Multi(ST_GeomFromText('POLYGON((-85.0 10.0, -30.0 10.0, -40.0 45.0, -78.0 35.0, -85.0 10.0))', 4326)));

-- Coastal Districts
INSERT INTO coastal_districts (id, name, state, country, basin, population, risk_weight, geom) VALUES
(1, 'Puri', 'Odisha', 'India', 'Bay of Bengal', 1698730, 1.3, ST_Multi(ST_GeomFromText('POLYGON((85.5 19.6, 86.2 19.8, 86.1 20.2, 85.4 20.0, 85.5 19.6))', 4326))),
(2, 'Jagatsinghpur', 'Odisha', 'India', 'Bay of Bengal', 1136971, 1.4, ST_Multi(ST_GeomFromText('POLYGON((86.1 19.9, 86.7 20.1, 86.6 20.5, 86.0 20.3, 86.1 19.9))', 4326))),
(3, 'Kendrapara', 'Odisha', 'India', 'Bay of Bengal', 1440218, 1.4, ST_Multi(ST_GeomFromText('POLYGON((86.4 20.3, 87.1 20.6, 87.0 20.9, 86.3 20.7, 86.4 20.3))', 4326))),
(4, 'Bhadrak', 'Odisha', 'India', 'Bay of Bengal', 1506522, 1.2, ST_Multi(ST_GeomFromText('POLYGON((86.6 20.8, 87.2 21.0, 87.0 21.3, 86.4 21.1, 86.6 20.8))', 4326))),
(5, 'Balasore', 'Odisha', 'India', 'Bay of Bengal', 2320529, 1.3, ST_Multi(ST_GeomFromText('POLYGON((86.8 21.2, 87.5 21.5, 87.2 21.8, 86.6 21.5, 86.8 21.2))', 4326))),
(6, 'South 24 Parganas (Sundarbans)', 'West Bengal', 'India', 'Bay of Bengal', 8161961, 1.5, ST_Multi(ST_GeomFromText('POLYGON((88.0 21.5, 89.1 21.6, 88.9 22.4, 88.1 22.2, 88.0 21.5))', 4326))),
(7, 'East Midnapore (Digha)', 'West Bengal', 'India', 'Bay of Bengal', 5095875, 1.3, ST_Multi(ST_GeomFromText('POLYGON((87.4 21.6, 88.1 21.8, 87.9 22.3, 87.3 22.0, 87.4 21.6))', 4326))),
(8, 'Visakhapatnam', 'Andhra Pradesh', 'India', 'Bay of Bengal', 4290589, 1.1, ST_Multi(ST_GeomFromText('POLYGON((83.1 17.5, 83.5 17.8, 83.3 18.1, 82.9 17.8, 83.1 17.5))', 4326))),
(9, 'Srikakulam', 'Andhra Pradesh', 'India', 'Bay of Bengal', 2703114, 1.2, ST_Multi(ST_GeomFromText('POLYGON((83.8 18.2, 84.6 18.8, 84.3 19.1, 83.6 18.6, 83.8 18.2))', 4326))),
(10, 'Chennai Coastal', 'Tamil Nadu', 'India', 'Bay of Bengal', 7088403, 1.3, ST_Multi(ST_GeomFromText('POLYGON((80.1 12.8, 80.4 13.0, 80.3 13.3, 80.0 13.1, 80.1 12.8))', 4326))),
(11, 'Mumbai Coastal', 'Maharashtra', 'India', 'Arabian Sea', 12442373, 1.4, ST_Multi(ST_GeomFromText('POLYGON((72.7 18.8, 73.0 19.0, 72.9 19.3, 72.6 19.1, 72.7 18.8))', 4326))),
(12, 'Ratnagiri', 'Maharashtra', 'India', 'Arabian Sea', 1615269, 1.0, ST_Multi(ST_GeomFromText('POLYGON((73.1 16.8, 73.5 17.0, 73.4 17.4, 73.0 17.2, 73.1 16.8))', 4326)));

-- Active Cyclonic Systems
INSERT INTO cyclonic_systems (id, system_code, basin, name, status, current_category, current_wind_kmh, current_pressure_hpa, current_lat, current_lon, movement_dir, movement_speed_kmh, peak_category, is_live)
VALUES
(1, 'BOB-06-2026', 'Bay of Bengal', 'Severe Cyclonic Storm DANA', 'active', 'SEVERE CYCLONIC STORM', 115.0, 976.0, 17.4, 87.2, 'NNW', 16.5, 'VERY SEVERE CYCLONIC STORM', TRUE),
(2, 'ARB-02-2026', 'Arabian Sea', 'Deep Depression ARB-02', 'active', 'DEEP DEPRESSION', 58.0, 998.0, 15.1, 68.4, 'WNW', 12.0, 'CYCLONIC STORM', TRUE),
(3, 'BOB-04-2025', 'Bay of Bengal', 'Very Severe Cyclonic Storm REMAL', 'dissipated', 'VERY SEVERE CYCLONIC STORM', 135.0, 968.0, 21.8, 89.2, 'N', 18.0, 'VERY SEVERE CYCLONIC STORM', FALSE),
(4, 'ARB-01-2025', 'Arabian Sea', 'Extremely Severe Cyclonic Storm BIPARJOY', 'dissipated', 'EXTREMELY SEVERE CYCLONIC STORM', 175.0, 952.0, 22.6, 68.8, 'NE', 14.0, 'EXTREMELY SEVERE CYCLONIC STORM', FALSE);

-- Environmental Data
INSERT INTO environmental_data (system_id, sea_surface_temp, wind_shear, mid_level_rh, steering_flow_speed, steering_flow_dir, cloud_top_temp, ocean_heat_content)
VALUES
(1, 30.4, 11.2, 82.5, 18.2, 335.0, 198.5, 112.0),
(2, 28.6, 18.4, 68.0, 12.5, 290.0, 224.0, 65.0);

-- Detections
INSERT INTO detections (id, system_id, source_sensors, center_lat, center_lon, confidence, is_cyclone, detection_method)
VALUES
(1, 1, ARRAY['INSAT-3DR_TIR1', 'INSAT-3DR_WV', 'HIMAWARI9_B13', 'ASCAT_METOP_B'], 17.4, 87.2, 0.96, TRUE, 'Multi-Spectral IR+WV Deep CNN Segmentation'),
(2, 2, ARRAY['INSAT-3DR_TIR1', 'GOES18_IR', 'OSCAT2'], 15.1, 68.4, 0.89, TRUE, 'Vorticity & Brightness Temp Gradient Analysis');

-- Classifications
INSERT INTO classifications (id, detection_id, system_id, category, wind_kmh, wind_kt, pressure_hpa, ci_number_equivalent, t_number, eye_present, eye_diameter_km, structure_notes, symmetry_index, confidence)
VALUES
(1, 1, 1, 'SEVERE CYCLONIC STORM', 115.0, 62.0, 976.0, 4.2, 4.0, TRUE, 26.5, 'Well-defined central dense overcast with embedded warming eye-pinhole and tightly wrapped spiral banding.', 0.88, 0.94),
(2, 2, 2, 'DEEP DEPRESSION', 58.0, 31.0, 998.0, 2.5, 2.5, FALSE, NULL, 'Moderate vertical shear causing convection to be displaced to western semicircle. Curved banding 0.4 wrap.', 0.62, 0.86);

-- Track Forecasts
INSERT INTO track_forecasts (system_id, lead_h, lat, lon, uncertainty_km, category, wind_kmh, wind_kt, pressure_hpa, ri_probability) VALUES
(1, 12, 18.3, 86.8, 32.0, 'VERY SEVERE CYCLONIC STORM', 125.0, 68.0, 970.0, 0.45),
(1, 24, 19.4, 86.3, 58.0, 'VERY SEVERE CYCLONIC STORM', 140.0, 75.0, 962.0, 0.52),
(1, 36, 20.3, 85.9, 85.0, 'VERY SEVERE CYCLONIC STORM', 145.0, 78.0, 958.0, 0.38),
(1, 48, 20.9, 85.6, 115.0, 'SEVERE CYCLONIC STORM', 105.0, 57.0, 982.0, 0.10),
(1, 72, 21.8, 85.1, 170.0, 'CYCLONIC STORM', 75.0, 40.0, 994.0, 0.02),
(1, 96, 22.5, 84.7, 240.0, 'DEPRESSION', 45.0, 24.0, 1002.0, 0.0),
(1, 120, 23.1, 84.3, 320.0, 'WELL MARKED LOW', 30.0, 16.0, 1006.0, 0.0),
(2, 12, 15.6, 67.4, 38.0, 'CYCLONIC STORM', 65.0, 35.0, 994.0, 0.15),
(2, 24, 16.2, 66.2, 70.0, 'CYCLONIC STORM', 75.0, 40.0, 990.0, 0.20),
(2, 48, 17.1, 64.1, 130.0, 'SEVERE CYCLONIC STORM', 90.0, 48.0, 984.0, 0.25),
(2, 72, 18.0, 62.2, 195.0, 'CYCLONIC STORM', 70.0, 38.0, 992.0, 0.05);

-- GIS Track Geometry
INSERT INTO gis_track_geometry (system_id, geom_type, geom, properties) VALUES
(1, 'track_past', ST_SetSRID(ST_GeomFromText('LINESTRING(88.8 14.2, 88.2 15.3, 87.7 16.4, 87.2 17.4)'), 4326), '{"name": "Observed Best Track", "points_count": 4}'::jsonb),
(1, 'track_forecast', ST_SetSRID(ST_GeomFromText('LINESTRING(87.2 17.4, 86.8 18.3, 86.3 19.4, 85.9 20.3, 85.6 20.9, 85.1 21.8, 84.7 22.5, 84.3 23.1)'), 4326), '{"name": "Forecast Track 120h", "model": "ECMWF-GFS-Hybrid ML"}'::jsonb),
(1, 'cone', ST_SetSRID(ST_GeomFromText('POLYGON((87.2 17.4, 86.2 18.2, 85.4 19.3, 84.7 20.2, 84.1 20.8, 83.2 21.7, 82.5 22.4, 82.0 23.1, 86.6 23.1, 86.9 22.6, 87.1 21.9, 87.1 21.0, 87.2 20.4, 87.2 19.5, 87.4 18.4, 87.2 17.4))'), 4326), '{"confidence": "67% NHC/IMD Standard Cone"}'::jsonb),
(1, 'wind_radii_64', ST_SetSRID(ST_GeomFromText('POLYGON((87.2 17.9, 87.7 17.4, 87.2 16.9, 86.7 17.4, 87.2 17.9))'), 4326), '{"wind_kt": 64, "radius_km": 55}'::jsonb),
(1, 'wind_radii_50', ST_SetSRID(ST_GeomFromText('POLYGON((87.2 18.3, 88.1 17.4, 87.2 16.5, 86.3 17.4, 87.2 18.3))'), 4326), '{"wind_kt": 50, "radius_km": 100}'::jsonb),
(1, 'wind_radii_34', ST_SetSRID(ST_GeomFromText('POLYGON((87.2 18.9, 88.7 17.4, 87.2 15.9, 85.7 17.4, 87.2 18.9))'), 4326), '{"wind_kt": 34, "radius_km": 170}'::jsonb),
-- ARB-02 track past & forecast
(2, 'track_past', ST_SetSRID(ST_GeomFromText('LINESTRING(71.2 13.8, 70.1 14.4, 68.4 15.1)'), 4326), '{"name": "Observed Track ARB-02"}'::jsonb),
(2, 'track_forecast', ST_SetSRID(ST_GeomFromText('LINESTRING(68.4 15.1, 67.4 15.6, 66.2 16.2, 64.1 17.1, 62.2 18.0)'), 4326), '{"name": "Forecast Track ARB-02"}'::jsonb),
(2, 'cone', ST_SetSRID(ST_GeomFromText('POLYGON((68.4 15.1, 67.0 15.4, 65.4 16.0, 63.0 16.9, 61.0 17.8, 63.4 18.2, 65.2 17.3, 67.4 16.4, 68.4 15.1))'), 4326), '{"confidence": "Standard Cone"}'::jsonb);

-- Landfall Estimates
INSERT INTO landfall_estimates (system_id, district_id, district_name, state, probability, eta_window_start, eta_window_end, surge_height_m)
VALUES
(1, 1, 'Puri', 'Odisha', 0.84, NOW() + INTERVAL '28 hours', NOW() + INTERVAL '34 hours', 2.8),
(1, 2, 'Jagatsinghpur', 'Odisha', 0.76, NOW() + INTERVAL '30 hours', NOW() + INTERVAL '36 hours', 2.4),
(1, 3, 'Kendrapara', 'Odisha', 0.62, NOW() + INTERVAL '32 hours', NOW() + INTERVAL '38 hours', 2.1),
(1, 4, 'Bhadrak', 'Odisha', 0.48, NOW() + INTERVAL '34 hours', NOW() + INTERVAL '40 hours', 1.8),
(1, 5, 'Balasore', 'Odisha', 0.35, NOW() + INTERVAL '36 hours', NOW() + INTERVAL '42 hours', 1.5),
(1, 7, 'East Midnapore (Digha)', 'West Bengal', 0.28, NOW() + INTERVAL '36 hours', NOW() + INTERVAL '42 hours', 1.4),
(1, 6, 'South 24 Parganas (Sundarbans)', 'West Bengal', 0.19, NOW() + INTERVAL '38 hours', NOW() + INTERVAL '44 hours', 1.2);

-- Alerts
INSERT INTO alerts (id, system_id, level, category, wind_kmh, title, message, affected_districts, channels_dispatched, acknowledged, sha256_hash, blockchain_tx_ref)
VALUES
(1, 1, 'SEVERE', 'VERY SEVERE CYCLONIC STORM', 140.0, 'RED EMERGENCY: Cyclone DANA Landfall Warning for Odisha Coast', 'Severe Cyclonic Storm DANA is intensifying into a Very Severe Cyclonic Storm over Westcentral & adjoining Northwest Bay of Bengal. High probability of landfall near Puri-Jagatsinghpur coastline within 30-36 hours. Storm surge up to 2.8m expected.', ARRAY['Puri', 'Jagatsinghpur', 'Kendrapara', 'Bhadrak', 'Balasore'], ARRAY['WEBSOCKET', 'PUSH', 'SMS', 'AUDIO'], FALSE, '9b7f8c4e12d3a567f890123456789abcdef0123456789abcdef0123456789abcd', '0x8f2a1b94c3d7e50218f4a9b6c3d8e1f5a7b2c9d4e6f8a1b3c5d7e9f1a3b5c7d9'),
(2, 1, 'WARNING', 'SEVERE CYCLONIC STORM', 115.0, 'ORANGE ALERT: Cyclone DANA Approaching North Odisha - West Bengal Coast', 'Cyclonic Storm DANA has upgraded to Severe Cyclonic Storm. Gale winds reaching 100-120 km/h prevailing over Central Bay of Bengal. Fishermen are strictly advised not to venture into deep sea.', ARRAY['Puri', 'Jagatsinghpur', 'East Midnapore'], ARRAY['WEBSOCKET', 'PUSH', 'SMS'], TRUE, '3c2e1a9f8b7d6c5e4a3b2c1d0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e', '0x7e1d5a8b4c2f6e9a3d7b1c5f8e2a4d6b9c1e3f5a7d9b2c4e6f8a0b2d4e6f8a1b'),
(3, 2, 'WATCH', 'DEEP DEPRESSION', 58.0, 'YELLOW WATCH: Deep Depression ARB-02 over Eastcentral Arabian Sea', 'Deep depression observed at 15.1°N, 68.4°E. Likely to move west-northwestwards away from Indian coast with moderate sea conditions.', ARRAY['Maharashtra Offshore', 'Goa Offshore'], ARRAY['WEBSOCKET', 'PUSH'], TRUE, '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b');

-- Bulletins
INSERT INTO bulletins (id, bulletin_number, system_id, title, category, wind_kmh, pressure_hpa, landfall_summary, warning_signals, fishermen_warning, full_text, sha256_hash, blockchain_tx_ref, block_number)
VALUES
(1, 'BOB-DANA-BLTN-08', 1, 'NATIONAL CYCLONE WARNING BULLETIN NO. 8: SEVERE CYCLONE DANA', 'VERY SEVERE CYCLONIC STORM', 140.0, 962.0, 'Landfall expected between Puri and Dhamra Port (Odisha) during night of 26th-27th with peak sustained wind speed of 120-135 kmph gusting to 150 kmph.', 'Great Danger Signal No. 10 hoisted at Paradip and Dhamra ports. Signal No. 8 at Gopalpur.', 'Fishermen are strictly advised not to venture into North and Central Bay of Bengal until 28th.', 'INDIA METEOROLOGICAL DEPARTMENT / RSMC CYCLONE WARNING FOR NORTH INDIAN OCEAN
BULLETIN NO.: 08 (BOB/06/2026)
TIME OF ISSUE: 0600 HOURS UTC

SUBJECT: SEVERE CYCLONIC STORM “DANA” (PRONOUNCED AS DA-NA) OVER WESTCENTRAL & NORTHWEST BAY OF BENGAL (CYCLONE WARNING FOR ODISHA AND WEST BENGAL COASTS: RED MESSAGE)

The Severe Cyclonic Storm “DANA” moved north-northwestwards with a speed of 16 kmph during past 6 hours and lay centered at 0600 UTC of today over Northwest Bay of Bengal near latitude 17.4°N and longitude 87.2°E, about 280 km south-southeast of Paradip (Odisha) and 350 km south of Sagar Island (West Bengal).

It is very likely to move north-northwestwards and intensify further into a VERY SEVERE CYCLONIC STORM over Northwest Bay of Bengal during next 12 hours. It is likely to cross north Odisha and West Bengal coasts between Puri and Sagar Island, close to Bhitarkanika and Dhamra during night of 26th to morning of 27th with wind speed of 120-135 kmph gusting to 150 kmph.

1. WIND WARNING:
- Gale wind speed reaching 100-110 kmph gusting to 120 kmph is prevailing over Northwest Bay of Bengal.
- It will increase to 120-135 kmph gusting to 150 kmph along and off north Odisha and West Bengal coasts from 26th evening.

2. STORM SURGE WARNING:
Tidal wave of height about 1.5 to 2.5 m above astronomical tide is likely to inundate low lying areas of Kendrapara, Bhadrak and Balasore districts of Odisha at the time of landfall.

3. DAMAGE EXPECTED:
- Total destruction of thatched houses/extensive damage to kutcha houses.
- Uprooting of large banyan and coconut trees.
- Major disruption of rail and road traffic.
- Localized flooding in coastal low-lying tracts.', '9b7f8c4e12d3a567f890123456789abcdef0123456789abcdef0123456789abcd', '0x8f2a1b94c3d7e50218f4a9b6c3d8e1f5a7b2c9d4e6f8a1b3c5d7e9f1a3b5c7d9', 1543288),
(2, 'BOB-DANA-BLTN-07', 1, 'NATIONAL CYCLONE BULLETIN NO. 7: CYCLONE DANA INTENSIFIES', 'SEVERE CYCLONIC STORM', 115.0, 976.0, 'Approaching Odisha coastline. Anticipated landfall within 36-48 hours.', 'Local Cautionary Signal No. 3 at all East Coast ports.', 'Total suspension of fishing operations over Central and North Bay of Bengal.', 'CYCLONE ADVISORY BULLETIN 07: Cyclonic storm DANA upgraded to Severe Cyclonic Storm. Maximum sustained winds 115 km/h.', '3c2e1a9f8b7d6c5e4a3b2c1d0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e', '0x7e1d5a8b4c2f6e9a3d7b1c5f8e2a4d6b9c1e3f5a7d9b2c4e6f8a0b2d4e6f8a1b', 1543265);

-- Blockchain Records
INSERT INTO blockchain_records (id, record_id, ref_table, ref_id, data_hash, transaction_hash, block_number, contract_address, network, status, issuer)
VALUES
(1, 'BLTN-2026-0008', 'bulletins', 1, '9b7f8c4e12d3a567f890123456789abcdef0123456789abcdef0123456789abcd', '0x8f2a1b94c3d7e50218f4a9b6c3d8e1f5a7b2c9d4e6f8a1b3c5d7e9f1a3b5c7d9', 1543288, '0x3B9A570D12E6B4F819A208D1C743E5109489A12B', 'Hardhat Local / Ethereum L2', 'CONFIRMED', 'RSMC_IMD_AUTHORIZED_ORACLE'),
(2, 'BLTN-2026-0007', 'bulletins', 2, '3c2e1a9f8b7d6c5e4a3b2c1d0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e', '0x7e1d5a8b4c2f6e9a3d7b1c5f8e2a4d6b9c1e3f5a7d9b2c4e6f8a0b2d4e6f8a1b', 1543265, '0x3B9A570D12E6B4F819A208D1C743E5109489A12B', 'Hardhat Local / Ethereum L2', 'CONFIRMED', 'RSMC_IMD_AUTHORIZED_ORACLE'),
(3, 'ALT-2026-0001', 'alerts', 1, '9b7f8c4e12d3a567f890123456789abcdef0123456789abcdef0123456789abcd', '0x8f2a1b94c3d7e50218f4a9b6c3d8e1f5a7b2c9d4e6f8a1b3c5d7e9f1a3b5c7d9', 1543288, '0x3B9A570D12E6B4F819A208D1C743E5109489A12B', 'Hardhat Local / Ethereum L2', 'CONFIRMED', 'CHAKRAVYUH_ALERT_DISPATCH');

-- GIS Layers
INSERT INTO gis_layers (id, name, layer_key, layer_type, style_config, is_active)
VALUES
(1, 'Observed Cyclone Tracks', 'layer_track_past', 'VECTOR', '{"color": "#1E293B", "weight": 3, "dashArray": null}'::jsonb, TRUE),
(2, 'Forecast Cone of Uncertainty', 'layer_cone', 'VECTOR', '{"color": "#DC2626", "fillColor": "#F87171", "fillOpacity": 0.25, "weight": 2}'::jsonb, TRUE),
(3, 'Forecast Center Track', 'layer_track_forecast', 'VECTOR', '{"color": "#DC2626", "weight": 3, "dashArray": "6, 6"}'::jsonb, TRUE),
(4, 'Gale Wind Radii (34 kt)', 'layer_wind_34', 'VECTOR', '{"color": "#F59E0B", "fillColor": "#FCD34D", "fillOpacity": 0.15, "weight": 1.5}'::jsonb, TRUE),
(5, 'Storm Wind Radii (50 kt)', 'layer_wind_50', 'VECTOR', '{"color": "#EA580C", "fillColor": "#FB923C", "fillOpacity": 0.2, "weight": 1.5}'::jsonb, TRUE),
(6, 'Hurricane Wind Radii (64 kt)', 'layer_wind_64', 'VECTOR', '{"color": "#DC2626", "fillColor": "#EF4444", "fillOpacity": 0.25, "weight": 2}'::jsonb, TRUE),
(7, 'Coastal Administrative Districts', 'layer_districts', 'VECTOR', '{"color": "#0284C7", "fillColor": "#38BDF8", "fillOpacity": 0.1, "weight": 1}'::jsonb, TRUE),
(8, 'Ocean Basin Boundaries', 'layer_basins', 'VECTOR', '{"color": "#0D9488", "fillColor": "#2DD4BF", "fillOpacity": 0.05, "weight": 1.5}'::jsonb, TRUE),
(9, 'SST / Sea Surface Temperature', 'layer_sst', 'RASTER', '{"opacity": 0.6, "colormap": "turbo"}'::jsonb, FALSE);

-- Feature Flags
INSERT INTO feature_flags (id, key, enabled, scope) VALUES
(1, 'demo_mode.satellite_data', TRUE, 'GLOBAL'),
(2, 'demo_mode.geocoding', TRUE, 'GLOBAL'),
(3, 'demo_mode.blockchain', TRUE, 'GLOBAL'),
(4, 'demo_mode.sms', TRUE, 'GLOBAL'),
(5, 'gis.wms_wfs_service', TRUE, 'GLOBAL'),
(6, 'chatbot.multilingual', TRUE, 'GLOBAL');
