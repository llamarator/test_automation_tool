import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import TestRunner from './components/TestRunner.jsx'
import InstrumentPanel from './components/InstrumentPanel.jsx'
import ResultsChart from './components/ResultsChart.jsx'
import { useWebSocket } from './services/websocket.js'
import { useStore } from './services/store.js'

function App() {
  const { 
    instruments, 
    testResults, 
    isTestRunning,
    currentTest,
    addTestResult,
    updateInstrument,
    setTestRunning 
  } = useStore()
  
  const [activeTab, setActiveTab] = useState('control')
  
  // Conectar WebSocket
  const { sendMessage, connectionStatus } = useWebSocket('ws://localhost:8000/ws', {
    onMessage: (data) => {
      console.log('Mensaje WebSocket:', data)
      
      switch (data.type) {
        case 'instrument_status':
          updateInstrument(data.instrument, data.data)
          break
        case 'test_started':
          setTestRunning(true, data.test_id)
          break
        case 'step_completed':
          addTestResult(data.result)
          break
        case 'test_completed':
          setTestRunning(false, null)
          break
        case 'test_error':
          setTestRunning(false, null)
          console.error('Error en prueba:', data.error)
          break
      }
    }
  })

  const tabs = [
    { id: 'control', name: 'Control de Pruebas', icon: '🚀' },
    { id: 'instruments', name: 'Instrumentos', icon: '⚡' },
    { id: 'results', name: 'Resultados', icon: '📊' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="glass-effect rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Sistema de Pruebas Automáticas
            </h1>
            <p className="text-blue-200">
              Estado: 
              <span className={`status-indicator ml-2 ${
                connectionStatus === 'connected' ? 'status-connected' : 'status-disconnected'
              }`}></span>
              <span className="font-medium">
                {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {isTestRunning && (
              <div className="flex items-center space-x-2 bg-yellow-500/20 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-yellow-400 rounded-full pulse-glow"></div>
                <span className="text-yellow-200 font-medium">Prueba en Ejecución</span>
              </div>
            )}
            
            <div className="text-right text-blue-200">
              <div className="text-sm">Instrumentos Conectados</div>
              <div className="text-2xl font-bold text-white">
                {Object.values(instruments).filter(i => i.connected).length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass-effect rounded-xl p-2 mb-6">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 font-medium ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="glass-effect rounded-xl p-6 min-h-[600px]">
        {activeTab === 'control' && (
          <TestRunner 
            onStartTest={(sequence) => {
              sendMessage({
                type: 'start_test',
                sequence: sequence
              })
            }}
            onStopTest={() => {
              sendMessage({ type: 'stop_test' })
            }}
            isRunning={isTestRunning}
            currentTest={currentTest}
          />
        )}
        
        {activeTab === 'instruments' && (
          <InstrumentPanel 
            instruments={instruments}
            onConnect={(instrumentName, config) => {
              // Llamada a API para conectar instrumento
              fetch(`http://localhost:8000/api/instruments/${instrumentName}/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
              })
            }}
            onDisconnect={(instrumentName) => {
              fetch(`http://localhost:8000/api/instruments/${instrumentName}`, {
                method: 'DELETE'
              })
            }}
          />
        )}
        
        {activeTab === 'results' && (
          <ResultsChart 
            results={testResults}
            isRunning={isTestRunning}
          />
        )}
      </main>

      {/* Status Footer */}
      <footer className="glass-effect rounded-xl p-4 mt-6">
        <div className="flex justify-between items-center text-blue-200 text-sm">
          <div>
            Última actualización: {new Date().toLocaleTimeString()}
          </div>
          <div>
            Resultados almacenados: {testResults.length}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App