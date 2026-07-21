import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 멀티페이지: 기존 일기 앱(index.html) + 사주 앱(saju.html)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        saju: resolve(__dirname, 'saju.html'),
      },
    },
  },
})
