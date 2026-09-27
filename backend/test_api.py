import asyncio
import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
from app.main import app
from app.core.database import SessionLocal, engine
from app.services.cyclone_pipeline import CyclonePipelineService

async def test_all_subsystems():
    print("=" * 60)
    print("CHAKRAVYUH RAKSHAK — API & SUBSYSTEM VERIFICATION TEST")
    print("=" * 60)
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test Root
        resp = await client.get("/")
        print(f"[1/8] Root Endpoint: {resp.status_code} -> {resp.json()['title']}")
        assert resp.status_code == 200

        # 2. Test System Status
        resp = await client.get("/api/system/status")
        print(f"[2/8] System Status: {resp.status_code} -> Subsystems: {resp.json()['subsystems']}")
        assert resp.status_code == 200

        # 3. Test Active Systems
        resp = await client.get("/api/systems/active")
        systems = resp.json()
        print(f"[3/8] Active Systems: {resp.status_code} -> Found {len(systems)} systems: {[s['name'] for s in systems]}")
        assert resp.status_code == 200
        assert len(systems) > 0

        sys_id = systems[0]['id']

        # 4. Test System Detail & Forecast
        resp = await client.get(f"/api/systems/{sys_id}/detail")
        det = resp.json()
        print(f"[4/8] System Detail ({det['system']['name']}): Category: {det['system']['current_category']}, Forecasts: {len(det['forecasts'])}, Landfall: {len(det['landfall_estimates'])}")
        assert resp.status_code == 200

        # 5. Test GIS Tracks GeoJSON
        resp = await client.get(f"/api/gis/all-active-tracks")
        gis_data = resp.json()
        print(f"[5/8] GIS Active Tracks GeoJSON: {resp.status_code} -> {len(gis_data['features'])} spatial features")
        assert resp.status_code == 200

        # 6. Test Blockchain Records & Verification
        resp = await client.get("/api/blockchain/stats")
        stats = resp.json()
        print(f"[6/8] Blockchain Stats: {resp.status_code} -> {stats['total_anchored']} records, network: {stats['network']}")
        assert resp.status_code == 200

        resp = await client.post("/api/blockchain/verify/BLTN-2026-0008")
        ver = resp.json()
        print(f"      Verification of BLTN-2026-0008: Valid={ver['is_valid']}, Status={ver['tamper_status']}")
        assert ver['is_valid'] == True

        # 7. Test Multilingual AI Chatbot
        resp = await client.post("/api/chat", json={"message": "Is there any cyclone near Odisha right now?", "language": "en"})
        chat_res = resp.json()
        print(f"[7/8] Multilingual AI Chatbot (EN): {resp.status_code} -> {chat_res['reply'][:80]}...")
        assert resp.status_code == 200

        # 8. Test 12-Step Cyclone Analysis Pipeline
        print(f"[8/8] Executing Full 12-Step ML Analysis Cycle on System {sys_id}...")
        resp = await client.post(f"/api/systems/{sys_id}/analyze")
        analysis = resp.json()
        print(f"      Analysis Complete! Final Category: {analysis['final_category']}, Confidence: {analysis['confidence']}, Steps Executed: {len(analysis['steps'])}")
        assert resp.status_code == 200
        assert len(analysis['steps']) == 12

    print("=" * 60)
    print("ALL API & SUBSYSTEM VERIFICATIONS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_all_subsystems())
