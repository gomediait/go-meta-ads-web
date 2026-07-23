// CSP nới lỏng script-src/style-src bằng 'unsafe-inline' vì:
// - pages/_app.jsx tự inject <script> GTM/FB Pixel/TikTok Pixel bằng document.createElement (inline, không có src cố định)
// - styled-jsx (toàn bộ pages/admin/*, pages/dashboard/*) render <style> inline theo từng component
// Đây là đánh đổi có chủ đích: CSP vẫn chặn được script/style load từ domain lạ, chặn iframe nhúng ngoài ý muốn,
// nhưng không chặn triệt để XSS dạng inject inline-script. Muốn siết chặt hơn cần refactor sang CSP nonce (việc lớn hơn).
// 'unsafe-eval' chỉ cần ở dev (React Fast Refresh/webpack HMR dùng eval() để patch module runtime) —
// production build không cần eval nên không nới lỏng CSP ở đó.
const { checkEnv } = require('./lib/envCheck')

// Chỉ enforce trên Vercel (production/preview) — không chặn `next dev`/build local
// khi lập trình viên chưa set đủ secret cho tính năng họ chưa đụng tới.
if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
  checkEnv()
}

const isDev = process.env.NODE_ENV !== 'production'

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://connect.facebook.net https://analytics.tiktok.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // ảnh đến từ nhiều domain động (Facebook CDN scontent-*, upanhnhanh.com...) nên để https: chung thay vì liệt kê từng domain
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.shopaikey.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://analytics.tiktok.com",
  "frame-src https://www.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async headers() {
    return [
      { source: '/(.*)', headers: SECURITY_HEADERS },
    ]
  },
  // Keep @payos/node as a native require() to avoid CJS/ESM bundling issues
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)), { '@payos/node': 'commonjs @payos/node' }]
    }
    return config
  },
}
module.exports = nextConfig
