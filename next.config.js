/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bỏ output: 'export' — dùng Vercel SSR thay vì static export
  // Lý do: nhiều component dùng browser API (canvas, sessionStorage, IntersectionObserver)
  // Vercel hỗ trợ SSR natively, không cần static export
  images: { unoptimized: true },
}
module.exports = nextConfig
