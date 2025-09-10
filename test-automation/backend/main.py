from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import asyncio
import json
from typing import List

from api.routes import router as api_router
from api.websocket import ConnectionManager
from test_engine.engine import TestEngine

app = FastAPI(title="Test Automation System", version="1.0.0")

# Configurar CORS para desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite/React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancia global del motor de pruebas y manager de conexiones
test_engine = TestEngine()
connection_manager = ConnectionManager()

# Incluir rutas de la API
app.include_router(api_router, prefix="/api")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        while True:
            # Mantener conexión activa y escuchar mensajes del cliente
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "start_test":
                # Iniciar prueba y enviar resultados en tiempo real
                await test_engine.run_sequence(
                    message["sequence"], 
                    connection_manager.send_to_all
                )
            elif message["type"] == "stop_test":
                await test_engine.stop()
                
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

@app.get("/")
async def read_root():
    return {"message": "Test Automation System API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )