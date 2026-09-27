from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from geoalchemy2 import Geometry

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="ANALYST")
    preferred_language = Column(String(10), default="en")
    phone_number = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    preferred_basin = Column(String(100), default="Bay of Bengal")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class OceanBasin(Base):
    __tablename__ = "ocean_basins"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    basin_code = Column(String(20), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CoastalDistrict(Base):
    __tablename__ = "coastal_districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    country = Column(String(100), default="India")
    basin = Column(String(100), default="Bay of Bengal")
    population = Column(Integer, default=1000000)
    risk_weight = Column(Float, default=1.0)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CyclonicSystem(Base):
    __tablename__ = "cyclonic_systems"

    id = Column(Integer, primary_key=True, index=True)
    system_code = Column(String(50), unique=True, nullable=False)
    basin = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    status = Column(String(50), default="active")
    current_category = Column(String(100), nullable=False)
    current_wind_kmh = Column(Float, nullable=False)
    current_pressure_hpa = Column(Float, nullable=False)
    current_lat = Column(Float, nullable=False)
    current_lon = Column(Float, nullable=False)
    movement_dir = Column(String(20), default="NNW")
    movement_speed_kmh = Column(Float, default=15.0)
    genesis_time = Column(DateTime(timezone=True), server_default=func.now())
    dissipation_time = Column(DateTime(timezone=True), nullable=True)
    peak_category = Column(String(100), nullable=True)
    is_live = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    detections = relationship("Detection", back_populates="system", cascade="all, delete-orphan")
    classifications = relationship("Classification", back_populates="system", cascade="all, delete-orphan")
    forecasts = relationship("TrackForecast", back_populates="system", cascade="all, delete-orphan")
    landfall_estimates = relationship("LandfallEstimate", back_populates="system", cascade="all, delete-orphan")
    environmental = relationship("EnvironmentalData", back_populates="system", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="system", cascade="all, delete-orphan")
    bulletins = relationship("Bulletin", back_populates="system", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    source_sensors = Column(ARRAY(String), nullable=False)
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    is_cyclone = Column(Boolean, default=True)
    detection_method = Column(String(100), default="IR+WV Multi-Spectral Segmentation")
    raw_satellite_meta = Column(JSON, default={})
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="detections")

class Classification(Base):
    __tablename__ = "classifications"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id", ondelete="SET NULL"), nullable=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    wind_kmh = Column(Float, nullable=False)
    wind_kt = Column(Float, nullable=False)
    pressure_hpa = Column(Float, nullable=False)
    ci_number_equivalent = Column(Float, nullable=False)
    t_number = Column(Float, nullable=False)
    eye_present = Column(Boolean, default=False)
    eye_diameter_km = Column(Float, nullable=True)
    structure_notes = Column(Text, nullable=True)
    symmetry_index = Column(Float, default=0.85)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="classifications")

class TrackForecast(Base):
    __tablename__ = "track_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    lead_h = Column(Integer, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    uncertainty_km = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    wind_kmh = Column(Float, nullable=False)
    wind_kt = Column(Float, nullable=False)
    pressure_hpa = Column(Float, nullable=False)
    ri_probability = Column(Float, default=0.0)

    system = relationship("CyclonicSystem", back_populates="forecasts")

class GISTrackGeometry(Base):
    __tablename__ = "gis_track_geometry"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    geom_type = Column(String(50), nullable=False)
    geom = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=False)
    properties = Column(JSON, default={})
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

class LandfallEstimate(Base):
    __tablename__ = "landfall_estimates"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    district_id = Column(Integer, ForeignKey("coastal_districts.id", ondelete="CASCADE"), nullable=False)
    district_name = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    probability = Column(Float, nullable=False)
    eta_window_start = Column(DateTime(timezone=True), nullable=True)
    eta_window_end = Column(DateTime(timezone=True), nullable=True)
    surge_height_m = Column(Float, default=1.5)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="landfall_estimates")

class EnvironmentalData(Base):
    __tablename__ = "environmental_data"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    sea_surface_temp = Column(Float, nullable=False)
    wind_shear = Column(Float, nullable=False)
    mid_level_rh = Column(Float, nullable=False)
    steering_flow_speed = Column(Float, nullable=False)
    steering_flow_dir = Column(Float, nullable=False)
    cloud_top_temp = Column(Float, nullable=False)
    ocean_heat_content = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="environmental")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    level = Column(String(20), nullable=False)
    category = Column(String(100), nullable=False)
    wind_kmh = Column(Float, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    affected_districts = Column(ARRAY(String), default=[])
    channels_dispatched = Column(ARRAY(String), default=["WEBSOCKET", "PUSH"])
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    sha256_hash = Column(String(100), nullable=False)
    blockchain_tx_ref = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="alerts")

class Bulletin(Base):
    __tablename__ = "bulletins"

    id = Column(Integer, primary_key=True, index=True)
    bulletin_number = Column(String(100), unique=True, nullable=False)
    system_id = Column(Integer, ForeignKey("cyclonic_systems.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    wind_kmh = Column(Float, nullable=False)
    pressure_hpa = Column(Float, nullable=False)
    landfall_summary = Column(Text, nullable=False)
    warning_signals = Column(String(255), default="Great Danger Signal No. 10 (Local Ports)")
    fishermen_warning = Column(Text, nullable=False)
    full_text = Column(Text, nullable=False)
    sha256_hash = Column(String(100), nullable=False)
    blockchain_tx_ref = Column(String(100), nullable=True)
    block_number = Column(Integer, nullable=True)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    system = relationship("CyclonicSystem", back_populates="bulletins")

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(100), unique=True, nullable=False)
    ref_table = Column(String(50), nullable=False)
    ref_id = Column(Integer, nullable=True)
    data_hash = Column(String(100), nullable=False)
    transaction_hash = Column(String(100), nullable=True)
    block_number = Column(Integer, nullable=True)
    contract_address = Column(String(100), nullable=True)
    network = Column(String(100), default="Hardhat Local / Ethereum L2")
    status = Column(String(20), default="CONFIRMED")
    issuer = Column(String(255), default="CHAKRAVYUH_CORE_ORACLE")
    anchored_at = Column(DateTime(timezone=True), server_default=func.now())

class GISLayer(Base):
    __tablename__ = "gis_layers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    layer_key = Column(String(100), unique=True, nullable=False)
    layer_type = Column(String(50), default="VECTOR")
    style_config = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    role = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    detected_language = Column(String(10), default="en")
    response_language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    enabled = Column(Boolean, default=True)
    scope = Column(String(50), default="GLOBAL")
    updated_by = Column(String(255), default="SYSTEM")
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
