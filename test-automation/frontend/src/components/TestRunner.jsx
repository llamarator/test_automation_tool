import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const TestRunner = ({ onStartTest, onStopTest, isRunning, currentTest }) => {
  const [selectedSequence, setSelectedSequence] = useState('')
  const [testSequences, setTestSequences] = useState([])
  const [testProgress, setTestProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  
  // Cargar secuencias disponibles
  useEffect(() => {
    fetch('http://localhost:8000/api/sequences')
      .then(res => res.json())
      .then(data => setTestSequences(data))
      .catch(err => console.error('Error cargando secuencias:', err))
  }, [])

  const handleStartTest = () => {
    if (!selectedSequence) {
      toast.error('Selecciona una secuencia de prueba')
      return
    }
    
    const sequence = testSequences.find(seq => seq.id === selectedSequence)
    if (sequence) {
      onStartTest(sequence)
      toast.success(`Iniciando prueba: ${sequence.name}`)
      setTestProgress(0)
      setCurrentStep('Inicializando...')
    }
  }

  const handleStopTest = () => {
    onStopTest()
    toast.error('Prueba detenida por el usuario')
    setTestProgress(0)
    setCurrentStep('')
  }

  // Secuencias predefinidas para demo
  const demoSequences = [
    {
      id: 'basic_power_test',
      name: 'Prueba Básica de Alimentación',
      description: 'Verifica voltajes de salida del DUT',
      steps: [
        { name: 'Configurar fuente a 5V', type: 'power_supply', voltage: 5.0, current_limit: 1.0 },
        { name: 'Medir voltaje de salida', type: 'measurement', measurement_type: 'voltage', expected_value: 5.0, tolerance: 0.1 },
        { name: 'Configurar fuente a 12V', type: 'power_supply', voltage: 12.0, current_limit: 1.0 },
        { name: 'Medir voltaje 12V', type: 'measurement', measurement_type: 'voltage', expected_value: 12.0, tolerance: 0.2 },
        { name: 'Apagar fuente', type: 'power_supply', voltage: 0, current_limit: 0.1 }
      ]
    },
    {
      id: 'full_functional_test',
      name: 'Prueba Funcional Completa',
      description: 'Suite completa de pruebas funcionales',
      steps: [
        { name: 'Inicialización', type: 'power_supply', voltage: 0, current_limit: 0.5 },
        { name: 'Prueba 3.3V', type: 'power_supply', voltage: 3.3, current_limit: 1.0 },
        { name: 'Verificar 3.3V', type: 'measurement', measurement_type: 'voltage', expected_value: 3.3, tolerance: 0.05 },
        { name: 'Esperar estabilización', type: 'delay', delay_ms: 100 },
        { name: 'Prueba 5V', type: 'power_supply', voltage: 5.0, current_limit: 1.0 },
        { name: 'Verificar 5V', type: 'measurement', measurement_type: 'voltage', expected_value: 5.0, tolerance: 0.1 },
        { name: 'Prueba carga', type: 'measurement', measurement_type: 'current', expected_value: 0.5, tolerance: 0.1 },
        { name: 'Finalizar', type: 'power_supply', voltage: 0, current_limit: 0.1 }
      ]
    }
  ]

  const currentSequenceData = [...testSequences, ...demoSequences].find(seq => seq.id === selectedSequence)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Control de Pruebas</h2>
        
        {isRunning && (
          <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
            <div className="text-yellow-200 text-sm">Paso actual:</div>
            <div className="text-yellow-100 font-medium">{currentStep}</div>
          </div>
        )}
      </div>

      {/* Selección de Secuencia */}
      <div className="bg-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Seleccionar Secuencia</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {[...testSequences, ...demoSequences].map((sequence) => (
            <div
              key={sequence.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedSequence === sequence.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setSelectedSequence(sequence.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-white font-medium">{sequence.name}</h4>
                  <p className="text-blue-200 text-sm mt-1">{sequence.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-blue-300">
                    <span>📋 {sequence.steps?.length || 0} pasos</span>
                    <span>⏱️ {sequence.duration_estimate || 'N/A'}</span>
                  </div>
                </div>
                
                {selectedSequence === sequence.id && (
                  <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalles de la Secuencia Seleccionada */}
      {currentSequenceData && (
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Pasos de la Secuencia: {currentSequenceData.name}
          </h3>
          
          <div className="space-y-2">
            {currentSequenceData.steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{step.name}</div>
                  <div className="text-blue-200 text-sm">
                    Tipo: {step.type}
                    {step.voltage && ` | Voltaje: ${step.voltage}V`}
                    {step.expected_value && ` | Esperado: ${step.expected_value}`}
                    {step.delay_ms && ` | Retardo: ${step.delay_ms}ms`}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  isRunning && index < testProgress ? 'bg-green-400' :
                  isRunning && index === testProgress ? 'bg-yellow-400' :
                  'bg-gray-400'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de Progreso */}
      {isRunning && currentSequenceData && (
        <div className="bg-white/10 rounded-lg p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Progreso de la Prueba</span>
            <span className="text-blue-200 text-sm">
              {testProgress} / {currentSequenceData.steps.length} pasos
            </span>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${(testProgress / currentSequenceData.steps.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Botones de Control */}
      <div className="flex space-x-4">
        {!isRunning ? (
          <button
            onClick={handleStartTest}
            disabled={!selectedSequence}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedSequence
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            🚀 Iniciar Prueba
          </button>
        ) : (
          <button
            onClick={handleStopTest}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
          >
            ⏹️ Detener Prueba
          </button>
        )}
        
        <button
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            isRunning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          ⚙️ Configurar
        </button>
      </div>
    </div>
  )
}

export default TestRunner