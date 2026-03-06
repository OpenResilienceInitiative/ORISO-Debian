import { useState, useEffect } from 'react'

export default function ServiceRow({ serviceKey, service }) {
  const [status, setStatus] = useState('checking')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`/api/health/${serviceKey}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // Check if we need to look at a specific component (like 'db')
          if (service.checkComponent && data.components) {
            const componentStatus = data.components[service.checkComponent]?.status
            setStatus(componentStatus === 'UP' ? 'UP' : 'DOWN')
          } else {
            setStatus(data.status === 'UP' ? 'UP' : 'DOWN')
          }
        } else {
          setStatus('DOWN')
        }
      } catch (error) {
        setStatus('DOWN')
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [serviceKey, service.checkComponent])

  const isUp = status === 'UP'

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-2">
        <span className="text-base font-medium text-gray-900">
          {service.name}
        </span>
      </div>
      
      <div className="flex items-center space-x-3">
        {loading ? (
          <span className="text-sm text-gray-400">Checking...</span>
        ) : (
          <>
            <span className="text-sm text-gray-500">
              {isUp ? 'Operational' : 'Down'}
            </span>
            <div className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
              isUp ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isUp ? (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

