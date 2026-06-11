/**
 * ProjectService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { ProjectService } from '../../../main/services/ProjectService'
import { ProjectConfig } from '../../../shared/types'
import { SecurityValidator } from '../../../main/utils/SecurityValidator'
import { PathValidationError, FileOperationError } from '../../../shared/errorTypes'

// 模拟依赖项
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    statSync: vi.fn(),
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    join: vi.fn((...args) => args.join('/')),
  }
})

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/user/data'),
  },
}))

vi.mock('../../../main/utils/SecurityValidator', () => ({
  SecurityValidator: {
    validatePath: vi.fn(),
    validatePathAccessible: vi.fn(),
    validateCommand: vi.fn(),
    validateCommandName: vi.fn(),
  },
}))

describe('ProjectService', () => {
  const mockProjectData: Omit<ProjectConfig, 'id' | 'status'> = {
    name: 'Test Project',
    path: '/path/to/test/project',
    description: 'A test project',
  }

  const mockFullProject: ProjectConfig = {
    ...mockProjectData,
    id: 'test-id',
    status: 'stopped',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 默认模拟返回值
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
    vi.mocked(fs.existsSync).mockReturnValue(false) // 默认文件不存在
    vi.mocked(SecurityValidator.validatePath).mockReturnValue('/path/to/test/project')
    vi.mocked(SecurityValidator.validatePathAccessible).mockReturnValue({
      exists: true,
      isDirectory: true,
    })
    vi.mocked(SecurityValidator.validateCommand).mockImplementation((cmd) => cmd)
    vi.mocked(SecurityValidator.validateCommandName).mockImplementation((name) => name)
  })

  describe('getAll', () => {
    it('应该返回空数组当项目文件不存在时', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const projects = ProjectService.getAll()

      expect(projects).toEqual([])
      expect(fs.existsSync).toHaveBeenCalledWith('/user/data/devlauncher/projects.json')
    })

    it('应该返回解析的项目数据', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([mockFullProject]))

      const projects = ProjectService.getAll()

      expect(projects).toEqual([mockFullProject])
    })

    it('应该处理读取文件时的错误', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Read error')
      })

      const projects = ProjectService.getAll()

      expect(projects).toEqual([])
    })

    it('应该自动执行数据迁移', () => {
      const projectWithStartCommand = {
        ...mockFullProject,
        startCommand: 'npm run dev',
        startupProfiles: undefined,
      }

      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([projectWithStartCommand]))
      vi.mocked(fs.writeFileSync).mockImplementation(() => {}) // 模拟写入

      const projects = ProjectService.getAll()

      // 验证项目被迁移，包含startupProfiles
      expect(projects[0]).toHaveProperty('startupProfiles')
      expect(projects[0].startupProfiles).toHaveLength(1)
      expect(projects[0].startupProfiles![0].command).toBe('npm run dev')
    })
  })

  describe('add', () => {
    it('应该添加新项目并返回完整配置', () => {
      vi.mocked(uuidv4).mockReturnValue('generated-id')
      vi.mocked(fs.readFileSync).mockReturnValue('[]')
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const newProject = ProjectService.add(mockProjectData)

      expect(newProject).toEqual({
        ...mockProjectData,
        id: 'generated-id',
        status: 'stopped',
        lastLaunched: undefined,
      })
      expect(SecurityValidator.validatePath).toHaveBeenCalledWith('/path/to/test/project')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('应该验证项目路径', () => {
      const validationError = new PathValidationError('Invalid path')
      vi.mocked(SecurityValidator.validatePath).mockImplementation(() => {
        throw validationError
      })

      expect(() => ProjectService.add(mockProjectData)).toThrow(PathValidationError)
    })

    it('应该验证路径是否存在', () => {
      vi.mocked(SecurityValidator.validatePathAccessible).mockReturnValue({
        exists: false,
        isDirectory: false,
      })

      expect(() => ProjectService.add(mockProjectData)).toThrow(PathValidationError)
    })

    it('应该验证自定义命令', () => {
      const projectWithCommands = {
        ...mockProjectData,
        customCommands: [{ name: 'Build', command: 'npm run build' }],
      }

      vi.mocked(uuidv4).mockReturnValue('generated-id')
      vi.mocked(fs.readFileSync).mockReturnValue('[]')
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})

      const newProject = ProjectService.add(projectWithCommands)

      expect(SecurityValidator.validateCommand).toHaveBeenCalledWith('npm run build')
      expect(SecurityValidator.validateCommandName).toHaveBeenCalledWith('Build')
    })

    it('应该处理自定义命令验证失败', () => {
      const projectWithCommands = {
        ...mockProjectData,
        customCommands: [{ name: 'Build', command: 'dangerous command' }],
      }

      const validationError = new SecurityError('Dangerous command')
      vi.mocked(SecurityValidator.validateCommand).mockImplementation(() => {
        throw validationError
      })

      expect(() => ProjectService.add(projectWithCommands)).toThrow(FileOperationError)
    })
  })

  describe('update', () => {
    const existingProjects: ProjectConfig[] = [{ ...mockFullProject, id: 'existing-id' }]

    beforeEach(() => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingProjects))
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    })

    it('应该更新指定项目的属性', () => {
      const updates = { name: 'Updated Name' }

      ProjectService.update('existing-id', updates)

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/user/data/devlauncher/projects.json',
        JSON.stringify([{ ...mockFullProject, id: 'existing-id', name: 'Updated Name' }], null, 2)
      )
    })

    it('应该验证更新的路径', () => {
      const validationError = new PathValidationError('Invalid path')
      vi.mocked(SecurityValidator.validatePath).mockImplementation(() => {
        throw validationError
      })

      expect(() => ProjectService.update('existing-id', { path: '/invalid/path' })).toThrow(
        PathValidationError
      )
    })

    it('应该验证更新的自定义命令', () => {
      const updates = {
        customCommands: [{ name: 'New Command', command: 'npm run new' }],
      }

      ProjectService.update('existing-id', updates)

      expect(SecurityValidator.validateCommand).toHaveBeenCalledWith('npm run new')
      expect(SecurityValidator.validateCommandName).toHaveBeenCalledWith('New Command')
    })

    it('应该处理不存在的项目', () => {
      // 尝试更新不存在的项目
      ProjectService.update('non-existent-id', { name: 'New Name' })

      // 文件内容应该没有变化
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/user/data/devlauncher/projects.json',
        JSON.stringify(existingProjects, null, 2)
      )
    })
  })

  describe('delete', () => {
    const existingProjects: ProjectConfig[] = [
      { ...mockFullProject, id: 'existing-id' },
      { ...mockFullProject, id: 'to-delete-id', name: 'To Delete' },
    ]

    beforeEach(() => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existingProjects))
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    })

    it('应该删除指定项目', () => {
      ProjectService.delete('to-delete-id')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/user/data/devlauncher/projects.json',
        JSON.stringify([existingProjects[0]], null, 2)
      )
    })
  })

  describe('exportTo', () => {
    beforeEach(() => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
      vi.mocked(fs.existsSync).mockReturnValue(true) // 目录存在
    })

    it('应该导出项目到指定文件', () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([mockFullProject])

      const result = ProjectService.exportTo('/output/path/projects.json')

      expect(result.success).toBe(true)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/output/path/projects.json',
        expect.stringContaining('Test Project'),
        'utf-8'
      )
    })

    it('应该处理导出错误', () => {
      vi.mocked(ProjectService.getAll).mockImplementation(() => {
        throw new Error('Export failed')
      })

      const result = ProjectService.exportTo('/output/path/projects.json')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Export failed')
    })
  })

  describe('importFrom', () => {
    const validImportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      projects: [mockFullProject],
    }

    beforeEach(() => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validImportData))
      vi.mocked(ProjectService.getAll).mockReturnValue([])
      vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    })

    it('应该从文件导入项目（合并模式）', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const result = ProjectService.importFrom('/input/path/projects.json', true)

      expect(result.success).toBe(true)
      expect(result.imported).toBe(1)
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('应该从文件导入项目（替换模式）', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const result = ProjectService.importFrom('/input/path/projects.json', false)

      expect(result.success).toBe(true)
      expect(result.imported).toBe(1)
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('应该处理不存在的导入文件', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = ProjectService.importFrom('/nonexistent/path.json')

      expect(result.success).toBe(false)
      expect(result.imported).toBe(0)
    })

    it('应该处理无效的 JSON 数据', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json')
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const result = ProjectService.importFrom('/input/path/projects.json')

      expect(result.success).toBe(false)
      expect(result.imported).toBe(0)
    })

    it('应该处理无效的导入数据格式', () => {
      const invalidImportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        projects: 'not-an-array',
      }

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidImportData))
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const result = ProjectService.importFrom('/input/path/projects.json')

      expect(result.success).toBe(false)
      expect(result.imported).toBe(0)
    })

    it('应该验证导入的项目路径', () => {
      const projectWithValidPath = {
        ...mockFullProject,
        path: '/valid/path',
      }

      const validImportDataWithValidPath = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        projects: [projectWithValidPath],
      }

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validImportDataWithValidPath))
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // 项目路径不存在

      const result = ProjectService.importFrom('/input/path/projects.json')

      // 由于路径不存在，项目不会被导入
      expect(result.success).toBe(true) // 成功解析文件，但没有导入任何项目
      expect(result.imported).toBe(0)
    })
  })
})
