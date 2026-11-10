/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Las pestañas ya abiertas o precargadas se reutilizan 30 s sin volver al servidor.
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default nextConfig
