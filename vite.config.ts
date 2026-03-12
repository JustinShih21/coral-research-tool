import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // Ensure .env is loaded from project root (same dir as this config) regardless of cwd
  envDir: path.resolve(__dirname),
})
