"use client"

import DotPattern from "@/components/ui/dot-pattern"

export function AboutQuote() {
  return (
    <div className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
      <div className="relative flex flex-col items-center border-2 border-white/20 rounded-lg backdrop-blur-sm bg-white/5">
        <DotPattern width={5} height={5} />

        {/* Corner decorations */}
        <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-white/80" />
        <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-white/80" />

        <div className="relative z-20 mx-auto max-w-4xl rounded-[40px] py-6 md:p-10 xl:py-16 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] mb-4 md:mb-6 font-open-sans-custom">
            Vision of Rhiley
          </h1>
          <div className="space-y-4 md:space-y-6">
            <p className="text-sm md:text-lg lg:text-xl xl:text-2xl text-white/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom leading-relaxed">
              A world where anyone can bring their ideas to life through beautiful, intelligent design - where creativity is limitless and technical barriers don't exist.
            </p>
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] mb-4 md:mb-6 font-open-sans-custom mt-8">
              Mission of Rhiley
            </h1>
            <p className="text-sm md:text-lg lg:text-xl xl:text-2xl text-white/90 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom leading-relaxed">
              To build AI that understands design at a human level, transforming concepts into production-ready interfaces with the craft and precision of world-class designers and developers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}