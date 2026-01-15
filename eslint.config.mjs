// Minimal ESLint config to allow builds to proceed
// Using flat config format for ESLint 9
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
];
