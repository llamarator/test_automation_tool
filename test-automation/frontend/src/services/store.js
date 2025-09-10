import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Store principal de la aplicación
export const useStore = create(
  subscribeWithSelector((set, get) => ({
    // Estado de instrumentos
    instruments: {},
    
    // Estado de pruebas
    testResults: [],
    isTestRunning: false,
    currentTest: null,
    testHistory: [],
    
    // Estado de la aplicación
    connectionStatus: 'disconnected',
    lastUpdate: null,
    
    // Acciones para instrumentos
    updateInstrument: (name, data) => set((state) => ({
      instruments: {
        ...state.instruments,
        [name]: { ...state.instruments[name], ...data }
      },
      lastUpdate: Date.now()
    })),
    
    addInstrument: (name, config) => set((state) => ({
      instruments: {
        ...state.instruments,
        [name]: {
          name,
          connected: false,
          status: 'disconnected',
          config,
          lastReading: {},
          error: null
        }
      }
    })),
    
    removeInstrument: (name) => set((state) => {
      const { [name]: removed, ...remaining } = state.instruments
      return { instruments: remaining }
    }),
    
    // Acciones para pruebas
    setTestRunning: (running, testId = null) => set(() => ({
      isTestRunning: running,
      currentTest: testId,
      testResults: running ? [] : get().testResults // Limpiar si inicia nueva prueba
    })),
    
    addTestResult: (result) => set((state) => ({
      testResults: [...state.testResults, {
        ...result,
        id: Date.now(),
        timestamp: new Date().toISOString()
      }]
    })),
    
    clearTestResults: () => set(() => ({
      testResults: []
    })),
    
    saveTestToHistory: (testData) => set((state) => ({
      testHistory: [{
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...testData
      }, ...state.testHistory.slice(0, 49)] // Mantener últimas 50 pruebas
    })),
    
    // Acciones para conexión
    setConnectionStatus: (status) => set(() => ({
      connectionStatus: status,
      lastUpdate: Date.now()
    })),
    
    // Getters computados
    getConnectedInstruments: () => {
      const state = get()
      return Object.values(state.instruments).filter(instrument => instrument.connected)
    },
    
    getInstrumentByName: (name) => {
      const state = get()
      return state.instruments[name] || null
    },
    
    getTestStatistics: () => {
      const state = get()
      const total = state.testResults.length
      const passed = state.testResults.filter(r => r.passed).length
      const failed = total - passed
      
      return {
        total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total * 100).toFixed(1) : 0
      }
    },
    
    // Acciones de utilidad
    reset: () => set(() => ({
      instruments: {},
      testResults: [],
      isTestRunning: false,
      currentTest: null,
      connectionStatus: 'disconnected'
    }))
  }))
)

// Store para configuraciones
export const useConfigStore = create((set, get) => ({
  // Configuraciones de instrumentos
  instrumentConfigs: {
    power_supply_1: {
      name: 'Fuente Principal',
      type: 'power_supply',
      resource_name: 'USB0::0x2A8D::0x0001::INSTR',
      max_voltage: 30,
      max_current: 5,
      safety_limits: {
        voltage: 25,
        current: 3
      }
    },
    daq_1: {
      name: 'DAQ Principal',
      type: 'daq',
      device_name: 'Dev1',
      channels: ['ai0', 'ai1', 'ao0', 'ao1'],
      sample_rate: 1000
    }
  },
  
  // Configuraciones de pruebas
  testConfigs: {
    default_timeouts: {
      step: 30000, // 30 segundos
      sequence: 300000 // 5 minutos
    },
    default_tolerances: {
      voltage: 0.05, // 5%
      current: 0.1,  // 10%
      frequency: 0.01 // 1%
    }
  },
  
  // Acciones
  updateInstrumentConfig: (name, config) => set((state) => ({
    instrumentConfigs: {
      ...state.instrumentConfigs,
      [name]: { ...state.instrumentConfigs[name], ...config }
    }
  })),
  
  updateTestConfig: (key, value) => set((state) => ({
    testConfigs: {
      ...state.testConfigs,
      [key]: value
    }
  })),
  
  getInstrumentConfig: (name) => {
    const state = get()
    return state.instrumentConfigs[name] || null
  }
}))

// Hook personalizado para suscribirse a cambios específicos
export const useStoreSubscribe = (selector, callback) => {
  return useStore.subscribe(
    (state) => selector(state),
    callback,
    { fireImmediately: false }
  )
}

// Selectores útiles
export const selectInstrumentsByType = (type) => (state) =>
  Object.values(state.instruments).filter(instrument => 
    instrument.config?.type === type
  )

export const selectTestResultsByStatus = (passed) => (state) =>
  state.testResults.filter(result => result.passed === passed)

export const selectLastTestResults = (count = 10) => (state) =>
  state.testResults.slice(-count)