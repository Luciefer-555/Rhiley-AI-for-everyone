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
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
}

export default nextConfig
