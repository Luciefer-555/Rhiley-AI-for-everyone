import { motion } from 'framer-motion'

export default function ProductRecommendations({ products }) {
  if (products.length === 0) {
    return null
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended Products</h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 capitalize">
                  {product.type}
                </h3>
                <p className="text-xs text-gray-500">ID: {product.id}</p>
              </div>
              <span className="text-lg font-bold text-orange-600">
                ₹{product.price}
              </span>
            </div>
            
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">
                <span className="font-medium">Source:</span> {product.source}
              </p>
              <div className="flex flex-wrap gap-1">
                {product.style.map((style, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-700">
                <span className="font-medium">Why it works:</span> {product.reason}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
