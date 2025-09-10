import { useState, useEffect, useRef } from 'react'

export const useWebSocket = (url, options = {}) => {
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [lastMessage, setLastMessage] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = options.maxReconnectAttempts || 5

  const connect = () => {
    try {
      wsRef.current = new WebSocket(url)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket conectado')
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        
        if (options.onOpen) {
          options.onOpen()
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          
          if (options.onMessage) {
            options.onMessage(data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket desconectado:', event.code, event.reason)
        setConnectionStatus('disconnected')
        
        if (options.onClose) {
          options.onClose(event)
        }

        // Intentar reconexión automática
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttempts.current) * 1000 // Backoff exponencial
          console.log(`Reintentando conexión en ${timeout}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            setConnectionStatus('connecting')
            connect()
          }, timeout)
        } else {
          console.log('Máximo número de reintentos alcanzado')
          setConnectionStatus('failed')
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        
        if (options.onError) {
          options.onError(error)
        }
      }

    } catch (error) {
      console.error('Error creating WebSocket:', error)
      setConnectionStatus('error')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
    }
  }

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageString = typeof message === 'string' ? message : JSON.stringify(message)
        wsRef.current.send(messageString)
        return true
      } catch (error) {
        console.error('Error enviando mensaje WebSocket:', error)
        return false
      }
    } else {
      console.warn('WebSocket no está conectado. Estado:', wsRef.current?.readyState)
      return false
    }
  }

  const reconnect = () => {
    disconnect()
    reconnectAttempts.current = 0
    setConnectionStatus('connecting')
    connect()
  }

  // Conectar al montar el componente
  useEffect(() => {
    connect()

    // Cleanup al desmontar
    return () => {
      disconnect()
    }
  }, [url])

  return {
    connectionStatus,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect
  }
}

// Hook para manejar múltiples suscripciones a mensajes WebSocket
export const useWebSocketSubscription = (wsConnection, messageType, handler) => {
  useEffect(() => {
    if (!wsConnection.lastMessage) return

    if (wsConnection.lastMessage.type === messageType) {
      handler(wsConnection.lastMessage)
    }
  }, [wsConnection.lastMessage, messageType, handler])
}

// Utilidades para WebSocket
export const WebSocketUtils = {
  // Estados de conexión
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  FAILED: 'failed',

  // Tipos de mensaje comunes
  MESSAGE_TYPES: {
    TEST_STARTED: 'test_started',
    TEST_COMPLETED: 'test_completed',
    TEST_ERROR: 'test_error',
    STEP_STARTED: 'step_started',
    STEP_COMPLETED: 'step_completed',
    INSTRUMENT_STATUS: 'instrument_status',
    TEST_PROGRESS: 'test_progress'
  },

  // Crear mensaje formateado
  createMessage: (type, data = {}) => ({
    type,
    timestamp: Date.now(),
    ...data
  }),

  // Validar mensaje recibido
  isValidMessage: (message) => {
    return message && typeof message === 'object' && message.type
  }
}