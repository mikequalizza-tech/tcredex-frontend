// postcss.config.js
module.exports = {
  plugins: {
    // force require from CJS entrypoint to bypass ESM export issue
    'postcss-import': {},
    'tailwindcss': { config: './tailwind.config.ts' },
    'autoprefixer': {},
  }
}


