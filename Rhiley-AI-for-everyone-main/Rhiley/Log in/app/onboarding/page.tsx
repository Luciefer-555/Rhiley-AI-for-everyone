"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, ArrowRight } from "lucide-react"

interface DummyUser {
  email: string
  loginTime: string
}

export default function OnboardingPage() {
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

  const handleContinue = () => {
    // Navigate to job role selection
    router.push("/job-role")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto bg-[#f0f3fa] rounded-3xl p-8 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff]"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-[#f0f3fa] shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]"
          >
            <CheckCircle className="w-8 h-8 text-[#ff1493]" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-700 mb-2 font-mono">Welcome!</h1>
          <p className="text-gray-500 mb-6 font-mono">
            Hey {user.email.split("@")[0]}, you're all set! Let's get you started.
          </p>

          <div className="w-full space-y-4 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-4 bg-[#f0f3fa] rounded-2xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
            >
              <div className="w-3 h-3 bg-[#ff1493] rounded-full shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]"></div>
              <span className="text-gray-600 font-mono">Account created</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-3 p-4 bg-[#f0f3fa] rounded-2xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
            >
              <div className="w-3 h-3 bg-[#ff1493] rounded-full shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]"></div>
              <span className="text-gray-600 font-mono">Profile setup ready</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-3 p-4 bg-[#f0f3fa] rounded-2xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
            >
              <div className="w-3 h-3 bg-gray-300 rounded-full shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]"></div>
              <span className="text-gray-400 font-mono">Complete onboarding</span>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            onClick={handleContinue}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-[#f0f3fa] rounded-2xl text-lg font-semibold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center justify-center gap-2 font-mono"
            style={{ color: "#ff1493" }}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
