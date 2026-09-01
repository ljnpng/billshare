import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_LOCALE: process.env.NEXT_LOCALE || 'zh',
  },
  compress: true,
  optimizeFonts: true,
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      {
        module: /libheif-js\/libheif-wasm\/libheif-bundle\.js/,
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ];

    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'heic-convert': 'heic-convert',
        'libheif-js': 'libheif-js',
      });
    }

    return config;
  },
};

export default withNextIntl(nextConfig);
