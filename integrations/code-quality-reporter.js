// vue-code-reviewer 代码质量报告生成器
// 版本: 1.0.0
// 作者: LittleTiger 🐯
// 日期: 2026-04-06

/**
 * 代码质量报告生成器
 * 将代码审查结果转换为可分享的报告格式，支持BotLearn社区发布
 */

const fs = require('fs');
const path = require('path');

class CodeQualityReporter {
  constructor(config = {}) {
    this.config = {
      outputDir: config.outputDir || './reports',
      format: config.format || 'markdown', // markdown, json, html
      includeDetails: config.includeDetails !== false,
      includeRecommendations: config.includeRecommendations !== false,
      autoGenerate: config.autoGenerate || false,
      ...config
    };
    
    this.reports = [];
    this.metrics = {
      totalFiles: 0,
      issuesFound: 0,
      criticalIssues: 0,
      warnings: 0,
      suggestions: 0,
      filesWithIssues: 0,
      averageScore: 0
    };
  }

  /**
   * 初始化报告生成器
   */
  initialize() {
    console.log('📊 初始化代码质量报告生成器...');
    
    // 创建输出目录
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      console.log(`✅ 创建报告目录: ${this.config.outputDir}`);
    }
    
    return this;
  }

  /**
   * 处理审查结果并生成报告
   * @param {Object} reviewResults - 代码审查结果
   * @param {Object} projectInfo - 项目信息
   */
  async generateReport(reviewResults, projectInfo = {}) {
    console.log('📝 生成代码质量报告...');
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const reportId = `code-review-${timestamp}`;
    
    // 计算指标
    this.calculateMetrics(reviewResults);
    
    // 生成报告数据
    const reportData = {
      reportId,
      timestamp: new Date().toISOString(),
      project: {
        name: projectInfo.name || 'Unknown Project',
        path: projectInfo.path || process.cwd(),
        ...projectInfo
      },
      metrics: this.metrics,
      summary: this.generateSummary(reviewResults),
      details: this.config.includeDetails ? this.generateDetails(reviewResults) : null,
      recommendations: this.config.includeRecommendations ? this.generateRecommendations(reviewResults) : null,
      rawResults: reviewResults
    };
    
    // 保存报告
    const savedReports = await this.saveReport(reportData);
    
    // 添加到报告历史
    this.reports.push({
      id: reportId,
      timestamp: reportData.timestamp,
      metrics: this.metrics,
      filePaths: savedReports
    });
    
    console.log(`✅ 代码质量报告生成完成: ${reportId}`);
    console.log(`📊 指标: ${this.metrics.issuesFound}个问题, ${this.metrics.criticalIssues}个严重问题`);
    
    return {
      reportId,
      metrics: this.metrics,
      filePaths: savedReports,
      data: reportData
    };
  }

  /**
   * 计算审查指标
   * @param {Object} reviewResults - 审查结果
   */
  calculateMetrics(reviewResults) {
    this.metrics = {
      totalFiles: 0,
      issuesFound: 0,
      criticalIssues: 0,
      warnings: 0,
      suggestions: 0,
      filesWithIssues: 0,
      averageScore: 0
    };
    
    let totalScore = 0;
    let scoredFiles = 0;
    
    // 遍历所有文件结果
    for (const [filePath, fileResults] of Object.entries(reviewResults.files || {})) {
      this.metrics.totalFiles++;
      
      if (fileResults.issues && fileResults.issues.length > 0) {
        this.metrics.filesWithIssues++;
        this.metrics.issuesFound += fileResults.issues.length;
        
        // 分类统计问题
        fileResults.issues.forEach(issue => {
          if (issue.severity === 'critical') {
            this.metrics.criticalIssues++;
          } else if (issue.severity === 'warning') {
            this.metrics.warnings++;
          } else if (issue.severity === 'suggestion') {
            this.metrics.suggestions++;
          }
        });
      }
      
      // 计算分数
      if (fileResults.score !== undefined) {
        totalScore += fileResults.score;
        scoredFiles++;
      }
    }
    
    // 计算平均分
    if (scoredFiles > 0) {
      this.metrics.averageScore = Math.round((totalScore / scoredFiles) * 100) / 100;
    }
    
    // 计算问题文件百分比
    if (this.metrics.totalFiles > 0) {
      this.metrics.filesWithIssuesPercentage = Math.round((this.metrics.filesWithIssues / this.metrics.totalFiles) * 100);
    }
  }

  /**
   * 生成报告摘要
   * @param {Object} reviewResults - 审查结果
   */
  generateSummary(reviewResults) {
    const summary = {
      overallStatus: this.metrics.criticalIssues > 0 ? '需要立即修复' : 
                    this.metrics.issuesFound > 0 ? '需要改进' : '优秀',
      keyFindings: [],
      topIssues: [],
      improvementAreas: []
    };
    
    // 关键发现
    if (this.metrics.criticalIssues > 0) {
      summary.keyFindings.push(`发现 ${this.metrics.criticalIssues} 个严重问题，需要立即修复`);
    }
    
    if (this.metrics.issuesFound > 0) {
      summary.keyFindings.push(`共发现 ${this.metrics.issuesFound} 个问题`);
    }
    
    if (this.metrics.filesWithIssues > 0) {
      summary.keyFindings.push(`${this.metrics.filesWithIssues} 个文件存在问题 (${this.metrics.filesWithIssuesPercentage}%)`);
    }
    
    // 平均分评价
    if (this.metrics.averageScore >= 90) {
      summary.keyFindings.push(`代码质量优秀，平均分: ${this.metrics.averageScore}`);
    } else if (this.metrics.averageScore >= 70) {
      summary.keyFindings.push(`代码质量良好，平均分: ${this.metrics.averageScore}`);
    } else if (this.metrics.averageScore > 0) {
      summary.keyFindings.push(`代码质量需要改进，平均分: ${this.metrics.averageScore}`);
    }
    
    return summary;
  }

  /**
   * 生成详细报告
   * @param {Object} reviewResults - 审查结果
   */
  generateDetails(reviewResults) {
    const details = {
      bySeverity: {
        critical: [],
        warning: [],
        suggestion: []
      },
      byCategory: {},
      byFile: {}
    };
    
    // 按严重程度分类
    for (const [filePath, fileResults] of Object.entries(reviewResults.files || {})) {
      if (!fileResults.issues) continue;
      
      details.byFile[filePath] = {
        totalIssues: fileResults.issues.length,
        issues: fileResults.issues.map(issue => ({
          line: issue.line,
          message: issue.message,
          severity: issue.severity,
          category: issue.category,
          rule: issue.rule
        }))
      };
      
      fileResults.issues.forEach(issue => {
        // 按严重程度
        if (issue.severity === 'critical') {
          details.bySeverity.critical.push({
            file: filePath,
            line: issue.line,
            message: issue.message
          });
        } else if (issue.severity === 'warning') {
          details.bySeverity.warning.push({
            file: filePath,
            line: issue.line,
            message: issue.message
          });
        } else if (issue.severity === 'suggestion') {
          details.bySeverity.suggestion.push({
            file: filePath,
            line: issue.line,
            message: issue.message
          });
        }
        
        // 按类别
        if (issue.category) {
          if (!details.byCategory[issue.category]) {
            details.byCategory[issue.category] = [];
          }
          details.byCategory[issue.category].push({
            file: filePath,
            line: issue.line,
            message: issue.message,
            severity: issue.severity
          });
        }
      });
    }
    
    return details;
  }

  /**
   * 生成改进建议
   * @param {Object} reviewResults - 审查结果
   */
  generateRecommendations(reviewResults) {
    const recommendations = {
      immediateActions: [],
      shortTermImprovements: [],
      longTermStrategies: []
    };
    
    // 根据问题类型生成建议
    if (this.metrics.criticalIssues > 0) {
      recommendations.immediateActions.push(`修复 ${this.metrics.criticalIssues} 个严重问题`);
    }
    
    if (this.metrics.warnings > 0) {
      recommendations.shortTermImprovements.push(`处理 ${this.metrics.warnings} 个警告`);
    }
    
    if (this.metrics.suggestions > 0) {
      recommendations.longTermStrategies.push(`考虑 ${this.metrics.suggestions} 个改进建议`);
    }
    
    // 根据问题类别生成具体建议
    const categoryCounts = {};
    for (const [filePath, fileResults] of Object.entries(reviewResults.files || {})) {
      if (!fileResults.issues) continue;
      
      fileResults.issues.forEach(issue => {
        if (issue.category) {
          categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
        }
      });
    }
    
    // 添加基于类别的建议
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > 5) {
        recommendations.shortTermImprovements.push(`集中处理 ${count} 个${category}问题`);
      }
    }
    
    return recommendations;
  }

  /**
   * 保存报告到文件
   * @param {Object} reportData - 报告数据
   */
  async saveReport(reportData) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // yyyy-MM-dd
    const reportId = reportData.reportId;
    const filePaths = {};
    
    // 生成Markdown报告
    if (this.config.format === 'markdown' || this.config.format === 'all') {
      const mdContent = this.generateMarkdown(reportData);
      const mdPath = path.join(this.config.outputDir, `${reportId}.md`);
      fs.writeFileSync(mdPath, mdContent, 'utf8');
      filePaths.markdown = mdPath;
      console.log(`📄 Markdown报告已保存: ${mdPath}`);
    }
    
    // 生成JSON报告
    if (this.config.format === 'json' || this.config.format === 'all') {
      const jsonPath = path.join(this.config.outputDir, `${reportId}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2), 'utf8');
      filePaths.json = jsonPath;
      console.log(`📊 JSON报告已保存: ${jsonPath}`);
    }
    
    // 生成HTML报告（简化版）
    if (this.config.format === 'html' || this.config.format === 'all') {
      const htmlContent = this.generateHTML(reportData);
      const htmlPath = path.join(this.config.outputDir, `${reportId}.html`);
      fs.writeFileSync(htmlPath, htmlContent, 'utf8');
      filePaths.html = htmlPath;
      console.log(`🌐 HTML报告已保存: ${htmlPath}`);
    }
    
    // 更新报告索引
    this.updateReportIndex(reportData, filePaths);
    
    return filePaths;
  }

  /**
   * 生成Markdown格式报告
   * @param {Object} reportData - 报告数据
   */
  generateMarkdown(reportData) {
    const { reportId, timestamp, project, metrics, summary, details, recommendations } = reportData;
    
    let md = `# 代码质量审查报告\n\n`;
    md += `**报告ID**: ${reportId}\n`;
    md += `**生成时间**: ${new Date(timestamp).toLocaleString('zh-CN')}\n`;
    md += `**项目**: ${project.name}\n`;
    md += `**路径**: ${project.path}\n\n`;
    
    md += `## 📊 总体指标\n\n`;
    md += `| 指标 | 数值 |\n`;
    md += `|------|------|\n`;
    md += `| 审查文件数 | ${metrics.totalFiles} |\n`;
    md += `| 发现问题数 | ${metrics.issuesFound} |\n`;
    md += `| 严重问题数 | ${metrics.criticalIssues} |\n`;
    md += `| 警告数 | ${metrics.warnings} |\n`;
    md += `| 建议数 | ${metrics.suggestions} |\n`;
    md += `| 问题文件数 | ${metrics.filesWithIssues} (${metrics.filesWithIssuesPercentage}%) |\n`;
    md += `| 平均分数 | ${metrics.averageScore} |\n\n`;
    
    md += `## 🎯 总体评价\n\n`;
    md += `**状态**: ${summary.overallStatus}\n\n`;
    
    if (summary.keyFindings && summary.keyFindings.length > 0) {
      md += `### 关键发现\n`;
      summary.keyFindings.forEach(finding => {
        md += `- ${finding}\n`;
      });
      md += `\n`;
    }
    
    if (details && this.config.includeDetails) {
      md += `## 📋 详细问题\n\n`;
      
      // 按严重程度显示问题
      if (details.bySeverity.critical.length > 0) {
        md += `### 🔴 严重问题 (${details.bySeverity.critical.length}个)\n`;
        details.bySeverity.critical.forEach((issue, index) => {
          md += `${index + 1}. **${issue.file}** (第${issue.line}行): ${issue.message}\n`;
        });
        md += `\n`;
      }
      
      if (details.bySeverity.warning.length > 0) {
        md += `### 🟡 警告 (${details.bySeverity.warning.length}个)\n`;
        details.bySeverity.warning.slice(0, 10).forEach((issue, index) => {
          md += `${index + 1}. **${issue.file}** (第${issue.line}行): ${issue.message}\n`;
        });
        if (details.bySeverity.warning.length > 10) {
          md += `... 还有 ${details.bySeverity.warning.length - 10} 个警告\n`;
        }
        md += `\n`;
      }
    }
    
    if (recommendations && this.config.includeRecommendations) {
      md += `## 🚀 改进建议\n\n`;
      
      if (recommendations.immediateActions.length > 0) {
        md += `### ⚡ 立即行动\n`;
        recommendations.immediateActions.forEach(action => {
          md += `- ${action}\n`;
        });
        md += `\n`;
      }
      
      if (recommendations.shortTermImprovements.length > 0) {
        md += `### 📅 短期改进\n`;
        recommendations.shortTermImprovements.forEach(improvement => {
          md += `- ${improvement}\n`;
        });
        md += `\n`;
      }
      
      if (recommendations.longTermStrategies.length > 0) {
        md += `### 🎯 长期策略\n`;
        recommendations.longTermStrategies.forEach(strategy => {
          md += `- ${strategy}\n`;
        });
        md += `\n`;
      }
    }
    
    md += `---\n`;
    md += `*报告由 vue-code-reviewer 生成，作者: LittleTiger 🐯*\n`;
    md += `*生成时间: ${new Date().toLocaleString('zh-CN')}*\n`;
    
    return md;
  }

  /**
   * 生成HTML格式报告
   * @param {Object} reportData - 报告数据
   */
  generateHTML(reportData) {
    const { reportId, timestamp, project, metrics } = reportData;
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>代码质量审查报告 - ${reportId}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 10px; margin-bottom: 2rem; }
        h1 { margin: 0; font-size: 2.5rem; }
        .subtitle { opacity: 0.9; margin-top: 0.5rem; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0; }
        .metric-card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2rem; font-weight: bold; margin: 0.5rem 0; }
        .metric-label { color: #666; font-size: 0.9rem; }
        .critical { color: #dc3545; }
        .warning { color: #ffc107; }
        .success { color: #28a745; }
        .section { margin: 2rem 0; }
        .section-title { font-size: 1.5rem; margin-bottom: 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
        .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; font-size: 0.9rem; text-align: center; }
    </style>
</head>
<body>
    <header>
        <h1>代码质量审查报告</h1>
        <div class="subtitle">
            <div>报告ID: ${reportId}</div>
            <div>生成时间: ${new Date(timestamp).toLocaleString('zh-CN')}</div>
            <div>项目: ${project.name}</div>
        </div>
    </header>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-label">审查文件数</div>
            <div class="metric-value">${metrics.totalFiles}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">发现问题数</div>
            <div class="metric-value ${metrics.issuesFound > 0 ? 'critical' : 'success'}">${metrics.issuesFound}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">严重问题数</div>
            <div class="metric-value ${metrics.criticalIssues > 0 ? 'critical' : 'success'}">${metrics.criticalIssues}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">平均分数</div>
            <div class="metric-value ${metrics.averageScore >= 90 ? 'success' : metrics.averageScore >= 70 ? 'warning' : 'critical'}">${metrics.averageScore}</div>
        </div>
    </div>
    
    <div class="section">
        <h2 class="section-title">总体评价</h2>
        <p><strong>状态:</strong> ${reportData.summary.overallStatus}</p>
        
        <h3>关键发现</h3>
        <ul>
            ${reportData.summary.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
    </div>
    
    <div class="footer">
        <p>报告由 vue-code-reviewer 生成 | 作者: LittleTiger 🐯</p>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>`;
  }

  /**
   * 更新报告索引
   * @param {Object} reportData - 报告数据
   * @param {Object} filePaths - 报告文件路径
   */
  updateReportIndex(reportData, filePaths) {
    const indexPath = path.join(this.config.outputDir, 'reports-index.json');
    let index = [];
    
    if (fs.existsSync(indexPath)) {
      try {
        index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      } catch (error) {
        console.warn('无法读取报告索引，创建新索引:', error.message);
      }
    }
    
    // 添加新报告
    index.unshift({
      id: reportData.reportId,
      timestamp: reportData.timestamp,
      project: reportData.project.name,
      metrics: reportData.metrics,
      summary: reportData.summary,
      filePaths
    });
    
    // 限制索引大小
    if (index.length > 50) {
      index = index.slice(0, 50);
    }
    
    // 保存索引
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
    console.log(`📋 报告索引已更新: ${indexPath}`);
  }

  /**
   * 为BotLearn社区生成可分享的报告
   * @param {Object} reportData - 报告数据
   */
  generateBotLearnPost(reportData) {
    const { metrics, summary, project } = reportData;
    
    const post = {
      title: `代码质量审查报告: ${project.name} - ${summary.overallStatus}`,
      content: `## 📊 代码质量审查报告

**项目**: ${project.name}
**审查时间**: ${new Date().toLocaleString('zh-CN')}
**总体状态**: ${summary.overallStatus}

### 关键指标
- 🔍 审查文件数: ${metrics.totalFiles}
- ⚠️ 发现问题数: ${metrics.issuesFound}
- 🔴 严重问题数: ${metrics.criticalIssues}
- 🟡 警告数: ${metrics.warnings}
- 💡 建议数: ${metrics.suggestions}
- 📈 平均分数: ${metrics.averageScore}

### 主要发现
${summary.keyFindings.map(finding => `- ${finding}`).join('\n')}

### 工具信息
本报告由 **vue-code-reviewer** 生成，这是一个专为Vue 3 + TypeScript项目设计的智能代码审查技能。

### 技术栈
- Vue 3 Composition API
- TypeScript类型安全
- OpenClaw微内核架构
- 自动化代码审查

---
*分享自 vue-code-reviewer 项目 | 作者: LittleTiger 🐯*`,
      tags: ['code-review', 'vue3', 'typescript', 'quality', 'openclaw'],
      channel: 'ai_engineering'
    };
    
    return post;
  }

  /**
   * 获取报告历史
   * @param {number} limit - 限制数量
   */
  getReportHistory(limit = 10) {
    return this.reports.slice(0, limit);
  }

  /**
   * 清除旧报告
   * @param {number} daysToKeep - 保留天数
   */
  cleanupOldReports(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const oldReports = this.reports.filter(report => 
      new Date(report.timestamp) < cutoffDate
    );
    
    console.log(`🗑️ 清理 ${oldReports.length} 份旧报告（保留${daysToKeep}天内）`);
    
    // 从内存中移除
    this.reports = this.reports.filter(report => 
      new Date(report.timestamp) >= cutoffDate
    );
    
    return oldReports.length;
  }
}

module.exports = CodeQualityReporter;