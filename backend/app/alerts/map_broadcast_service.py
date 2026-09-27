from fastapi import WebSocket
from typing import List, Dict, Any

class MapBroadcastManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_diff(self, diff: Dict[str, Any]):
        for connection in self.active_connections:
            try:
                await connection.send_json({"type": "MAP_LAYER_UPDATE", "data": diff})
            except Exception as e:
                pass

map_ws_manager = MapBroadcastManager()
