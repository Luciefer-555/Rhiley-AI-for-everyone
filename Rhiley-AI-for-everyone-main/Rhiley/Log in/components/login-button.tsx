"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface LoginButtonProps {
  onClick: () => void
  isLoading?: boolean
}

const LoginButton: React.FC<LoginButtonProps> = ({ onClick, isLoading = false }) => {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileHover={!isLoading ? { scale: 1.02 } : {}}
      whileTap={!isLoading ? { scale: 0.98 } : {}}
      className={`w-full py-4 bg-[#f0f3fa] rounded-2xl text-lg mb-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200 font-mono font-normal flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
      style={{
        color: "#ff1493",
      }}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {isLoading ? "Signing In..." : "Login"}
    </motion.button>
  )
}

export default LoginButton
