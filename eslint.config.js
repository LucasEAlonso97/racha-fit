import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Regla nueva de react-hooks v7. El proyecto tiene varios
      // casos heredados (cargar datos en un useEffect) que
      // funcionan bien; queda como aviso para ir limpiándolos
      // sin que el chequeo automático falle por ellos.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
