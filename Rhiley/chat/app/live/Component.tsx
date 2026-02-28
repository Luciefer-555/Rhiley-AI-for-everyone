'use client';

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

const FerrariPoster = () => {
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in')
          }
        })
      },
      { threshold: 0.1 }
    )

    if (textRef.current) {
      observer.observe(textRef.current)
    }

    return () => {
      if (textRef.current) {
        observer.unobserve(textRef.current)
      }
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#FFF500] to-[#8B0032] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#333] opacity-20 z-0"></div>
      
      <motion.div 
        className="relative z-10"
        initial={{ scale: 0.8, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      >
        <img 
          src="https://images.unsplash.com/photo-1586661520548-39e25a6762a3?auto=format&fit=crop&w=1920&q=80" 
          alt="Ferrari" 
          className="w-full max-w-md h-auto border-4 border-[#FFC159] rounded-lg shadow-xl"
        />
      </motion.div>

      <motion.div 
        ref={textRef}
        className="absolute z-20 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        <div className="text-white text-4xl md:text-6xl font-bold mb-4">
          <span className="block bg-[#333] bg-opacity-30 px-4 py-1 rounded">Ferrari</span>
          <span className="block bg-[#FFC159] bg-opacity-20 px-4 py-1 rounded">V12</span>
        </div>
        <div className="text-white text-xl md:text-2xl mb-8">
          <span className="bg-[#333] bg-opacity-30 px-4 py-1 rounded inline-block">Speed</span>
          <span className="bg-[#FFC159] bg-opacity-20 px-4 py-1 rounded inline-block">Legacy</span>
        </div>
        <div className="text-white text-sm md:text-base">
          <span className="bg-[#333] bg-opacity-30 px-4 py-1 rounded inline-block">1960s</span>
          <span className="bg-[#FFC159] bg-opacity-20 px-4 py-1 rounded inline-block">Revolution</span>
        </div>
      </motion.div>
    </div>
  )
}

export default FerrariPoster