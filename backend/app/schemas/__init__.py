from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# ── Auth Schemas ────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    preferred_language: Optional[str] = "en"
    phone_number: Optional[str] = None
    preferred_basin: Optional[str] = "Bay of Bengal"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    preferred_language: str
    phone_number: Optional[str] = None
    phone_verified: bool
    preferred_basin: Optional[str] = "Bay of Bengal"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ── Cyclonic System Schemas ─────────────────────────────────────────────
class CyclonicSystemSummary(BaseModel):
    id: int
    system_code: str
    basin: str
    name: str
    status: str
    current_category: str
    current_wind_kmh: float
    current_pressure_hpa: float
    current_lat: float
    current_lon: float
    movement_dir: str
    movement_speed_kmh: float
    genesis_time: datetime
    peak_category: Optional[str] = None
    is_live: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EnvironmentalSummary(BaseModel):
    sea_surface_temp: float
    wind_shear: float
    mid_level_rh: float
    steering_flow_speed: float
    steering_flow_dir: float
    cloud_top_temp: float
    ocean_heat_content: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ClassificationSummary(BaseModel):
    category: str
    wind_kmh: float
    wind_kt: float
    pressure_hpa: float
    ci_number_equivalent: float
    t_number: float
    eye_present: bool
    eye_diameter_km: Optional[float] = None
    structure_notes: Optional[str] = None
    symmetry_index: float
    confidence: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class ForecastPoint(BaseModel):
    lead_h: int
    lat: float
    lon: float
    uncertainty_km: float
    category: str
    wind_kmh: float
    wind_kt: float
    pressure_hpa: float
    ri_probability: float

class LandfallSummary(BaseModel):
    district_id: int
    district_name: str
    state: str
    probability: float
    eta_window_start: Optional[datetime] = None
    eta_window_end: Optional[datetime] = None
    surge_height_m: float

class SystemDetailResponse(BaseModel):
    system: CyclonicSystemSummary
    classification: Optional[ClassificationSummary] = None
    environmental: Optional[EnvironmentalSummary] = None
    forecasts: List[ForecastPoint] = []
    landfall_estimates: List[LandfallSummary] = []
    latest_bulletin_hash: Optional[str] = None
    blockchain_anchored: bool = False

# ── Pipeline Analysis Request & Response ────────────────────────────────
class AnalysisStep(BaseModel):
    step_number: int
    name: str
    status: str  # pending, running, completed, degraded
    details: str

class AnalysisProgressResponse(BaseModel):
    system_id: int
    system_name: str
    steps: List[AnalysisStep]
    final_category: str
    confidence: float
    ri_probability: float
    landfall_threat_districts: List[str]
    sha256_hash: str
    blockchain_tx: str
    timestamp: datetime

# ── Alert Schemas ───────────────────────────────────────────────────────
class AlertResponse(BaseModel):
    id: int
    system_id: int
    level: str
    category: str
    wind_kmh: float
    title: str
    message: str
    affected_districts: List[str]
    channels_dispatched: List[str]
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    sha256_hash: str
    blockchain_tx_ref: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertAcknowledgeRequest(BaseModel):
    acknowledged: bool = True

# ── Bulletin Schemas ────────────────────────────────────────────────────
class BulletinResponse(BaseModel):
    id: int
    bulletin_number: str
    system_id: int
    title: str
    category: str
    wind_kmh: float
    pressure_hpa: float
    landfall_summary: str
    warning_signals: str
    fishermen_warning: str
    full_text: str
    sha256_hash: str
    blockchain_tx_ref: Optional[str] = None
    block_number: Optional[int] = None
    issued_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ── Blockchain Schemas ──────────────────────────────────────────────────
class BlockchainRecordResponse(BaseModel):
    id: int
    record_id: str
    ref_table: str
    ref_id: Optional[int] = None
    data_hash: str
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    contract_address: Optional[str] = None
    network: str
    status: str
    issuer: str
    anchored_at: datetime

    model_config = ConfigDict(from_attributes=True)

class BlockchainVerificationRequest(BaseModel):
    record_id_or_hash: str

class BlockchainVerificationResponse(BaseModel):
    is_valid: bool
    record_id: Optional[str] = None
    matched_hash: str
    block_number: Optional[int] = None
    transaction_hash: Optional[str] = None
    network: str
    timestamp: Optional[datetime] = None
    tamper_status: str
    message: str

class BlockchainStats(BaseModel):
    total_anchored: int
    verified_valid: int
    pending_anchor: int
    tamper_detected: int
    network: str
    latest_block: int
    smart_contract: str

# ── GIS Schemas ─────────────────────────────────────────────────────────
class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class LayerConfig(BaseModel):
    id: int
    name: str
    layer_key: str
    layer_type: str
    style_config: Dict[str, Any]
    is_active: bool

class LocationValidationRequest(BaseModel):
    latitude: float
    longitude: float

class LocationValidationResponse(BaseModel):
    latitude: float
    longitude: float
    is_ocean: bool
    basin: Optional[str] = None
    is_inland: bool
    district: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    nearest_cyclone_name: Optional[str] = None
    nearest_cyclone_distance_km: Optional[float] = None
    threat_level: str = "LOW"
    advice: str

# ── Chatbot Schemas ─────────────────────────────────────────────────────
class ToolAction(BaseModel):
    action_type: str  # MAP_FOCUS, TRIGGER_SIREN, MUTE_SIREN, VERIFY_BULLETIN, TOGGLE_LAYER
    payload: Dict[str, Any]
    description: str

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"
    system_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    detected_language: str
    response_language: str
    referenced_system: Optional[str] = None
    bulletin_hash: Optional[str] = None
    tool_action: Optional[ToolAction] = None
    risk_escalation_reasoning: Optional[str] = None
    quick_suggestions: List[str] = []

# ── Production & Situation Report Schemas ──────────────────────────────
class SituationReport(BaseModel):
    generated_at: datetime
    active_cyclones_count: int
    highest_threat_system: Optional[str] = None
    highest_category: Optional[str] = None
    projected_landfall_district: Optional[str] = None
    projected_landfall_eta_hours: Optional[int] = None
    evacuation_alert_level: str
    bulletin_reference: Optional[str] = None
    sha256_hash: Optional[str] = None
    blockchain_tx: Optional[str] = None
    ipfs_cid: Optional[str] = None
    summary_markdown: str

class PhoneVerificationRequest(BaseModel):
    phone_number: str
    language: str = "en"

class NotificationPreferences(BaseModel):
    sms_enabled: bool = True
    push_enabled: bool = True
    websocket_enabled: bool = True
    audio_siren_enabled: bool = True
    min_alert_level: str = "WARNING"
    preferred_basin: str = "Bay of Bengal"
    preferred_language: str = "en"
