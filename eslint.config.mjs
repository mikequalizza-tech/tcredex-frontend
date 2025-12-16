import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    plugins: {
      unicorn,
    },
    rules: {
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            pascalCase: true,
          },
        },
      ],
    },
  },
];
