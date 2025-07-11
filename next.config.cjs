/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // 启用严格模式
  reactStrictMode: true,
  // 启用 SWC 压缩
  swcMinify: true,
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 输出配置 - 支持 Docker 部署
  output: 'standalone',
  // 压缩配置
  compress: true,
  // 优化配置
  optimizeFonts: true,
  // 性能优化
  poweredByHeader: false,
}

module.exports = nextConfig 