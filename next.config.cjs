/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  // 启用严格模式
  reactStrictMode: true,
  // 启用 SWC 压缩
  swcMinify: true,
  // 输出配置 - 支持 Docker 部署
  output: 'standalone',
  // 环境变量配置
  env: {
    AI_PROVIDER: process.env.AI_PROVIDER,
  },
  // 压缩配置
  compress: true,
  // 优化配置
  optimizeFonts: true,
  // 性能优化
  poweredByHeader: false,
}

module.exports = nextConfig; 