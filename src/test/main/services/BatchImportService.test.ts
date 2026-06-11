/**
 * BatchImportService 单元測試
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BatchImportService } from '../../../main/services/BatchImportService'
import { ProjectService } from '../../../main/services/ProjectService'
import { ProjectConfig } from '../../../shared/types'
import { PROJECT_TYPE_CONFIG } from '../../../shared/projectTypeConfig'

interface ScannedProject {
  name: string
  path: string
  type: string
}

// 模擬依賴項
vi.mock('../../../main/services/ProjectService', () => ({
  ProjectService: {
    getAll: vi.fn(),
    add: vi.fn(),
  },
}))

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid'),
}))

describe('BatchImportService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('batchAddProjects', () => {
    it('應該批量添加新項目', async () => {
      // 模擬沒有現有項目
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      const scannedProjects = [
        {
          name: 'Test Project 1',
          path: '/path/to/test1',
          type: 'Node.js/JavaScript',
        },
        {
          name: 'Test Project 2',
          path: '/path/to/test2',
          type: 'Python',
        },
      ]

      const result = await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證項目被添加
      expect(ProjectService.add).toHaveBeenCalledTimes(2)
      expect(result.added).toBe(2)
      expect(result.skipped).toBe(0)
      expect(result.success).toBe(true)
    })

    it('應該跳過已存在的項目', async () => {
      // 模擬已存在一個項目
      vi.mocked(ProjectService.getAll).mockReturnValue([
        {
          id: 'existing-id',
          name: 'Existing Project',
          path: '/path/to/existing',
          status: 'stopped',
        } as ProjectConfig,
      ])

      const scannedProjects = [
        {
          name: 'Existing Project',
          path: '/path/to/existing', // 與現有項目路徑相同
          type: 'Node.js/JavaScript',
        },
        {
          name: 'New Project',
          path: '/path/to/new',
          type: 'Python',
        },
      ]

      const result = await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證只有新項目被添加
      expect(ProjectService.add).toHaveBeenCalledTimes(1)
      expect(result.added).toBe(1)
      expect(result.skipped).toBe(1)
      expect(result.success).toBe(true)
    })

    it('應該根據項目類型生成正確的啟動配置', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      const scannedProjects = [
        {
          name: 'Node.js Project',
          path: '/path/to/nodejs',
          type: 'Node.js/JavaScript',
        },
      ]

      await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證添加的項目具有正確的啟動配置
      expect(ProjectService.add).toHaveBeenCalledWith({
        name: 'Node.js Project',
        path: '/path/to/nodejs',
        description: '自動掃描發現的 Node.js/JavaScript 項目',
        tags: ['JavaScript', 'Node.js'],
        startupProfiles: [
          {
            id: 'mocked-uuid',
            name: '啟動',
            type: 'backend',
            command: 'npm run dev',
            isDefault: true,
          },
        ],
        ideCommand: 'code .',
      })
    })

    it('應該為未知項目類型使用默認配置', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      const scannedProjects = [
        {
          name: 'Unknown Project',
          path: '/path/to/unknown',
          type: 'Unknown Type',
        },
      ]

      await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證添加的項目具有默認配置
      expect(ProjectService.add).toHaveBeenCalledWith({
        name: 'Unknown Project',
        path: '/path/to/unknown',
        description: '自動掃描發現的 Unknown Type 項目',
        tags: ['Unknown Type'],
        startupProfiles: [
          {
            id: 'mocked-uuid',
            name: '啟動',
            type: 'backend',
            command: 'echo "請配置啟動命令"',
            isDefault: true,
          },
        ],
        ideCommand: 'code .',
      })
    })

    it('應該處理添加項目時的錯誤', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      // 模擬添加項目時拋出錯誤
      vi.mocked(ProjectService.add).mockImplementation(() => {
        throw new Error('Failed to add project')
      })

      const scannedProjects = [
        {
          name: 'Failing Project',
          path: '/path/to/failing',
          type: 'Node.js/JavaScript',
        },
      ]

      const result = await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證錯誤被記錄
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Failing Project:')
      expect(result.added).toBe(0)
      expect(result.success).toBe(true) // 整體操作仍然視為成功，只是有錯誤
    })

    it('應該為不同項目類型生成相應標籤', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      const scannedProjects = [
        {
          name: 'Python Project',
          path: '/path/to/python',
          type: 'Python',
        },
      ]

      await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證Python項目生成了正確的標籤
      expect(ProjectService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['Python'],
        })
      )
    })

    it('應該處理包含斜槓的項目類型', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      const scannedProjects = [
        {
          name: 'Multi-Type Project',
          path: '/path/to/multi',
          type: 'Type1/Type2',
        },
      ]

      await BatchImportService.batchAddProjects(scannedProjects)

      // 驗證包含斜槓的類型被正確分割
      expect(ProjectService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['Type1', 'Type2'],
        })
      )
    })

    it('應該返回空結果當沒有項目需要添加時', async () => {
      // 模擬已存在所有項目
      vi.mocked(ProjectService.getAll).mockReturnValue([
        {
          id: 'existing-id',
          name: 'Existing Project',
          path: '/path/to/existing',
          status: 'stopped',
        } as ProjectConfig,
      ])

      const scannedProjects = [
        {
          name: 'Existing Project',
          path: '/path/to/existing',
          type: 'Node.js/JavaScript',
        },
      ]

      const result = await BatchImportService.batchAddProjects(scannedProjects)

      expect(result.added).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.errors).toHaveLength(0)
      expect(result.success).toBe(true)
    })
  })

  describe('PROJECT_TYPE_CONFIG integration', () => {
    it('應該使用項目類型配置中的默認命令', async () => {
      vi.mocked(ProjectService.getAll).mockReturnValue([])

      // 測試幾種不同的項目類型
      const testCases = [
        { type: 'Node.js/JavaScript', expectedCommand: 'npm run dev' },
        { type: 'Python', expectedCommand: 'python main.py' },
        { type: 'Go', expectedCommand: 'go run .' },
        { type: 'Rust', expectedCommand: 'cargo run' },
      ]

      for (const testCase of testCases) {
        vi.mocked(ProjectService.add).mockClear() // 清除之前的調用

        const scannedProjects = [
          {
            name: `${testCase.type} Project`,
            path: `/path/to/${testCase.type}`,
            type: testCase.type,
          },
        ]

        await BatchImportService.batchAddProjects(scannedProjects)

        // 驗證使用了正確的默認命令
        expect(ProjectService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            startupProfiles: expect.arrayContaining([
              expect.objectContaining({
                command: testCase.expectedCommand,
              }),
            ]),
          })
        )
      }
    })
  })
})
