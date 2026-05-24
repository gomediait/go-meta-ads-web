/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Keep @payos/node as a native require() to avoid CJS/ESM bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)), { '@payos/node': 'commonjs @payos/node' }]
    }
    return config
  },
}
module.exports = nextConfig
