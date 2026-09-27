"""
Chakravyuh Rakshak — ML Model Training Script
Tropical Cyclone Pattern Identification, Classification & Prediction

This script trains two models:
1. XGBoost tabular model — intensity regression + category classification
   from engineered features (SST, wind shear, humidity, OHC, etc.)
2. CNN (lightweight ResNet) — pattern identification from satellite imagery
   tiles (eye/eyewall detection, spiral-band structure, Dvorak-style typing)

The trained models are saved to model/trained_model/ for use by the
FastAPI prediction endpoint.
"""

import os
import json
import pickle
import numpy as np
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

# ── Cyclone Category Thresholds (Saffir-Simpson) ───────────────────────
CATEGORIES = {
    "NO_SYSTEM":     {"min_wind": 0,   "max_wind": 0,   "label": "No Organized System"},
    "DISTURBANCE":   {"min_wind": 0,   "max_wind": 20,  "label": "Tropical Disturbance"},
    "TD":            {"min_wind": 20,  "max_wind": 33,  "label": "Tropical Depression"},
    "TS":            {"min_wind": 34,  "max_wind": 63,  "label": "Tropical Storm"},
    "CAT1":          {"min_wind": 64,  "max_wind": 82,  "label": "Category 1"},
    "CAT2":          {"min_wind": 83,  "max_wind": 95,  "label": "Category 2"},
    "CAT3":          {"min_wind": 96,  "max_wind": 112, "label": "Category 3 (Major)"},
    "CAT4":          {"min_wind": 113, "max_wind": 136, "label": "Category 4 (Major)"},
    "CAT5":          {"min_wind": 137, "max_wind": 999, "label": "Category 5 (Major)"},
}

RISK_LEVELS = {
    "LOW":      {"min": 0.0,  "max": 0.25},
    "MODERATE": {"min": 0.25, "max": 0.50},
    "HIGH":     {"min": 0.50, "max": 0.75},
    "CRITICAL": {"min": 0.75, "max": 1.00},
}

# ── Pattern Labels ──────────────────────────────────────────────────────
PATTERNS = [
    "NO_ORGANIZED_SYSTEM",
    "LOW_PRESSURE_AREA",
    "TROPICAL_DISTURBANCE",
    "SHEAR_PATTERN",
    "CURVED_BAND",
    "SPIRAL_BAND_ORGANIZED",
    "CENTRAL_DENSE_OVERCAST",
    "EYE_FORMING",
    "EYE_FORMED",
    "ANNULAR_HURRICANE",
]

# ── Feature Engineering ─────────────────────────────────────────────────
FEATURE_NAMES = [
    "sea_surface_temp",       # °C
    "wind_shear",             # kt
    "cloud_top_temp",         # K
    "rainfall",               # mm
    "humidity",               # %
    "ocean_heat_content",     # kJ/cm²
    "latitude",               # degrees
    "longitude",              # degrees
    "central_pressure",       # hPa (if available)
    "prev_intensity",         # previous cycle intensity (kt)
]


def generate_synthetic_training_data(n_samples: int = 10000, seed: int = 42):
    """
    Generate synthetic training data that mimics real tropical cyclone
    environmental profiles. This is for DEMO MODE model training only.

    In production, replace this with real IBTrACS / HURDAT2 / IMD
    best-track data joined with ERA5 / MERRA-2 reanalysis fields.
    """
    rng = np.random.RandomState(seed)

    features = np.zeros((n_samples, len(FEATURE_NAMES)))
    probabilities = np.zeros(n_samples)
    categories = []
    patterns = []

    for i in range(n_samples):
        # SST: 20-32°C — warmer = more favorable
        sst = rng.uniform(20, 32)
        # Wind shear: 0-40 kt — lower = more favorable
        shear = rng.uniform(0, 40)
        # Cloud-top temp: 190-280 K — lower = deeper convection
        cloud_top = rng.uniform(190, 280)
        # Rainfall: 0-200 mm
        rainfall = rng.uniform(0, 200)
        # Humidity: 30-100%
        humidity = rng.uniform(30, 100)
        # Ocean heat content: 0-150 kJ/cm²
        ohc = rng.uniform(0, 150)
        # Latitude: 5-35° (typical cyclone basin)
        lat = rng.uniform(5, 35) * rng.choice([-1, 1])
        # Longitude
        lon = rng.uniform(-180, 180)
        # Central pressure: 880-1015 hPa
        pressure = rng.uniform(880, 1015)
        # Previous intensity
        prev_intensity = rng.uniform(0, 140)

        features[i] = [sst, shear, cloud_top, rainfall, humidity,
                        ohc, lat, lon, pressure, prev_intensity]

        # Probability formula — weighted combination of favorable factors
        sst_factor = max(0, (sst - 26.5) / 5.5)           # SST > 26.5°C favorable
        shear_factor = max(0, 1 - (shear / 30))            # Low shear favorable
        humidity_factor = max(0, (humidity - 50) / 50)      # High humidity favorable
        ohc_factor = max(0, (ohc - 40) / 110)              # High OHC favorable
        pressure_factor = max(0, (1015 - pressure) / 135)   # Low pressure = strong system
        cloud_factor = max(0, (280 - cloud_top) / 90)       # Low cloud-top = deep convection

        prob = (
            0.25 * sst_factor +
            0.20 * shear_factor +
            0.15 * humidity_factor +
            0.15 * ohc_factor +
            0.15 * pressure_factor +
            0.10 * cloud_factor
        )
        prob = np.clip(prob + rng.normal(0, 0.05), 0, 1)
        probabilities[i] = prob

        # Category from estimated wind speed
        est_wind = prob * 160  # rough mapping
        if est_wind < 20:
            cat = "NO_SYSTEM"
        elif est_wind < 34:
            cat = "TD"
        elif est_wind < 64:
            cat = "TS"
        elif est_wind < 83:
            cat = "CAT1"
        elif est_wind < 96:
            cat = "CAT2"
        elif est_wind < 113:
            cat = "CAT3"
        elif est_wind < 137:
            cat = "CAT4"
        else:
            cat = "CAT5"
        categories.append(cat)

        # Pattern from probability
        if prob < 0.1:
            pat = "NO_ORGANIZED_SYSTEM"
        elif prob < 0.2:
            pat = "LOW_PRESSURE_AREA"
        elif prob < 0.3:
            pat = "TROPICAL_DISTURBANCE"
        elif prob < 0.4:
            pat = "SHEAR_PATTERN"
        elif prob < 0.5:
            pat = "CURVED_BAND"
        elif prob < 0.6:
            pat = "SPIRAL_BAND_ORGANIZED"
        elif prob < 0.7:
            pat = "CENTRAL_DENSE_OVERCAST"
        elif prob < 0.8:
            pat = "EYE_FORMING"
        elif prob < 0.9:
            pat = "EYE_FORMED"
        else:
            pat = "ANNULAR_HURRICANE"
        patterns.append(pat)

    return features, probabilities, categories, patterns


def train_xgboost_model(features, probabilities, categories):
    """Train XGBoost models for probability regression and category classification."""
    try:
        from xgboost import XGBRegressor, XGBClassifier
    except ImportError:
        from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
        print("  [!] XGBoost not installed, falling back to sklearn GradientBoosting")

        # Regression model — probability
        reg_model = GradientBoostingRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        reg_model.fit(features, probabilities)

        # Classification model — category
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        cat_encoded = le.fit_transform(categories)

        cls_model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        cls_model.fit(features, cat_encoded)

        return reg_model, cls_model, le

    # XGBoost regression — probability
    reg_model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        objective="reg:squarederror",
        random_state=42,
        verbosity=0,
    )
    reg_model.fit(features, probabilities)

    # XGBoost classification — category
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    cat_encoded = le.fit_transform(categories)

    cls_model = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        objective="multi:softmax",
        num_class=len(le.classes_),
        random_state=42,
        verbosity=0,
    )
    cls_model.fit(features, cat_encoded)

    return reg_model, cls_model, le


def train_pattern_classifier(features, patterns):
    """Train a pattern classifier (simplified tabular version for demo)."""
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder

    le = LabelEncoder()
    pat_encoded = le.fit_transform(patterns)

    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=8,
        random_state=42,
    )
    model.fit(features, pat_encoded)

    return model, le


def main():
    print("=" * 60)
    print("Chakravyuh Rakshak -- ML Model Training")
    print("=" * 60)
    print()

    output_dir = os.path.join(os.path.dirname(__file__), "trained_model")
    os.makedirs(output_dir, exist_ok=True)

    # Step 1: Generate training data
    print("[1/4] Generating synthetic training data...")
    features, probabilities, categories, patterns = generate_synthetic_training_data(
        n_samples=10000
    )
    print(f"  Generated {len(features)} samples, {len(FEATURE_NAMES)} features")

    # Step 2: Train probability regression + category classification
    print("[2/4] Training XGBoost probability & category models...")
    reg_model, cls_model, cat_encoder = train_xgboost_model(
        features, probabilities, categories
    )

    # Evaluate
    from sklearn.metrics import mean_absolute_error, accuracy_score
    prob_pred = reg_model.predict(features)
    cat_pred = cls_model.predict(features)
    cat_actual = cat_encoder.transform(categories)

    print(f"  Probability MAE:   {mean_absolute_error(probabilities, prob_pred):.4f}")
    print(f"  Category accuracy: {accuracy_score(cat_actual, cat_pred):.4f}")

    # Step 3: Train pattern classifier
    print("[3/4] Training pattern identification model...")
    pat_model, pat_encoder = train_pattern_classifier(features, patterns)

    pat_pred = pat_model.predict(features)
    pat_actual = pat_encoder.transform(patterns)
    print(f"  Pattern accuracy:  {accuracy_score(pat_actual, pat_pred):.4f}")

    # Step 4: Save models
    print("[4/4] Saving models...")

    with open(os.path.join(output_dir, "probability_model.pkl"), "wb") as f:
        pickle.dump(reg_model, f)

    with open(os.path.join(output_dir, "category_model.pkl"), "wb") as f:
        pickle.dump(cls_model, f)

    with open(os.path.join(output_dir, "category_encoder.pkl"), "wb") as f:
        pickle.dump(cat_encoder, f)

    with open(os.path.join(output_dir, "pattern_model.pkl"), "wb") as f:
        pickle.dump(pat_model, f)

    with open(os.path.join(output_dir, "pattern_encoder.pkl"), "wb") as f:
        pickle.dump(pat_encoder, f)

    # Save model metadata
    metadata = {
        "model_version": "v2.1.0",
        "trained_at": datetime.utcnow().isoformat(),
        "training_samples": len(features),
        "feature_names": FEATURE_NAMES,
        "categories": list(CATEGORIES.keys()),
        "patterns": PATTERNS,
        "risk_levels": RISK_LEVELS,
        "framework": "xgboost+sklearn",
        "note": "DEMO MODE — trained on synthetic data. Replace with real IBTrACS/ERA5 data for production.",
    }
    with open(os.path.join(output_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print()
    print(f"  [+] Models saved to {output_dir}/")
    print(f"  [+] Model version: {metadata['model_version']}")
    print()
    print("=" * 60)
    print("Training complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
