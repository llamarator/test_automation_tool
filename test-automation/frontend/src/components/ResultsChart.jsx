import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const ResultsChart = ({ results, isRunning }) => {
  // Procesar datos para los gráficos
  const chartData = useMemo(() => {
    return results.map((result, index) => ({
      step: index + 1,
      stepName: result.step_name,
      voltage: result.measurements?.voltage_measured || result.measurements?.voltage || 0,
      current: result.measurements?.current_measured || result.measurements?.current || 0,
      power: result.measurements?.power || 0,
      passed: result.passed ? 1 : 0,
      duration: result.duration || 0,
      timestamp: new Date(result.start_time || Date.now()).toLocaleTimeString()
    }))
  }, [results])

  // Estadísticas generales
  const statistics = useMemo(() => {
    const total = results.length
    const passed = results.filter(r => r.passed).length
    const failed = total - passed
    const avgDuration = results.length > 0 ? 
      results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length : 0

    return { total, passed, failed, avgDuration, passRate: total > 0 ? (passed / total * 100) : 0 }
  }, [results])

  // Datos para gráfico de pasados/fallados
  const passFailData = [
    { name: 'Pasados', value: statistics.passed, color: '#10b981' },
    { name: 'Fallados', value: statistics.failed, color: '#ef4444' }
  ]

  // Colores personalizados
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/20">
          <p className="font-medium">{`Paso ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Resultados de Pruebas</h2>
        
        {isRunning && (
          <div className="bg-yellow-500/20 px-4 py-2 rounded-lg">
            <span className="text-yellow-200 text-sm">🔄 Actualizando en tiempo real...</span>
          </div>
        )}
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{statistics.total}</div>
          <div className="text-blue-200 text-sm">Total Pasos</div>
        </div>
        
        <div className="bg-green-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{statistics.passed}</div>
          <div className="text-green-200 text-sm">Pasados</div>
        </div>
        
        <div className="bg-red-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{statistics.failed}</div>
          <div className="text-red-200 text-sm">Fallados</div>
        </div>
        
        <div className="bg-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{statistics.passRate.toFixed(1)}%</div>
          <div className="text-blue-200 text-sm">Tasa Éxito</div>
        </div>
      </div>

      {results.length > 0 ? (
        <>
          {/* Gráfico de mediciones en el tiempo */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📈 Mediciones por Paso</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="step" 
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="voltage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Voltaje (V)"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Corriente (A)"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="power" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Potencia (W)"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Gráfico de duración de pasos */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">⏱️ Duración por Paso</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="step" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="duration" 
                    fill="#8b5cf6"
                    name="Duración (s)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico circular de éxito/fallo */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">✅ Estado de Pasos</h3>
              {statistics.total > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                  Sin datos para mostrar
                </div>
              )}
            </div>
          </div>

          {/* Tabla detallada de resultados */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Detalle de Resultados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-2 text-blue-200">Paso</th>
                    <th className="text-left p-2 text-blue-200">Nombre</th>
                    <th className="text-left p-2 text-blue-200">Estado</th>
                    <th className="text-right p-2 text-blue-200">Voltaje</th>
                    <th className="text-right p-2 text-blue-200">Corriente</th>
                    <th className="text-right p-2 text-blue-200">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="p-2 text-white font-mono">{index + 1}</td>
                      <td className="p-2 text-white">{result.step_name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.passed 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {result.passed ? '✅ Pasó' : '❌ Falló'}
                        </span>
                      </td>
                      <td className="p-2 text-white text-right font-mono">
                        {result.measurements?.voltage_measured?.toFixed(3) || 'N/A'} V
                      </td>
                      <td className="p-2 text-white text-right font-mono">
                        {result.measurements?.current_measured?.toFixed(3) || 'N/A'} A
                      </td>
                      <td className="p-2 text-white text-right font-mono">
                        {result.duration?.toFixed(2) || 'N/A'} s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No hay resultados disponibles
          </h3>
          <p className="text-blue-200">
            Los resultados aparecerán aquí cuando ejecutes una prueba
          </p>
        </div>
      )}
    </div>
  )
}

export default ResultsChart