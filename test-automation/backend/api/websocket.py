from fastapi import WebSocket
from typing import List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"Cliente conectado. Total conexiones: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"Cliente desconectado. Total conexiones: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # Conexión cerrada, remover de la lista
            self.disconnect(websocket)

    async def send_to_all(self, message: dict):
        if self.active_connections:
            # Enviar a todas las conexiones activas
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    disconnected.append(connection)
            
            # Limpiar conexiones muertas
            for conn in disconnected:
                self.disconnect(conn)

    async def broadcast_instrument_status(self, instrument_name: str, status: dict):
        """Broadcast del estado de un instrumento específico"""
        message = {
            "type": "instrument_status",
            "instrument": instrument_name,
            "data": status,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.send_to_all(message)

    async def broadcast_test_progress(self, test_id: str, step: str, progress: float):
        """Broadcast del progreso de una prueba"""
        message = {
            "type": "test_progress",
            "test_id": test_id,
            "step": step,
            "progress": progress,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.send_to_all(message)

    async def broadcast_test_result(self, test_id: str, step_name: str, result: dict):
        """Broadcast de resultado de un paso de prueba"""
        message = {
            "type": "test_result",
            "test_id": test_id,
            "step": step_name,
            "result": result,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.send_to_all(message)