import os
from typing import Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # Configuración de la aplicación
    APP_NAME: str = "Test Automation System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    
    # Configuración del servidor
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    
    # Configuración de CORS
    CORS_ORIGINS: list = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )
    
    # Configuración de base de datos
    DATABASE_URL: str = Field(
        default="postgresql://test_user:test_password@localhost:5432/test_automation",
        env="DATABASE_URL"
    )
    
    # Configuración de Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379",
        env="REDIS_URL"
    )
    
    # Configuración de logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FILE: Optional[str] = Field(default=None, env="LOG_FILE")
    
    # Configuración de instrumentos
    VISA_LIBRARY: Optional[str] = Field(default=None, env="VISA_LIBRARY")
    INSTRUMENT_TIMEOUT: float = Field(default=5.0, env="INSTRUMENT_TIMEOUT")
    MAX_CONCURRENT_INSTRUMENTS: int = Field(default=10, env="MAX_CONCURRENT_INSTRUMENTS")
    
    # Configuración de pruebas
    DEFAULT_TEST_TIMEOUT: float = Field(default=300.0, env="DEFAULT_TEST_TIMEOUT")
    MAX_TEST_DURATION: float = Field(default=3600.0, env="MAX_TEST_DURATION")
    RESULTS_RETENTION_DAYS: int = Field(default=90, env="RESULTS_RETENTION_DAYS")
    
    # Configuración de seguridad
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Configuración de archivos
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    BACKUP_DIR: str = Field(default="./backups", env="BACKUP_DIR")
    SEQUENCE_DIR: str = Field(default="./sequences", env="SEQUENCE_DIR")
    
    # Configuración de WebSocket
    WS_HEARTBEAT_INTERVAL: float = Field(default=30.0, env="WS_HEARTBEAT_INTERVAL")
    WS_MAX_CONNECTIONS: int = Field(default=100, env="WS_MAX_CONNECTIONS")
    
    # Límites de seguridad por defecto
    SAFETY_LIMITS: dict = {
        "max_voltage": 30.0,
        "max_current": 5.0,
        "max_power": 100.0,
        "max_temperature": 85.0
    }
    
    # Tolerancias por defecto
    DEFAULT_TOLERANCES: dict = {
        "voltage": 0.05,  # 5%
        "current": 0.1,   # 10%
        "frequency": 0.01, # 1%
        "temperature": 1.0 # 1°C
    }
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instancia global de configuración
settings = Settings()

# Configuración de logging
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
        "detailed": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": settings.LOG_LEVEL,
            "formatter": "default",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "": {
            "level": settings.LOG_LEVEL,
            "handlers": ["console"],
        },
        "uvicorn": {
            "level": "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "level": "WARNING" if not settings.DEBUG else "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}

# Si se especifica un archivo de log, agregarlo
if settings.LOG_FILE:
    LOGGING_CONFIG["handlers"]["file"] = {
        "class": "logging.handlers.RotatingFileHandler",
        "level": settings.LOG_LEVEL,
        "formatter": "detailed",
        "filename": settings.LOG_FILE,
        "maxBytes": 10485760,  # 10MB
        "backupCount": 5,
    }
    LOGGING_CONFIG["loggers"][""]["handlers"].append("file")

def get_database_url() -> str:
    """Obtener URL de base de datos con validación"""
    return settings.DATABASE_URL

def get_redis_url() -> str:
    """Obtener URL de Redis con validación"""
    return settings.REDIS_URL

def create_directories():
    """Crear directorios necesarios si no existen"""
    directories = [
        settings.UPLOAD_DIR,
        settings.BACKUP_DIR,
        settings.SEQUENCE_DIR,
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def validate_safety_limits(voltage: float = None, current: float = None, power: float = None) -> bool:
    """Validar que los valores están dentro de los límites de seguridad"""
    if voltage is not None and voltage > settings.SAFETY_LIMITS["max_voltage"]:
        return False
    if current is not None and current > settings.SAFETY_LIMITS["max_current"]:
        return False
    if power is not None and power > settings.SAFETY_LIMITS["max_power"]:
        return False
    return True

def get_tolerance(parameter: str) -> float:
    """Obtener tolerancia por defecto para un parámetro"""
    return settings.DEFAULT_TOLERANCES.get(parameter.lower(), 0.05)  # 5% por defecto