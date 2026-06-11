/**
 * ProjectDetectionService 单元測試
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  ProjectDetectionService,
  ProjectDetection,
} from '../../../main/services/ProjectDetectionService'

// 模擬依賴項
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs')
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  }
})

vi.mock('path', async () => {
  const actual = await vi.importActual<typeof path>('path')
  return {
    ...actual,
    join: vi.fn(),
  }
})

describe('ProjectDetectionService', () => {
  const testProjectPath = '/test/project'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detect', () => {
    it('應該返回默認檢測結果當目錄不存在時', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Unknown',
        startCommand: '',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 Node.js 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('package.json')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Node.js/JavaScript',
        startCommand: 'npm run dev',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 TypeScript 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        const pathStr = String(filePath)
        return pathStr.endsWith('tsconfig.json') || pathStr.endsWith('package.json')
      })
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}))

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'TypeScript',
        startCommand: 'npm run dev',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 Python 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('requirements.txt')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Python',
        startCommand: 'python main.py',
        ideCommand: 'code .',
      })
    })

    it('應該從 package.json 提取項目描述', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('package.json')
      })
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          description: 'A sample Node.js project',
          scripts: { dev: 'nodemon server.js' },
        })
      )

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Node.js/JavaScript',
        startCommand: 'npm run dev',
        ideCommand: 'code .',
        description: 'A sample Node.js project',
      })
    })

    it('應該從 package.json 提取 start 腳本', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('package.json')
      })
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          scripts: { start: 'node server.js' },
        })
      )

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result.startCommand).toBe('npm start')
    })

    it('應該處理 package.json 解析錯誤', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('package.json')
      })
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Cannot parse JSON')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result.language).toBe('Node.js/JavaScript')
      expect(result.startCommand).toBe('npm run dev')
    })

    it('應該正確檢測 Go 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('go.mod')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Go',
        startCommand: 'go run .',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 Rust 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('Cargo.toml')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Rust',
        startCommand: 'cargo run',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 Java 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        return String(filePath).endsWith('pom.xml')
      })

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result).toEqual({
        language: 'Java',
        startCommand: 'mvn spring-boot:run',
        ideCommand: 'code .',
      })
    })

    it('應該正確檢測 React/Next.js 項目', () => {
      vi.mocked(path.join).mockImplementation((...args) => args.join('/'))
      vi.mocked(fs.existsSync).mockImplementation((filePath: any) => {
        const pathStr = String(filePath)
        return pathStr.endsWith('next.config.js') || pathStr.endsWith('package.json')
      })
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
        },
      }))

      const result = ProjectDetectionService.detect(testProjectPath)

      expect(result.language).toBe('React/Next.js')
      expect(result.startCommand).toBe('npm run dev')
      expect(result.ideCommand).toBe('code .')
    })
  })

  describe('extractProjectName', () => {
    it('應該從路徑中提取項目名稱', () => {
      const result = ProjectDetectionService.extractProjectName('/path/to/my-project')

      expect(result).toBe('my-project')
    })

    it('應該處理 Windows 路徑', () => {
      const result = ProjectDetectionService.extractProjectName('C:\\Users\\Test\\MyProject')

      expect(result).toBe('MyProject')
    })

    it('應該處理結尾帶斜槓的路徑', () => {
      const result = ProjectDetectionService.extractProjectName('/path/to/project/')

      expect(result).toBe('project')
    })
  })

  describe('generateTags', () => {
    it('應該為 Node.js 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('Node.js/JavaScript')

      expect(tags).toContain('JavaScript')
      expect(tags).toContain('Node.js')
    })

    it('應該為 TypeScript 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('TypeScript')

      expect(tags).toContain('TypeScript')
      expect(tags).toContain('Node.js')
    })

    it('應該為 Python 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('Python')

      expect(tags).toContain('Python')
    })

    it('應該為 Go 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('Go')

      expect(tags).toContain('Go')
    })

    it('應該為 Rust 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('Rust')

      expect(tags).toContain('Rust')
    })

    it('應該為 Java 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('Java')

      expect(tags).toContain('Java')
    })

    it('應該為 React/Next.js 項目生成正確標籤', () => {
      const tags = ProjectDetectionService.generateTags('React/Next.js')

      expect(tags).toContain('React')
      expect(tags).toContain('Next.js')
      expect(tags).toContain('Frontend')
    })

    it('應該為未知語言生成語言名稱作為標籤', () => {
      const tags = ProjectDetectionService.generateTags('UnknownLanguage')

      expect(tags).toContain('UnknownLanguage')
    })
  })

  describe('LANGUAGE_RULES constant', () => {
    it('應該包含多種語言的檢測規則', () => {
      const rules = (ProjectDetectionService as any).LANGUAGE_RULES
      expect(rules).toBeInstanceOf(Array)
      expect(rules.length).toBeGreaterThan(0)

      const nodeRules = rules.filter((rule: any) => rule.language === 'Node.js/JavaScript')
      expect(nodeRules.length).toBeGreaterThan(0)

      const pythonRules = rules.filter((rule: any) => rule.language === 'Python')
      expect(pythonRules.length).toBeGreaterThan(0)

      const goRules = rules.filter((rule: any) => rule.language === 'Go')
      expect(goRules.length).toBeGreaterThan(0)
    })
  })
})
