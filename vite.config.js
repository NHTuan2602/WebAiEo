import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { lexiprepSyncPlugin } from './syncPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), lexiprepSyncPlugin()],
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
})
