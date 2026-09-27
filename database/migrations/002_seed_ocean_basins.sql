-- ============================================================
-- Chakravyuh Rakshak — Accurate Ocean Basin Seed Polygons
-- ============================================================

TRUNCATE TABLE ocean_basin_polygons;

INSERT INTO ocean_basin_polygons (source, geom) VALUES
('Bay of Bengal', ST_Multi(ST_GeomFromText('POLYGON((80.0 5.0, 95.0 5.0, 98.0 20.0, 92.0 22.0, 88.0 21.5, 80.0 13.0, 80.0 5.0))', 4326))),
('Arabian Sea', ST_Multi(ST_GeomFromText('POLYGON((55.0 5.0, 75.0 5.0, 72.0 20.0, 60.0 24.0, 55.0 15.0, 55.0 5.0))', 4326))),
('North Atlantic Ocean', ST_Multi(ST_GeomFromText('POLYGON((-80.0 10.0, -30.0 10.0, -40.0 45.0, -75.0 35.0, -80.0 10.0))', 4326))),
('Western Pacific Ocean', ST_Multi(ST_GeomFromText('POLYGON((120.0 5.0, 160.0 5.0, 150.0 35.0, 120.0 30.0, 120.0 5.0))', 4326)));
