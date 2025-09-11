import React, { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const TestRunner = ({ onStartTest, onStopTest, isRunning, currentTest }) => {
  const [selectedSequence, setSelectedSequence] = useState('')
  const [testSequences, setTestSequences] = useState([])
  const [testProgress, setTestProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [editingSequences, setEditingSequences] = useState({}) // Para secuencias modificadas
  const [editingStep, setEditingStep] = useState(null) // Para edición inline
  const [draggedStep, setDraggedStep] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  
  // Secuencias predefinidas para demo (con IDs únicos)
  const demoSequences = [
    {
      id: 'demo_basic_power_test',
      name: 'Prueba Básica de Alimentación (Demo)',
      description: 'Verifica voltajes de salida del DUT',
      editable: true, // Marcar como editables
      steps: [
        { name: 'Configurar fuente a 5V', type: 'power_supply', voltage: 5.0, current_limit: 1.0 },
        { name: 'Medir voltaje de salida', type: 'measurement', measurement_type: 'voltage', expected_value: 5.0, tolerance: 0.1 },
        { name: 'Configurar fuente a 12V', type: 'power_supply', voltage: 12.0, current_limit: 1.0 },
        { name: 'Medir voltaje 12V', type: 'measurement', measurement_type: 'voltage', expected_value: 12.0, tolerance: 0.2 },
        { name: 'Apagar fuente', type: 'power_supply', voltage: 0, current_limit: 0.1 }
      ]
    },
    {
      id: 'demo_full_functional_test',
      name: 'Prueba Funcional Completa (Demo)',
      description: 'Suite completa de pruebas funcionales',
      editable: true,
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
  
  // Cargar secuencias disponibles del servidor
  useEffect(() => {
    fetch('http://localhost:8000/api/sequences')
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('No se pudieron cargar las secuencias del servidor')
      })
      .then(data => {
        const validSequences = data.filter(seq => 
          seq && seq.id && seq.name && Array.isArray(seq.steps)
        )
        setTestSequences(validSequences)
      })
      .catch(err => {
        console.warn('Error cargando secuencias del servidor:', err)
        setTestSequences([])
      })
  }, [])

  // Obtener secuencia actual (con modificaciones aplicadas)
  const getCurrentSequence = (sequenceId) => {
    if (editingSequences[sequenceId]) {
      return editingSequences[sequenceId]
    }
    
    return [...testSequences, ...demoSequences].find(seq => seq.id === sequenceId)
  }

  // Combinar secuencias del servidor con las demo (evitando duplicados)
  const allSequences = [
    ...testSequences.map(seq => editingSequences[seq.id] || seq),
    ...demoSequences.filter(demo => 
      !testSequences.some(server => server.id === demo.id)
    ).map(demo => editingSequences[demo.id] || demo)
  ]

  const handleStartTest = () => {
    if (!selectedSequence) {
      toast.error('Selecciona una secuencia de prueba')
      return
    }
    
    const sequence = getCurrentSequence(selectedSequence)
    if (sequence && Array.isArray(sequence.steps)) {
      onStartTest(sequence)
      toast.success(`Iniciando prueba: ${sequence.name}`)
      setTestProgress(0)
      setCurrentStep('Inicializando...')
    } else {
      toast.error('La secuencia seleccionada no es válida')
    }
  }

  const handleStopTest = () => {
    onStopTest()
    toast.error('Prueba detenida por el usuario')
    setTestProgress(0)
    setCurrentStep('')
  }

  // Funciones de edición
  const handleDoubleClick = (sequenceId, stepIndex) => {
    const sequence = getCurrentSequence(sequenceId)
    if (!sequence?.editable && !sequence?.id.startsWith('demo_')) return
    
    setEditingStep({ sequenceId, stepIndex })
  }

  const handleStepEdit = (sequenceId, stepIndex, field, value) => {
    const sequence = getCurrentSequence(sequenceId)
    if (!sequence) return

    const updatedSequence = {
      ...sequence,
      steps: sequence.steps.map((step, index) => 
        index === stepIndex ? { ...step, [field]: value } : step
      )
    }

    setEditingSequences(prev => ({
      ...prev,
      [sequenceId]: updatedSequence
    }))
  }

  const handleFinishEdit = () => {
    setEditingStep(null)
  }

  // Funciones de drag & drop
  const handleDragStart = (e, sequenceId, stepIndex) => {
    const sequence = getCurrentSequence(sequenceId)
    if (!sequence?.editable && !sequence?.id.startsWith('demo_')) {
      e.preventDefault()
      return
    }
    
    setDraggedStep({ sequenceId, stepIndex })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, targetIndex) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(targetIndex)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, sequenceId, targetIndex) => {
    e.preventDefault()
    
    if (!draggedStep || draggedStep.sequenceId !== sequenceId) return

    const sequence = getCurrentSequence(sequenceId)
    if (!sequence) return

    const steps = [...sequence.steps]
    const draggedStepData = steps[draggedStep.stepIndex]
    
    // Remover el paso arrastrado
    steps.splice(draggedStep.stepIndex, 1)
    
    // Insertar en la nueva posición
    const insertIndex = targetIndex > draggedStep.stepIndex ? targetIndex - 1 : targetIndex
    steps.splice(insertIndex, 0, draggedStepData)

    const updatedSequence = {
      ...sequence,
      steps
    }

    setEditingSequences(prev => ({
      ...prev,
      [sequenceId]: updatedSequence
    }))

    setDraggedStep(null)
    setDragOverIndex(null)
    toast.success('Paso reordenado correctamente')
  }

  const handleAddStep = (sequenceId) => {
    const sequence = getCurrentSequence(sequenceId)
    if (!sequence) return

    const newStep = {
      name: 'Nuevo Paso',
      type: 'power_supply',
      voltage: 0,
      current_limit: 0.5
    }

    const updatedSequence = {
      ...sequence,
      steps: [...sequence.steps, newStep]
    }

    setEditingSequences(prev => ({
      ...prev,
      [sequenceId]: updatedSequence
    }))

    toast.success('Paso agregado')
  }

  const handleDeleteStep = (sequenceId, stepIndex) => {
    const sequence = getCurrentSequence(sequenceId)
    if (!sequence || sequence.steps.length <= 1) {
      toast.error('No se puede eliminar el último paso')
      return
    }

    const updatedSequence = {
      ...sequence,
      steps: sequence.steps.filter((_, index) => index !== stepIndex)
    }

    setEditingSequences(prev => ({
      ...prev,
      [sequenceId]: updatedSequence
    }))

    toast.success('Paso eliminado')
  }

  const handleResetSequence = (sequenceId) => {
    setEditingSequences(prev => {
      const newState = { ...prev }
      delete newState[sequenceId]
      return newState
    })
    toast.success('Secuencia restaurada')
  }

  const currentSequenceData = getCurrentSequence(selectedSequence)
  const isSequenceModified = editingSequences[selectedSequence]

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
        
        {allSequences.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔄</div>
            <p className="text-blue-200">Cargando secuencias...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {allSequences.map((sequence) => (
              <div
                key={sequence.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                  selectedSequence === sequence.id
                    ? 'border-blue-400 bg-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setSelectedSequence(sequence.id)}
              >
                {editingSequences[sequence.id] && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full pulse-glow"></div>
                )}
                
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white font-medium">
                      {sequence.name}
                      {editingSequences[sequence.id] && (
                        <span className="text-yellow-400 text-xs ml-2">• Modificada</span>
                      )}
                    </h4>
                    <p className="text-blue-200 text-sm mt-1">{sequence.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-300">
                      <span>📋 {Array.isArray(sequence.steps) ? sequence.steps.length : 0} pasos</span>
                      <span>⏱️ {sequence.duration_estimate || 'N/A'}</span>
                      {(sequence.editable || sequence.id.startsWith('demo_')) && (
                        <span className="text-green-400">✏️ Editable</span>
                      )}
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
        )}
      </div>

      {/* Detalles de la Secuencia Seleccionada */}
      {currentSequenceData && Array.isArray(currentSequenceData.steps) && (
        <div className="bg-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              Pasos de la Secuencia: {currentSequenceData.name}
            </h3>
            
            <div className="flex space-x-2">
              {(currentSequenceData.editable || currentSequenceData.id.startsWith('demo_')) && !isRunning && (
                <>
                  <button
                    onClick={() => handleAddStep(selectedSequence)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-all"
                  >
                    ➕ Agregar Paso
                  </button>
                  
                  {isSequenceModified && (
                    <button
                      onClick={() => handleResetSequence(selectedSequence)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-all"
                    >
                      🔄 Restaurar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {currentSequenceData.steps.map((step, index) => {
              const isEditing = editingStep?.sequenceId === selectedSequence && editingStep?.stepIndex === index
              const isDraggable = (currentSequenceData.editable || currentSequenceData.id.startsWith('demo_')) && !isRunning
              const isDragOver = dragOverIndex === index
              
              return (
                <div
                  key={`${currentSequenceData.id}-step-${index}`}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    isDragOver ? 'bg-blue-500/20 border-2 border-blue-400 border-dashed' : 'bg-white/5'
                  } ${isDraggable ? 'cursor-move' : ''}`}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, selectedSequence, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, selectedSequence, index)}
                  onDoubleClick={() => handleDoubleClick(selectedSequence, index)}
                >
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={step.name || ''}
                          onChange={(e) => handleStepEdit(selectedSequence, index, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-white/10 text-white rounded border border-white/20 focus:border-blue-400 focus:outline-none text-sm"
                          placeholder="Nombre del paso"
                        />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <select
                            value={step.type || 'power_supply'}
                            onChange={(e) => handleStepEdit(selectedSequence, index, 'type', e.target.value)}
                            className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 focus:border-blue-400 focus:outline-none text-xs"
                          >
                            <option value="power_supply">Fuente</option>
                            <option value="measurement">Medición</option>
                            <option value="delay">Retardo</option>
                          </select>
                          
                          {(step.type === 'power_supply' || step.type === 'measurement') && (
                            <>
                              <input
                                type="number"
                                step="0.1"
                                value={step.voltage || ''}
                                onChange={(e) => handleStepEdit(selectedSequence, index, 'voltage', parseFloat(e.target.value) || 0)}
                                placeholder="Voltaje"
                                className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 focus:border-blue-400 focus:outline-none text-xs"
                              />
                              
                              <input
                                type="number"
                                step="0.01"
                                value={step.current_limit || step.expected_value || ''}
                                onChange={(e) => {
                                  const field = step.type === 'power_supply' ? 'current_limit' : 'expected_value'
                                  handleStepEdit(selectedSequence, index, field, parseFloat(e.target.value) || 0)
                                }}
                                placeholder={step.type === 'power_supply' ? 'Corriente' : 'Esperado'}
                                className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 focus:border-blue-400 focus:outline-none text-xs"
                              />
                            </>
                          )}
                          
                          {step.type === 'delay' && (
                            <input
                              type="number"
                              value={step.delay_ms || ''}
                              onChange={(e) => handleStepEdit(selectedSequence, index, 'delay_ms', parseInt(e.target.value) || 0)}
                              placeholder="Retardo (ms)"
                              className="px-2 py-1 bg-white/10 text-white rounded border border-white/20 focus:border-blue-400 focus:outline-none text-xs"
                            />
                          )}
                          
                          <button
                            onClick={handleFinishEdit}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-all"
                          >
                            ✓ Listo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-white font-medium">{step.name || `Paso ${index + 1}`}</div>
                        <div className="text-blue-200 text-sm">
                          Tipo: {step.type || 'N/A'}
                          {step.voltage !== undefined && ` | Voltaje: ${step.voltage}V`}
                          {step.current_limit !== undefined && ` | Corriente: ${step.current_limit}A`}
                          {step.expected_value !== undefined && ` | Esperado: ${step.expected_value}`}
                          {step.delay_ms !== undefined && ` | Retardo: ${step.delay_ms}ms`}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!isEditing && (currentSequenceData.editable || currentSequenceData.id.startsWith('demo_')) && !isRunning && (
                    <button
                      onClick={() => handleDeleteStep(selectedSequence, index)}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-all flex-shrink-0"
                    >
                      ✕
                    </button>
                  )}
                  
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isRunning && index < testProgress ? 'bg-green-400' :
                    isRunning && index === testProgress ? 'bg-yellow-400' :
                    'bg-gray-400'
                  }`}></div>
                </div>
              )
            })}
          </div>
          
          {(currentSequenceData.editable || currentSequenceData.id.startsWith('demo_')) && !isRunning && (
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-blue-200 text-sm">
                💡 <strong>Sugerencia:</strong> Haz doble clic en un paso para editarlo, o arrastra los pasos para reordenarlos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Barra de Progreso */}
      {isRunning && currentSequenceData && Array.isArray(currentSequenceData.steps) && (
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
            disabled={!selectedSequence || !currentSequenceData || !Array.isArray(currentSequenceData.steps)}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedSequence && currentSequenceData && Array.isArray(currentSequenceData.steps)
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