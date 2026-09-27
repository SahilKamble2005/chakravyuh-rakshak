# 🌀 Chakravyuh Rakshak

**AI-Powered Real-Time Tropical Cyclone Monitoring & Early Warning System**

*Detect. Analyze. Visualize. Alert. Verify. Reach everyone. In any language.*

---

## Overview

Chakravyuh Rakshak (चक्रव्यूह रक्षक — "Cyclone Guardian") is a production-grade, software-only tropical cyclone monitoring platform that combines:

- **AI/ML** — Pattern identification (CNN on satellite imagery) + intensity/category classification (XGBoost) + track prediction
- **GIS** — PostGIS spatial database, vector/raster analysis, OGC-standard services, geocoding, real-time map updates
- **Blockchain** — SHA-256 tamper-proof audit trail on Ethereum-compatible chain (Hardhat local / Polygon testnet)
- **Multi-Channel Alerts** — SMS (Twilio), Web Push (FCM/VAPID), WebSocket/in-app, software audio buzzer
- **Multilingual AI Chatbot** — 13+ Indian languages, real-time tool calling, SSE streaming fallback
- **Production Infrastructure** — Celery workers, Redis cache/pub-sub, OpenTelemetry tracing, feature flags, i18n

No hardware. No IoT. No physical sensors. 100% software.

---

## Architecture

```
Frontend (React + TypeScript + Tailwind + Leaflet)
    ↕ REST API + WebSocket
Backend (FastAPI + Python)
    ↕
PostgreSQL + PostGIS  ←  Single source of truth
Redis / Memurai       ←  Cache / pub-sub / queue only
Hardhat Blockchain    ←  Immutable audit layer
Celery Workers        ←  Background processing
```

---

## Quick Start (Native Windows — No Docker Required)

### Prerequisites

- **PostgreSQL 16** + **PostGIS 3.4** extension (native Windows install)
- **Redis / Memurai** (native Windows install via Chocolatey)
- **Python 3.11+**
- **Node.js 18+** + npm

---

### 1. Clone & Configure

```bash
git clone <repo-url> chakravyuh-rakshak
cd chakravyuh-rakshak
cp .env.example .env
# Edit .env with your API keys (or leave DEMO_MODE=true)
```

---

### 2. Install Database & Cache (Native Windows)

#### Step A: PostgreSQL + PostGIS (Database)
1. Download & install PostgreSQL 16 from [postgresql.org](https://www.postgresql.org/download/windows/).
2. In **Stack Builder** at the end of installation, select **Spatial Extensions -> PostGIS 3.x**.
3. Create the database & enable PostGIS:
```sql
CREATE DATABASE chakravyuh_rakshak;
\c chakravyuh_rakshak;
CREATE EXTENSION postgis;
```

#### Step B: Install Redis on Windows (Chocolatey)
Open **PowerShell as Administrator** and run:

```powershell
# Install Redis (Memurai native Windows engine)
choco install redis-64 -y

# Verify status (Memurai starts automatically on port 6379 as a Windows Service)
memurai-cli ping
```
*(Optionally run `redis-server` or `memurai-cli` to interact with Redis on port `6379`)*

---

### 3. Start Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

---

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

---

### 5. Start Blockchain (Local Hardhat)

```bash
cd blockchain
npm install
npx hardhat node                        # Terminal 1 — local chain node
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2 — deploy contract
# Copy the printed contract address to .env → CONTRACT_ADDRESS
```

---

### 6. Start Celery Workers (Optional)

```bash
cd backend
celery -A app.workers.celery_app worker --loglevel=info -Q monitoring_queue,raster_queue,blockchain_queue,notification_queue
celery -A app.workers.celery_app beat --loglevel=info
```

---

## Project Structure

```
chakravyuh-rakshak/
├── frontend/          React + TypeScript + Tailwind + Leaflet
├── backend/           FastAPI + Python + ML + GIS services
├── blockchain/        Solidity + Hardhat + deployment scripts
├── database/          SQL migrations + init scripts
├── model/             Trained ML models + preprocessing
├── audio/             Alert sound assets
├── .env.example       Environment template
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Leaflet.js, Recharts, react-i18next |
| Backend | FastAPI, SQLAlchemy 2.0, GeoAlchemy2, Celery, Web3.py, rasterio |
| Database | PostgreSQL 16 + PostGIS 3.4 (Native Windows) |
| Cache | Redis 7 / Memurai (Native Windows Service on Port 6379) |
| Blockchain | Solidity 0.8.20, Hardhat, OpenZeppelin |
| ML | XGBoost, PyTorch/TensorFlow (CNN), scikit-learn |
| GIS | PostGIS, GDAL, rasterio, Natural Earth |

---

## Demo Mode

When `DEMO_MODE=true` or external APIs are unavailable, the system falls back to bundled sample data. Demo mode is:
- **Clearly labeled** — every demo-sourced value shows a DEMO badge
- **Per-subsystem** — satellite data, geocoding, blockchain, and SMS can independently fall back
- **Admin-toggleable** — via feature flags in Settings

---

## License

MIT

---

*Follow instructions from local emergency and disaster-management authorities. This system is a decision-support tool, not an official government warning service.*
