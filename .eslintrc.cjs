module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    // React 17+ JSX transform — no need for `import React`
    'react/react-in-jsx-scope': 'off',
    // PropTypes not used (TypeScript-style or no prop validation)
    'react/prop-types': 'off',
    // Allow unused vars prefixed with _
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Allow empty catch blocks (common pattern in this codebase)
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Warn on console.log in production code (allow warn/error/info)
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'backend/',
    'public/sw.js',
    '*.config.js',
    '*.config.cjs',
  ],
};
