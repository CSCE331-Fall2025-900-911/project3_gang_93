import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensure public folder is properly copied during build
  publicDir: 'public',
  build: {
    // Ensure static assets are properly handled
    assetsDir: 'assets',
    // Copy public folder contents to dist
    copyPublicDir: true,
  },
  // Vite automatically handles SPA routing in dev mode
  // For production, the Express server (server.js) handles routing
})
