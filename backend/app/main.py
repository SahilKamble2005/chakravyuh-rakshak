from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine
from typing import List
import structlog
import json

structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()

# Active WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_alerts_manager = ConnectionManager()
ws_map_manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Chakravyuh Rakshak Meteorological Command Center API...")
    yield
    logger.info("Shutting down API...")
    await engine.dispose()

app = FastAPI(
    title="🌀 Chakravyuh Rakshak API",
    description="AI-Powered Multi-Source Satellite Intelligence for Tropical Cyclone Detection, Classification & Track Prediction",
    version="2.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import auth, predictions, gis, alerts, blockchain, bulletins, chat, system

app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(gis.router)
app.include_router(alerts.router)
app.include_router(blockchain.router)
app.include_router(bulletins.router)
app.include_router(chat.router)
app.include_router(system.router)

@app.get("/")
async def root():
    return {
        "title": "🌀 Chakravyuh Rakshak Meteorological Command Center API",
        "tagline": "Detect the storm. Decode its structure. Predict its path. Protect the coast.",
        "status": "ONLINE",
        "version": "2.1.0",
        "spatial_db": "PostgreSQL 16 + PostGIS 3.6",
        "docs": "/docs"
    }

# ── Real-Time WebSockets ───────────────────────────────────────────────
@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_alerts_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({
                "type": "ALERT_ACK",
                "status": "CONNECTED",
                "channels": ["SMS", "PUSH", "WEBSOCKET", "AUDIO_SIREN"]
            })
    except WebSocketDisconnect:
        ws_alerts_manager.disconnect(websocket)

@app.websocket("/ws/map")
async def websocket_map_endpoint(websocket: WebSocket):
    await ws_map_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_json({
                "type": "MAP_SYNC_PONG",
                "status": "STREAMING",
                "projection": "EPSG:4326"
            })
    except WebSocketDisconnect:
        ws_map_manager.disconnect(websocket)
