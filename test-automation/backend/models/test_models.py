from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

class InstrumentType(str, Enum):
    POWER_SUPPLY = "power_supply"
    DAQ = "daq"
    MULTIMETER = "multimeter"
    OSCILLOSCOPE = "oscilloscope"
    SIGNAL_GENERATOR = "signal_generator"

class TestStepType(str, Enum):
    POWER_SUPPLY = "power_supply"
    MEASUREMENT = "measurement"
    DELAY = "delay"
    VALIDATION = "validation"
    DAQ_READ = "daq_read"
    DAQ_WRITE = "daq_write"

class TestStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"

# Modelos de configuración de instrumentos
class InstrumentConfig(BaseModel):
    name: str
    type: InstrumentType
    resource_name: Optional[str] = None
    device_name: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)

class PowerSupplyConfig(BaseModel):
    max_voltage: float = 30.0
    max_current: float = 5.0
    voltage_resolution: float = 0.001
    current_resolution: float = 0.001
    safety_limits: Dict[str, float] = Field(default_factory=lambda: {
        "voltage": 25.0,
        "current": 3.0
    })

class DAQConfig(BaseModel):
    device_name: str
    input_channels: List[str] = Field(default_factory=list)
    output_channels: List[str] = Field(default_factory=list)
    sample_rate: float = 1000.0
    input_range: float = 10.0
    output_range: float = 10.0

# Modelos de pasos de prueba
class TestStep(BaseModel):
    name: str
    type: TestStepType
    description: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: float = 30.0
    required_instruments: List[str] = Field(default_factory=list)
    validation_criteria: Dict[str, Any] = Field(default_factory=dict)

class PowerSupplyStep(BaseModel):
    voltage: float = Field(ge=0, le=30)
    current_limit: float = Field(ge=0, le=5)
    output_enabled: bool = True
    stabilization_time_ms: int = 50

class MeasurementStep(BaseModel):
    measurement_type: str  # voltage, current, power, etc.
    expected_value: float
    tolerance: float
    tolerance_type: str = "absolute"  # absolute, percentage
    channel: Optional[str] = None

class DelayStep(BaseModel):
    delay_ms: int = Field(ge=0, le=60000)  # Max 1 minuto

class ValidationStep(BaseModel):
    condition: str  # Expresión a evaluar
    variables: Dict[str, Any] = Field(default_factory=dict)

# Modelos de secuencias de prueba
class TestSequence(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    version: str = "1.0"
    author: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    steps: List[TestStep]
    required_instruments: List[str] = Field(default_factory=list)
    estimated_duration_seconds: Optional[float] = None
    tags: List[str] = Field(default_factory=list)

# Modelos de resultados
class MeasurementResult(BaseModel):
    parameter: str
    value: float
    unit: str
    expected_value: Optional[float] = None
    tolerance: Optional[float] = None
    within_tolerance: Optional[bool] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class StepResult(BaseModel):
    step_name: str
    step_number: int
    step_type: TestStepType
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    passed: bool = False
    measurements: List[MeasurementResult] = Field(default_factory=list)
    error_message: Optional[str] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict)

class TestResult(BaseModel):
    test_id: str
    sequence_id: str
    sequence_name: str
    status: TestStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    step_results: List[StepResult] = Field(default_factory=list)
    overall_passed: bool = False
    operator: Optional[str] = None
    dut_serial_number: Optional[str] = None
    environment_conditions: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None

# Modelos de estado del sistema
class InstrumentStatus(BaseModel):
    name: str
    type: InstrumentType
    connected: bool = False
    status: str = "disconnected"
    last_communication: Optional[datetime] = None
    current_readings: Dict[str, Any] = Field(default_factory=dict)
    error_count: int = 0
    last_error: Optional[str] = None

class SystemStatus(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    instruments: List[InstrumentStatus] = Field(default_factory=list)
    active_test_id: Optional[str] = None
    system_health: str = "healthy"  # healthy, warning, error
    resource_usage: Dict[str, float] = Field(default_factory=dict)

# Modelos de configuración del sistema
class SystemConfig(BaseModel):
    default_timeouts: Dict[str, float] = Field(default_factory=lambda: {
        "instrument_connection": 10.0,
        "step_execution": 30.0,
        "sequence_execution": 300.0
    })
    default_tolerances: Dict[str, float] = Field(default_factory=lambda: {
        "voltage": 0.05,
        "current": 0.1,
        "frequency": 0.01,
        "temperature": 1.0
    })
    safety_limits: Dict[str, float] = Field(default_factory=lambda: {
        "max_voltage": 30.0,
        "max_current": 5.0,
        "max_power": 100.0,
        "max_temperature": 85.0
    })
    data_retention_days: int = 90
    auto_backup_enabled: bool = True
    log_level: str = "INFO"

# Modelos para API requests
class StartTestRequest(BaseModel):
    sequence_id: str
    operator: Optional[str] = None
    dut_serial_number: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None

class ConnectInstrumentRequest(BaseModel):
    config: InstrumentConfig
    auto_configure: bool = True

class UpdateInstrumentRequest(BaseModel):
    parameters: Dict[str, Any]

# Modelos para WebSocket messages
class WebSocketMessage(BaseModel):
    type: str
    timestamp: datetime = Field(default_factory=datetime.now)
    data: Dict[str, Any] = Field(default_factory=dict)

class TestProgressMessage(BaseModel):
    test_id: str
    current_step: int
    total_steps: int
    step_name: str
    progress_percentage: float
    estimated_remaining_seconds: Optional[float] = None

class InstrumentUpdateMessage(BaseModel):
    instrument_name: str
    readings: Dict[str, Any]
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)