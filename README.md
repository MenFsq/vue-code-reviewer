# Vue Code Reviewer 🐯

一个专为Vue 3 + TypeScript项目设计的智能代码审查技能，基于OpenClaw的微内核架构。

## ✨ 特性

### 🎯 智能审查
- **分层规则系统**：基础规则 + 项目特定规则
- **上下文感知**：根据文件类型动态加载规则
- **渐进式反馈**：先展示关键问题，再提供详细建议
- **智能修复**：自动修复常见问题

### 📊 多维度检查
- **代码质量**：语法、类型、风格
- **性能优化**：重复渲染、大列表、异步加载
- **安全风险**：XSS漏洞、敏感信息泄露
- **最佳实践**：Vue 3 Composition API、TypeScript类型安全

### 🔧 灵活集成
- **命令行工具**：手动触发审查
- **Git钩子**：提交前自动审查
- **CI/CD集成**：GitHub Actions、GitLab CI
- **编辑器插件**：VSCode、WebStorm

## 🚀 快速开始

### 1. 安装技能
```bash
# 克隆仓库（使用master分支）
git clone https://github.com/MenFsq/vue-code-reviewer.git

# 复制到OpenClaw技能目录
cp -r vue-code-reviewer ~/.openclaw/workspace/skills/
```

### 2. 配置项目
```bash
# 进入你的Vue项目
cd your-vue-project

# 运行安装脚本
npx openclaw exec --skill vue-code-reviewer --install
```

### 3. 运行审查
```bash
# 审查整个项目
npx openclaw exec --skill vue-code-reviewer --project .

# 审查单个文件
npx openclaw exec --skill vue-code-reviewer --file src/components/MyComponent.vue

# 审查暂存文件
npx openclaw exec --skill vue-code-reviewer --staged
```

## 📋 输出示例

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

## 🚀 飞书文档集成

### 自动保存审查报告到飞书文档

vue-code-reviewer 现在支持将审查报告自动保存到飞书文档，方便团队协作和知识沉淀。

#### 特性
- **自动创建结构化报告** — 将审查结果按章节写入飞书文档
- **智能文件夹管理** — 自动创建"代码审查报告/项目名/年份/月份"层级文件夹
- **团队协作支持** — 支持分享给团队成员，开启评论功能
- **历史记录追踪** — 生成审查报告索引，方便查看历史记录

#### 快速开始
```bash
# 1. 配置飞书应用凭证
export FEISHU_APP_ID=your_app_id
export FEISHU_APP_SECRET=your_app_secret

# 2. 运行审查并保存到飞书
vue-code-reviewer --feishu --project ./my-vue-project

# 或通过 OpenClaw
npx openclaw exec --skill vue-code-reviewer --feishu --project ./my-vue-project
```

#### 详细配置
参考 [飞书配置指南](docs/feishu-setup-guide.md) 获取完整配置说明。

#### 架构设计
采用三层封装架构：
1. **基础客户端层** — 处理认证、重试、错误处理、速率限制
2. **业务逻辑层** — 将审查结果转换为飞书文档块
3. **集成接口层** — 提供简洁的API，隐藏底层复杂性

## ⚙️ 配置

### 配置文件 `.openclaw/config.json`
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
        "checkDuplicateRenders": true
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

### 自定义规则 `.vue-code-reviewer-rules.js`
```javascript
module.exports = {
  rules: {
    'no-global-state-in-composables': {
      check: (fileContent, filePath) => {
        // 自定义检查逻辑
      },
      message: '避免在Composable中使用全局状态',
      suggestion: '使用provide/inject或Pinia store'
    }
  }
};
```

## 🔗 集成

### Git钩子
自动在提交前运行代码审查：
```bash
# .git/hooks/pre-commit
npx openclaw exec --skill vue-code-reviewer --staged
```

### GitHub Actions
```yaml
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

### VSCode扩展
在保存时自动审查：
```json
{
  "vueCodeReviewer.autoReviewOnSave": true,
  "vueCodeReviewer.showInlineSuggestions": true
}
```

## 📈 性能优化

### 增量审查
只审查变更的文件：
```bash
npx openclaw exec --skill vue-code-reviewer --changed --since HEAD~1
```

### 缓存机制
避免重复分析：
```bash
npx openclaw exec --skill vue-code-reviewer --use-cache --project .
```

### 并行处理
多文件并行审查：
```bash
npx openclaw exec --skill vue-code-reviewer --parallel --project .
```

## 🛠️ 开发

### 项目结构
```
vue-code-reviewer/
├── reviewer.js          # 核心审查引擎
├── install.js          # 安装脚本
├── SKILL.md           # 技能文档
├── config-template.json # 配置模板
├── package.json       # 项目配置
└── README.md         # 使用文档
```

### 添加新规则
1. 在 `reviewer.js` 中添加规则定义
2. 实现检查逻辑
3. 更新文档
4. 添加测试

### 运行测试
```bash
npm test
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！请阅读[贡献指南](CONTRIBUTING.md)和[行为准则](CODE_OF_CONDUCT.md)。

### 贡献步骤
1. Fork仓库到你的GitHub账户
2. 克隆你的fork到本地：
   ```bash
   git clone https://github.com/你的用户名/vue-code-reviewer.git
   cd vue-code-reviewer
   ```
3. 创建功能分支：
   ```bash
   git checkout -b feature/你的功能名称
   ```
4. 进行更改并提交：
   ```bash
   git add .
   git commit -m '描述你的更改'
   ```
5. 推送到你的fork：
   ```bash
   git push origin feature/你的功能名称
   ```
6. 在GitHub上创建Pull Request到原仓库的`master`分支

### 开发规范
- 使用ESLint进行代码检查
- 编写清晰的提交信息
- 添加测试用例
- 更新相关文档

## 📄 许可证

MIT License © 2026 小老虎

## 🌐 社区

### BotLearn 社区讨论
- [vue-code-reviewer 新增飞书文档集成](https://www.botlearn.ai/community/post/17bfe97c-5d11-44ed-8d29-d6016200a1ee) - 最新功能发布
- [Vue 3 项目中的 OpenClaw 记忆架构实战](https://www.botlearn.ai/community/post/e4ebc850-2113-43a9-b813-ea586856e82d) - 深度技术分享
- [vue-code-reviewer：Vue 3 代码自动审查 Skill 发布](https://www.botlearn.ai/community/post/850c3687-edef-4502-b88d-c71b89acab7d) - 项目介绍

### 技术交流
- 在 BotLearn 社区参与技术讨论
- 分享使用经验和最佳实践
- 提出功能建议和改进意见

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) - 强大的AI助手平台
- [Vue.js](https://vuejs.org) - 渐进式JavaScript框架
- [TypeScript](https://typescriptlang.org) - JavaScript的超集
- [BotLearn社区](https://botlearn.ai) - AI代理学习平台
- [飞书开放平台](https://open.feishu.cn) - 企业级协作平台API

## 📞 支持

- 问题报告：[GitHub Issues](https://github.com/MenFsq/vue-code-reviewer/issues)
- 功能请求：[GitHub Discussions](https://github.com/MenFsq/vue-code-reviewer/discussions)
- 文档：[技能文档](./SKILL.md)

---

**Made with ❤️ by 小老虎 🐯**
