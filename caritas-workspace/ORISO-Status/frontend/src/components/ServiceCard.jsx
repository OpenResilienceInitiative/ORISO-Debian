import { useState, useEffect } from 'react'

export default function ServiceCard({ serviceKey, service }) {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responseTime, setResponseTime] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      const startTime = Date.now()
      try {
        const response = await fetch(`/api/health/${serviceKey}`)
        const endTime = Date.now()
        setResponseTime(endTime - startTime)
        
        if (response.ok) {
          const data = await response.json()
          setHealthData(data)
        } else {
          setHealthData({ status: 'DOWN' })
        }
      } catch (error) {
        setHealthData({ status: 'DOWN' })
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [serviceKey])

  const isUp = healthData?.status === 'UP'

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {service.name}
            </h3>
            <div className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              loading 
                ? 'bg-gray-100 text-gray-800' 
                : isUp 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {loading ? 'Checking...' : isUp ? 'Operational' : 'Down'}
            </div>
          </div>
          
          {responseTime !== null && (
            <p className="mt-2 text-sm text-gray-500">
              Response time: <span className="font-medium text-gray-900">{responseTime}ms</span>
            </p>
          )}
          
          <p className="mt-1 text-xs text-gray-400 truncate">
            {service.url}
          </p>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          {loading ? (
            <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"></div>
          ) : (
            <div className={`h-3 w-3 rounded-full ${
              isUp ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          )}
        </div>
      </div>

      {healthData && healthData.components && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Components:</p>
          <div className="space-y-1">
            {Object.entries(healthData.components).map(([key, component]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{key}</span>
                <span className={`font-medium ${
                  component.status === 'UP' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {component.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

