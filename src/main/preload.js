const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 项目管理
  getProjects: () => ipcRenderer.invoke('get-projects'),
  addProject: (project) => ipcRenderer.invoke('add-project', project),
  updateProject: (id, updates) => ipcRenderer.invoke('update-project', id, updates),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  // 导入/导出
  exportProjects: () => ipcRenderer.invoke('export-projects'),
  importProjects: () => ipcRenderer.invoke('import-projects'),

  // 目录扫描
  selectScanDirectory: () => ipcRenderer.invoke('select-scan-directory'),
  scanDirectory: (dirPath, maxDepth) => ipcRenderer.invoke('scan-directory', dirPath, maxDepth),
  batchAddProjects: (projects) => ipcRenderer.invoke('batch-add-projects', projects),

  // 文件选择
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // 项目检测
  detectProject: (projectPath) => ipcRenderer.invoke('detect-project', projectPath),
  extractProjectName: (projectPath) => ipcRenderer.invoke('extract-project-name', projectPath),

  // README 读取
  readReadme: (projectPath) => ipcRenderer.invoke('read-readme', projectPath),

  // 命令执行
  startProject: (id) => ipcRenderer.send('run-command', id),
  stopProject: (id) => ipcRenderer.send('kill-process', id),
  startProfile: (project, profileId) => ipcRenderer.send('start-profile', project, profileId),
  openIde: (project) => ipcRenderer.send('open-ide', project),
  openFolder: (project) => ipcRenderer.send('open-folder', project),
  openTerminal: (project) => ipcRenderer.send('open-terminal', project),

  // 自定义命令（添加验证）
  runCustomCommand: (project, commandName) => {
    if (!project || !commandName) {
      console.error('无效的自定义命令参数')
      return
    }

    const customCommand = project.customCommands?.find((c) => c.name === commandName)
    if (!customCommand) {
      console.error(`未找到命令: ${commandName}`)
      return
    }

    const command = customCommand.command
    if (!command || typeof command !== 'string') {
      console.error(`无效的命令: ${commandName}`)
      return
    }

    // 基本验证：命令不能为空且不能包含明显危险的操作
    const trimmed = command.trim()
    if (trimmed.length === 0 || trimmed.length > 10000) {
      console.error(`命令长度不合法: ${commandName}`)
      return
    }

    // 检查明显的危险模式
    const dangerousPatterns = [/;\s*rm\s+-rf/i, /;\s*del\s+/i, /`.*\$\(.*\)/, />\s*\/(?:dev|null)/]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        console.error(`命令包含危险操作: ${commandName}`)
        return
      }
    }

    ipcRenderer.send('run-command', project, command)
  },

  // 事件监听
  onCommandOutput: (callback) => {
    const handler = (event, data) => callback(data)
    ipcRenderer.on('command-output', handler)
    return () => ipcRenderer.removeListener('command-output', handler)
  },
  onProjectStatusUpdated: (callback) => {
    const handler = (event, projectId, status, profileId) => callback(projectId, status, profileId)
    ipcRenderer.on('project-status-updated', handler)
    return () => ipcRenderer.removeListener('project-status-updated', handler)
  },

  // 向运行中的进程发送输入
  sendCommandInput: (projectId, input) => {
    ipcRenderer.send('send-command-input', projectId, input)
  },
})
