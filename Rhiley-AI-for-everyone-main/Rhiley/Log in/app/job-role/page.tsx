"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  User,
  Crown,
  Palette,
  Code,
  TrendingUp,
  Users,
  GraduationCap,
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"

interface DummyUser {
  email: string
  loginTime: string
  jobRole?: string
}

interface JobRole {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const jobRoles: JobRole[] = [
  {
    id: "product-manager",
    title: "Product Manager",
    description: "Drive product strategy",
    icon: User,
  },
  {
    id: "founder",
    title: "Founder/CEO",
    description: "Build and scale your business",
    icon: Crown,
  },
  {
    id: "designer",
    title: "Designer",
    description: "Create beautiful experiences",
    icon: Palette,
  },
  {
    id: "developer",
    title: "Developer",
    description: "Build amazing products",
    icon: Code,
  },
  {
    id: "marketer",
    title: "Marketer",
    description: "Grow your audience",
    icon: TrendingUp,
  },
  {
    id: "consultant",
    title: "Consultant",
    description: "Advise and strategize",
    icon: Users,
  },
  {
    id: "student",
    title: "Student",
    description: "Learning and exploring",
    icon: GraduationCap,
  },
  {
    id: "other",
    title: "Other",
    description: "Something else entirely",
    icon: MoreHorizontal,
  },
]

export default function JobRolePage() {
  const [user, setUser] = useState<DummyUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
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

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
  }

  const handleContinue = () => {
    if (!selectedRole || !user) return

    // Update user data with selected role
    const updatedUser = { ...user, jobRole: selectedRole }
    localStorage.setItem("dummyUser", JSON.stringify(updatedUser))

    // Navigate to company info page
    router.push("/company-info")
  }

  const handleGoBack = () => {
    router.push("/onboarding")
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
          <h1 className="text-2xl font-bold text-gray-700 mb-2 font-mono">What is your job role?</h1>
          <p className="text-gray-500 font-mono">Help us personalize your experience</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {jobRoles.map((role, index) => {
            const IconComponent = role.icon
            const isSelected = selectedRole === role.id

            return (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                className={`relative p-4 bg-[#f0f3fa] rounded-2xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff] ring-2 ring-[#ff149380]"
                    : "shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff]"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#ff1493] rounded-full flex items-center justify-center shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff]">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0f3fa] flex items-center justify-center mb-3 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff]">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>

                  <h3 className="font-semibold text-gray-700 mb-1 font-mono text-sm">{role.title}</h3>
                  <p className="text-xs text-gray-500 font-mono">{role.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

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
            disabled={!selectedRole}
            whileHover={selectedRole ? { scale: 1.02 } : {}}
            whileTap={selectedRole ? { scale: 0.98 } : {}}
            className={`px-6 py-3 bg-[#f0f3fa] rounded-2xl font-semibold shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 flex items-center gap-2 font-mono ${
              selectedRole ? "text-[#ff1493]" : "text-gray-400 opacity-50 cursor-not-allowed"
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
