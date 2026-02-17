import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Code-split for better Core Web Vitals
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'quiz-data': ['./src/data/questions.js', './src/data/dmv-states.js'],
        },
      },
    },
  },
})
