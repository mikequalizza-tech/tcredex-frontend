/** @type {import('next').NextConfig} */

// Optional bundle analyzer - only load if installed
let withBundleAnalyzer;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not installed, use identity function
  withBundleAnalyzer = (config) => config;
}

const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['mapbox-gl', 'react-map-gl', '@supabase/supabase-js'],
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize for production
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244KB chunks
            },
            mapbox: {
              test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl)[\\/]/,
              name: 'mapbox',
              chunks: 'all',
              priority: 10,
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    // Exclude heavy dependencies from server bundle
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('mapbox-gl');
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },

  // Compression
  compress: true,

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/tiles/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // Proxy API traffic to consolidated backend services
  async rewrites() {
    const backendBase =
      process.env.BACKEND_SERVICE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001';

    const backendUrl = backendBase.replace(/\/$/, '');
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    const isSelfTarget =
      backendUrl === 'http://localhost:3000' ||
      backendUrl === 'https://localhost:3000' ||
      (frontendUrl && backendUrl === frontendUrl);

    // Avoid self-proxying to prevent redirect loops when backend points to frontend host
    if (isSelfTarget) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
