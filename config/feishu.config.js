/**
 * 飞书集成配置模板
 * 复制此文件并修改为 feishu.config.js
 */

module.exports = {
  // ====================
  // 飞书应用凭证（必需）
  // ====================
  
  // 方式1: 直接配置（不推荐提交到版本库）
  appId: 'your_app_id_here',
  appSecret: 'your_app_secret_here',
  
  // 方式2: 使用环境变量（推荐）
  // appId: process.env.FEISHU_APP_ID,
  // appSecret: process.env.FEISHU_APP_SECRET,
  
  // ====================
  // 文档存储设置
  // ====================
  storage: {
    // 指定文件夹 token（可选，不指定则自动创建层级文件夹）
    // folderToken: 'fldcnxxxxxx',
    
    // 文档命名模板
    // 可用变量: {date}, {project}, {time}, {timestamp}
    documentNameTemplate: '代码审查报告-{date}-{project}',
    
    // 默认文档章节结构
    defaultSections: [
      '项目概况',
      '审查摘要', 
      '严重问题',
      '警告问题',
      '建议改进',
      '修复建议',
      '总结'
    ],
    
    // 自动创建文件夹层级
    // 根目录/代码审查报告/{项目名}/{年份}/{月份}/
    autoCreateFolders: true,
    
    // 文件夹命名
    rootFolderName: '代码审查报告',
    yearFolderFormat: 'YYYY',
    monthFolderFormat: 'MM'
  },
  
  // ====================
  // 团队协作设置
  // ====================
  collaboration: {
    // 默认分享给的用户/部门（飞书用户ID数组）
    // 示例: ['ou_xxxxxx', 'ou_yyyyyy']
    shareWith: [],
    
    // 分享权限: 'view'（仅查看）, 'edit'（可编辑）, 'comment'（可评论）
    defaultPermission: 'view',
    
    // 是否开启评论功能
    enableComments: true,
    
    // 是否自动创建跟进任务（需要额外权限）
    createTasks: false,
    
    // 任务分配设置
    taskSettings: {
      assignee: null, // 默认负责人
      dueDate: '+7d', // 截止日期（相对时间）
      priority: 'medium' // 优先级: low, medium, high
    }
  },
  
  // ====================
  // 审查报告设置
  // ====================
  report: {
    // 是否包含代码片段
    includeCodeSnippets: true,
    
    // 代码片段最大长度（字符）
    maxCodeSnippetLength: 1000,
    
    // 是否包含修复建议
    includeFixSuggestions: true,
    
    // 是否按文件分组问题
    groupByFile: false,
    
    // 问题显示顺序: 'severity'（按严重程度）, 'file'（按文件）
    issueOrder: 'severity',
    
    // 是否生成执行摘要（前3个关键问题）
    generateExecutiveSummary: true,
    
    // 是否包含趋势分析（需要历史数据）
    includeTrendAnalysis: false,
    
    // 报告语言: 'zh'（中文）, 'en'（英文）
    language: 'zh',
    
    // 自定义问题分类
    customCategories: [
      // {
      //   name: '性能问题',
      //   icon: '⚡',
      //   rules: ['performance-*'] // 匹配的规则名称
      // }
    ]
  },
  
  // ====================
  // 高级设置
  // ====================
  advanced: {
    // API 请求超时（毫秒）
    timeout: 30000,
    
    // 重试次数
    maxRetries: 3,
    
    // 重试延迟（毫秒）
    retryDelay: 1000,
    
    // 是否启用请求日志
    enableRequestLogging: false,
    
    // 是否缓存访问令牌
    cacheAccessToken: true,
    
    // 缓存过期时间（秒，默认2小时）
    cacheExpiry: 7200,
    
    // 批量处理延迟（避免速率限制）
    batchDelay: 1000
  },
  
  // ====================
  // 通知设置
  // ====================
  notifications: {
    // 审查完成时发送通知
    onReviewComplete: true,
    
    // 通知方式: 'feishu'（飞书消息）, 'email'（邮件）, 'none'（无）
    method: 'feishu',
    
    // 飞书机器人 webhook（用于发送通知）
    feishuWebhook: process.env.FEISHU_WEBHOOK_URL,
    
    // 通知模板
    messageTemplate: '✅ 代码审查完成\n项目: {project}\n问题: {critical}严重 {warning}警告 {suggestion}建议\n报告: {url}'
  },
  
  // ====================
  // 集成设置
  // ====================
  integration: {
    // 是否自动集成到现有工作流
    autoIntegrate: false,
    
    // 触发条件
    triggers: [
      // 'on-commit',      // 提交时
      // 'on-push',        // 推送时
      // 'on-schedule',    // 定时
      // 'manual'          // 手动
    ],
    
    // 定时审查设置（cron表达式）
    schedule: '0 9 * * *', // 每天上午9点
    
    // 忽略的文件/目录
    ignorePatterns: [
      'node_modules',
      'dist',
      'build',
      '.git',
      '*.min.js',
      '*.min.css'
    ],
    
    // 最小审查间隔（秒，避免频繁审查）
    minReviewInterval: 3600
  }
};

/**
 * 环境变量说明:
 * 
 * 必需:
 * - FEISHU_APP_ID: 飞书开放平台应用ID
 * - FEISHU_APP_SECRET: 飞书开放平台应用密钥
 * 
 * 可选:
 * - FEISHU_WEBHOOK_URL: 飞书机器人webhook地址（用于通知）
 * - FEISHU_FOLDER_TOKEN: 指定存储文件夹token
 * - FEISHU_SHARE_USERS: 分享用户ID，逗号分隔（如: ou_xxx,ou_yyy）
 * 
 * 使用示例:
 * 
 * 1. 创建配置文件:
 *   cp feishu.config.template.js feishu.config.js
 * 
 * 2. 编辑配置文件，设置 appId 和 appSecret
 * 
 * 3. 或在环境变量中设置:
 *   export FEISHU_APP_ID=your_app_id
 *   export FEISHU_APP_SECRET=your_app_secret
 * 
 * 4. 运行审查:
 *   npx openclaw exec --skill vue-code-reviewer --feishu
 */
