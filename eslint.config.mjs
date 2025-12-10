import nextConfig from 'eslint-config-next';

export default [
  {
    ignores: ['**/.next/**', '**/node_modules/**'],
  },
  ...nextConfig,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
];
