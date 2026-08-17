"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface DummyUser {
  email: string
  loginTime: string
  jobRole?: string
  companyType?: string
  companySize?: string
}

const companyTypes = [
  "Tech Startup",
  "Software Agency",
  "Design Agency",
  "Freelancer",
  "Solopreneur",
  "eCommerce Business",
  "Consulting Firm",
  "VC Firm",
]

const companySizes = [
  { value: "1-10", label: "1-10 people" },
  { value: "11-50", label: "11-50 people" },
  { value: "51-200", label: "51-200 people" },
  { value: "201-1000", label: "201-1000 people" },
  { value: "1000+", label: "1000+ people" },
]

export default function CompanyInfoPage() {
  const [user, setUser] = useState<DummyUser | null>(null)
  const [selectedCompanyType, setSelectedCompanyType] = useState<string>("")
  const [selectedCompanySize, setSelectedCompanySize] = useState<number>(0)
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

  const handleCompanyTypeSelect = (type: string) => {
    setSelectedCompanyType(type)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCompanySize(Number.parseInt(e.target.value))
  }

  const handleContinue = () => {
    if (!selectedCompanyType || !user) return

    // Update user data with company info
    const updatedUser = {
      ...user,
      companyType: selectedCompanyType,
      companySize: companySizes[selectedCompanySize].value,
    }
    localStorage.setItem("dummyUser", JSON.stringify(updatedUser))

    // Navigate to welcome page
    router.push("/welcome")
  }

  const handleGoBack = () => {
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
        className="w-full max-w-2xl mx-auto bg-[#f0f3fa] rounded-3xl p-8 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff]"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-700 mb-2 font-mono">Can you tell us about your company?</h1>
          <p className="text-gray-500 font-mono">Help us personalize your experience</p>
        </div>

        {/* Company Type Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 font-mono text-center">
            What kind of company are you?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {companyTypes.map((type, index) => {
              const isSelected = selectedCompanyType === type

              return (
                <motion.button
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCompanyTypeSelect(type)}
                  className={`px-4 py-3 bg-[#f0f3fa] rounded-full text-sm font-mono cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] ring-1 ring-[#ff149380] text-[#ff1493]"
                      : "shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] text-gray-600"
                  }`}
                >
                  {type}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Company Size Slider */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 font-mono text-center">How large is your company?</h2>
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xl font-bold text-gray-700 font-mono">
                {companySizes[selectedCompanySize].label}
              </span>
            </div>

            <div className="relative">
              <div className="w-full h-3 bg-[#f0f3fa] rounded-full shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] relative">
                {/* Progress track */}
                <div
                  className="h-full bg-gradient-to-r from-[#ff1493] to-[#ff1493] rounded-full transition-all duration-300"
                  style={{ width: `${(selectedCompanySize / (companySizes.length - 1)) * 100}%` }}
                />

                {/* Slider handle */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[#ff1493] rounded-full shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{ left: `calc(${(selectedCompanySize / (companySizes.length - 1)) * 100}% - 12px)` }}
                />
              </div>

              {/* Hidden input for interaction */}
              <input
                type="range"
                min="0"
                max={companySizes.length - 1}
                value={selectedCompanySize}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Size labels */}
            <div className="flex justify-between text-xs text-gray-400 font-mono px-1">
              <span>1-10</span>
              <span>11-50</span>
              <span>51-200</span>
              <span>201-1K</span>
              <span>1K+</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleGoBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-[#f0f3fa] rounded-2xl font-semibold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center gap-2 font-mono text-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            onClick={handleContinue}
            disabled={!selectedCompanyType}
            whileHover={selectedCompanyType ? { scale: 1.02 } : {}}
            whileTap={selectedCompanyType ? { scale: 0.98 } : {}}
            className={`px-6 py-3 bg-[#f0f3fa] rounded-2xl font-semibold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center gap-2 font-mono ${
              selectedCompanyType ? "text-[#ff1493]" : "text-gray-400 opacity-50 cursor-not-allowed"
            }`}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
