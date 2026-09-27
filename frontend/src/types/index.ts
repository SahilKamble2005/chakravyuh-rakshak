export interface User {
  id: number | string;
  name: string;
  email: string;
  role: string;
  preferred_language?: string;
  phone_number?: string;
  phone_verified?: boolean;
  preferred_basin?: string;
  created_at?: string;
}

export interface CyclonicSystem {
  id: number;
  system_code: string;
  basin: string;
  name: string;
  status: 'active' | 'weakening' | 'dissipated' | 'post_landfall';
  current_category: string;
  current_wind_kmh: number;
  current_pressure_hpa: number;
  current_lat: number;
  current_lon: number;
  movement_dir: string;
  movement_speed_kmh: number;
  genesis_time: string;
  peak_category?: string;
  is_live: boolean;
  created_at: string;
}

export interface ClassificationSummary {
  category: string;
  wind_kmh: number;
  wind_kt: number;
  pressure_hpa: number;
  ci_number_equivalent: number;
  t_number: number;
  eye_present: boolean;
  eye_diameter_km?: number;
  structure_notes?: string;
  symmetry_index: number;
  confidence: number;
  timestamp: string;
}

export interface EnvironmentalSummary {
  sea_surface_temp: number;
  wind_shear: number;
  mid_level_rh: number;
  steering_flow_speed: number;
  steering_flow_dir: number;
  cloud_top_temp: number;
  ocean_heat_content: number;
  timestamp: string;
}

export interface ForecastPoint {
  lead_h: number;
  lat: number;
  lon: number;
  uncertainty_km: number;
  category: string;
  wind_kmh: number;
  wind_kt: number;
  pressure_hpa: number;
  ri_probability: number;
}

export interface LandfallSummary {
  district_id: number;
  district_name: string;
  state: string;
  probability: number;
  eta_window_start?: string;
  eta_window_end?: string;
  surge_height_m: number;
}

export interface SystemDetail {
  system: CyclonicSystem;
  classification?: ClassificationSummary;
  environmental?: EnvironmentalSummary;
  forecasts: ForecastPoint[];
  landfall_estimates: LandfallSummary[];
  latest_bulletin_hash?: string;
  blockchain_anchored: boolean;
}

export interface AnalysisStep {
  step_number: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'degraded';
  details: string;
}

export interface AnalysisResult {
  system_id: number;
  system_name: string;
  steps: AnalysisStep[];
  final_category: string;
  confidence: number;
  ri_probability: number;
  landfall_threat_districts: string[];
  sha256_hash: string;
  blockchain_tx: string;
  timestamp: string;
}

export interface AlertItem {
  id: number;
  system_id: number;
  level: 'WATCH' | 'WARNING' | 'SEVERE';
  category: string;
  wind_kmh: number;
  title: string;
  message: string;
  affected_districts: string[];
  channels_dispatched: string[];
  acknowledged: boolean;
  acknowledged_at?: string;
  sha256_hash: string;
  blockchain_tx_ref?: string;
  created_at: string;
}

// Aliases for legacy stores
export type Alert = AlertItem;

export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface GISLayer {
  id: number;
  name: string;
  layer_key: string;
  layer_type: string;
  style_config: any;
  is_active: boolean;
}

export interface BulletinItem {
  id: number;
  bulletin_number: string;
  system_id: number;
  title: string;
  category: string;
  wind_kmh: number;
  pressure_hpa: number;
  landfall_summary: string;
  warning_signals: string;
  fishermen_warning: string;
  full_text: string;
  sha256_hash: string;
  blockchain_tx_ref?: string;
  block_number?: number;
  issued_at: string;
}

export interface BlockchainRecord {
  id: number;
  record_id: string;
  ref_table: string;
  ref_id?: number;
  data_hash: string;
  transaction_hash?: string;
  block_number?: number;
  contract_address?: string;
  network: string;
  status: string;
  issuer: string;
  anchored_at: string;
}

export interface BlockchainStats {
  total_anchored: number;
  verified_valid: number;
  pending_anchor: number;
  tamper_detected: number;
  network: string;
  latest_block: number;
  smart_contract: string;
}

export interface VerificationResult {
  is_valid: boolean;
  record_id?: string;
  matched_hash: string;
  block_number?: number;
  transaction_hash?: string;
  network: string;
  timestamp?: string;
  tamper_status: string;
  message: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  timestamp?: string;
  quick_suggestions?: string[];
  tool_action?: {
    action_type: string;
    payload: Record<string, any>;
    description: string;
  };
  risk_escalation_reasoning?: string;
}

export interface SystemStatusData {
  status: string;
  subsystems: Record<string, string>;
  satellite_feeds: Array<{
    sensor: string;
    status: string;
    band: string;
    latency_min: number;
  }>;
  monitored_basins: string[];
  active_systems_count: number;
  demo_mode: boolean;
  last_update_utc: string;
}

export interface LocationValidationResult {
  latitude: number;
  longitude: number;
  is_ocean: boolean;
  basin?: string;
  is_inland: boolean;
  district?: string;
  state?: string;
  country: string;
  nearest_cyclone_name?: string;
  nearest_cyclone_distance_km?: number;
  threat_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  advice: string;
}

export interface SituationReportData {
  generated_at: string;
  active_cyclones_count: number;
  highest_threat_system?: string;
  highest_category?: string;
  projected_landfall_district?: string;
  projected_landfall_eta_hours?: number;
  evacuation_alert_level: string;
  bulletin_reference?: string;
  sha256_hash?: string;
  blockchain_tx?: string;
  ipfs_cid?: string;
  summary_markdown: string;
}

export interface DataProvenance {
  satellite_ingestion_utc: string;
  satellite_sensors: Array<{
    sensor: string;
    band: string;
    resolution_km: number;
    latency_min: number;
  }>;
  nwp_environmental_cycle: string;
  spatial_crs: string;
  spatial_database: string;
  ml_inference_latency_ms: number;
  model_version: string;
  blockchain_oracle_network: string;
  ipfs_storage_pinned: boolean;
}

export interface SavedWatchpoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state: string;
  basin: string;
  alertLevel: 'WATCH' | 'WARNING' | 'SEVERE' | 'CLEAR';
}

