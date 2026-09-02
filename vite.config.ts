import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

function localServiceWorkerCleanup(): Plugin {
  return {
    name: 'local-service-worker-cleanup',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/sw.js', (request, response, next) => {
        if (request.method !== 'GET') {
          next()
          return
        }

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store, max-age=0')
        response.end(`
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    await self.clients.claim()
    await self.registration.unregister()
    const clients = await self.clients.matchAll({ type: 'window' })
    await Promise.all(clients.map((client) => client.navigate(client.url)))
  })())
})
`)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    localServiceWorkerCleanup(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{css,html,js}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 10,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365,
                maxEntries: 20,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [
            {
              name: 'language-catalog',
              test: /[\\/]src[\\/]lib[\\/]language\.tsx(?:\?|$)/,
              includeDependenciesRecursively: false,
              priority: 60,
            },
            {
              name: 'vendor-supabase',
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              includeDependenciesRecursively: false,
              priority: 50,
            },
            {
              name: 'vendor-react',
              test: (id) => id.includes('node_modules') && (
                /[\\/]node_modules[\\/](?:react|react-dom|react-hook-form|react-router)[\\/]/.test(id)
                || /[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)
              ),
              includeDependenciesRecursively: false,
              priority: 40,
            },
            {
              name: 'vendor-ui',
              test: (id) => id.includes('node_modules') && (id.includes('lucide-react') || id.includes('@radix-ui')),
              includeDependenciesRecursively: false,
              priority: 30,
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              includeDependenciesRecursively: false,
              priority: 20,
            },
            {
              name: (id) => {
                const feature = id.match(/[\\/]src[\\/]features[\\/]([^\\/]+)/)
                return feature ? `feature-${feature[1]}` : null
              },
              test: /[\\/]src[\\/]features[\\/]/,
              includeDependenciesRecursively: true,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
