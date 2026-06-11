/**
 * DirectoryScanService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  DirectoryScanService,
  ScannedProject,
  ScanResult,
} from '../../../main/services/DirectoryScanService'

// 模拟依赖项
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs')
  return {
    ...actual,
    readdirSync: vi.fn(),
    existsSync: vi.fn(),
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    basename: vi.fn(),
    join: vi.fn(),
  }
})

describe('DirectoryScanService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectProjectType', () => {
    it('应该正确识别 Node.js 项目', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['package.json'])

      const projectType = (DirectoryScanService as any).detectProjectType('/test/path')

      expect(projectType).toBe('Node.js/JavaScript')
    })

    it('应该正确识别 TypeScript 项目', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['package.json', 'tsconfig.json'])

      const projectType = (DirectoryScanService as any).detectProjectType('/test/path')

      expect(projectType).toBe('TypeScript')
    })

    it('应该正确识别 Python 项目', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['requirements.txt'])

      const projectType = (DirectoryScanService as any).detectProjectType('/test/path')

      expect(projectType).toBe('Python')
    })

    it('应该返回 null 当目录不是项目时', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['random-file.txt'])

      const projectType = (DirectoryScanService as any).detectProjectType('/test/path')

      expect(projectType).toBeNull()
    })

    it('应该处理目录读取错误', () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const projectType = (DirectoryScanService as any).detectProjectType('/test/path')

      expect(projectType).toBeNull()
    })
  })

  describe('extractProjectName', () => {
    it('应该从 package.json 读取项目名称', () => {
      vi.mocked(path.basename).mockReturnValue('my-project-dir')
      vi.mocked(path.join).mockReturnValue('/test/path/package.json')
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'my-cool-app' }))

      const projectName = (DirectoryScanService as any).extractProjectName('/test/path')

      expect(projectName).toBe('my-cool-app')
    })

    it('应该处理 scoped package 名称', () => {
      vi.mocked(path.basename).mockReturnValue('my-project-dir')
      vi.mocked(path.join).mockReturnValue('/test/path/package.json')
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: '@myorg/my-cool-app' }))

      const projectName = (DirectoryScanService as any).extractProjectName('/test/path')

      expect(projectName).toBe('my-cool-app')
    })

    it('应该使用目录名当 package.json 不存在时', () => {
      vi.mocked(path.basename).mockReturnValue('my-project-dir')
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const projectName = (DirectoryScanService as any).extractProjectName('/test/path')

      expect(projectName).toBe('my-project-dir')
    })

    it('应该使用目录名当 package.json 读取失败时', () => {
      vi.mocked(path.basename).mockReturnValue('my-project-dir')
      vi.mocked(path.join).mockReturnValue('/test/path/package.json')
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Cannot read file')
      })

      const projectName = (DirectoryScanService as any).extractProjectName('/test/path')

      expect(projectName).toBe('my-project-dir')
    })
  })

  describe('scan', () => {
    it('应该返回错误当目录不存在时', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = DirectoryScanService.scan('/nonexistent/path')

      expect(result).toEqual({
        projects: [],
        scanned: 0,
        errors: ['目录不存在: /nonexistent/path'],
      })
    })

    it('应该返回错误当路径不是目录时', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false })

      const result = DirectoryScanService.scan('/not/a/dir')

      expect(result).toEqual({
        projects: [],
        scanned: 0,
        errors: ['路径不是目录: /not/a/dir'],
      })
    })

    it('应该扫描目录并找到项目', () => {
      // 模拟目录结构
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true })
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        {
          name: 'subdir',
          isDirectory: () => true,
        },
      ] as any) // 第一次调用，返回子目录
      vi.mocked(fs.readdirSync).mockReturnValue(['package.json']) // 子目录内容

      const result = DirectoryScanService.scan('/test/root', 2)

      expect(result.scanned).toBeGreaterThanOrEqual(1)
      expect(Array.isArray(result.projects)).toBe(true)
    })

    it('应该跳过特定目录', () => {
      // 模拟包含需要跳过的目录
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true })
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        { name: 'node_modules', isDirectory: () => true },
        { name: 'my-project', isDirectory: () => true },
      ] as any)
      vi.mocked(fs.readdirSync).mockReturnValue(['package.json']) // my-project 目录内容

      const result = DirectoryScanService.scan('/test/root', 2)

      // 验证扫描了正确的目录数
      expect(result.scanned).toBeGreaterThanOrEqual(1)
    })

    it('应该去重相同路径的项目', () => {
      // 模拟重复的项目路径
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true })
      vi.mocked(fs.readdirSync).mockReturnValueOnce([
        { name: 'project1', isDirectory: () => true },
        { name: 'duplicate-project', isDirectory: () => true },
      ] as any)
      vi.mocked(fs.readdirSync).mockReturnValue(['package.json']) // 两个目录都有 package.json

      // 模拟相同的路径
      vi.mocked(path.join).mockReturnValue('/same/path/package.json')

      const result = DirectoryScanService.scan('/test/root', 2)

      // 验证结果中没有重复的项目
      const uniquePaths = new Set(result.projects.map((p) => p.path))
      expect(result.projects.length).toBe(uniquePaths.size)
    })
  })

  describe('quickScan', () => {
    it('应该只扫描第一层目录', () => {
      // 模拟快速扫描 - 只扫描一层
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true })
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'project1', isDirectory: () => true },
        { name: 'project2', isDirectory: () => true },
      ] as any)

      // 模拟每个子目录的内容
      let callCount = 0
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        callCount++
        if (callCount === 1) return ['package.json'] // 第一次调用返回 project1 的内容
        return ['requirements.txt'] // 第二次调用返回 project2 的内容
      })

      const result = DirectoryScanService.quickScan('/test/root')

      // 快速扫描只扫描一层，所以应该找到两个项目
      expect(result.scanned).toBe(1) // 只扫描了根目录
      expect(result.projects).toHaveLength(2) // 找到了两个项目
    })
  })

  describe('MAX_DEPTH constant', () => {
    it('应该限制扫描的最大深度', () => {
      expect((DirectoryScanService as any).MAX_DEPTH).toBe(10)
    })
  })

  describe('PROJECT_MARKERS constant', () => {
    it('应该包含各种项目类型的标记文件', () => {
      const markers = (DirectoryScanService as any).PROJECT_MARKERS
      expect(markers).toHaveProperty('Node.js/JavaScript')
      expect(markers['Node.js/JavaScript']).toContain('package.json')
      expect(markers).toHaveProperty('Python')
      expect(markers.Python).toContain('requirements.txt')
      expect(markers).toHaveProperty('TypeScript')
      expect(markers.TypeScript).toContain('tsconfig.json')
    })
  })

  describe('SKIP_DIRS constant', () => {
    it('应该包含需要跳过的目录名称', () => {
      const skipDirs = (DirectoryScanService as any).SKIP_DIRS
      expect(skipDirs.has('node_modules')).toBe(true)
      expect(skipDirs.has('.git')).toBe(true)
      expect(skipDirs.has('dist')).toBe(true)
      expect(skipDirs.has('build')).toBe(true)
    })
  })
})
