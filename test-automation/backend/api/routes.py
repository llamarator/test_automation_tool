from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

#from hardware.power_supply import PowerSupply
#from hardware.daq_controller import DAQController
from models.test_models import TestSequence, TestResult, InstrumentConfig

router = APIRouter()

# Instancias globales de instrumentos (en producción usar un pool)
instruments = {}

class InstrumentStatus(BaseModel):
    name: str
    connected: bool
    status: str
    last_reading: Dict[str, Any] = {}

class TestStartRequest(BaseModel):
    sequence_id: str
    parameters: Dict[str, Any] = {}

@router.get("/instruments")
async def get_instruments() -> List[InstrumentStatus]:
    """Obtener estado de todos los instrumentos"""
    status_list = []
    for name, instrument in instruments.items():
        try:
            status = await instrument.get_status()
            status_list.append(InstrumentStatus(
                name=name,
                connected=True,
                status=status.get('status', 'unknown'),
                last_reading=status.get('readings', {})
            ))
        except Exception as e:
            status_list.append(InstrumentStatus(
                name=name,
                connected=False,
                status=f"Error: {str(e)}"
            ))
    return status_list

@router.post("/instruments/{instrument_name}/connect")
async def connect_instrument(instrument_name: str, config: InstrumentConfig):
    """Conectar un instrumento específico"""
    try:
        if instrument_name.startswith("power_supply"):
            instrument = PowerSupply(config.resource_name)
        elif instrument_name.startswith("daq"):
            instrument = DAQController(config.device_name)
        else:
            raise ValueError(f"Tipo de instrumento no soportado: {instrument_name}")
        
        await instrument.connect()
        instruments[instrument_name] = instrument
        
        return {"status": "connected", "message": f"{instrument_name} conectado exitosamente"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error conectando {instrument_name}: {str(e)}")

@router.delete("/instruments/{instrument_name}")
async def disconnect_instrument(instrument_name: str):
    """Desconectar un instrumento"""
    if instrument_name not in instruments:
        raise HTTPException(status_code=404, detail="Instrumento no encontrado")
    
    try:
        await instruments[instrument_name].disconnect()
        del instruments[instrument_name]
        return {"status": "disconnected"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error desconectando: {str(e)}")

@router.get("/sequences")
async def get_test_sequences() -> List[Dict[str, Any]]:
    """Obtener lista de secuencias de prueba disponibles"""
    # En producción esto vendría de la base de datos
    return [
        {
            "id": "basic_power_test",
            "name": "Prueba Básica de Alimentación",
            "description": "Verifica voltajes de salida del DUT",
            "duration_estimate": "30s",
            "steps": 5
        },
        {
            "id": "full_functional_test",
            "name": "Prueba Funcional Completa",
            "description": "Suite completa de pruebas funcionales",
            "duration_estimate": "5m",
            "steps": 25
        }
    ]

@router.post("/tests/start")
async def start_test(request: TestStartRequest):
    """Iniciar una secuencia de pruebas"""
    # Validar que los instrumentos necesarios estén conectados
    if not instruments:
        raise HTTPException(status_code=400, detail="No hay instrumentos conectados")
    
    return {
        "test_id": f"test_{request.sequence_id}_{int(time.time())}",
        "status": "started",
        "message": "Prueba iniciada, resultados vía WebSocket"
    }

@router.post("/tests/{test_id}/stop")
async def stop_test(test_id: str):
    """Detener una prueba en ejecución"""
    return {"status": "stopped", "test_id": test_id}

@router.get("/results/{test_id}")
async def get_test_results(test_id: str) -> TestResult:
    """Obtener resultados de una prueba específica"""
    # En producción esto vendría de la base de datos
    raise HTTPException(status_code=404, detail="Resultados no encontrados")