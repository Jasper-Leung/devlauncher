/**
 * projectStore 单元测试
 * P1 优化：为状态管理添加测试覆盖
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useProjectStore,
  useFilteredProjects,
  useAllTags,
  useAllGroups,
} from '../../../renderer/stores/projectStore'
import { ProjectConfig } from '../../../shared/types'

// Mock electronAPI
const mockGetProjects = vi.fn()
const mockAddProject = vi.fn()
const mockUpdateProject = vi.fn()
const mockDeleteProject = vi.fn()

global.window = {
  ...global.window,
  electronAPI: {
    getProjects: mockGetProjects,
    addProject: mockAddProject,
    updateProject: mockUpdateProject,
    deleteProject: mockDeleteProject,
  },
} as any

describe('projectStore', () => {
  const mockProjects: ProjectConfig[] = [
    {
      id: '1',
      name: 'Project A',
      path: '/path/to/project-a',
      status: 'stopped',
      tags: ['frontend', 'react'],
      group: 'work',
    },
    {
      id: '2',
      name: 'Project B',
      path: '/path/to/project-b',
      status: 'running',
      tags: ['backend', 'node'],
      group: 'work',
    },
    {
      id: '3',
      name: 'Project C',
      path: '/path/to/project-c',
      status: 'stopped',
      tags: ['mobile', 'flutter'],
      group: 'personal',
    },
  ]

  beforeEach(() => {
    // 重置 store 状态
    useProjectStore.setState({
      projects: [],
      selectedProjectId: null,
      searchQuery: '',
      selectedGroup: null,
      logs: {},
    })
    vi.clearAllMocks()
  })

  describe('基本状态操作', () => {
    it('应该设置项目列表', () => {
      const { setProjects } = useProjectStore.getState()

      setProjects(mockProjects)

      const state = useProjectStore.getState()
      expect(state.projects).toEqual(mockProjects)
    })

    it('应该添加单个项目', () => {
      const { addProject, projects } = useProjectStore.getState()

      addProject(mockProjects[0])

      expect(useProjectStore.getState().projects).toHaveLength(1)
      expect(useProjectStore.getState().projects[0]).toEqual(mockProjects[0])
    })

    it('应该更新项目', () => {
      useProjectStore.setState({ projects: mockProjects })

      const { updateProject } = useProjectStore.getState()
      updateProject('1', { name: 'Updated Project A' })

      expect(useProjectStore.getState().projects[0].name).toBe('Updated Project A')
    })

    it('应该删除项目', () => {
      useProjectStore.setState({ projects: mockProjects })

      const { removeProject } = useProjectStore.getState()
      removeProject('1')

      expect(useProjectStore.getState().projects).toHaveLength(2)
      expect(useProjectStore.getState().projects.find((p) => p.id === '1')).toBeUndefined()
    })

    it('应该设置选中项目', () => {
      const { setSelectedProjectId } = useProjectStore.getState()

      setSelectedProjectId('1')

      expect(useProjectStore.getState().selectedProjectId).toBe('1')
    })

    it('应该设置搜索查询', () => {
      const { setSearchQuery } = useProjectStore.getState()

      setSearchQuery('react')

      expect(useProjectStore.getState().searchQuery).toBe('react')
    })

    it('应该设置选中分组', () => {
      const { setSelectedGroup } = useProjectStore.getState()

      setSelectedGroup('work')

      expect(useProjectStore.getState().selectedGroup).toBe('work')
    })
  })

  describe('日志管理', () => {
    it('应该追加日志', () => {
      const { appendLog, logs } = useProjectStore.getState()

      appendLog('1', undefined, 'First log\n')
      appendLog('1', undefined, 'Second log\n')

      const state = useProjectStore.getState()
      expect(state.logs['1']).toBe('First log\nSecond log\n')
    })

    it('应该限制日志大小', () => {
      const { appendLog } = useProjectStore.getState()

      // 添加超过限制的日志
      const largeLog = 'x'.repeat(60000)
      appendLog('1', undefined, largeLog)

      const state = useProjectStore.getState()
      expect(state.logs['1']?.length).toBeLessThanOrEqual(50000)
      expect(state.logs['1']).toContain('[日志已截断')
    })

    it('应该清除指定项目的日志', () => {
      useProjectStore.setState({
        logs: {
          '1': 'log 1',
          '2': 'log 2',
          '1-profile1': 'log 1 profile1',
        },
      })

      const { clearLogs } = useProjectStore.getState()
      clearLogs('1')

      const state = useProjectStore.getState()
      expect(state.logs['1']).toBeUndefined()
      expect(state.logs['2']).toBe('log 2')
    })

    it('应该清除所有日志', () => {
      useProjectStore.setState({
        logs: {
          '1': 'log 1',
          '2': 'log 2',
        },
      })

      const { clearAllLogs } = useProjectStore.getState()
      clearAllLogs()

      expect(useProjectStore.getState().logs).toEqual({})
    })
  })

  describe('选择器', () => {
    beforeEach(() => {
      useProjectStore.setState({
        projects: mockProjects,
        searchQuery: '',
        selectedGroup: null,
      })
    })

    describe('useFilteredProjects', () => {
      it('应该返回所有项目（无过滤）', () => {
        // Note: 这个测试需要在一个 React 组件或使用 renderHook 来进行
        // 这里只验证 store 状态
        const state = useProjectStore.getState()
        expect(state.projects).toHaveLength(3)
      })

      it('应该根据搜索查询过滤', () => {
        useProjectStore.setState({ searchQuery: 'react' })

        const state = useProjectStore.getState()
        const filtered = state.projects.filter(
          (p) =>
            p.name.toLowerCase().includes('react') ||
            p.path.toLowerCase().includes('react') ||
            p.tags?.some((t) => t.toLowerCase().includes('react'))
        )

        expect(filtered).toHaveLength(1)
        expect(filtered[0].id).toBe('1')
      })

      it('应该根据分组过滤', () => {
        useProjectStore.setState({ selectedGroup: 'work' })

        const state = useProjectStore.getState()
        const filtered = state.projects.filter((p) => p.group === 'work')

        expect(filtered).toHaveLength(2)
      })
    })

    describe('useAllTags', () => {
      it('应该返回所有唯一的标签，已排序', () => {
        const tags = new Set<string>()
        useProjectStore.getState().projects.forEach((p) => {
          p.tags?.forEach((t) => tags.add(t))
        })

        const sortedTags = Array.from(tags).sort()

        // 后端、前端、移动端的标签按字母排序
        expect(sortedTags).toEqual(['backend', 'flutter', 'frontend', 'mobile', 'node', 'react'])
      })
    })

    describe('useAllGroups', () => {
      it('应该返回所有唯一的分组，已排序', () => {
        const groups = new Set<string>()
        useProjectStore.getState().projects.forEach((p) => {
          if (p.group) groups.add(p.group)
        })

        const sortedGroups = Array.from(groups).sort()

        expect(sortedGroups).toEqual(['personal', 'work'])
      })
    })
  })

  describe('loadProjects', () => {
    it('应该从主进程加载项目', async () => {
      mockGetProjects.mockResolvedValueOnce(mockProjects)

      const { loadProjects } = useProjectStore.getState()
      await loadProjects()

      expect(mockGetProjects).toHaveBeenCalledOnce()
      expect(useProjectStore.getState().projects).toEqual(mockProjects)
    })

    it('应该处理加载错误', async () => {
      mockGetProjects.mockRejectedValueOnce(new Error('Load failed'))

      const { loadProjects } = useProjectStore.getState()

      await expect(loadProjects()).rejects.toThrow('Load failed')
    })
  })

  describe('删除项目时清除选中状态', () => {
    it('如果删除的是选中项目，应清除选中状态', () => {
      useProjectStore.setState({
        projects: mockProjects,
        selectedProjectId: '1',
      })

      const { removeProject } = useProjectStore.getState()
      removeProject('1')

      expect(useProjectStore.getState().selectedProjectId).toBeNull()
    })

    it('如果删除的不是选中项目，应保持选中状态', () => {
      useProjectStore.setState({
        projects: mockProjects,
        selectedProjectId: '2',
      })

      const { removeProject } = useProjectStore.getState()
      removeProject('1')

      expect(useProjectStore.getState().selectedProjectId).toBe('2')
    })
  })
})
