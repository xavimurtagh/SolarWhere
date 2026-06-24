import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Heavy feature routes (charts, map) are lazy-loaded via React.lazy, so
    // Rollup automatically code-splits them into on-demand chunks.
    chunkSizeWarningLimit: 800,
  },
})
