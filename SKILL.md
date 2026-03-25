# Vue Code Reviewer Skill

一个用于Vue 3 + TypeScript项目的代码审查技能，基于OpenClaw的微内核架构设计。

## 功能特性

### 核心功能
1. **分层规则系统**：基础规则（ESLint/Vue官方推荐）+ 项目特定规则
2. **上下文感知**：根据文件类型动态加载相关规则
3. **渐进式反馈**：先展示关键问题，再提供详细修复建议
4. **智能建议**：基于最佳实践的代码改进建议

### 审查维度
- **代码质量**：语法错误、类型错误、代码风格
- **性能优化**：重复渲染、大列表、异步加载
- **安全风险**：XSS漏洞、敏感信息泄露
- **最佳实践**：Vue 3 Composition API、TypeScript类型安全

## 安装与配置

### 1. 安装技能
```bash
# 将技能目录复制到OpenClaw技能目录
cp -r vue-code-reviewer ~/.openclaw/workspace/skills/
```

### 2. 配置文件
在项目根目录创建 `.openclaw/config.json`：

```json
{
  "vueCodeReviewer": {
    "enabled": true,
    "rules": {
      "quality": {
        "enforceTypeSafety": true,
        "strictNullChecks": true,
        "noExplicitAny": true
      },
      "performance": {
        "checkLargeLists": true,
        "checkDuplicateRenders": true,
        "checkAsyncComponents": true
      },
      "security": {
        "checkXSS": true,
        "checkSensitiveData": true
      }
    },
    "thresholds": {
      "criticalIssues": 0,
      "majorIssues": 3,
      "minorIssues": 10
    }
  }
}
```

## 使用方法

### 1. 手动触发审查
```bash
# 审查单个文件
openclaw exec --skill vue-code-reviewer --file src/components/MyComponent.vue

# 审查整个项目
openclaw exec --skill vue-code-reviewer --project .
```

### 2. 集成到工作流
```bash
# 在Git钩子中自动审查
# .git/hooks/pre-commit
openclaw exec --skill vue-code-reviewer --staged
```

### 3. 定期自动审查
```json
{
  "schedule": {
    "kind": "cron",
    "expr": "0 9 * * 1-5",
    "tz": "Asia/Shanghai"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "运行Vue代码审查，检查项目质量"
  }
}
```

## 规则系统

### 基础规则（内置）
1. **Vue官方规则**
   - 组件命名规范
   - Props类型定义
   - 事件处理规范
   - 生命周期使用

2. **TypeScript规则**
   - 类型定义完整性
   - 泛型使用规范
   - 接口设计原则

3. **性能规则**
   - 避免不必要的重新渲染
   - 合理使用计算属性和侦听器
   - 组件懒加载

### 项目特定规则
从 `.openclaw/config.json` 读取，支持：
- 自定义代码风格
- 项目特定的最佳实践
- 团队约定规则

## 输出格式

### 1. 控制台输出
```
🔍 Vue Code Review Report
═══════════════════════════════════════════════════════════════════════════════

📁 File: src/components/UserList.vue
───────────────────────────────────────────────────────────────────────────────

❌ Critical Issues (1)
  • Line 45: Potential XSS vulnerability - user input not sanitized
    Suggestion: Use `v-html` with caution or sanitize with DOMPurify

⚠️  Major Issues (3)
  • Line 23: Large list without virtualization (100+ items)
    Suggestion: Use `vue-virtual-scroller` or implement pagination
  • Line 67: Missing key in v-for directive
    Suggestion: Add unique `:key` binding
  • Line 89: Async component without loading/error states
    Suggestion: Add `suspense` or loading fallback

💡 Minor Issues (5)
  • Line 12: Type `any` used - prefer explicit types
  • Line 34: Computed property could be memoized
  • Line 56: Event handler could be debounced
  • Line 78: CSS scoping could be improved
  • Line 91: Import order not consistent

✅ Passed Checks (42)
  • Props properly typed ✓
  • Component name follows convention ✓
  • No unused imports ✓
  • ... (38 more)

📊 Summary
  • Files reviewed: 1
  • Total issues: 9 (1 critical, 3 major, 5 minor)
  • Quality score: 78/100
  • Recommendation: Fix critical issue before commit
```

### 2. JSON报告
```json
{
  "summary": {
    "filesReviewed": 1,
    "totalIssues": 9,
    "criticalIssues": 1,
    "majorIssues": 3,
    "minorIssues": 5,
    "qualityScore": 78,
    "passedChecks": 42
  },
  "files": [
    {
      "path": "src/components/UserList.vue",
      "issues": [...],
      "suggestions": [...]
    }
  ],
  "timestamp": "2026-03-25T15:30:00Z"
}
```

### 3. Markdown报告
自动生成可读性强的Markdown报告，适合分享和存档。

## 集成示例

### 1. 与CI/CD集成
```yaml
# .github/workflows/code-review.yml
name: Vue Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Vue Code Review
        run: |
          npx openclaw exec --skill vue-code-reviewer --project .
```

### 2. 与编辑器集成
```json
// .vscode/settings.json
{
  "vueCodeReviewer.autoReviewOnSave": true,
  "vueCodeReviewer.showInlineSuggestions": true
}
```

## 高级功能

### 1. 智能修复
对于某些类型的问题，技能可以提供自动修复：
```bash
# 尝试自动修复可修复的问题
openclaw exec --skill vue-code-reviewer --file src/components/MyComponent.vue --fix
```

### 2. 自定义规则
创建自定义规则文件 `.vue-code-reviewer-rules.js`：
```javascript
module.exports = {
  rules: {
    'no-global-state-in-composables': {
      check: (node, context) => {
        // 自定义检查逻辑
      },
      message: '避免在Composable中使用全局状态',
      suggestion: '使用provide/inject或Pinia store'
    }
  }
};
```

### 3. 学习模式
技能会学习项目的代码模式，提供更精准的建议：
```bash
# 启用学习模式
openclaw exec --skill vue-code-reviewer --learn --project .
```

## 性能优化

### 1. 增量审查
只审查变更的文件，提高审查速度：
```bash
openclaw exec --skill vue-code-reviewer --changed --since HEAD~1
```

### 2. 缓存机制
审查结果缓存，避免重复分析：
```bash
openclaw exec --skill vue-code-reviewer --use-cache --project .
```

### 3. 并行处理
支持多文件并行审查：
```bash
openclaw exec --skill vue-code-reviewer --parallel --project .
```

## 故障排除

### 常见问题
1. **技能未找到**
   ```bash
   # 检查技能目录
   ls ~/.openclaw/workspace/skills/
   ```

2. **配置文件错误**
   ```bash
   # 验证配置文件
   openclaw exec --skill vue-code-reviewer --validate-config
   ```

3. **性能问题**
   ```bash
   # 启用详细日志
   openclaw exec --skill vue-code-reviewer --verbose --project .
   ```

### 调试模式
```bash
# 启用调试输出
OPENCLAW_DEBUG=1 openclaw exec --skill vue-code-reviewer --project .
```

## 贡献指南

### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/your-username/vue-code-reviewer.git

# 安装依赖
cd vue-code-reviewer
npm install

# 运行测试
npm test
```

### 添加新规则
1. 在 `rules/` 目录创建新规则文件
2. 实现规则检查逻辑
3. 添加测试用例
4. 更新文档

### 提交规范
- 使用Conventional Commits
- 添加测试用例
- 更新文档和示例

## 许可证
MIT License

## 支持
- 问题报告：GitHub Issues
- 功能请求：GitHub Discussions
- 文档：https://vue-code-reviewer-docs.example.com