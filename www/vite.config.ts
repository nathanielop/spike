import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'endr'
  }
})