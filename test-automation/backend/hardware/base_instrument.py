from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseInstrument(ABC):
    """Clase base para todos los instrumentos de medida"""
    
    def __init__(self, resource_name: str):
        self.resource_name = resource_name
        self.connected = False
        self.last_error = None

    @abstractmethod
    async def connect(self) -> bool:
        """Conectar al instrumento"""
        pass

    @abstractmethod
    async def disconnect(self):
        """Desconectar del instrumento"""
        pass

    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        """Obtener estado actual del instrumento"""
        pass

    async def self_test(self) -> bool:
        """Realizar autotest del instrumento"""
        try:
            status = await self.get_status()
            return status.get("status") == "connected"
        except Exception as e:
            self.last_error = str(e)
            return False

    def is_connected(self) -> bool:
        """Verificar si el instrumento está conectado"""
        return self.connected

    def get_last_error(self) -> str:
        """Obtener último error registrado"""
        return self.last_error