"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Sparkles } from "lucide-react"

interface DummyUser {
  email: string
  loginTime: string
  jobRole?: string
  companyType?: string
  companySize?: string
}

export default function WelcomePage() {
  const [user, setUser] = useState<DummyUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is "logged in"
    const dummyUser = localStorage.getItem("dummyUser")
    if (!dummyUser) {
      router.push("/")
      return
    }

    setUser(JSON.parse(dummyUser))
  }, [router])

  const handleEnterApp = () => {
    // Navigate to the Chat Application
    window.location.href = "http://localhost:3001"
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating dots */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-[#ff1493] rounded-full opacity-60"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            opacity: 0,
          }}
          animate={{
            y: -50,
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4,
            delay: i * 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Main welcome card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: [0.9, 1.02, 1],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.6, 1],
          ease: "easeOut",
        }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="w-full max-w-lg mx-auto bg-[#f0f3fa] rounded-3xl p-12 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff]"
        >
          <div className="flex flex-col items-center text-center">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.6,
                type: "spring",
                stiffness: 200,
              }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8 bg-[#f0f3fa] shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]"
            >
              <CheckCircle className="w-10 h-10 text-[#ff1493]" />
            </motion.div>

            {/* Welcome text */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-4xl font-bold text-gray-700 mb-4 font-mono"
            >
              Welcome aboard!
            </motion.h1>

            {/* Personalized message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-gray-500 font-mono mb-8 text-lg"
            >
              Hey {user.email.split("@")[0]}, you're all set to get started!
            </motion.p>

            {/* User selections summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="flex flex-wrap gap-2 justify-center mb-8"
            >
              {user.jobRole && (
                <div className="px-4 py-2 bg-[#f0f3fa] rounded-full text-sm font-mono text-gray-600 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  {user.jobRole.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              )}
              {user.companyType && (
                <div className="px-4 py-2 bg-[#f0f3fa] rounded-full text-sm font-mono text-gray-600 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  {user.companyType}
                </div>
              )}
              {user.companySize && (
                <div className="px-4 py-2 bg-[#f0f3fa] rounded-full text-sm font-mono text-gray-600 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                  {user.companySize} people
                </div>
              )}
            </motion.div>

            {/* Enter app button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              onClick={handleEnterApp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#f0f3fa] rounded-2xl text-lg font-semibold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center gap-2 font-mono"
              style={{ color: "#ff1493" }}
            >

              Enter
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
