import type { ProjectConfig } from '../../shared/types'

/**
 * 项目过滤选项
 */
export interface ProjectFilterOptions {
  /** 搜索关键词 */
  searchQuery: string
  /** 选中的分组ID，null表示显示所有 */
  selectedGroup: string | null
  /** 要排除的标签数组，项目包含这些标签中的任何一个都会被排除 */
  excludedTags?: string[]
}

/**
 * 根据搜索关键词、分组和排除标签过滤项目列表
 *
 * @param projects - 原始项目列表
 * @param options - 过滤选项
 * @returns 过滤后的项目列表
 */
export function filterProjects(
  projects: ProjectConfig[],
  options: ProjectFilterOptions
): ProjectConfig[] {
  const { searchQuery, selectedGroup, excludedTags = [] } = options

  return projects.filter((project) => {
    // 搜索过滤
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())

    // 分组过滤
    const matchesGroup = !selectedGroup || project.group === selectedGroup

    // 排除标签过滤 - 如果项目包含任何被排除的标签，则过滤掉
    const matchesExcludedTags =
      excludedTags.length === 0 ||
      !project.tags ||
      !excludedTags.some((excludedTag) => project.tags!.includes(excludedTag))

    return matchesSearch && matchesGroup && matchesExcludedTags
  })
}

/**
 * 获取所有唯一的分组名称
 *
 * @param projects - 项目列表
 * @returns 分组名称数组（已排序）
 */
export function getUniqueGroups(projects: ProjectConfig[]): string[] {
  const groups = new Set<string>()

  projects.forEach((project) => {
    if (project.group) {
      groups.add(project.group)
    }
  })

  return Array.from(groups).sort()
}

/**
 * 获取所有唯一的标签
 *
 * @param projects - 项目列表
 * @returns 标签数组（已排序）
 */
export function getUniqueTags(projects: ProjectConfig[]): string[] {
  const tags = new Set<string>()

  projects.forEach((project) => {
    project.tags?.forEach((tag) => {
      tags.add(tag)
    })
  })

  return Array.from(tags).sort()
}
