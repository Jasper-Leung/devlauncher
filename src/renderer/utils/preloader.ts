/**
 * 预加载工具
 * P3 优化：在空闲时预加载可能会用到的组件，提升用户体验
 */

/**
 * 预加载队列管理器
 */
class PreloadManager {
  private queue: Array<() => Promise<void>> = []
  private isPreloading = false

  /**
   * 添加预加载任务
   */
  add(preloadFn: () => Promise<void>): void {
    this.queue.push(preloadFn)
    this.processQueue()
  }

  /**
   * 处理预加载队列
   */
  private async processQueue(): Promise<void> {
    if (this.isPreloading || this.queue.length === 0) {
      return
    }

    this.isPreloading = true

    while (this.queue.length > 0) {
      const preloadFn = this.queue.shift()
      if (preloadFn) {
        try {
          await preloadFn()
        } catch (error) {
          console.warn('预加载失败:', error)
        }
      }

      // 每次预加载后让出控制权，避免阻塞UI
      await new Promise((resolve) => setTimeout(resolve, 0))
    }

    this.isPreloading = false
  }

  /**
   * 预加载所有组件
   */
  preloadAll(preloadFns: Array<() => Promise<void>>): void {
    preloadFns.forEach((fn) => this.add(fn))
  }

  /**
   * 获取队列长度
   */
  get queueLength(): number {
    return this.queue.length
  }
}

/**
 * 全局预加载管理器实例
 */
export const preloadManager = new PreloadManager()

/**
 * 预加载函数集合
 */
export const preloadFunctions = {
  /**
   * 预加载添加项目模态框
   */
  preloadAddProjectModal: () =>
    import('../components/AddProjectModal').catch(() => {
      // 忽略加载错误
    }),

  /**
   * 预加载批量导入模态框
   */
  preloadBatchImportModal: () =>
    import('../components/BatchImportModal').catch(() => {
      // 忽略加载错误
    }),

  /**
   * 预加载日志查看器
   */
  preloadLogViewer: () =>
    import('../components/LogViewer').catch(() => {
      // 忽略加载错误
    }),

  /**
   * 预加载启动配置组件
   */
  preloadStartupProfiles: () =>
    import('../components/StartupProfiles').catch(() => {
      // 忽略加载错误
    }),
}

/**
 * 初始化预加载
 * 在应用启动后空闲时预加载常用组件
 */
export function initPreload(): void {
  // 使用 requestIdleCallback 在浏览器空闲时预加载
  if ('requestIdleCallback' in window) {
    const preloadTasks = Object.values(preloadFunctions)

    const preloadInIdle = (deadline: IdleDeadline) => {
      while (deadline.timeRemaining() > 0 && preloadTasks.length > 0) {
        const task = preloadTasks.shift()
        if (task) {
          task().catch(() => {
            // 忽略预加载错误
          })
        }
      }

      if (preloadTasks.length > 0) {
        requestIdleCallback(preloadInIdle)
      }
    }

    requestIdleCallback(preloadInIdle)
  } else {
    // 降级方案：使用延迟预加载
    setTimeout(() => {
      preloadTasks.forEach((task) =>
        task().catch(() => {
          // 忽略预加载错误
        })
      )
    }, 2000)
  }
}

/**
 * 预加载指定组件
 * 用于在用户即将使用某个功能前提前加载相关组件
 */
export function preloadComponent(componentName: string): void {
  const preloadFn = (preloadFunctions as Record<string, () => Promise<unknown>>)[
    `preload${componentName}`
  ]

  if (preloadFn) {
    preloadManager.add(preloadFn)
  }
}
