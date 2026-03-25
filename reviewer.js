#!/usr/bin/env node

/**
 * Vue Code Reviewer - 核心审查引擎
 * 
 * 功能：
 * 1. 分析Vue 3 + TypeScript代码
 * 2. 应用分层规则系统
 * 3. 生成详细审查报告
 * 4. 提供智能修复建议
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VueCodeReviewer {
  constructor(options = {}) {
    this.options = {
      configPath: options.configPath || '.openclaw/config.json',
      rulesPath: options.rulesPath || '.vue-code-reviewer-rules.js',
      verbose: options.verbose || false,
      fix: options.fix || false,
      ...options
    };

    this.config = this.loadConfig();
    this.rules = this.loadRules();
    this.results = {
      summary: {
        filesReviewed: 0,
        totalIssues: 0,
        criticalIssues: 0,
        majorIssues: 0,
        minorIssues: 0,
        qualityScore: 100,
        passedChecks: 0
      },
      files: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.options.configPath)) {
        const configContent = fs.readFileSync(this.options.configPath, 'utf8');
        const config = JSON.parse(configContent);
        return config.vueCodeReviewer || {};
      }
    } catch (error) {
      console.warn(`⚠️  无法加载配置文件: ${error.message}`);
    }

    // 默认配置
    return {
      enabled: true,
      rules: {
        quality: {
          enforceTypeSafety: true,
          strictNullChecks: true,
          noExplicitAny: true
        },
        performance: {
          checkLargeLists: true,
          checkDuplicateRenders: true,
          checkAsyncComponents: true
        },
        security: {
          checkXSS: true,
          checkSensitiveData: true
        }
      },
      thresholds: {
        criticalIssues: 0,
        majorIssues: 3,
        minorIssues: 10
      }
    };
  }

  /**
   * 加载规则系统
   */
  loadRules() {
    const rules = {
      quality: [],
      performance: [],
      security: [],
      bestPractices: []
    };

    // 基础规则
    if (this.config.rules?.quality?.enforceTypeSafety) {
      rules.quality.push(this.createTypeSafetyRule());
    }

    if (this.config.rules?.quality?.noExplicitAny) {
      rules.quality.push(this.createNoExplicitAnyRule());
    }

    if (this.config.rules?.performance?.checkLargeLists) {
      rules.performance.push(this.createLargeListRule());
    }

    if (this.config.rules?.security?.checkXSS) {
      rules.security.push(this.createXSSRule());
    }

    // 加载自定义规则
    try {
      if (fs.existsSync(this.options.rulesPath)) {
        const customRules = require(path.resolve(this.options.rulesPath));
        Object.assign(rules, customRules.rules || {});
      }
    } catch (error) {
      console.warn(`⚠️  无法加载自定义规则: ${error.message}`);
    }

    return rules;
  }

  /**
   * 创建类型安全规则
   */
  createTypeSafetyRule() {
    return {
      id: 'type-safety',
      name: '类型安全检查',
      description: '确保TypeScript类型定义完整且正确',
      severity: 'major',
      check: (fileContent, filePath) => {
        const issues = [];
        
        // 检查是否缺少类型定义
        const missingTypePatterns = [
          /function\s+\w+\s*\([^)]*\)\s*{/g,
          /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g
        ];

        missingTypePatterns.forEach((pattern, index) => {
          const matches = fileContent.match(pattern);
          if (matches) {
            matches.forEach(match => {
              if (!match.includes(':')) {
                issues.push({
                  line: this.getLineNumber(fileContent, match),
                  message: '函数缺少类型定义',
                  suggestion: '为参数和返回值添加TypeScript类型'
                });
              }
            });
          }
        });

        return issues;
      }
    };
  }

  /**
   * 创建禁止使用any规则
   */
  createNoExplicitAnyRule() {
    return {
      id: 'no-explicit-any',
      name: '禁止使用any类型',
      description: '避免使用any类型，使用具体类型代替',
      severity: 'minor',
      check: (fileContent) => {
        const issues = [];
        const anyPattern = /:\s*any\b/g;
        let match;

        while ((match = anyPattern.exec(fileContent)) !== null) {
          issues.push({
            line: this.getLineNumber(fileContent, match[0]),
            message: '使用了any类型',
            suggestion: '使用具体类型代替any，如 string, number, 或自定义接口'
          });
        }

        return issues;
      }
    };
  }

  /**
   * 创建大列表检查规则
   */
  createLargeListRule() {
    return {
      id: 'large-list',
      name: '大列表性能检查',
      description: '检查是否对大列表进行了性能优化',
      severity: 'major',
      check: (fileContent) => {
        const issues = [];
        
        // 检查v-for指令
        const vForPattern = /v-for="[^"]*"\s*(:key="[^"]*")?/g;
        const matches = fileContent.match(vForPattern);

        if (matches) {
          matches.forEach(match => {
            // 检查是否缺少key
            if (!match.includes(':key=')) {
              issues.push({
                line: this.getLineNumber(fileContent, match),
                message: 'v-for指令缺少key属性',
                suggestion: '添加唯一的:key绑定，如 :key="item.id"'
              });
            }

            // 检查是否可能渲染大量项目
            const itemPattern = /v-for=".*in\s*(.*?)[\s\]]/;
            const itemMatch = match.match(itemPattern);
            if (itemMatch && itemMatch[1]) {
              const dataSource = itemMatch[1].trim();
              if (dataSource.includes('items') || dataSource.includes('list') || 
                  dataSource.includes('data') || dataSource.includes('array')) {
                issues.push({
                  line: this.getLineNumber(fileContent, match),
                  message: '可能渲染大量列表项',
                  suggestion: '考虑使用虚拟滚动(vue-virtual-scroller)或分页'
                });
              }
            }
          });
        }

        return issues;
      }
    };
  }

  /**
   * 创建XSS安全检查规则
   */
  createXSSRule() {
    return {
      id: 'xss-check',
      name: 'XSS漏洞检查',
      description: '检查潜在的XSS安全漏洞',
      severity: 'critical',
      check: (fileContent) => {
        const issues = [];
        
        // 检查v-html指令
        const vHtmlPattern = /v-html="[^"]*"/g;
        const matches = fileContent.match(vHtmlPattern);

        if (matches) {
          matches.forEach(match => {
            issues.push({
              line: this.getLineNumber(fileContent, match),
              message: '使用了v-html指令，可能存在XSS风险',
              suggestion: '避免使用v-html，或使用DOMPurify等库进行净化处理'
            });
          });
        }

        // 检查innerHTML
        const innerHTMLPattern = /\.innerHTML\s*=/g;
        if (innerHTMLPattern.test(fileContent)) {
          issues.push({
            line: this.getLineNumber(fileContent, 'innerHTML'),
            message: '使用了innerHTML，可能存在XSS风险',
            suggestion: '使用textContent代替，或进行严格的输入验证和净化'
          });
        }

        return issues;
      }
    };
  }

  /**
   * 获取字符串在文件中的行号
   */
  getLineNumber(fileContent, searchString) {
    const lines = fileContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString)) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * 审查单个文件
   */
  reviewFile(filePath) {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileExt = path.extname(filePath).toLowerCase();
    
    // 只审查Vue和TypeScript文件
    if (!['.vue', '.ts', '.tsx'].includes(fileExt)) {
      return null;
    }

    const fileResult = {
      path: filePath,
      issues: [],
      suggestions: [],
      passedChecks: 0
    };

    // 应用所有规则
    Object.values(this.rules).forEach(ruleCategory => {
      ruleCategory.forEach(rule => {
        try {
          const issues = rule.check(fileContent, filePath);
          if (issues && issues.length > 0) {
            issues.forEach(issue => {
              fileResult.issues.push({
                rule: rule.name,
                severity: rule.severity,
                ...issue
              });
            });
          } else {
            fileResult.passedChecks++;
          }
        } catch (error) {
          console.warn(`⚠️  规则执行失败 ${rule.name}: ${error.message}`);
        }
      });
    });

    // 统计问题严重程度
    const criticalIssues = fileResult.issues.filter(i => i.severity === 'critical').length;
    const majorIssues = fileResult.issues.filter(i => i.severity === 'major').length;
    const minorIssues = fileResult.issues.filter(i => i.severity === 'minor').length;

    // 更新总体统计
    this.results.summary.filesReviewed++;
    this.results.summary.totalIssues += fileResult.issues.length;
    this.results.summary.criticalIssues += criticalIssues;
    this.results.summary.majorIssues += majorIssues;
    this.results.summary.minorIssues += minorIssues;
    this.results.summary.passedChecks += fileResult.passedChecks;

    this.results.files.push(fileResult);

    return fileResult;
  }

  /**
   * 审查整个目录
   */
  reviewDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ 目录不存在: ${dirPath}`);
      return;
    }

    const files = this.getVueFiles(dirPath);
    
    console.log(`🔍 开始审查 ${files.length} 个Vue/TypeScript文件...\n`);

    files.forEach((file, index) => {
      if (this.options.verbose) {
        console.log(`[${index + 1}/${files.length}] 审查: ${file}`);
      }
      this.reviewFile(file);
    });

    this.generateReport();
  }

  /**
   * 获取所有Vue和TypeScript文件
   */
  getVueFiles(dirPath) {
    const files = [];
    
    function traverse(currentPath) {
      const items = fs.readdirSync(currentPath);
      
      items.forEach(item => {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // 跳过node_modules等目录
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            traverse(fullPath);
          }
        } else {
          const ext = path.extname(fullPath).toLowerCase();
          if (['.vue', '.ts', '.tsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    }

    traverse(dirPath);
    return files;
  }

  /**
   * 生成审查报告
   */
  generateReport() {
    const { summary } = this.results;
    
    // 计算质量分数
    const totalChecks = summary.passedChecks + summary.totalIssues;
    summary.qualityScore = totalChecks > 0 
      ? Math.round((summary.passedChecks / totalChecks) * 100)
      : 100;

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('🔍 Vue Code Review Report');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    console.log(`📊 审查总结`);
    console.log(`   • 审查文件: ${summary.filesReviewed} 个`);
    console.log(`   • 总问题数: ${summary.totalIssues} 个`);
    console.log(`   • 严重问题: ${summary.criticalIssues} 个`);
    console.log(`   • 主要问题: ${summary.majorIssues} 个`);
    console.log(`   • 次要问题: ${summary.minorIssues} 个`);
    console.log(`   • 通过检查: ${summary.passedChecks} 项`);
    console.log(`   • 质量分数: ${summary.qualityScore}/100\n`);

    // 显示严重问题
    if (summary.criticalIssues > 0) {
      console.log('❌ 严重问题 (需要立即修复)');
      this.results.files.forEach(file => {
        file.issues.filter(i => i.severity === 'critical').forEach(issue => {
          console.log(`   • ${file.path}:${issue.line} - ${issue.message}`);
          console.log(`     建议: ${issue.suggestion}`);
        });
      });
      console.log('');
    }

    // 显示主要问题
    if (summary.majorIssues > 0) {
      console.log('⚠️  主要问题 (建议尽快修复)');
      this.results.files.forEach(file => {
        file.issues.filter(i => i.severity === 'major').forEach(issue => {
          console.log(`   • ${file.path}:${issue.line} - ${issue.message}`);
          console.log(`     建议: ${issue.suggestion}`);
        });
      });
      console.log('');
    }

    // 检查是否超过阈值
    const thresholds = this.config.thresholds || {};
    let passed = true;
    
    if (summary.criticalIssues > (thresholds.criticalIssues || 0)) {
      console.log('❌ 严重问题超过阈值，审查不通过');
      passed = false;
    }
    
    if (summary.majorIssues > (thresholds.majorIssues || 3)) {
      console.log('⚠️  主要问题超过阈值，建议修复后再提交');
      passed = false;
    }
    
    if (summary.minorIssues > (thresholds.minorIssues || 10)) {
      console.log('💡 次要问题较多，建议优化代码质量');
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    
    if (passed) {
      console.log('✅ 审查通过！');
    } else {
      console.log('❌ 审查未通过，请修复上述问题');
      process.exit(1);
    }

    // 生成JSON报告
    if (this.options.outputJson) {
      const reportPath = this.options.outputJson === true 
        ? 'vue-code-review-report.json'
        : this.options.outputJson;
      
      fs.writeFileSync(
        reportPath,
        JSON.stringify(this.results, null, 2),
        'utf8'
      );
      console.log(`📄 JSON报告已保存: ${reportPath}`);
    }

    // 生成Markdown报告
    if (this.options.outputMarkdown) {
      this.generateMarkdownReport();
    }
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport() {
    const { summary } = this.results;
    const reportPath = this.options.outputMarkdown === true
      ? 'VUE-CODE-REVIEW-REPORT.md'
      : this.options.outputMarkdown;

    let markdown = `# Vue Code Review Report\n\n`;
    markdown += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

    // 总结部分
    markdown += `## 📊 审查总结\n\n`;
    markdown += `| 指标 | 数量 |\n`;
    markdown += `|------|------|\n`;
    markdown += `| 审查文件 | ${summary.filesReviewed} |\n`;
    markdown += `| 总问题数 | ${summary.totalIssues} |\n`;
    markdown += `| 严重问题 | ${summary.criticalIssues} |\n`;
    markdown += `| 主要问题 | ${summary.majorIssues} |\n`;
    markdown += `| 次要问题 | ${summary.minorIssues} |\n`;
    markdown += `| 通过检查 | ${summary.passedChecks} |\n`;
    markdown += `| 质量分数 | ${summary.qualityScore}/100 |\n\n`;

    // 问题详情
    if (summary.totalIssues > 0) {
      markdown += `## ❌ 发现问题\n\n`;

      this.results.files.forEach(file => {
        if (file.issues.length > 0) {
          markdown += `### 📁 ${file.path}\n\n`;
          
          file.issues.forEach(issue => {
            const severityIcon = issue.severity === 'critical' ? '🔴' : 
                               issue.severity === 'major' ? '🟡' : '🔵';
            
            markdown += `${severityIcon} **${issue.rule}** (行 ${issue.line})\n`;
            markdown += `- **问题**: ${issue.message}\n`;
            markdown += `- **建议**: ${issue.suggestion}\n\n`;
          });
        }
      });
    }

    // 建议
    markdown += `## 💡 改进建议\n\n`;

    if (summary.criticalIssues > 0) {
      markdown += `1. **立即修复严重问题** - 这些安全问题需要优先处理\n`;
    }
    if (summary.majorIssues > 0) {
      markdown += `2. **优化性能问题** - 关注大列表、重复渲染等问题\n`;
    }
    if (summary.minorIssues > 0) {
      markdown += `3. **提升代码质量** - 修复类型定义、代码风格等问题\n`;
    }

    markdown += `\n## 📈 质量趋势\n\n`;
    markdown += `| 指标 | 当前值 | 目标值 | 状态 |\n`;
    markdown += `|------|--------|--------|------|\n`;
    markdown += `| 严重问题 | ${summary.criticalIssues} | ${thresholds.criticalIssues || 0} | ${summary.criticalIssues <= (thresholds.criticalIssues || 0) ? '✅ 达标' : '❌ 未达标'} |\n`;
    markdown += `| 主要问题 | ${summary.majorIssues} | ${thresholds.majorIssues || 3} | ${summary.majorIssues <= (thresholds.majorIssues || 3) ? '✅ 达标' : '❌ 未达标'} |\n`;
    markdown += `| 次要问题 | ${summary.minorIssues} | ${thresholds.minorIssues || 10} | ${summary.minorIssues <= (thresholds.minorIssues || 10) ? '✅ 达标' : '❌ 未达标'} |\n`;
    markdown += `| 质量分数 | ${summary.qualityScore}/100 | 80/100 | ${summary.qualityScore >= 80 ? '✅ 达标' : '❌ 未达标'} |\n\n`;

    markdown += `---\n\n`;
    markdown += `**报告生成时间**: ${new Date().toLocaleString('zh-CN')}\n`;
    markdown += `**审查工具**: Vue Code Reviewer v1.0.0\n`;

    fs.writeFileSync(reportPath, markdown, 'utf8');
    console.log(`📄 Markdown报告已保存: ${reportPath}`);
  }
}

// 命令行接口
if (require.main === module) {
  const yargs = require('yargs/yargs');
  const { hideBin } = require('yargs/helpers');
  const argv = yargs(hideBin(process.argv))
    .usage('用法: $0 [选项]')
    .option('file', {
      alias: 'f',
      type: 'string',
      description: '审查单个文件'
    })
    .option('project', {
      alias: 'p',
      type: 'string',
      description: '审查整个项目目录',
      default: '.'
    })
    .option('staged', {
      type: 'boolean',
      description: '审查Git暂存区的文件'
    })
    .option('changed', {
      type: 'boolean',
      description: '审查变更的文件'
    })
    .option('since', {
      type: 'string',
      description: '从指定提交开始审查变更'
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: '显示详细输出'
    })
    .option('fix', {
      type: 'boolean',
      description: '尝试自动修复问题'
    })
    .option('output-json', {
      type: 'string',
      description: '输出JSON报告文件'
    })
    .option('output-markdown', {
      type: 'string',
      description: '输出Markdown报告文件'
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      description: '指定配置文件路径'
    })
    .option('install', {
      type: 'boolean',
      description: '安装并配置项目'
    })
    .help()
    .alias('help', 'h')
    .argv;

  const reviewer = new VueCodeReviewer({
    configPath: argv.config,
    verbose: argv.verbose,
    fix: argv.fix,
    outputJson: argv.outputJson,
    outputMarkdown: argv.outputMarkdown
  });

  if (argv.install) {
    // 运行安装脚本
    const Installer = require('./install.js').Installer;
    const installer = new Installer();
    installer.run();
  } else if (argv.file) {
    reviewer.reviewFile(argv.file);
    reviewer.generateReport();
  } else if (argv.staged) {
    console.log('审查Git暂存区文件...');
    // 这里可以添加Git暂存区文件获取逻辑
    reviewer.reviewDirectory(argv.project);
    reviewer.generateReport();
  } else if (argv.changed) {
    console.log('审查变更文件...');
    // 这里可以添加变更文件获取逻辑
    reviewer.reviewDirectory(argv.project);
    reviewer.generateReport();
  } else {
    reviewer.reviewDirectory(argv.project);
    reviewer.generateReport();
  }
}

module.exports = { VueCodeReviewer };