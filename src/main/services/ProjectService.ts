import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ProjectConfig } from '../../shared/types'
import { SecurityValidator } from '../utils/SecurityValidator'
import { PathValidationError, FileOperationError, isAppError } from '../../shared/errorTypes'

/**
 * 导入文件的数据格式
 */
interface ImportFileData {
  version?: string
  exportDate?: string
  projects: unknown[]
}

/**
 * 项目数据存储服务
 * 负责项目配置的持久化存储与管理
 */
export class ProjectService {
  private static readonly DATA_DIR = path.join(app.getPath('userData'), 'devlauncher')
  private static readonly PROJECTS_FILE = path.join(ProjectService.DATA_DIR, 'projects.json')

  /**
   * 确保数据目录存在
   */
  private static ensureDataDir() {
    if (!fs.existsSync(ProjectService.DATA_DIR)) {
      fs.mkdirSync(ProjectService.DATA_DIR, { recursive: true })
    }
  }

  /**
   * 迁移旧版数据到新版格式
   * 将 startCommand 转换为 startupProfiles
   * @param projects 项目配置数组
   * @returns 迁移后的项目配置数组
   */
  private static migrateData(projects: ProjectConfig[]): ProjectConfig[] {
    let hasMigration = false

    const migratedProjects = projects.map((project) => {
      // 如果项目有旧的 startCommand 但没有 startupProfiles，进行迁移
      if (project.startCommand && !project.startupProfiles?.length) {
        hasMigration = true
        return {
          ...project,
          // 创建默认的启动配置
          startupProfiles: [
            {
              id: uuidv4(),
              name: '默认启动',
              type: 'backend' as const,
              command: project.startCommand,
              isDefault: true,
            },
          ],
          // 保留旧字段以便回滚，但标记为已废弃
          startCommand: project.startCommand,
        }
      }
      return project
    })

    // 如果有数据迁移，保存更新后的数据
    if (hasMigration) {
      this.save(migratedProjects)
      console.log('数据迁移完成：已将 startCommand 转换为 startupProfiles')
    }

    return migratedProjects
  }

  /**
   * 读取所有项目配置
   * @returns 项目配置数组
   */
  static getAll(): ProjectConfig[] {
    this.ensureDataDir()

    try {
      if (fs.existsSync(this.PROJECTS_FILE)) {
        const data = fs.readFileSync(this.PROJECTS_FILE, 'utf-8')
        const projects = JSON.parse(data)
        // 自动执行数据迁移
        return this.migrateData(projects)
      }
      return []
    } catch (error) {
      console.error('读取项目配置失败:', error)
      return []
    }
  }

  /**
   * 添加新项目
   * @param project 基础项目配置（不含id和状态）
   * @returns 完整项目配置
   * @throws PathValidationError 如果路径无效
   */
  static add(project: Omit<ProjectConfig, 'id' | 'status'>): ProjectConfig {
    // P0 改进：验证项目路径安全性
    try {
      SecurityValidator.validatePath(project.path)

      // 可选：验证路径是否存在
      const pathInfo = SecurityValidator.validatePathAccessible(project.path)
      if (!pathInfo.exists) {
        throw new PathValidationError(`项目路径不存在: ${project.path}`)
      }
      if (!pathInfo.isDirectory) {
        throw new PathValidationError(`项目路径不是目录: ${project.path}`)
      }
    } catch (error) {
      if (isAppError(error)) {
        throw error
      }
      throw new PathValidationError(`路径验证失败: ${String(error)}`)
    }

    // 验证自定义命令
    if (project.customCommands) {
      for (const cmd of project.customCommands) {
        try {
          SecurityValidator.validateCommand(cmd.command)
          SecurityValidator.validateCommandName(cmd.name)
        } catch (error) {
          if (isAppError(error)) {
            throw error
          }
          throw new FileOperationError(`自定义命令验证失败: ${cmd.name}`)
        }
      }
    }

    const newProject: ProjectConfig = {
      ...project,
      id: uuidv4(),
      status: 'stopped',
      lastLaunched: undefined,
    }

    const projects = this.getAll()
    projects.push(newProject)
    this.save(projects)

    return newProject
  }

  /**
   * 更新项目配置
   * @param id 项目ID
   * @param updates 更新字段
   */
  static update(id: string, updates: Partial<ProjectConfig>): void {
    const projects = this.getAll()
    const index = projects.findIndex((p) => p.id === id)

    if (index !== -1) {
      // P0 改进：验证更新的路径
      if (updates.path) {
        try {
          SecurityValidator.validatePath(updates.path)
          const pathInfo = SecurityValidator.validatePathAccessible(updates.path)
          if (!pathInfo.exists) {
            throw new PathValidationError(`项目路径不存在: ${updates.path}`)
          }
          if (!pathInfo.isDirectory) {
            throw new PathValidationError(`项目路径不是目录: ${updates.path}`)
          }
        } catch (error) {
          if (isAppError(error)) {
            throw error
          }
          throw new PathValidationError(`路径验证失败: ${String(error)}`)
        }
      }

      // 验证自定义命令
      if (updates.customCommands) {
        for (const cmd of updates.customCommands) {
          try {
            SecurityValidator.validateCommand(cmd.command)
            SecurityValidator.validateCommandName(cmd.name)
          } catch (error) {
            if (isAppError(error)) {
              throw error
            }
            throw new FileOperationError(`自定义命令验证失败: ${cmd.name}`)
          }
        }
      }

      projects[index] = { ...projects[index], ...updates }
      this.save(projects)
    }
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  static delete(id: string): void {
    const projects = this.getAll().filter((p) => p.id !== id)
    this.save(projects)
  }

  /**
   * 保存项目列表到文件
   * @param projects 项目列表
   */
  private static save(projects: ProjectConfig[]): void {
    this.ensureDataDir()
    fs.writeFileSync(this.PROJECTS_FILE, JSON.stringify(projects, null, 2))
  }

  /**
   * 导出项目配置到 JSON 文件
   * @param outputPath 输出文件路径
   * @returns 导出结果
   */
  static exportTo(outputPath: string): { success: boolean; error?: string } {
    try {
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const projects = this.getAll()
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        projects: projects,
      }

      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8')
      console.log(`成功导出 ${projects.length} 个项目到 ${outputPath}`)
      return { success: true }
    } catch (error: unknown) {
      const errorMsg = `导出项目配置失败: ${error instanceof Error ? error.message : String(error)}`
      console.error(errorMsg)
      return { success: false, error: errorMsg }
    }
  }

  /**
   * 从 JSON 文件导入项目配置
   * @param inputPath 输入文件路径
   * @param merge 是否合并模式（true=合并，false=替换）
   * @returns 导入结果
   */
  static importFrom(
    inputPath: string,
    merge: boolean = true
  ): { success: boolean; imported: number; errors?: string } {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(inputPath)) {
        return { success: false, imported: 0, errors: `文件不存在: ${inputPath}` }
      }

      // 读取文件内容
      const data = fs.readFileSync(inputPath, 'utf-8')

      // 验证文件内容不为空
      if (!data || data.trim().length === 0) {
        return { success: false, imported: 0, errors: '文件内容为空' }
      }

      // 解析 JSON
      let importData: ImportFileData
      try {
        importData = JSON.parse(data) as ImportFileData
      } catch (parseError) {
        return { success: false, imported: 0, errors: `JSON 解析失败: ${String(parseError)}` }
      }

      // 验证数据格式
      if (!importData.projects || !Array.isArray(importData.projects)) {
        return { success: false, imported: 0, errors: '无效的导入文件格式：缺少 projects 数组' }
      }

      const existingProjects = this.getAll()
      const projectsToImport: ProjectConfig[] = []
      const skippedPaths: string[] = []

      for (const project of importData.projects) {
        // 验证必要字段
        if (
          !project ||
          typeof project !== 'object' ||
          !('name' in project) ||
          !('path' in project)
        ) {
          console.warn('跳过无效项目（缺少必要字段）:', project)
          continue
        }

        const projectData = project as Partial<ProjectConfig>
        if (!projectData.name || !projectData.path) {
          console.warn('跳过无效项目（缺少必要字段）:', project)
          continue
        }

        // P0 改进：验证导入的路径安全性
        try {
          SecurityValidator.validatePath(projectData.path)
        } catch (error) {
          console.warn(`跳过无效路径的项目: ${projectData.path}`, error)
          continue
        }

        // 可选：检查路径是否存在
        if (!fs.existsSync(projectData.path)) {
          console.warn(`项目路径不存在，跳过: ${projectData.path}`)
          continue
        }

        // 验证自定义命令
        if (projectData.customCommands) {
          let hasInvalidCommand = false
          for (const cmd of projectData.customCommands) {
            try {
              SecurityValidator.validateCommand(cmd.command)
              SecurityValidator.validateCommandName(cmd.name)
            } catch (error) {
              console.warn(`跳过包含无效命令的项目: ${projectData.name}`, error)
              hasInvalidCommand = true
              break
            }
          }
          if (hasInvalidCommand) continue
        }

        // 为导入的项目生成新的 ID
        const newProject: ProjectConfig = {
          name: projectData.name!,
          path: projectData.path!,
          id: uuidv4(),
          status: 'stopped',
          lastLaunched: undefined,
          group: projectData.group,
          startCommand: projectData.startCommand,
          startupProfiles: projectData.startupProfiles,
          ideCommand: projectData.ideCommand,
          customCommands: projectData.customCommands,
          description: projectData.description,
          tags: projectData.tags,
          activeProfileId: undefined,
        }

        // 检查是否已存在相同路径的项目
        const exists = existingProjects.some((p) => p.path === newProject.path)
        if (exists) {
          skippedPaths.push(newProject.path)
        } else {
          projectsToImport.push(newProject)
        }
      }

      // 保存导入的项目
      if (merge) {
        // 合并模式：添加新项目
        const mergedProjects = [...existingProjects, ...projectsToImport]
        this.save(mergedProjects)
      } else {
        // 替换模式：完全替换
        this.save(projectsToImport)
      }

      const resultMsg = `成功导入 ${projectsToImport.length} 个项目`
      if (skippedPaths.length > 0) {
        console.log(`${resultMsg}，跳过 ${skippedPaths.length} 个已存在的项目`)
      } else {
        console.log(resultMsg)
      }

      return { success: true, imported: projectsToImport.length }
    } catch (error: unknown) {
      const errorMsg = `导入项目配置失败: ${error instanceof Error ? error.message : String(error)}`
      console.error(errorMsg)
      return { success: false, imported: 0, errors: errorMsg }
    }
  }
}
