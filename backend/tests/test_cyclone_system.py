import pytest
import httpx
from app.main import app

@pytest.mark.asyncio
async def test_root():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ONLINE"
        assert "Chakravyuh" in data["title"]

@pytest.mark.asyncio
async def test_system_status():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/system/status")
        assert resp.status_code == 200
        subsystems = resp.json()["subsystems"]
        assert subsystems["identification_model"] == "ONLINE"
        assert subsystems["classification_model"] == "ONLINE"
        assert subsystems["track_intensity_model"] == "ONLINE"

@pytest.mark.asyncio
async def test_active_systems():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/systems/active")
        assert resp.status_code == 200
        systems = resp.json()
        assert len(systems) > 0

@pytest.mark.asyncio
async def test_blockchain_stats_and_verification():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        stats_resp = await client.get("/api/blockchain/stats")
        assert stats_resp.status_code == 200
        assert stats_resp.json()["total_anchored"] >= 500

        ver_resp = await client.post("/api/blockchain/verify/BLTN-2026-0008")
        assert ver_resp.status_code == 200
        assert ver_resp.json()["is_valid"] is True

@pytest.mark.asyncio
async def test_multilingual_chatbot():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/chat", json={"message": "Cyclone near Odisha", "language": "en"})
        assert resp.status_code == 200
        assert len(resp.json()["reply"]) > 5
