/**
 * CommandService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain } from 'electron'
import * as pty from 'node-pty'
import { CommandService } from '../../../main/services/CommandService'
import { ProjectService } from '../../../main/services/ProjectService'
import { ProjectConfig, StartupProfile } from '../../../shared/types'
import { SecurityValidator } from '../../../main/utils/SecurityValidator'
import { CommandExecutionError, SecurityError } from '../../../shared/errorTypes'

// 模拟依赖项
vi.mock('electron', async () => {
  const actual = await vi.importActual('electron')
  return {
    ...actual,
    ipcMain: {
      on: vi.fn(),
      emit: vi.fn(),
    },
  }
})

vi.mock('node-pty', () => ({
  spawn: vi.fn(),
}))

vi.mock('../../../main/services/ProjectService', () => ({
  ProjectService: {
    update: vi.fn(),
  },
}))

vi.mock('../../../main/utils/SecurityValidator', () => ({
  SecurityValidator: {
    validatePath: vi.fn(),
    validateCommand: vi.fn(),
    validateEnvironmentVariables: vi.fn(),
    createPtyOptions: vi.fn(),
    limitLogSize: vi.fn(),
    validateIdeCommand: vi.fn(),
  },
}))

describe('CommandService', () => {
  const mockProject: ProjectConfig = {
    id: 'test-project-id',
    name: 'Test Project',
    path: '/path/to/test/project',
    status: 'stopped',
  }

  const mockProfile: StartupProfile = {
    id: 'test-profile-id',
    name: 'Test Profile',
    type: 'frontend',
    command: 'npm run dev',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // 默认模拟返回值
    vi.mocked(SecurityValidator.validatePath).mockReturnValue('/path/to/test/project')
    vi.mocked(SecurityValidator.validateCommand).mockReturnValue('npm run dev')
    vi.mocked(SecurityValidator.validateEnvironmentVariables).mockReturnValue({})
    vi.mocked(SecurityValidator.createPtyOptions).mockReturnValue({
      name: 'xterm-color',
      cwd: '/path/to/test/project',
      env: {},
    })
    vi.mocked(SecurityValidator.limitLogSize).mockImplementation((current, data) => current + data)
  })

  describe('runCommand', () => {
    it('应该正确启动命令并更新项目状态', () => {
      // 模拟 pty 进程
      const mockPty = {
        onData: vi.fn((callback) => callback('test data')),
        onExit: vi.fn(),
        write: vi.fn(),
        kill: vi.fn(),
      }
      vi.mocked(pty.spawn).mockReturnValue(mockPty as any)

      const mockCallback = vi.fn()

      CommandService.runCommand(mockProject, mockProfile, mockCallback)

      // 验证项目状态被更新为运行中
      expect(ProjectService.update).toHaveBeenCalledWith(mockProject.id, {
        status: 'running',
        lastLaunched: expect.any(Number),
        activeProfileId: mockProfile.id,
      })

      // 验证 IPC 事件被触发
      expect(ipcMain.emit).toHaveBeenCalledWith(
        'project-status-updated',
        mockProject.id,
        'running',
        mockProfile.id
      )
    })

    it('应该处理命令执行错误', () => {
      // 模拟安全验证失败
      vi.mocked(SecurityValidator.validatePath).mockImplementation(() => {
        throw new SecurityError('Invalid path')
      })

      const mockCallback = vi.fn()

      CommandService.runCommand(mockProject, mockProfile, mockCallback)

      // 验证错误被传递给回调
      expect(mockCallback).toHaveBeenCalledWith('\n[错误] Invalid path\n')

      // 验证项目状态被恢复为停止
      expect(ProjectService.update).toHaveBeenCalledWith(mockProject.id, { status: 'stopped' })
    })

    it('应该预处理命令以确保在 Windows 上正确执行', () => {
      const originalPlatform = process.platform

      // 模拟 Windows 平台
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      })

      try {
        const result = (CommandService as any).preprocessCommand('npm run dev; echo test')
        expect(result).toBe('npm run dev&& echo test') // 在 Windows 上 ; 应该被转换为 &&
      } finally {
        // 恢复原始平台
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
        })
      }
    })

    it('应该在非 Windows 平台上保持命令不变', () => {
      const originalPlatform = process.platform

      // 模拟 Linux 平台
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true,
      })

      try {
        const result = (CommandService as any).preprocessCommand('npm run dev; echo test')
        expect(result).toBe('npm run dev; echo test') // 在 Linux 上应保持原样
      } finally {
        // 恢复原始平台
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
        })
      }
    })
  })

  describe('killProcess', () => {
    it('应该终止指定项目的进程', () => {
      // 模拟一个活动进程
      const mockPty = {
        kill: vi.fn(),
      }

      // 直接设置内部状态（这在实际测试中可能需要通过其他方式实现）
      ;(CommandService as any).activeProcesses.set(mockProject.id, {
        pty: mockPty as any,
        profileId: mockProfile.id,
        createdAt: Date.now(),
      })

      CommandService.killProcess(mockProject.id)

      // 验证进程被终止
      expect(mockPty.kill).toHaveBeenCalled()

      // 验证项目状态被更新为停止
      expect(ProjectService.update).toHaveBeenCalledWith(mockProject.id, {
        status: 'stopped',
        activeProfileId: undefined,
      })
    })

    it('应该处理不存在的进程', () => {
      // 确保没有活动进程
      ;(CommandService as any).activeProcesses.clear()

      CommandService.killProcess(mockProject.id)

      // 验证即使没有活动进程，项目状态也会被更新为停止
      expect(ProjectService.update).toHaveBeenCalledWith(mockProject.id, {
        status: 'stopped',
        activeProfileId: undefined,
      })
    })
  })

  describe('openIde', () => {
    it('应该使用验证后的命令打开 IDE', () => {
      const mockPty = {
        write: vi.fn(),
        kill: vi.fn(),
      }
      vi.mocked(pty.spawn).mockReturnValue(mockPty as any)
      vi.mocked(SecurityValidator.validateIdeCommand).mockReturnValue('code .')

      CommandService.openIde(mockProject)

      // 验证 IDE 命令被写入
      expect(mockPty.write).toHaveBeenCalledWith('code . && exit\r')
    })

    it('应该处理打开 IDE 时的错误', () => {
      vi.mocked(SecurityValidator.validatePath).mockImplementation(() => {
        throw new SecurityError('Invalid path')
      })

      expect(() => CommandService.openIde(mockProject)).toThrow(CommandExecutionError)
    })
  })

  describe('openTerminal', () => {
    it('应该在不同平台上执行适当的命令', () => {
      const originalPlatform = process.platform

      // 测试 Windows 平台
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
      })

      try {
        // 模拟 exec 函数
        const mockExec = vi.fn()
        vi.doMock('child_process', () => ({
          exec: mockExec,
        }))

        CommandService.openTerminal(mockProject)

        // 验证 Windows 命令被执行
        expect(mockExec).toHaveBeenCalledWith('start cmd /K "cd /d "/path/to/test/project""')
      } finally {
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          writable: true,
        })
      }
    })
  })

  describe('cleanupAll', () => {
    it('应该清理所有活动进程和资源', () => {
      const mockPty1 = {
        kill: vi.fn(),
      }
      const mockPty2 = {
        kill: vi.fn(),
      }

      // 添加活动进程到内部状态
      ;(CommandService as any).activeProcesses.set('project1', {
        pty: mockPty1 as any,
        profileId: 'profile1',
        createdAt: Date.now(),
      })
      ;(CommandService as any).activeProcesses.set('project2', {
        pty: mockPty2 as any,
        profileId: 'profile2',
        createdAt: Date.now(),
      })

      CommandService.cleanupAll()

      // 验证所有进程都被终止
      expect(mockPty1.kill).toHaveBeenCalled()
      expect(mockPty2.kill).toHaveBeenCalled()

      // 验证内部状态被清空
      expect((CommandService as any).activeProcesses.size).toBe(0)
      expect((CommandService as any).logBuffers.size).toBe(0)
    })
  })

  describe('initIpc', () => {
    it('应该初始化 IPC 通信监听器', () => {
      CommandService.initIpc()

      // 验证 IPC 监听器被注册
      expect(ipcMain.on).toHaveBeenCalledWith('kill-process', expect.any(Function))
      expect(ipcMain.on).toHaveBeenCalledWith('start-profile', expect.any(Function))
    })
  })
})
