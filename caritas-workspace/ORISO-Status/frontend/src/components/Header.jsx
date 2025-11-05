export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ORISO System Status
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <a 
              href="https://app.oriso.site" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ORISO Platform
            </a>
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 
                rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white 
                hover:bg-gray-50 transition-colors"
            >
              Subscribe to Updates
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

