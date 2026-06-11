import fs from 'fs'
import path from 'path'
import { SecurityValidator } from '../utils/SecurityValidator'
import { PathValidationError } from '../../shared/errorTypes'

/**
 * 扫描到的项目信息
 */
export interface ScannedProject {
  name: string
  path: string
  type: string
  depth: number
}

/**
 * 目录扫描结果
 */
export interface ScanResult {
  projects: ScannedProject[]
  scanned: number
  errors: string[]
}

/**
 * 目录扫描服务
 * 用于全盘扫描批量添加项目
 */
export class DirectoryScanService {
  /**
   * 项目特征文件映射
   * 用于识别不同类型的项目
   */
  private static readonly PROJECT_MARKERS = {
    'Node.js/JavaScript': ['package.json'],
    TypeScript: ['package.json', 'tsconfig.json'],
    Python: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
    Go: ['go.mod'],
    Rust: ['Cargo.toml'],
    Java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
    Ruby: ['Gemfile'],
    PHP: ['composer.json'],
    'Dart/Flutter': ['pubspec.yaml'],
    Elixir: ['mix.exs'],
    Crystal: ['shard.yml'],
    'C#': ['*.csproj', '*.sln'],
    'C++': ['CMakeLists.txt', 'Makefile'],
  }

  /**
   * 需要跳过的目录名称
   */
  private static readonly SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    '.bzr',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.vscode',
    '.idea',
    'vendor',
    '.venv',
    'venv',
    'env',
    '__pycache__',
    '.next',
    '.nuxt',
    'coverage',
    '.cache',
    'tmp',
    'temp',
  ])

  /**
   * 最大扫描深度（防止无限递归）
   */
  private static readonly MAX_DEPTH = 10

  /**
   * 检测目录是否是项目根目录
   * @param dirPath 目录路径
   * @returns 项目类型或 null
   */
  private static detectProjectType(dirPath: string): string | null {
    try {
      const files = fs.readdirSync(dirPath)

      for (const [type, markers] of Object.entries(this.PROJECT_MARKERS)) {
        for (const marker of markers) {
          // 支持通配符匹配
          if (marker.includes('*')) {
            const pattern = marker.replace('*', '.*')
            const regex = new RegExp(`^${pattern}$`)
            if (files.some((file) => regex.test(file))) {
              return type
            }
          } else {
            if (files.includes(marker)) {
              return type
            }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * 提取项目名称
   * @param projectPath 项目路径
   * @returns 项目名称
   */
  private static extractProjectName(projectPath: string): string {
    const dirName = path.basename(projectPath)

    // 尝试从 package.json 读取名称
    try {
      const packageJsonPath = path.join(projectPath, 'package.json')
      if (fs.existsSync(packageJsonPath)) {
        const content = fs.readFileSync(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(content)
        if (packageJson.name) {
          // 使用包名，但如果是 scoped 包，去掉 scope
          return packageJson.name.replace(/^@[^/]+\//, '')
        }
      }
    } catch {
      // 忽略错误，使用目录名
    }

    return dirName
  }

  /**
   * 递归扫描目录
   * @param dirPath 要扫描的目录路径
   * @param maxDepth 最大扫描深度
   * @param currentDepth 当前深度
   * @param projects 扫描到的项目列表
   * @param errors 错误信息列表
   * @param scanned 扫描的目录数量
   */
  private static scanDirectory(
    dirPath: string,
    maxDepth: number,
    currentDepth: number,
    projects: ScannedProject[],
    errors: string[],
    scanned: { count: number }
  ): void {
    // 超过最大深度
    if (currentDepth > maxDepth) {
      return
    }

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      scanned.count++

      // 检测当前目录是否是项目
      const projectType = this.detectProjectType(dirPath)
      if (projectType) {
        projects.push({
          name: this.extractProjectName(dirPath),
          path: dirPath,
          type: projectType,
          depth: currentDepth,
        })

        // 如果是项目根目录，不再深入扫描其子目录
        // 除非子目录本身也是一个独立项目
      }

      // 递归扫描子目录
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue
        }

        // 跳过特定目录
        if (this.SKIP_DIRS.has(entry.name)) {
          continue
        }

        const subDirPath = path.join(dirPath, entry.name)
        this.scanDirectory(subDirPath, maxDepth, currentDepth + 1, projects, errors, scanned)
      }
    } catch (error) {
      const errorMsg = `扫描目录失败: ${dirPath} - ${String(error)}`
      errors.push(errorMsg)
      console.error(errorMsg)
    }
  }

  /**
   * 扫描指定目录，查找所有项目
   * @param rootPath 要扫描的根目录路径
   * @param maxDepth 最大扫描深度（默认为 5）
   * @returns 扫描结果
   */
  static scan(rootPath: string, maxDepth: number = 5): ScanResult {
    const projects: ScannedProject[] = []
    const errors: string[] = []
    const scanned = { count: 0 }

    try {
      // 验证路径安全性（防止路径遍历攻击）
      const validatedPath = SecurityValidator.validatePath(rootPath)

      // 验证路径是否存在
      if (!fs.existsSync(validatedPath)) {
        return {
          projects: [],
          scanned: 0,
          errors: [`目录不存在: ${rootPath}`],
        }
      }

      // 验证是否是目录
      const stats = fs.statSync(validatedPath)
      if (!stats.isDirectory()) {
        return {
          projects: [],
          scanned: 0,
          errors: [`路径不是目录: ${rootPath}`],
        }
      }

      // 开始扫描
      this.scanDirectory(validatedPath, Math.min(maxDepth, this.MAX_DEPTH), 0, projects, errors, scanned)

      // 去重（相同路径的项目只保留一个）
      const uniqueProjects = Array.from(new Map(projects.map((p) => [p.path, p])).values())

      return {
        projects: uniqueProjects,
        scanned: scanned.count,
        errors,
      }
    } catch (error) {
      if (error instanceof PathValidationError) {
        return {
          projects: [],
          scanned: 0,
          errors: [error.message],
        }
      }
      // 其他错误
      return {
        projects: [],
        scanned: 0,
        errors: [`扫描失败: ${String(error)}`],
      }
    }
  }

  /**
   * 快速扫描指定目录（仅扫描第一层）
   * @param rootPath 要扫描的根目录路径
   * @returns 扫描结果
   */
  static quickScan(rootPath: string): ScanResult {
    return this.scan(rootPath, 1)
  }
}
