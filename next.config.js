const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // IMPORTANT: Disable Turbopack - causes issues with Mapbox workers
  experimental: {
    turbo: false,
  },

  // Webpack config for Mapbox compatibility
  webpack: (config) => {
    // Prevent Mapbox from being bundled server-side
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    return config;
  },
};

module.exports = withMDX(nextConfig);
