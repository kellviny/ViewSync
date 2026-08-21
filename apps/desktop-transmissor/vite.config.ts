import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['mediasoup', 'electron', 'express', 'socket.io', 'bufferutil', 'utf-8-validate'],
              output: {
                format: 'cjs', 
                entryFileNames: '[name].js',
              }
            }
          }
        }
      },
      {
        entry: 'electron/server.ts',
        vite: {
          build: {
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['mediasoup', 'electron', 'express', 'socket.io', 'bufferutil', 'utf-8-validate'],
              output: {
                format: 'cjs', 
                entryFileNames: '[name].js',
              }
            }
          }
        }
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            minify: false,
            outDir: 'dist-electron',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].js', 
              }
            }
          }
        }
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['lucide-react']
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ['**/release/**', '**/dist-electron/**'],
    },
  },
})