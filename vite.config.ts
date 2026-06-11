import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    // 代码分割优化：配置分包策略
    rollupOptions: {
      output: {
        // 手动分包：将不同类型的代码分离到不同的chunk
        manualChunks: (id) => {
          // vendor chunks - 第三方库
          if (id.includes('node_modules')) {
            // React 相关（包括 react 和 react-dom）
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor'
            }
            // i18next 国际化库
            if (id.includes('i18next')) {
              return 'i18n'
            }
            // Markdown 相关
            if (id.includes('remark') || id.includes('rehype') || id.includes('unist') || id.includes('markdown') || id.includes('hast') || id.includes('mdast') || id.includes('micromark')) {
              return 'markdown'
            }
            // 其他第三方库
            return 'vendor'
          }

          // 应用代码分割
          // 组件按功能分组
          if (id.includes('/components/')) {
            // 项目管理相关组件
            if (id.includes('Project') || id.includes('Batch')) {
              return 'project-components'
            }
            // 模态框组件
            if (id.includes('Modal')) {
              return 'modal-components'
            }
            return 'components'
          }

          // 工具函数和Hooks
          if (id.includes('/hooks/') || id.includes('/utils/')) {
            return 'utils'
          }

          // Store
          if (id.includes('/stores/')) {
            return 'stores'
          }

          // i18n 配置
          if (id.includes('/i18n/')) {
            return 'i18n-config'
          }
        },
      },
    },
    // 启用源码映射便于调试
    sourcemap: true,
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    strictPort: true, // 强制使用指定端口，如果端口被占用则报错
  },
  optimizeDeps: {
    // 预构建优化
    include: ['react', 'react-dom', 'react-markdown'],
  },
})
