import { ProjectConfig, StartupProfile } from '../../shared/types'
import { ProjectService } from './ProjectService'
import { v4 as uuidv4 } from 'uuid'
import { PROJECT_TYPE_CONFIG } from '../../shared/projectTypeConfig'

interface ScannedProject {
  name: string
  path: string
  type: string
}

export class BatchImportService {
  /**
   * 批量添加扫描到的项目
   */
  static async batchAddProjects(projects: ScannedProject[]): Promise<{
    success: boolean
    added: number
    skipped: number
    errors: string[]
  }> {
    const existingProjects = ProjectService.getAll()
    const existingPaths = new Set(existingProjects.map((p) => p.path))

    let addedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const scannedProject of projects) {
      // 跳过已存在的项目
      if (existingPaths.has(scannedProject.path)) {
        skippedCount++
        continue
      }

      try {
        // 根据项目类型生成默认启动配置
        const config = PROJECT_TYPE_CONFIG[scannedProject.type]
        const startupProfiles: StartupProfile[] = [
          {
            id: uuidv4(),
            name: '启动',
            type: config?.profileType || 'backend',
            command: config?.defaultCommand || 'echo "请配置启动命令"',
            isDefault: true,
          },
        ]

        // 生成标签
        const tags =
          config?.tags || scannedProject.type.includes('/')
            ? scannedProject.type.split('/')
            : [scannedProject.type]

        const projectData: Omit<ProjectConfig, 'id' | 'status'> = {
          name: scannedProject.name,
          path: scannedProject.path,
          description: `自动扫描发现的 ${scannedProject.type} 项目`,
          tags,
          startupProfiles,
          ideCommand: 'code .',
        }

        ProjectService.add(projectData)
        existingPaths.add(scannedProject.path)
        addedCount++
      } catch (error) {
        errors.push(`${scannedProject.name}: ${String(error)}`)
      }
    }

    return {
      success: true,
      added: addedCount,
      skipped: skippedCount,
      errors,
    }
  }
}
