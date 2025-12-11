const withMDX = require("@next/mdx")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Skip ESLint during builds (install eslint separately if you want linting)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withMDX(nextConfig);
