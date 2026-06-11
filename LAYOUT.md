# 程序布局说明

## 最近优化 (2026-02-02)

### 代码质量改进
1. **提取 ScrollableText 组件** - 消除 90+ 行重复代码
2. **创建集中式过滤工具** - `src/renderer/utils/projectFilters.ts`
3. **统一常量管理** - `src/renderer/utils/constants.ts`
4. **移除 CSS 重复** - 清理 VirtualProjectList.css 中的重复主题变量
5. **添加 React.memo** - BatchActions 组件优化
6. **改进错误处理** - LogViewer 复制功能添加用户反馈
7. **统一日志工具** - `src/renderer/utils/logger.ts`
8. **类型导入优化** - 使用 `import type` 提升 tree-shaking

### 新增文件
- `src/renderer/components/ScrollableText.tsx` - 可滚动文本组件
- `src/renderer/components/ScrollableText.css`
- `src/renderer/utils/projectFilters.ts` - 项目过滤工具
- `src/renderer/utils/logger.ts` - 统一日志工具

## 侧边栏 (ProjectSidebar)
- **宽度**: 600px
- **位置**: 左侧
- **文件**: `src/renderer/components/ProjectSidebar.css`

### 侧边栏顶部按钮区域 (sidebar-top-actions)
- **布局**: 2x2 网格布局
- **按钮**:
  1. 添加项目 (+ 添加项目)
  2. 批量导入 (🔍 批量导入)
  3. 切换视图 (☰/▦)
  4. 批量操作 (☑ 批量操作)

### CSS 设置
```css
.sidebar {
  width: 600px;
  min-width: 600px;
}

.sidebar-top-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
```

## 项目列表

### 网格视图 (viewMode === 'grid')
- **布局**: 每行 2 个项目
- **CSS**:
  - `ProjectList.css`: `grid-template-columns: repeat(2, 1fr);`
  - `VirtualProjectList.css`: `grid-template-columns: repeat(2, 1fr);`

### 列表视图 (viewMode === 'list')
- **布局**: 每行 1 个项目（单列）
- **CSS**: `grid-template-columns: 1fr;` 或 `flex-direction: column;`

### 虚拟滚动
- **仅在列表视图下启用**: `useVirtualScroll = viewMode === 'list' && filteredProjects.length > 20`
- **网格视图下禁用**: 因为网格布局与绝对定位不兼容

## 批量操作 (BatchActions)
- **不使用 span**: 正常参与 2x2 网格布局
- **激活时**: 显示批量操作面板（全选、批量启动、批量停止、批量删除）

## 相关文件
| 文件 | 用途 |
|------|------|
| `src/renderer/components/ProjectSidebar.css` | 侧边栏样式 |
| `src/renderer/components/ProjectList.css` | 普通项目列表样式 |
| `src/renderer/components/VirtualProjectList.css` | 虚拟滚动项目列表样式 |
| `src/renderer/components/VirtualProjectList.tsx` | 虚拟滚动组件逻辑 |
| `src/renderer/components/BatchActions.css` | 批量操作样式 |
