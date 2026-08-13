import { useState } from 'react'
import HeroSection from './components/HeroSection'
import DesignEngine from './components/DesignEngine'

export default function App() {
  const [showEngine, setShowEngine] = useState(false)

  const handleStartAnalysis = () => {
    setShowEngine(true)
  }

  const handleBackToHome = () => {
    setShowEngine(false)
  }

  return (
    <div className="min-h-screen">
      {showEngine ? (
        <div>
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-6 py-3">
              <button
                onClick={handleBackToHome}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </nav>
          <DesignEngine />
        </div>
      ) : (
        <HeroSection onStartAnalysis={handleStartAnalysis} />
      )}
    </div>
  )
}
