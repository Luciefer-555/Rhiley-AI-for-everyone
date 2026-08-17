import { useState } from 'react'
import { motion } from 'framer-motion'
import RoomAnalyzer from './RoomAnalyzer'
import ProductRecommendations from './ProductRecommendations'
import runCozy from '../utils/designEngine'

const mockEngineOutput = {
  intent: {
    room: "bedroom",
    style: ["cozy", "warm"]
  },
  issues: [
    {
      type: "visual_imbalance",
      severity: "medium"
    }
  ],
  decision: {
    mode: "small_refinements"
  }
}

export default function DesignEngine() {
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    
    setTimeout(() => {
      const result = runCozy(mockEngineOutput)
      setAnalysis(result)
      setIsAnalyzing(false)
    }, 1500)
  }

  return (
    <section className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Design Analysis Engine
          </h1>
          <p className="text-base text-gray-600 max-w-lg mx-auto">
            AI-powered insights and product recommendations for your space
          </p>
        </motion.div>

        {!analysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center"
          >
            <button
              onClick={handleAnalyze}
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors"
            >
              Analyze Room Design
            </button>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="mt-3 text-sm text-gray-600">Analyzing your room design...</p>
          </motion.div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <RoomAnalyzer analysis={analysis.narration} />
            <ProductRecommendations products={analysis.products} />
            
            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setAnalysis(null)
                  handleAnalyze()
                }}
                className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Re-analyze
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
