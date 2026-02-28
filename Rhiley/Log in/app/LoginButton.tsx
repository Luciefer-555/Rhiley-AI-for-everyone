"use client"

import type React from "react"
import { motion } from "framer-motion"
interface LoginButtonProps {
  onClick: () => void
}
const LoginButton: React.FC<LoginButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      type="submit"
      onClick={onClick}
      whileHover={{
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className="w-full py-4 bg-[#f0f3fa] rounded-2xl font-semibold text-lg mb-6 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] transition-all duration-200"
      aria-label="Login to your account"
      style={{ color: "#ff1493" }}
    >
      Login
    </motion.button>
  )
}
export default LoginButton
