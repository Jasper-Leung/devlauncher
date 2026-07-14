import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintReact from '@eslint-react/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        process: 'readonly',
        app: 'readonly',
        BrowserWindow: 'readonly',
        ipcMain: 'readonly',
        dialog: 'readonly',
        shell: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        module: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@eslint-react': eslintReact,
    },
    rules: {
      ...eslintReact.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/no-array-index-key': 'off',
      '@eslint-react/use-state': 'off',
      '@eslint-react/naming-convention-ref-name': 'off',
      '@eslint-react/no-useless-assignment': 'off',
      '@eslint-react/preserve-caught-error': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-useless-assignment': 'off',
      '@typescript-eslint/preserve-caught-error': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
      'no-undef': 'off',
      'no-prototype-builtins': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'src/test/**',
      'src/shared/types.js',
      'src/main/preload.js',
    ],
  },
];
