import ServiceRow from './ServiceRow'

export default function ServiceGrid({ services, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between animate-pulse">
              <div className="h-5 bg-gray-300 rounded w-1/3"></div>
              <div className="h-5 bg-gray-300 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const serviceEntries = Object.entries(services)

  if (serviceEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No services configured</p>
      </div>
    )
  }

  // Split services into two columns for GitHub-style layout
  const midpoint = Math.ceil(serviceEntries.length / 2)
  const leftColumn = serviceEntries.slice(0, midpoint)
  const rightColumn = serviceEntries.slice(midpoint)

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Current Status: ORISO System
      </h2>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Left Column */}
          <div className="px-6">
            {leftColumn.map(([key, service]) => (
              <ServiceRow key={key} serviceKey={key} service={service} />
            ))}
          </div>
          
          {/* Right Column */}
          <div className="px-6">
            {rightColumn.map(([key, service]) => (
              <ServiceRow key={key} serviceKey={key} service={service} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

