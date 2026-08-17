"use client"
import { Button } from "@/components/ui/button"

export function FloatingNavbar() {
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" })
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 py-4">
      <div className="mx-auto max-w-7xl rounded-2xl border-2 border-white/10 bg-white/5 px-6 py-0 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => scrollToSection("home")} className="cursor-pointer">
            <div className="flex items-center text-white [text-shadow:_0_2px_8px(rgb(0_0_0_/_40%)]">
              <img
                src="/logo.png"
                alt="Rhiley"
                className="h-18 w-auto"
                style={{ filter: 'brightness(10)' }}
              />
            </div>
          </button>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-open-sans-custom text-gray-300 transition-colors hover:text-white [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)]"
            >
              Contact
            </button>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white border border-white/20 hover:bg-white/10"
              onClick={() => { window.location.href = "http://localhost:3001" }} // ✅ CHANGED from 3000 → 3001
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="bg-white text-black hover:bg-gray-100 [text-shadow:_0_1px_2px_rgb(0_0_0_/_10%)] font-open-sans-custom"
              onClick={() => window.location.href = 'http://localhost:3001'}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
