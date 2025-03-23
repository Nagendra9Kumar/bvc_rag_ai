/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.clerk.dev'],
  },
  experimental: {
    serverActions: true,
  },
  output: 'standalone',
}

export default nextConfig

