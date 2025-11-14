import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig(({ command }) => {
  const isServe = command === 'serve'

  // Preload dosyasını kopyala (hem dev hem build için)
  const copyPreload = () => {
    const preloadSrc = resolve(__dirname, 'electron/preload.cjs')
    const preloadDest = resolve(__dirname, 'dist-electron/preload.cjs')
    if (existsSync(preloadSrc)) {
      // dist-electron klasörünü oluştur
      const distElectronDir = resolve(__dirname, 'dist-electron')
      if (!existsSync(distElectronDir)) {
        mkdirSync(distElectronDir, { recursive: true })
      }
      copyFileSync(preloadSrc, preloadDest)
      console.log('✅ Preload.cjs kopyalandı')
    } else {
      console.warn('⚠️ Preload.cjs kaynak dosyası bulunamadı:', preloadSrc)
    }
  }

  return {
    base: './',  // Production için relative path
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
          onstart(options) {
            // Her başlatmada preload'ı kopyala
            copyPreload()
            
            // Icon dosyalarını dist-electron/build klasörüne kopyala
            const buildDir = resolve(__dirname, 'dist-electron/build')
            if (!existsSync(buildDir)) {
              mkdirSync(buildDir, { recursive: true })
            }
            
            // Platform'a göre icon dosyalarını kopyala
            const iconFiles = ['icon.icns', 'icon.ico', 'icon.png']
            iconFiles.forEach(iconFile => {
              const iconSrc = resolve(__dirname, 'build', iconFile)
              const iconDest = resolve(buildDir, iconFile)
              if (existsSync(iconSrc)) {
                copyFileSync(iconSrc, iconDest)
                console.log(`✅ ${iconFile} kopyalandı`)
              }
            })
            
            options.startup()
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron', 'sql.js', 'puppeteer', 'puppeteer-core'],
                output: {
                  format: 'es'
                },
                plugins: [
                  {
                    name: 'copy-preload',
                    writeBundle() {
                      copyPreload()
                    }
                  }
                ]
              }
            }
          }
        }
      ]),
      renderer()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@electron': resolve(__dirname, './electron')
      }
    },
    server: {
      port: 5173
    }
  }
})

