import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// Web 端用绝对路径 '/',保证子路径(如 /oauth/callback)下也能正确加载资源。
// Electron / Capacitor 用 'vite build --mode electron' 构建,采用相对路径 './' 兼容 file:// 协议。
export default defineConfig(({ mode }) => ({
  base: mode === 'electron' ? './' : '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5059',
        changeOrigin: true,
      },
    },
  },
}))
