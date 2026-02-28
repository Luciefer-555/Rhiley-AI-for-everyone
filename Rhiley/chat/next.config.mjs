/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    removeConsole: false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react', '@radix-ui'],
    serverMinification: true,
  },
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  reactStrictMode: false,
}

export default nextConfig
