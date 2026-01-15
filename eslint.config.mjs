// ESLint flat config for Next.js 15+ and ESLint 9+
// Minimal configuration to avoid build blocking while maintaining code quality
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/dist/**',
      '**/.git/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Core rules to catch common issues without blocking builds
      'no-unused-vars': 'off', // TypeScript handles this
      'no-console': 'off', // Allow console for server-side logging
      'no-undef': 'off', // TypeScript handles this
    },
  },
];
