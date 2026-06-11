# 贡献指南

感谢你有兴趣为 DevLauncher 做出贡献！本文档将指导你如何参与项目开发。

## 行为准则

- 尊重所有贡献者
- 保持友好和包容的态度
- 接受建设性批评
- 关注对社区最有利的事情

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](https://github.com/your-username/devlauncher/issues) 是否已有人报告
2. 如果没有，创建一个新的 Issue，包含：
   - 清晰的标题
   - 详细的 Bug 描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（操作系统、Electron 版本等）

### 提出功能建议

我们欢迎功能建议！请：

1. 先检查是否已有类似建议
2. 创建一个 Feature Request Issue，说明：
   - 功能描述
   - 使用场景
   - 可能的实现方案

### 提交代码

#### 准备工作

1. Fork 本仓库
2. 克隆你的 Fork：
   ```bash
   git clone https://github.com/your-username/devlauncher.git
   cd devlauncher
   ```
3. 添加上游远程仓库：
   ```bash
   git remote add upstream https://github.com/original-owner/devlauncher.git
   ```
4. 安装依赖：
   ```bash
   npm install
   ```

#### 开发流程

1. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. 进行开发，遵循以下规范：
   - 使用 TypeScript
   - 遵循 ESLint 规则
   - 添加必要的注释
   - 保持代码简洁清晰

3. 运行测试：
   ```bash
   npm run lint
   npm run test
   ```

4. 提交代码：
   ```bash
   git add .
   git commit -m "feat: add xxx feature"
   # 或
   git commit -m "fix: resolve xxx issue"
   ```

   提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
   - `feat`: 新功能
   - `fix`: Bug 修复
   - `docs`: 文档更新
   - `style`: 代码格式调整
   - `refactor`: 重构
   - `test`: 测试相关
   - `chore`: 构建/工具相关

5. 推送到你的 Fork：
   ```bash
   git push origin feature/your-feature-name
   ```

6. 创建 Pull Request

#### Pull Request 规范

创建 PR 时，请确保：

- 标题清晰描述变更内容
- 描述中详细说明改动内容和原因
- 关联相关的 Issue
- 通过所有 CI 检查
- 请求合并到 `main` 分支

## 代码规范

### TypeScript

- 使用有意义的变量和函数名
- 为函数添加 JSDoc 注释
- 定义明确的类型

### React

- 使用函数组件
- 使用 Hooks 管理状态
- 组件保持单一职责
- Props 定义清晰

### CSS

- 使用 BEM 或类似命名规范
- 保持样式模块化
- 使用 CSS 变量管理主题

## 测试

- 为新功能添加测试
- 确保所有测试通过
- 测试覆盖率不应降低

## 文档

- 更新相关文档
- 添加必要的注释
- 更新 README（如需要）

## 获取帮助

如果你有任何问题：

- 查看 [文档](README.md)
- 搜索 [Issues](https://github.com/your-username/devlauncher/issues)
- 创建新的 Issue 或 Discussion

再次感谢你的贡献！
