import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "yuv-buffer",
      "yuv-canvas",
    ],
    needsInterop: [
      "yuv-buffer",
      "yuv-canvas",
    ],
    exclude: [
      "@yume-chan/scrcpy-decoder-tinyh264",
      "@yume-chan/scrcpy-decoder-webcodecs",
    ],
  },
  server: {
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '.cert/localhost.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '.cert/localhost.crt')),
    },
  },
})
