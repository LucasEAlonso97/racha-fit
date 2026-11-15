import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const { version } = JSON.parse(
  readFileSync(
    new URL('./package.json', import.meta.url),
    'utf-8',
  ),
) as { version: string }

export default defineConfig({
  plugins: [react(), tailwindcss()],

  /*
   * __APP_VERSION__ = "version" de package.json.
   * Se muestra en Perfil y se manda a Sentry.
   */
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})