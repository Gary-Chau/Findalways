import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [vue()],
    base: isProduction ? '/Findalways/' : '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    define: {
      // Ensure environment variables are properly defined
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    optimizeDeps: {
      include: [
        '@vueuse/core',
        '@floating-ui/vue',
        'remeda',
        'animejs',
        'nanoid'
      ]
    },
    css: {
      preprocessorOptions: {
        sass: {
          additionalData: '@use "sass:math"\n'
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    server: {
      fs: {
        strict: false
      }
    }
  }
}) 