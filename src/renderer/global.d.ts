import type { ProjectConfig } from '../shared/types'

declare global {
  interface Window {
    electronAPI: {
      // 项目管理
      getProjects: () => Promise<ProjectConfig[]>
      addProject: (project: Omit<ProjectConfig, 'id' | 'status'>) => Promise<ProjectConfig>
      updateProject: (id: string, updates: Partial<ProjectConfig>) => Promise<{ success: boolean }>
      deleteProject: (id: string) => Promise<{ success: boolean }>

      // 文件选择
      selectDirectory: () => Promise<string | null>

      // 项目检测
      detectProject: (projectPath: string) => Promise<{
        language: string
        startCommand: string
        ideCommand: string
        description?: string
      }>
      extractProjectName: (projectPath: string) => Promise<string>

      // README 读取
      readReadme: (projectPath: string) => Promise<{
        success: boolean
        content: string
        fileName?: string
      }>

      // 导入/导出
      exportProjects: () => Promise<{
        success: boolean
        canceled?: boolean
        path?: string
        error?: string
      }>
      importProjects: () => Promise<{
        success: boolean
        canceled?: boolean
        imported?: number
        errors?: string
      }>

      // 目录扫描
      selectScanDirectory: () => Promise<string | null>
      scanDirectory: (dirPath: string, maxDepth?: number) => Promise<
        Array<{
          name: string
          path: string
          type: string
        }>
      >
      batchAddProjects: (
        projects: Array<{ name: string; path: string; type: string }>
      ) => Promise<{
        success: boolean
        added: number
        skipped: number
        failed: number
      }>

      // 命令执行
      startProject: (id: string) => void
      stopProject: (id: string) => void
      startProfile: (project: ProjectConfig, profileId: string) => void
      openIde: (project: ProjectConfig) => void
      openFolder: (project: ProjectConfig) => void
      openTerminal: (project: ProjectConfig) => void

      // 自定义命令
      runCustomCommand: (project: ProjectConfig, commandName: string) => void

      // 事件监听
      onCommandOutput: (
        callback: (data: { projectId: string; profileId?: string; data: string }) => void
      ) => (() => void) | undefined
      onProjectStatusUpdated: (
        callback: (projectId: string, status: 'running' | 'stopped', profileId?: string) => void
      ) => (() => void) | undefined

      // 向运行中的进程发送输入
      sendCommandInput: (projectId: string, input: string) => void
    }
  }
}

export {}
