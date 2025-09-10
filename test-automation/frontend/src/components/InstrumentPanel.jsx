import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const InstrumentPanel = ({ instruments, onConnect, onDisconnect }) => {
  const [newInstrument, setNewInstrument] = useState({
    name: '',
    type: 'power_supply',
    resource_name: '',
    device_name: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)

  // Configuraciones predefinidas de instrumentos
  const instrumentTemplates = {
    power_supply: {
      name: 'Fuente de Alimentación',
      fields: [
        { key: 'resource_name', label: 'Recurso VISA', placeholder: 'USB0::0x2A8D::0x0001::INSTR' }
      ]
    },
    daq: {
      name: 'Tarjeta DAQ',
      fields: [
        { key: 'device_name', label: 'Nombre del Dispositivo', placeholder: 'Dev1' }
      ]
    },
    multimeter: {
      name: 'Multímetro',
      fields: [
        { key: 'resource_name', label: 'Recurso VISA', placeholder: 'USB0::0x0957::0x0607::INSTR' }
      ]
    }
  }

  const handleAddInstrument = async (e) => {
    e.preventDefault()
    
    if (!newInstrument.name.trim()) {
      toast.error('El nombre del instrumento es requerido')
      return
    }

    try {
      await onConnect(newInstrument.name, {
        type: newInstrument.type,
        resource_name: newInstrument.resource_name || newInstrument.device_name,
        device_name: newInstrument.device_name
      })
      
      setNewInstrument({ name: '', type: 'power_supply', resource_name: '', device_name: '' })
      setShowAddForm(false)
      toast.success(`Instrumento ${newInstrument.name} conectado`)
    } catch (error) {
      toast.error(`Error conectando instrumento: ${error.message}`)
    }
  }

  const handleDisconnect = async (instrumentName) => {
    try {
      await onDisconnect(instrumentName)
      toast.success(`Instrumento ${instrumentName} desconectado`)
    } catch (error) {
      toast.error(`Error desconectando: ${error.message}`)
    }
  }

  const getStatusColor = (instrument) => {
    if (!instrument.connected) return 'bg-red-500'
    if (instrument.status === 'error') return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusText = (instrument) => {
    if (!instrument.connected) return 'Desconectado'
    if (instrument.status === 'error') return 'Error'
    return 'Conectado'
  }

  const formatReading = (value, unit = '') => {
    if (typeof value !== 'number') return 'N/A'
    return `${value.toFixed(3)} ${unit}`.trim()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Panel de Instrumentos</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
        >
          {showAddForm ? '❌ Cancelar' : '➕ Agregar Instrumento'}
        </button>
      </div>

      {/* Formulario para agregar instrumento */}
      {showAddForm && (
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Nuevo Instrumento</h3>
          
          <form onSubmit={handleAddInstrument} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Nombre del Instrumento
                </label>
                <input
                  type="text"
                  value={newInstrument.name}
                  onChange={(e) => setNewInstrument({...newInstrument, name: e.target.value})}
                  placeholder="Ej: Fuente Principal"
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  Tipo de Instrumento
                </label>
                <select
                  value={newInstrument.type}
                  onChange={(e) => setNewInstrument({...newInstrument, type: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
                >
                  {Object.entries(instrumentTemplates).map(([key, template]) => (
                    <option key={key} value={key} className="bg-gray-800">
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos específicos del tipo de instrumento */}
            {instrumentTemplates[newInstrument.type].fields.map((field) => (
              <div key={field.key}>
                <label className="block text-blue-200 text-sm font-medium mb-2">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={newInstrument[field.key]}
                  onChange={(e) => setNewInstrument({...newInstrument, [field.key]: e.target.value})}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-blue-400 focus:outline-none"
                  required
                />
              </div>
            ))}

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
              >
                🔌 Conectar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de instrumentos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(instruments).map(([name, instrument]) => (
          <div key={name} className="bg-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{name}</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(instrument)}`}></div>
                <span className="text-blue-200 text-sm">{getStatusText(instrument)}</span>
              </div>
            </div>

            {/* Información del instrumento */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-blue-200">Tipo:</span>
                <span className="text-white">{instrument.config?.type || 'N/A'}</span>
              </div>
              
              {instrument.config?.resource_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Recurso:</span>
                  <span className="text-white text-xs">{instrument.config.resource_name}</span>
                </div>
              )}
              
              {instrument.error && (
                <div className="text-red-400 text-xs bg-red-500/20 p-2 rounded">
                  Error: {instrument.error}
                </div>
              )}
            </div>

            {/* Lecturas en tiempo real */}
            {instrument.connected && instrument.lastReading && Object.keys(instrument.lastReading).length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 mb-4">
                <h4 className="text-white font-medium mb-2">📊 Lecturas</h4>
                <div className="space-y-1">
                  {instrument.lastReading.voltage !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Voltaje:</span>
                      <span className="text-white font-mono">
                        {formatReading(instrument.lastReading.voltage, 'V')}
                      </span>
                    </div>
                  )}
                  
                  {instrument.lastReading.current !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Corriente:</span>
                      <span className="text-white font-mono">
                        {formatReading(instrument.lastReading.current, 'A')}
                      </span>
                    </div>
                  )}
                  
                  {instrument.lastReading.power !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-200">Potencia:</span>
                      <span className="text-white font-mono">
                        {formatReading(instrument.lastReading.power, 'W')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Controles del instrumento */}
            <div className="flex space-x-2">
              {instrument.connected ? (
                <button
                  onClick={() => handleDisconnect(name)}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition-all"
                >
                  🔌 Desconectar
                </button>
              ) : (
                <button
                  onClick={() => onConnect(name, instrument.config)}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-all"
                >
                  🔌 Reconectar
                </button>
              )}
              
              <button
                disabled={!instrument.connected}
                className={`px-3 py-2 text-sm rounded font-medium transition-all ${
                  instrument.connected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                ⚙️ Config
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay instrumentos */}
      {Object.keys(instruments).length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay instrumentos configurados
          </h3>
          <p className="text-blue-200 mb-4">
            Agrega tu primer instrumento para comenzar las pruebas
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
          >
            ➕ Agregar Primer Instrumento
          </button>
        </div>
      )}
    </div>
  )
}

export default InstrumentPanel