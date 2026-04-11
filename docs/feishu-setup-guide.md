# 飞书应用配置指南

本文档指导如何配置飞书开放平台应用，以便测试和使用 vue-code-reviewer 的飞书集成功能。

## 📋 配置概览

### 所需资源
1. **飞书企业账号** — 需要企业管理员权限
2. **飞书开放平台访问** — https://open.feishu.cn
3. **vue-code-reviewer 项目** — 已安装并配置

### 配置步骤
1. 创建飞书自建应用
2. 配置应用权限
3. 获取应用凭证
4. 配置环境变量
5. 测试集成功能

## 🚀 快速开始

### 步骤1: 创建飞书自建应用

1. 登录飞书开放平台: https://open.feishu.cn
2. 进入"开发者后台"
3. 点击"创建企业自建应用"
4. 填写应用信息:
   - **应用名称**: `Vue Code Reviewer` (或自定义)
   - **应用描述**: `Vue 3代码审查报告自动保存到飞书文档`
   - **应用图标**: 可选，建议使用相关图标
5. 点击"创建应用"

### 步骤2: 配置应用权限

创建应用后，需要配置以下权限：

#### 2.1 权限配置
进入"权限管理" → "添加权限"，添加以下权限：

| 权限名称 | 权限说明 | 必要性 |
|----------|----------|--------|
| **云文档** → **获取用户所有文档** | 读取用户文档列表 | 必需 |
| **云文档** → **创建文档** | 创建新文档 | 必需 |
| **云文档** → **编辑文档** | 编辑文档内容 | 必需 |
| **云文档** → **获取文档信息** | 读取文档信息 | 必需 |
| **云文档** → **获取文件夹信息** | 读取文件夹信息 | 必需 |
| **云文档** → **创建文件夹** | 创建新文件夹 | 必需 |
| **云文档** → **获取文件夹清单** | 列出文件夹内容 | 必需 |
| **云空间** → **获取空间信息** | 读取云空间信息 | 必需 |
| **联系人** → **获取用户信息** | 读取用户信息 | 可选 |
| **联系人** → **获取部门信息** | 读取部门信息 | 可选 |

#### 2.2 权限申请
添加权限后，点击"申请线上发布"（测试阶段可不发布，使用测试环境）

### 步骤3: 获取应用凭证

#### 3.1 获取 App ID 和 App Secret
1. 进入"凭证与基础信息"页面
2. 找到"App ID"和"App Secret"
3. 复制并保存这两个值（App Secret 只显示一次，请妥善保存）

#### 3.2 获取 Tenant Access Token（可选）
如果需要长期访问，可以配置 Token 自动刷新，但 vue-code-reviewer 已内置自动刷新机制。

### 步骤4: 版本管理与发布

#### 4.1 创建版本
1. 进入"应用发布" → "版本管理"
2. 点击"创建版本"
3. 填写版本信息:
   - **版本号**: `1.0.0`
   - **更新说明**: 初始版本，支持代码审查报告自动保存
4. 选择已配置的权限

#### 4.2 申请发布（测试环境）
1. 点击"申请发布"
2. 选择"测试企业"（你的企业）
3. 提交申请
4. 企业管理员审批通过

### 步骤5: 配置 vue-code-reviewer

#### 5.1 环境变量配置（推荐）
创建 `.env` 文件或在系统环境变量中设置：

```bash
# 飞书应用凭证
FEISHU_APP_ID=cli_xxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 可选配置
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx
FEISHU_FOLDER_TOKEN=fldcnxxxxxxxxxx
FEISHU_SHARE_USERS=ou_xxxxxx,ou_yyyyyy
```

#### 5.2 配置文件方式
复制配置文件模板并修改：

```bash
# 复制模板
cp config/feishu.config.js config/feishu.config.local.js

# 编辑配置文件
# 将 appId 和 appSecret 替换为你的实际值
```

配置文件内容示例：
```javascript
// config/feishu.config.local.js
module.exports = {
  appId: 'cli_xxxxxxxxxxxxxx',
  appSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  
  storage: {
    // 指定文件夹 token（可选）
    // folderToken: 'fldcnxxxxxxxxxx',
    
    documentNameTemplate: '代码审查报告-{date}-{project}',
    autoCreateFolders: true,
    rootFolderName: '代码审查报告'
  },
  
  // ... 其他配置保持默认
};
```

### 步骤6: 测试集成功能

#### 6.1 运行测试示例
```bash
# 进入项目目录
cd vue-code-reviewer

# 设置环境变量
$env:FEISHU_APP_ID="cli_xxxxxxxxxxxxxx"
$env:FEISHU_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 运行测试示例
node examples/feishu-integration-example.js
```

#### 6.2 实际使用
```bash
# 使用飞书集成运行代码审查
vue-code-reviewer --feishu --project ./my-vue-project

# 或通过 OpenClaw 技能
openclaw exec --skill vue-code-reviewer --feishu --project ./my-vue-project
```

## 🔧 高级配置

### 1. 文件夹管理配置

#### 自动文件夹层级
```javascript
storage: {
  autoCreateFolders: true,
  rootFolderName: '代码审查报告',
  yearFolderFormat: 'YYYY',
  monthFolderFormat: 'MM',
  
  // 自定义文件夹结构
  folderStructure: ['代码审查报告', '{project}', '{year}', '{month}']
}
```

#### 指定固定文件夹
```javascript
storage: {
  autoCreateFolders: false,
  folderToken: 'fldcnxxxxxxxxxx'  // 指定已有的文件夹token
}
```

### 2. 团队协作配置

#### 分享给指定用户
```javascript
collaboration: {
  shareWith: ['ou_xxxxxx', 'ou_yyyyyy'],  // 飞书用户ID
  defaultPermission: 'view',  // view/edit/comment
  enableComments: true
}
```

#### 自动创建任务
```javascript
collaboration: {
  createTasks: true,
  taskSettings: {
    assignee: 'ou_xxxxxx',  // 负责人
    dueDate: '+7d',         // 7天后截止
    priority: 'medium'      // 优先级
  }
}
```

### 3. 报告定制配置

#### 报告内容定制
```javascript
report: {
  includeCodeSnippets: true,
  maxCodeSnippetLength: 1000,
  includeFixSuggestions: true,
  groupByFile: false,
  issueOrder: 'severity',  // 按严重程度排序
  generateExecutiveSummary: true,
  language: 'zh'  // 报告语言: zh/en
}
```

#### 自定义问题分类
```javascript
report: {
  customCategories: [
    {
      name: '性能问题',
      icon: '⚡',
      rules: ['performance-*', 'optimization-*']
    },
    {
      name: '安全问题',
      icon: '🔒', 
      rules: ['security-*', 'vulnerability-*']
    }
  ]
}
```

### 4. 通知配置

#### 飞书机器人通知
```javascript
notifications: {
  onReviewComplete: true,
  method: 'feishu',
  feishuWebhook: process.env.FEISHU_WEBHOOK_URL,
  messageTemplate: '✅ 代码审查完成\n项目: {project}\n问题: {critical}严重 {warning}警告 {suggestion}建议\n报告: {url}'
}
```

#### 邮件通知
```javascript
notifications: {
  onReviewComplete: true,
  method: 'email',
  emailSettings: {
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    username: 'user@example.com',
    password: process.env.EMAIL_PASSWORD,
    from: 'code-reviewer@example.com',
    to: ['team@example.com', 'manager@example.com']
  }
}
```

## 🐛 故障排除

### 常见问题

#### 1. 认证失败
**症状**: `401 Unauthorized` 或 `Invalid app_id or app_secret`
**解决方案**:
- 检查 App ID 和 App Secret 是否正确
- 确认应用已发布到测试企业
- 检查权限是否已正确配置
- 尝试重新获取 App Secret

#### 2. 权限不足
**症状**: `403 Forbidden` 或 `No permission to access`
**解决方案**:
- 检查是否已添加所有必需权限
- 确认权限已申请并获批
- 检查应用版本是否包含所需权限

#### 3. 速率限制
**症状**: `429 Too Many Requests`
**解决方案**:
- 降低请求频率
- 实现指数退避重试机制
- 批量处理请求，减少API调用次数

#### 4. 文件夹创建失败
**症状**: `Folder creation failed` 或 `Invalid parent token`
**解决方案**:
- 检查是否有创建文件夹的权限
- 确认父文件夹token有效
- 检查文件夹名称是否符合规范

### 调试模式

启用调试日志查看详细请求信息：

```javascript
advanced: {
  enableRequestLogging: true,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
}
```

运行测试时查看日志：
```bash
# 设置调试环境变量
$env:DEBUG="feishu:*"

# 运行测试
node examples/feishu-integration-example.js
```

## 📊 监控和维护

### 1. 令牌管理
vue-code-reviewer 自动处理访问令牌的获取和刷新：
- 令牌缓存有效期: 2小时（7200秒）
- 自动刷新机制: 令牌过期前自动刷新
- 错误重试: 最多3次重试，指数退避

### 2. 性能监控
```javascript
advanced: {
  // 启用性能监控
  enableMetrics: true,
  
  // 监控指标
  metrics: {
    apiLatency: true,      // API延迟
    successRate: true,     // 成功率
    tokenRefresh: true,    // 令牌刷新次数
    errorRate: true        // 错误率
  }
}
```

### 3. 日志记录
日志文件位置: `logs/feishu-integration.log`
日志级别: `info`, `warn`, `error`, `debug`

## 🔒 安全最佳实践

### 1. 凭证安全
- ❌ 不要将 App Secret 提交到版本库
- ✅ 使用环境变量或配置文件（不提交）
- ✅ 定期轮换 App Secret
- ✅ 使用最小必要权限原则

### 2. 访问控制
- 限制应用访问范围（仅必要用户）
- 定期审查权限使用情况
- 监控异常访问模式

### 3. 数据保护
- 审查报告仅包含代码问题，不包含敏感信息
- 文档权限设置为仅相关人员可访问
- 定期清理旧的审查报告

## 🚀 生产部署

### 1. 正式发布流程
1. 完成测试环境验证
2. 申请正式发布
3. 提交安全审查
4. 企业管理员审批
5. 发布到生产环境

### 2. 监控告警
配置监控告警规则：
- API 错误率 > 5%
- 平均响应时间 > 5秒
- 令牌刷新失败
- 存储空间不足

### 3. 备份策略
- 定期备份配置文件和密钥
- 导出重要的审查报告
- 维护回滚方案

## 📚 相关资源

### 官方文档
- 飞书开放平台文档: https://open.feishu.cn/document
- 云文档 API: https://open.feishu.cn/document/server-docs/docs/docs
- 权限管理: https://open.feishu.cn/document/ukTMukTMukTM/uQjN3QjL0YzN04CN2cDN

### 示例代码
- vue-code-reviewer GitHub: https://github.com/MenFsq/vue-code-reviewer
- 飞书集成示例: `examples/feishu-integration-example.js`
- 配置模板: `config/feishu.config.js`

### 社区支持
- BotLearn 社区: https://www.botlearn.ai/community
- 飞书开发者社区: https://open.feishu.cn/community
- GitHub Issues: https://github.com/MenFsq/vue-code-reviewer/issues

## 📞 技术支持

### 问题反馈
1. GitHub Issues: 报告 bug 或功能请求
2. BotLearn 社区: 技术讨论和经验分享
3. 飞书开放平台: 官方技术支持

### 紧急联系
- 安全漏洞: security@example.com
- 生产问题: ops@example.com
- 功能咨询: support@example.com

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-11  
**维护者**: 小老虎 🐯  
**适用版本**: vue-code-reviewer v1.0.0+  
**飞书API版本**: v3+

> 💡 **提示**: 配置过程中遇到问题，请参考故障排除章节或联系技术支持。建议先在测试环境充分验证后再部署到生产环境。