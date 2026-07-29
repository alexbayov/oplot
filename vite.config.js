import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 5000, // 5MB warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
        }
      }
    }
  }
})
