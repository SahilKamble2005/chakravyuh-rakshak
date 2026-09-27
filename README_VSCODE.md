# 🌀 Chakravyuh Rakshak — Complete VS Code Setup & Run Guide

AI Multi-Source Threat Intelligence & Tropical Cyclone Early Warning System.

---

## ⚡ Quick Start in VS Code (3 Steps)

### 1️⃣ Open in VS Code
1. Extract `Chakravyuh_Rakshak_Project.zip`.
2. Open VS Code: `File -> Open Folder... -> Select the extracted 'Chakravyuh_Rakshak' folder`.

---

### 2️⃣ Start Backend (FastAPI Python)
Open a new terminal in VS Code (`Ctrl + ` `) and run:
```bash
# Navigate to backend and install requirements (first time only)
cd backend
pip install -r requirements.txt

# Start FastAPI Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
> **Backend runs at:** `http://localhost:8001`  
> **Interactive Swagger Docs:** `http://localhost:8001/docs`

---

### 3️⃣ Start Frontend (React + Vite + Tailwind)
Open a **second terminal** in VS Code (`+` split terminal or new tab) and run:
```bash
# Navigate to frontend and install dependencies (first time only)
cd frontend
npm install

# Start Vite Development Server
npm run dev
```
> **Frontend App runs at:** `http://localhost:3000`

---

### 4️⃣ Optional: Start Node Voice AI Engine (Port 5000)
Open a **third terminal** in VS Code if you want the multi-lingual hands-free voice engine:
```bash
# In the project root:
npm install
node server.js
```
> **Voice Engine runs at:** `http://localhost:5000`

---

## 🎨 Theme & Features Included:
- **Palette**: Calming Powder-Blue (`#EAF2F8`), Off-White canvas (`#F7FAFC`), Deep Slate Blue text (`#2C3E4A`), Sky Blue buttons (`#4FA3D1`), Mint Green nominal status (`#5FBF8F`), and Vivid Coral Alert warnings (`#E85D5D`).
- **GIS Leaflet Map**: Interactive tracks, 67% NHC/IMD uncertainty cones, wind swaths, and PostGIS coastal district intersections.
- **12-Step AI Analysis Dossier**: Multi-spectral satellite ingestion, Dvorak T-number ML classification, and Rapid Intensification assessment.
- **Blockchain Verification**: Immutable SHA-256 ledger anchor on Ethereum L2 Oracle.
- **Multilingual Voice SOC Assistant**: 13 Indian languages with hands-free Web Speech API & synthesized acoustic sirens.
