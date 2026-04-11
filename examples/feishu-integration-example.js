/**
 * 飞书集成使用示例
 */

const FeishuIntegration = require('../src/integrations/feishu-integration');

// 模拟的审查结果
const mockReviewResult = {
  summary: {
    totalFiles: 15,
    criticalIssues: 2,
    warningIssues: 8,
    suggestionIssues: 12,
    totalIssues: 22
  },
  passed: false,
  critical: [
    {
      file: 'src/components/UserForm.vue',
      line: 45,
      rule: 'vue/no-mutating-props',
      message: '直接修改了 prop 的值',
      suggestion: '使用 emit 事件或 computed 属性',
      codeSnippet: `// 错误示例
props: ['user'],
methods: {
  updateUser() {
    this.user.name = 'New Name' // 直接修改 prop
  }
}`,
      language: 'vue'
    },
    {
      file: 'src/utils/api.js',
      line: 78,
      rule: 'security/no-hardcoded-secrets',
      message: '代码中包含硬编码的 API 密钥',
      suggestion: '使用环境变量或配置管理',
      codeSnippet: `const API_KEY = 'sk_live_1234567890abcdef'; // 硬编码密钥`,
      language: 'javascript'
    }
  ],
  warnings: [
    {
      file: 'src/views/Home.vue',
      line: 23,
      rule: 'vue/no-unused-vars',
      message: '定义了未使用的变量',
      suggestion: '移除未使用的变量'
    },
    {
      file: 'src/store/modules/user.js',
      line: 56,
      rule: 'vuex/no-mutation-outside-mutation-handlers',
      message: '在 mutation 外部直接修改 state',
      suggestion: '通过 mutation 修改 state'
    }
  ],
  suggestions: [
    {
      file: 'src/components/Button.vue',
      line: 12,
      rule: 'vue/component-name-in-template-casing',
      message: '组件名应该使用 PascalCase',
      suggestion: '将 button 改为 Button'
    },
    {
      file: 'src/router/index.js',
      line: 34,
      rule: 'vue/require-default-prop',
      message: '可选 prop 应该提供默认值',
      suggestion: '为 prop 添加 default 值'
    }
  ],
  fixes: [
    {
      description: '将硬编码的 API 密钥移动到环境变量',
      example: `// .env.local
VITE_API_KEY=your_api_key_here

// src/utils/api.js
const API_KEY = import.meta.env.VITE_API_KEY;`
    },
    {
      description: '使用 emit 事件替代直接修改 prop',
      example: `// 父组件
<template>
  <UserForm :user="userData" @update:user="handleUserUpdate" />
</template>

// 子组件
props: ['user'],
emits: ['update:user'],
methods: {
  updateUser() {
    this.$emit('update:user', { ...this.user, name: 'New Name' })
  }
}`
    }
  ],
  recommendations: [
    '建议在 CI/CD 流程中加入代码审查步骤',
    '考虑使用 TypeScript 增强类型安全',
    '定期更新依赖包到最新版本'
  ]
};

async function runExample() {
  console.log('🚀 飞书集成示例开始\n');

  // 方式1: 使用环境变量
  const integration = new FeishuIntegration({
    // appId 和 appSecret 会从环境变量读取
    // FEISHU_APP_ID=your_id FEISHU_APP_SECRET=your_secret node example.js
  });

  // 方式2: 直接配置（不推荐在生产环境使用）
  /*
  const integration = new FeishuIntegration({
    appId: 'your_app_id',
    appSecret: 'your_app_secret',
    storage: {
      documentNameTemplate: '审查报告-{project}-{date}'
    },
    collaboration: {
      shareWith: ['ou_team_member1', 'ou_team_member2']
    }
  });
  */

  try {
    // 1. 测试连接
    console.log('1. 测试飞书连接...');
    const connectionTest = await integration.testConnection();
    
    if (!connectionTest.success) {
      console.error('❌ 连接测试失败，请检查配置');
      console.error('错误:', connectionTest.error);
      return;
    }
    
    console.log('✅ 连接测试成功\n');

    // 2. 创建审查报告
    console.log('2. 创建审查报告...');
    const reportResult = await integration.createReviewReport(mockReviewResult, {
      projectName: '示例项目',
      shareWith: [], // 分享给团队成员
      titleTemplate: 'Vue代码审查-{project}-{date}'
    });

    if (reportResult.success) {
      console.log('✅ 报告创建成功');
      console.log('   文档标题:', reportResult.title);
      console.log('   文档链接:', reportResult.url);
      console.log('   文档ID:', reportResult.documentId);
      console.log('   审查摘要:');
      console.log('     - 文件数:', reportResult.reviewSummary.totalFiles);
      console.log('     - 严重问题:', reportResult.reviewSummary.criticalIssues);
      console.log('     - 警告问题:', reportResult.reviewSummary.warningIssues);
      console.log('     - 建议数:', reportResult.reviewSummary.suggestionIssues);
      console.log('     - 是否通过:', reportResult.reviewSummary.passed ? '✅ 是' : '❌ 否');
    } else {
      console.error('❌ 报告创建失败:', reportResult.error);
    }

    console.log('\n3. 获取审查历史...');
    const history = await integration.getReviewHistory('示例项目', { limit: 5 });
    
    if (history.success && history.documents.length > 0) {
      console.log(`✅ 找到 ${history.total} 份历史报告`);
      history.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.name} (${doc.createdAt})`);
      });
    } else {
      console.log('📭 暂无历史报告');
    }

    // 4. 生成索引（可选）
    console.log('\n4. 生成审查报告索引...');
    const indexResult = await integration.generateReviewIndex('示例项目');
    
    if (indexResult.success) {
      console.log('✅ 索引生成成功');
      console.log('   索引链接:', indexResult.url);
      console.log('   包含报告数:', indexResult.documentCount);
    }

    // 5. 批量处理示例
    console.log('\n5. 批量处理示例...');
    const batchResults = await integration.batchCreateReports(
      [mockReviewResult, mockReviewResult],
      {
        projectNames: ['项目A', '项目B'],
        shareWith: []
      }
    );

    console.log(`✅ 批量处理完成: ${batchResults.succeeded} 成功, ${batchResults.failed} 失败`);

    console.log('\n🎉 示例运行完成！');
    console.log('\n下一步:');
    console.log('1. 在飞书开放平台创建应用，获取 appId 和 appSecret');
    console.log('2. 设置环境变量: FEISHU_APP_ID, FEISHU_APP_SECRET');
    console.log('3. 运行真实审查: npx openclaw exec --skill vue-code-reviewer --feishu');

  } catch (error) {
    console.error('❌ 示例运行失败:', error);
    console.error('堆栈:', error.stack);
  }
}

// 运行示例
if (require.main === module) {
  runExample().catch(console.error);
}

module.exports = {
  mockReviewResult,
  runExample
};
