/*
 * 项目配置数据模型定义
 * 包含项目的基本信息、启动配置、IDE配置和自定义命令
 */

/**
 * 启动配置类型
 * - internal: 在应用内的伪终端中运行（默认）
 * - external: 在系统终端中运行，支持完全交互
 * - frontend/backend: 保留的旧类型，兼容性使用
 * - docker: Docker 容器类型
 */
export type StartupType = 'internal' | 'external' | 'frontend' | 'backend' | 'docker'

/**
 * 单个启动配置
 */
export interface StartupProfile {
  /** 配置ID */
  id: string
  /** 配置名称 */
  name: string
  /** 配置类型 */
  type: StartupType
  /** 启动命令 */
  command: string
  /** 工作目录（相对于项目根目录） */
  cwd?: string
  /** Docker容器名称（当type为docker时使用） */
  dockerContainer?: string
  /** 环境变量 */
  env?: Record<string, string>
  /** 是否为此配置的默认启动 */
  isDefault?: boolean
}

/**
 * 项目配置接口
 * 定义DevLauncher中每个项目的结构
 */
export interface ProjectConfig {
  /** 唯一标识符，使用UUID生成 */
  id: string

  /** 项目显示名称 */
  name: string

  /** 项目在本地的绝对路径 */
  path: string

  /** 项目分组（可选） */
  group?: string

  /**
   * @deprecated 使用 startupProfiles 替代
   * 主要启动命令（如：npm run dev）
   */
  startCommand?: string

  /**
   * 启动配置列表
   * 支持多个启动配置（前端、后端、Docker等）
   */
  startupProfiles?: StartupProfile[]

  /** IDE打开命令（如：code .） */
  ideCommand?: string

  /** 自定义命令集合 */
  customCommands?: Array<{
    /** 命令显示名称 */
    name: string
    /** 实际执行的命令 */
    command: string
    /** 命令类型标识（可选） */
    type?: 'claude' | 'build' | 'test'
  }>

  /** 当前运行状态 */
  status: 'running' | 'stopped'

  /** 最后一次启动时间戳 */
  lastLaunched?: number

  /** 项目描述信息 */
  description?: string

  /** 项目标签（用于分类） */
  tags?: string[]

  /**
   * 当前活动的启动配置ID
   * 用于跟踪哪个配置正在运行
   */
  activeProfileId?: string
}
