import { motion } from 'framer-motion'

export default function HeroSection({ onStartAnalysis }) {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto px-8 text-center space-y-8"
      >
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl font-bold text-gray-900 leading-tight"
        >
          Transform Your Space
          <span className="block text-orange-600 mt-2">AI-Powered Design</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed"
        >
          Personalized interior design recommendations and expert analysis for your perfect cozy home.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartAnalysis}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium text-base hover:bg-orange-700 transition-colors"
        >
          Start Design Analysis
        </motion.button>
      </motion.div>
    </section>
  )
}
