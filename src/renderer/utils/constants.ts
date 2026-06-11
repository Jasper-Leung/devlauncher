// 快捷键配置
export const SHORTCUTS = {
  NEW_PROJECT: 'Ctrl+N',
  OPEN_IDE: 'Ctrl+O',
  TOGGLE_RUN: 'Ctrl+Space',
  DELETE: 'Delete',
  EDIT: 'Ctrl+E',
  EXPORT: 'Ctrl+D',
  IMPORT: 'Ctrl+I',
} as const

// 主题类型
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const

// 默认配置
export const DEFAULT_CONFIG = {
  IDE_COMMAND: 'code .',
  MAX_DEPTH: 3,
  TOAST_DURATION: 3000,
} as const

// 项目类型到启动配置的映射
export const PROJECT_TYPE_CONFIG: Record<
  string,
  {
    tags: string[]
    defaultCommand: string
    profileType: 'frontend' | 'backend' | 'docker'
  }
> = {
  'Node.js/JavaScript': {
    tags: ['JavaScript', 'Node.js'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  TypeScript: {
    tags: ['TypeScript', 'Node.js'],
    defaultCommand: 'npm run dev',
    profileType: 'frontend',
  },
  Python: {
    tags: ['Python'],
    defaultCommand: 'python main.py',
    profileType: 'backend',
  },
  Go: {
    tags: ['Go'],
    defaultCommand: 'go run .',
    profileType: 'backend',
  },
  Rust: {
    tags: ['Rust'],
    defaultCommand: 'cargo run',
    profileType: 'backend',
  },
  Java: {
    tags: ['Java'],
    defaultCommand: 'mvn spring-boot:run',
    profileType: 'backend',
  },
  'Dart/Flutter': {
    tags: ['Flutter', 'Dart'],
    defaultCommand: 'flutter run',
    profileType: 'frontend',
  },
}

/**
 * 日志相关常量
 */
export const LOG_LIMITS = {
  /** 单个项目日志最大长度 */
  MAX_LOG_LENGTH: 50000,
} as const

/**
 * 虚拟滚动相关常量
 */
export const VIRTUAL_SCROLL = {
  /** 列表视图下单个项目高度 */
  ITEM_HEIGHT_LIST: 80,
  /** 网格视图下单个项目高度 */
  ITEM_HEIGHT_GRID: 120,
  /** 额外渲染的项目数量（上下各几个） */
  OVERSCAN: 5,
  /** 启用虚拟滚动的项目数量阈值 */
  THRESHOLD: 20,
} as const

/**
 * ScrollableText 动画相关常量
 */
export const SCROLLABLE_TEXT = {
  /** 滚动动画持续时间（毫秒） */
  ANIMATION_DURATION: 2000,
  /** 暂停持续时间（毫秒） */
  PAUSE_DURATION: 1000,
  /** 完整动画周期（毫秒） */
  TOTAL_DURATION: 4000,
} as const

/**
 * 项目列表相关常量
 */
export const PROJECT_LIST = {
  /** 网格视图每行列数 */
  GRID_COLUMNS: 2,
  /** 项目卡片间距 */
  GRID_GAP: 8,
  /** 项目卡片内边距 */
  CARD_PADDING: 12,
} as const

/**
 * 侧边栏相关常量
 */
export const SIDEBAR = {
  /** 侧边栏宽度 */
  WIDTH: 700,
} as const

/**
 * 按钮相关常量
 */
export const BUTTONS = {
  /** 顶部按钮区域网格列数 */
  GRID_COLUMNS: 2,
  /** 按钮间距 */
  GAP: 8,
} as const
