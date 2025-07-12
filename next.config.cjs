const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

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
  // 环境变量配置
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // 压缩配置
  compress: true,
  // 优化配置
  optimizeFonts: true,
  // 性能优化
  poweredByHeader: false,
}

module.exports = withNextIntl(nextConfig); 