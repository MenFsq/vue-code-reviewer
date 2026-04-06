// 测试代码质量报告生成器
const CodeQualityReporter = require('./code-quality-reporter');

// 模拟审查结果
const mockReviewResults = {
  files: {
    'src/components/Button.vue': {
      issues: [
        { line: 10, message: '缺少TypeScript类型定义', severity: 'warning', category: 'typescript' },
        { line: 25, message: '重复渲染风险', severity: 'suggestion', category: 'performance' }
      ],
      score: 85
    },
    'src/utils/helpers.ts': {
      issues: [
        { line: 5, message: '安全漏洞: 未验证用户输入', severity: 'critical', category: 'security' },
        { line: 15, message: '函数过于复杂', severity: 'warning', category: 'complexity' }
      ],
      score: 65
    },
    'src/views/Home.vue': {
      issues: [],
      score: 95
    }
  }
};

// 模拟项目信息
const projectInfo = {
  name: 'Vue 3电商平台',
  path: '/projects/ecommerce',
  version: '1.2.0',
  framework: 'Vue 3 + TypeScript'
};

async function testReporter() {
  console.log('🧪 测试代码质量报告生成器...\n');
  
  // 创建报告生成器
  const reporter = new CodeQualityReporter({
    outputDir: './test-reports',
    format: 'all', // 生成所有格式
    includeDetails: true,
    includeRecommendations: true
  });
  
  // 初始化
  reporter.initialize();
  
  // 生成报告
  const report = await reporter.generateReport(mockReviewResults, projectInfo);
  
  console.log('\n✅ 测试完成！');
  console.log(`📋 报告ID: ${report.reportId}`);
  console.log(`📊 指标: ${report.metrics.issuesFound}个问题, ${report.metrics.criticalIssues}个严重问题`);
  console.log(`📁 报告文件:`);
  for (const [format, path] of Object.entries(report.filePaths)) {
    console.log(`  - ${format}: ${path}`);
  }
  
  // 生成BotLearn社区帖子
  const botlearnPost = reporter.generateBotLearnPost(report.data);
  console.log('\n📝 BotLearn社区帖子内容:');
  console.log(`标题: ${botlearnPost.title}`);
  console.log(`标签: ${botlearnPost.tags.join(', ')}`);
  console.log(`频道: ${botlearnPost.channel}`);
  console.log('\n内容预览:');
  console.log(botlearnPost.content.substring(0, 500) + '...');
  
  // 获取报告历史
  const history = reporter.getReportHistory();
  console.log(`\n📚 报告历史: ${history.length}份报告`);
  
  // 测试清理功能
  const cleanedCount = reporter.cleanupOldReports(1); // 只保留1天内的报告
  console.log(`🗑️ 清理了 ${cleanedCount} 份旧报告`);
  
  console.log('\n🎉 所有测试通过！');
}

// 运行测试
testReporter().catch(console.error);