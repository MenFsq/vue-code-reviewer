/**
 * 飞书集成主模块
 * 将代码审查结果保存到飞书文档
 */

const FeishuClient = require('../feishu/client');
const DriveManager = require('../feishu/drive-manager');

class FeishuIntegration {
  constructor(config = {}) {
    this.config = {
      // 飞书应用凭证
      appId: config.appId || process.env.FEISHU_APP_ID,
      appSecret: config.appSecret || process.env.FEISHU_APP_SECRET,
      
      // 文档存储设置
      storage: {
        folderToken: config.storage?.folderToken,
        documentNameTemplate: config.storage?.documentNameTemplate || '代码审查报告-{date}-{project}',
        defaultSections: config.storage?.defaultSections || [
          '项目概况',
          '审查摘要',
          '严重问题',
          '警告问题',
          '建议改进',
          '修复建议'
        ],
        ...config.storage
      },
      
      // 团队协作设置
      collaboration: {
        shareWith: config.collaboration?.shareWith || [],
        enableComments: config.collaboration?.enableComments || true,
        createTasks: config.collaboration?.createTasks || false,
        ...config.collaboration
      },
      
      // 审查报告设置
      report: {
        includeCodeSnippets: config.report?.includeCodeSnippets || true,
        includeFixSuggestions: config.report?.includeFixSuggestions || true,
        groupByFile: config.report?.groupByFile || false,
        ...config.report
      }
    };

    // 初始化客户端
    this.client = new FeishuClient({
      appId: this.config.appId,
      appSecret: this.config.appSecret
    });

    this.drive = new DriveManager(this.client);
  }

  /**
   * 验证配置
   */
  validateConfig() {
    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('缺少飞书应用凭证，请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量或配置 appId/appSecret');
    }
    return true;
  }

  /**
   * 创建代码审查报告
   */
  async createReviewReport(reviewResult, options = {}) {
    try {
      this.validateConfig();

      const {
        projectName = '未命名项目',
        folderToken = this.config.storage.folderToken,
        shareWith = this.config.collaboration.shareWith,
        titleTemplate = this.config.storage.documentNameTemplate,
        ...otherOptions
      } = options;

      console.log(`📝 正在创建飞书审查报告: ${projectName}`);

      // 创建文档
      const result = await this.drive.createReviewDocument(projectName, reviewResult, {
        titleTemplate,
        shareWith,
        ...otherOptions
      });

      console.log(`✅ 审查报告已创建: ${result.url}`);
      
      return {
        success: true,
        ...result,
        reviewSummary: {
          totalFiles: reviewResult.summary?.totalFiles || 0,
          criticalIssues: reviewResult.summary?.criticalIssues || 0,
          warningIssues: reviewResult.summary?.warningIssues || 0,
          suggestionIssues: reviewResult.summary?.suggestionIssues || 0,
          passed: reviewResult.passed || false
        }
      };

    } catch (error) {
      console.error('❌ 创建审查报告失败:', error.message);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * 追加审查结果到现有文档
   */
  async appendReviewToDocument(documentId, reviewResult, options = {}) {
    try {
      this.validateConfig();

      const {
        sectionTitle = '追加审查结果',
        ...otherOptions
      } = options;

      console.log(`📝 正在追加审查结果到文档: ${documentId}`);

      const result = await this.drive.appendReviewToDocument(
        documentId,
        reviewResult,
        sectionTitle
      );

      console.log(`✅ 已追加 ${result.issuesAdded} 个问题到文档`);
      
      return {
        success: true,
        ...result
      };

    } catch (error) {
      console.error('❌ 追加审查结果失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取审查历史
   */
  async getReviewHistory(projectName, options = {}) {
    try {
      this.validateConfig();

      const {
        limit = 20,
        ...otherOptions
      } = options;

      console.log(`📋 获取审查历史: ${projectName}`);

      const documents = await this.drive.getRecentReviewDocuments(projectName, limit);

      return {
        success: true,
        projectName,
        total: documents.length,
        documents
      };

    } catch (error) {
      console.error('❌ 获取审查历史失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 生成审查报告索引
   */
  async generateReviewIndex(projectName) {
    try {
      this.validateConfig();

      console.log(`📊 生成审查报告索引: ${projectName}`);

      const result = await this.drive.generateReviewIndex(projectName);

      if (result) {
        console.log(`✅ 索引已生成: ${result.url}`);
        return {
          success: true,
          ...result
        };
      } else {
        return {
          success: false,
          error: '没有找到审查报告'
        };
      }

    } catch (error) {
      console.error('❌ 生成索引失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      this.validateConfig();

      console.log('🔗 测试飞书连接...');

      // 获取访问令牌
      const token = await this.client.getAccessToken();
      
      if (token) {
        console.log('✅ 飞书连接正常');
        return {
          success: true,
          message: '飞书连接正常',
          appId: this.config.appId,
          tokenValid: true
        };
      } else {
        return {
          success: false,
          error: '获取访问令牌失败'
        };
      }

    } catch (error) {
      console.error('❌ 飞书连接测试失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量处理多个审查结果
   */
  async batchCreateReports(reviewResults, options = {}) {
    const results = [];
    
    for (const [index, reviewResult] of reviewResults.entries()) {
      const projectName = options.projectNames?.[index] || `项目${index + 1}`;
      
      console.log(`🔄 处理第 ${index + 1}/${reviewResults.length} 个报告: ${projectName}`);
      
      const result = await this.createReviewReport(reviewResult, {
        projectName,
        ...options
      });
      
      results.push({
        index,
        projectName,
        ...result
      });
      
      // 避免速率限制
      if (index < reviewResults.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
      success: true,
      total: reviewResults.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = FeishuIntegration;
