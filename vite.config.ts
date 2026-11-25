import { createHash } from 'node:crypto'
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const { version } = JSON.parse(
  readFileSync(
    new URL('./package.json', import.meta.url),
    'utf-8',
  ),
) as { version: string }

/*
 * Completa public/sw.js con la lista de
 * archivos de esta versión, para que la app
 * quede guardada en el celu y abra sin señal.
 */
function serviceWorkerPrecache(): Plugin {
  let outDir = 'dist'
  let files: string[] = []

  return {
    name: 'racha-sw-precache',
    apply: 'build',

    configResolved(config) {
      outDir = resolve(
        config.root,
        config.build.outDir,
      )
    },

    generateBundle(_options, bundle) {
      files = Object.keys(bundle)
        .filter(
          (file) =>
            file.startsWith('assets/') &&
            !file.endsWith('.map'),
        )
        .map((file) => `/${file}`)
        .sort()
    },

    closeBundle() {
      const swPath = resolve(outDir, 'sw.js')

      if (!existsSync(swPath)) {
        return
      }

      const buildId = createHash('sha256')
        .update(files.join('|'))
        .digest('hex')
        .slice(0, 12)

      const source = readFileSync(
        swPath,
        'utf-8',
      )

      writeFileSync(
        swPath,
        source
          .replace(
            "'__BUILD_ID__'",
            JSON.stringify(buildId),
          )
          .replace(
            '/*__PRECACHE__*/ []',
            JSON.stringify(files),
          ),
      )
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    serviceWorkerPrecache(),
  ],

  /*
   * __APP_VERSION__ = "version" de package.json.
   * Se muestra en Perfil y se manda a Sentry.
   */
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
})