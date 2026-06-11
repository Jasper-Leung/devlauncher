import type { ProjectConfig } from '../../shared/types'

export function getGroupsFromProjects(projects: ProjectConfig[]): string[] {
  const groups = new Set<string>()
  projects.forEach((project) => {
    if (project.group) {
      groups.add(project.group)
    }
  })
  return Array.from(groups).sort()
}

export function isProjectRunning(project: ProjectConfig): boolean {
  return project.status === 'running'
}

export function getDefaultProfile(project: ProjectConfig) {
  return project.startupProfiles.find((p) => p.isDefault) || project.startupProfiles[0]
}

export function getProjectTags(project: ProjectConfig): string[] {
  return project.tags || []
}
