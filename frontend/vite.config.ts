import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Cambiar a 'prompt' para permitir al usuario elegir cuándo actualizar
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Collector Enterprise - Amaranto',
        short_name: 'Collector',
        description: 'Sistema de gestión y formularios dinámicos para Amaranto Constructora',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // Pre-caching: Shell de la app y assets críticos
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          'index.html',
          'manifest.webmanifest',
        ],
        // Estrategias de runtime caching
        runtimeCaching: [
          // 1. Network First para API calls (con timeout de 5s)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 2. Cache First para assets estáticos
          {
            urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
              },
            },
          },
          // 3. Stale While Revalidate para datos frecuentes (dashboard)
          {
            urlPattern: /^https?:\/\/.*\/api\/(dashboard|stats|forms)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dashboard-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 5 * 60, // 5 minutos
              },
            },
          },
          // 4. Network Only para operaciones críticas (login, logout)
          {
            urlPattern: /^https?:\/\/.*\/api\/(auth|login|logout)/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'auth-cache',
            },
          },
          // Fonts con cache largo
          {
            urlPattern: /\.(?:woff2?|ttf|eot|otf)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
              },
            },
          },
        ],
        // Background sync
        skipWaiting: false,
        clientsClaim: false,
        // Offline page
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/admin/],
      },
      // Configuración de actualización
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})