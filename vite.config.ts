import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
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
