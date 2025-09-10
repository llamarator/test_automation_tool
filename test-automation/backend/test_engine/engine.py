import asyncio
import time
from typing import Dict, Any, Callable, Optional
from datetime import datetime

class TestEngine:
    """Motor principal de ejecución de pruebas"""
    
    def __init__(self):
        self.running = False
        self.current_test_id = None
        self.current_sequence = None
        self.results = []
        
    async def run_sequence(self, sequence: Dict[str, Any], callback: Callable = None):
        """Ejecutar una secuencia de pruebas completa"""
        if self.running:
            raise RuntimeError("Ya hay una prueba ejecutándose")
        
        self.running = True
        self.current_test_id = f"test_{int(time.time())}"
        self.current_sequence = sequence
        self.results = []
        
        try:
            await self._send_callback(callback, {
                "type": "test_started",
                "test_id": self.current_test_id,
                "sequence": sequence.get("name", "Unknown"),
                "total_steps": len(sequence.get("steps", []))
            })
            
            # Ejecutar cada paso de la secuencia
            for i, step in enumerate(sequence.get("steps", [])):
                if not self.running:
                    break
                
                step_result = await self._execute_step(step, i + 1, callback)
                self.results.append(step_result)
                
                # Pequeña pausa entre pasos
                await asyncio.sleep(0.01)
            
            # Evaluar resultado final
            passed_steps = sum(1 for r in self.results if r.get("passed", False))
            total_steps = len(self.results)
            overall_result = passed_steps == total_steps
            
            await self._send_callback(callback, {
                "type": "test_completed",
                "test_id": self.current_test_id,
                "passed": overall_result,
                "steps_passed": passed_steps,
                "total_steps": total_steps,
                "duration": time.time() - int(self.current_test_id.split("_")[1])
            })
            
        except Exception as e:
            await self._send_callback(callback, {
                "type": "test_error",
                "test_id": self.current_test_id,
                "error": str(e)
            })
        finally:
            self.running = False
            
    async def _execute_step(self, step: Dict[str, Any], step_number: int, callback: Callable = None):
        """Ejecutar un paso individual de la prueba"""
        step_name = step.get("name", f"Step {step_number}")
        step_type = step.get("type", "unknown")
        
        await self._send_callback(callback, {
            "type": "step_started",
            "test_id": self.current_test_id,
            "step": step_name,
            "step_number": step_number
        })
        
        start_time = time.time()
        result = {
            "step_name": step_name,
            "step_number": step_number,
            "start_time": datetime.now().isoformat(),
            "passed": False,
            "measurements": {},
            "error": None
        }
        
        try:
            # Ejecutar según el tipo de paso
            if step_type == "power_supply":
                result = await self._execute_power_step(step, result)
            elif step_type == "measurement":
                result = await self._execute_measurement_step(step, result)
            elif step_type == "delay":
                result = await self._execute_delay_step(step, result)
            elif step_type == "validation":
                result = await self._execute_validation_step(step, result)
            else:
                result["error"] = f"Tipo de paso desconocido: {step_type}"
                
        except Exception as e:
            result["error"] = str(e)
            result["passed"] = False
        
        result["duration"] = time.time() - start_time
        result["end_time"] = datetime.now().isoformat()
        
        await self._send_callback(callback, {
            "type": "step_completed",
            "test_id": self.current_test_id,
            "step": step_name,
            "result": result
        })
        
        return result
    
    async def _execute_power_step(self, step: Dict[str, Any], result: Dict[str, Any]):
        """Ejecutar paso relacionado con fuente de alimentación"""
        # Aquí integrarías con tus drivers reales
        voltage = step.get("voltage", 0)
        current_limit = step.get("current_limit", 1.0)
        
        # Simular configuración de fuente
        await asyncio.sleep(0.05)  # Simular tiempo de establecimiento
        
        # Simular medición
        result["measurements"] = {
            "voltage_set": voltage,
            "voltage_measured": voltage + (voltage * 0.01),  # Simular pequeña diferencia
            "current_measured": 0.1,
            "power": voltage * 0.1
        }
        
        # Validar que el voltaje esté dentro de tolerancia (1%)
        voltage_error = abs(result["measurements"]["voltage_measured"] - voltage) / voltage if voltage > 0 else 0
        result["passed"] = voltage_error < 0.01
        
        return result
    
    async def _execute_measurement_step(self, step: Dict[str, Any], result: Dict[str, Any]):
        """Ejecutar paso de medición"""
        measurement_type = step.get("measurement_type", "voltage")
        expected_value = step.get("expected_value", 0)
        tolerance = step.get("tolerance", 0.05)
        
        # Simular medición
        await asyncio.sleep(0.02)
        
        # Simular valor medido con pequeña variación
        import random
        measured_value = expected_value + random.uniform(-tolerance/2, tolerance/2)
        
        result["measurements"] = {
            measurement_type: measured_value,
            "expected": expected_value,
            "tolerance": tolerance
        }
        
        # Validar tolerancia
        error = abs(measured_value - expected_value)
        result["passed"] = error <= tolerance
        
        return result
    
    async def _execute_delay_step(self, step: Dict[str, Any], result: Dict[str, Any]):
        """Ejecutar paso de retardo/espera"""
        delay_ms = step.get("delay_ms", 100)
        
        await asyncio.sleep(delay_ms / 1000.0)
        
        result["measurements"] = {"delay_applied_ms": delay_ms}
        result["passed"] = True
        
        return result
    
    async def _execute_validation_step(self, step: Dict[str, Any], result: Dict[str, Any]):
        """Ejecutar paso de validación lógica"""
        condition = step.get("condition", "True")
        
        # En una implementación real, aquí evaluarías condiciones complejas
        # basadas en mediciones anteriores o estado del sistema
        
        result["measurements"] = {"condition_evaluated": condition}
        result["passed"] = True  # Simplificado
        
        return result
    
    async def stop(self):
        """Detener la prueba en ejecución"""
        self.running = False
        
    async def get_current_status(self) -> Dict[str, Any]:
        """Obtener estado actual del motor de pruebas"""
        return {
            "running": self.running,
            "test_id": self.current_test_id,
            "sequence": self.current_sequence.get("name") if self.current_sequence else None,
            "completed_steps": len(self.results),
            "total_steps": len(self.current_sequence.get("steps", [])) if self.current_sequence else 0
        }
    
    async def _send_callback(self, callback: Callable, message: Dict[str, Any]):
        """Enviar mensaje a través del callback si está disponible"""
        if callback:
            try:
                await callback(message)
            except Exception as e:
                print(f"Error enviando callback: {str(e)}")