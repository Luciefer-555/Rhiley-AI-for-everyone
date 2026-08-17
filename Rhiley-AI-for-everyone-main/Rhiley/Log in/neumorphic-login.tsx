"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"

const AvatarPlaceholder: React.FC = () => {
  return (
    <div className="w-20 h-20 rounded-full bg-[#1a1a2e] flex items-center justify-center mb-8 shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]">
      <img
        src="/logo.png"
        alt="Rhiley"
        className="w-10 h-10 object-contain"
      />
    </div>
  )
}

interface InputFieldProps {
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  showPasswordToggle?: boolean
}

const InputField: React.FC<InputFieldProps> = ({ type, placeholder, value, onChange, showPasswordToggle = false }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type
  return (
    <div className="relative mb-6">
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full px-6 py-4 bg-[#f0f3fa] rounded-2xl text-gray-700 placeholder-gray-400 outline-none transition-all duration-200 font-mono ${isFocused ? "shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] ring-2 ring-[#ff149380]" : "shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]"}`}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  )
}

interface LoginButtonProps {
  isLoading: boolean
}

const LoginButton: React.FC<LoginButtonProps> = ({ isLoading }) => {
  return (
    <motion.button
      type="submit"
      whileHover={{
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`w-full py-4 bg-[#f0f3fa] rounded-2xl text-gray-700 text-lg mb-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 font-mono font-normal ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{
        color: "#ff1493",
      }}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Login"}
    </motion.button>
  )
}

const FooterLinks: React.FC = () => {
  const router = useRouter()

  return (
    <div className="flex justify-between items-center text-sm">
      <button className="text-gray-500 hover:text-[#ff1493] hover:underline transition-all duration-200 font-mono">
        Forgot password?
      </button>
      <button
        className="text-gray-500 hover:text-[#ff1493] hover:underline transition-all duration-200 font-mono"
        style={{
          marginLeft: "5px",
        }}
        onClick={() => router.push("http://localhost:3003")}
      >
        or Sign up
      </button>
    </div>
  )
}

const LoginCard: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // ✅ ADDED — skip login if already authenticated
  useEffect(() => {
    if (typeof window === "undefined") return
    const userStr = localStorage.getItem("dummyUser")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        console.warn("[Rhiley] Already logged in — redirecting to chat")
        window.location.href = `http://localhost:3003?userEmail=${encodeURIComponent(user.email)}`
      } catch (e) {
        window.location.href = "http://localhost:3003"
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password) {
      alert("Please fill in both fields")
      return
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    // Simulate loading
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Store dummy user data
    localStorage.setItem(
      "dummyUser",
      JSON.stringify({
        email,
        loginTime: new Date().toISOString(),
      }),
    )

    // Pass the email in the query string so the chat app (on port 3003) can set its own localStorage
    window.location.href = `http://localhost:3003?userEmail=${encodeURIComponent(email)}`
  }

  return (
    <div className="w-full flex flex-col items-center">
      <>
        <h1 className="text-3xl text-center font-mono font-black text-gray-500 mt-20 mb-6">Sign In</h1>
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.1,
          }}
          className="w-full max-w-md mx-auto bg-[#f0f3fa] rounded-3xl p-8 shadow-[20px_20px_40px_#d1d9e6,-20px_-20px_40px_#ffffff] mt-4"
        >
          <div className="flex flex-col items-center">
            <AvatarPlaceholder />

            <form onSubmit={handleSubmit} className="w-full">
              <InputField type="email" placeholder="Email" value={email} onChange={setEmail} />

              <InputField
                type="password"
                placeholder="Password"
                value={password}
                onChange={setPassword}
                showPasswordToggle={true}
              />

              <LoginButton isLoading={isLoading} />
            </form>

            <FooterLinks />
          </div>
        </motion.div>
      </>
    </div>
  )
}

export default LoginCard
