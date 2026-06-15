import { useState, useCallback, useEffect } from 'react'
import type { ProjectConfig } from '../../shared/types'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await window.electronAPI.getProjects()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载项目失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const addProject = useCallback(
    async (project: Omit<ProjectConfig, 'id' | 'status'>) => {
      const result = await window.electronAPI.addProject(project)
      await loadProjects()
      return result
    },
    [loadProjects]
  )

  const updateProject = useCallback(
    async (id: string, updates: Partial<ProjectConfig>) => {
      await window.electronAPI.updateProject(id, updates)
      await loadProjects()
    },
    [loadProjects]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      await window.electronAPI.deleteProject(id)
      await loadProjects()
    },
    [loadProjects]
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化加载项目数据
    loadProjects()
  }, [loadProjects])

  return {
    projects,
    loading,
    error,
    loadProjects,
    addProject,
    updateProject,
    deleteProject,
  }
}
