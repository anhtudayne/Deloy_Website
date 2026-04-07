import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // ─────────────────────────────────────────────
    // Manual Chunk Splitting
    // Tách vendor libraries thành chunks riêng biệt:
    // → Trình duyệt cache hiệu quả (vendor ít thay đổi)
    // → Lazy load các lib nặng (recharts, framer-motion)
    // ─────────────────────────────────────────────
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — luôn cần, cache lâu dài
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Recharts — rất nặng (~800KB), chỉ cần ở Dashboard
          'vendor-recharts': ['recharts'],
          // Framer Motion — ~200KB, chỉ cần ở pages có animation
          'vendor-framer': ['framer-motion'],
          // Icons — lucide-react tree-shakes tốt nhưng vẫn nên tách
          'vendor-ui': ['lucide-react'],
          // State & Utils  
          'vendor-utils': ['zustand', 'axios', 'zod', 'react-hook-form'],
        },
      },
    },
    // Giảm threshold cảnh báo kích thước chunk
    chunkSizeWarningLimit: 500,
  },
})
