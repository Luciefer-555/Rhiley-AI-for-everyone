import { motion } from 'framer-motion'

export default function RoomAnalyzer({ analysis }) {
  const { summary, whyItWorks, suggestions, confidence } = analysis

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Room Analysis</h2>
      
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Summary</h3>
          <p className="text-gray-600 leading-relaxed">{summary}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Why It Works</h3>
          <ul className="space-y-2">
            {whyItWorks.map((point, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start"
              >
                <span className="text-orange-600 mr-2 mt-1 text-sm">•</span>
                <span className="text-gray-600 text-sm">{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Suggestions</h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                  className="flex items-start"
                >
                  <span className="text-orange-600 mr-2 mt-1 text-sm">→</span>
                  <span className="text-gray-600 text-sm">{suggestion}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Confidence</h3>
          <p className="text-gray-600 text-sm">{confidence}</p>
        </div>
      </div>
    </motion.div>
  )
}
