// ESLint flat config - minimal to prevent build blocking
// TypeScript type checking is handled by tsc, not ESLint
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
