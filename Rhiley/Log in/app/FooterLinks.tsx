"use client"

import type React from "react"
const FooterLinks: React.FC = () => {
  const handleForgotPassword = () => {
    console.log("Forgot password clicked")
  }
  const handleSignUp = () => {
    console.log("Sign up clicked")
  }
  return (
    <div className="flex justify-between items-center text-sm w-full">
      <button
        onClick={handleForgotPassword}
        className="text-gray-500 hover:text-[#ff1493] hover:underline transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff1493] focus:ring-opacity-50 rounded px-1 py-1"
        aria-label="Reset your password"
      >
        Forgot password?
      </button>
      <button
        onClick={handleSignUp}
        className="text-gray-500 hover:text-[#ff1493] hover:underline transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff1493] focus:ring-opacity-50 rounded px-1 py-1"
        aria-label="Create a new account"
      >
        Sign up
      </button>
    </div>
  )
}
export default FooterLinks
