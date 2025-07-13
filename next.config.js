const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    NEXT_LOCALE: process.env.NEXT_LOCALE || 'zh',
  },
  // 压缩配置
  compress: true,
  // 优化配置
  optimizeFonts: true,
  // 性能优化
  poweredByHeader: false,
  // Webpack configuration to handle HEIC dependencies
  webpack: (config, { dev, isServer }) => {
    // Ignore warnings from libheif-js WASM bundle
    config.ignoreWarnings = [
      {
        module: /libheif-js\/libheif-wasm\/libheif-bundle\.js/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ];

    // Configure externals for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'heic-convert': 'heic-convert',
        'libheif-js': 'libheif-js',
      });
    }

    return config;
  },
}

module.exports = withNextIntl(nextConfig); 