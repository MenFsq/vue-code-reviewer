# Feishu 集成功能设计

## 目标
将 vue-code-reviewer 的代码审查报告自动保存到飞书文档，便于团队协作和长期跟踪。

## 功能特性
1. **自动创建文档** — 每次审查生成新的飞书文档
2. **结构化报告** — 将审查结果（严重/警告/建议）按章节写入
3. **历史记录** — 在飞书云空间建立审查历史目录
4. **团队协作** — 支持@团队成员、评论、任务分配

## 技术实现

### 依赖
- `feishu-common` — 认证和基础 API
- `feishu-doc` — 文档读写
- `feishu-drive` — 云存储管理

### 文件结构
```
vue-code-reviewer/
├── src/
│   ├── feishu/
│   │   ├── client.js          # 飞书 API 客户端
│   │   ├── document-builder.js # 文档构建器
│   │   └── drive-manager.js   # 云存储管理
│   └── integrations/
│       └── feishu-integration.js # 主集成模块
├── config/
│   └── feishu.config.js       # 飞书配置模板
└── examples/
    └── feishu-integration-example.js
```

### API 设计
```javascript
// 主要接口
class FeishuIntegration {
  constructor(config) {
    this.client = new FeishuClient(config);
    this.drive = new DriveManager(this.client);
    this.docBuilder = new DocumentBuilder();
  }

  // 创建审查报告文档
  async createReviewReport(reviewResult, options = {}) {
    // 1. 在指定文件夹创建文档
    // 2. 写入报告标题和摘要
    // 3. 按问题分类写入内容
    // 4. 返回文档链接
  }

  // 更新现有文档（追加新审查结果）
  async appendReviewToDocument(docToken, reviewResult) {
    // 追加新的审查结果到文档末尾
  }

  // 获取历史审查文档列表
  async getReviewHistory(folderToken, limit = 20) {
    // 列出指定文件夹的所有审查文档
  }
}
```

### 配置示例
```javascript
// feishu.config.js
module.exports = {
  // 飞书应用凭证
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,

  // 文档存储设置
  storage: {
    // 云空间文件夹 token（可选，自动创建）
    folderToken: 'fldcnxxxx',
    // 文档命名模板
    documentNameTemplate: '代码审查报告-{date}-{project}',
    // 默认文档结构
    defaultSections: [
      '项目概况',
      '审查摘要',
      '严重问题',
      '警告问题',
      '建议改进',
      '修复建议'
    ]
  },

  // 团队协作设置
  collaboration: {
    // 默认分享给的用户/部门
    shareWith: ['ou_xxxx'],
    // 是否开启评论
    enableComments: true,
    // 是否创建跟进任务
    createTasks: false
  }
};
```

## 使用方式

### 1. 命令行集成
```bash
# 启用飞书集成
npx openclaw exec --skill vue-code-reviewer --feishu --config ./feishu.config.js

# 指定输出文件夹
npx openclaw exec --skill vue-code-reviewer --feishu --folder fldcnxxxx
```

### 2. 代码调用
```javascript
const { FeishuIntegration } = require('./src/integrations/feishu-integration');
const reviewResult = await runCodeReview(projectPath);

const feishu = new FeishuIntegration(config);
const docUrl = await feishu.createReviewReport(reviewResult, {
  projectName: 'my-vue-project',
  shareWith: ['ou_team_member1', 'ou_team_member2']
});

console.log(`审查报告已保存到飞书: ${docUrl}`);
```

### 3. OpenClaw 技能集成
```javascript
// 在技能主文件中添加飞书选项
module.exports = {
  name: 'vue-code-reviewer',
  description: 'Vue 3 代码审查工具',
  options: {
    feishu: {
      type: 'boolean',
      description: '是否保存到飞书文档'
    },
    'feishu-folder': {
      type: 'string',
      description: '飞书文件夹 token'
    }
  },
  // ...
};
```

## 实施计划

### 阶段一：基础集成（1-2天）
- [ ] 安装 feishu-common 依赖
- [ ] 实现基础 API 客户端
- [ ] 创建文档构建器（Markdown → 飞书 Block）
- [ ] 实现文档创建功能

### 阶段二：报告生成（1天）
- [ ] 将审查结果转换为结构化文档
- [ ] 支持问题分类和优先级展示
- [ ] 添加代码片段高亮支持

### 阶段三：团队协作（1天）
- [ ] 实现文档分享功能
- [ ] 支持@提及团队成员
- [ ] 可选的任务创建功能

### 阶段四：高级功能（可选）
- [ ] 定时审查报告汇总
- [ ] 与飞书机器人集成（通知）
- [ ] 审查趋势分析图表

## 注意事项
1. **权限管理** — 需要申请飞书开放平台应用权限
2. **速率限制** — 飞书 API 有调用频率限制
3. **错误处理** — 网络异常、权限不足等情况
4. **数据安全** — 审查结果可能包含敏感代码，注意分享范围

## 预期收益
1. **提升协作效率** — 团队可以在飞书文档直接讨论问题
2. **建立知识库** — 所有审查历史集中管理
3. **自动化流程** — 减少手动复制粘贴的工作量
4. **移动端访问** — 通过飞书 App 随时查看审查报告
