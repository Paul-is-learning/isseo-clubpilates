import js from '@eslint/js';
import globals from 'globals';

// Phase 1 — config permissive. On durcira au fil des phases.
export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'supabase/**', 'migrations/**', 'photos/**', 'video/**', 'icons/**', 'plans/**']
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        // Libs chargées via CDN
        supabase: 'readonly',
        L: 'readonly',
        // State global de l'app
        S: 'writable',
        sb: 'readonly'
      }
    },
    rules: {
      // On accepte beaucoup au départ, on resserra progressivement
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-empty': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
      'no-cond-assign': 'off',
      'no-inner-declarations': 'off',
      'no-irregular-whitespace': 'off'
    }
  }
];
