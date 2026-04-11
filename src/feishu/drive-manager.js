/**
 * 飞书云存储管理器
 * 管理文档的存储和组织
 */

class DriveManager {
  constructor(client) {
    this.client = client;
  }

  /**
   * 获取根文件夹 token
   */
  async getRootFolder() {
    // 飞书云空间的根文件夹通常是 "0"
    return '0';
  }

  /**
   * 确保代码审查报告文件夹存在
   * 路径: 根目录/代码审查报告/{项目名}/{年份}/{月份}/
   */
  async ensureReviewFolder(projectName = 'default') {
    const root = await this.getRootFolder();
    
    // 第一层: 代码审查报告
    const reviewRoot = await this.client.findOrCreateFolder(root, '代码审查报告');
    
    // 第二层: 项目名
    const projectFolder = await this.client.findOrCreateFolder(reviewRoot, projectName);
    
    // 第三层: 年份
    const year = new Date().getFullYear().toString();
    const yearFolder = await this.client.findOrCreateFolder(projectFolder, year);
    
    // 第四层: 月份
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const monthFolder = await this.client.findOrCreateFolder(yearFolder, month);
    
    return monthFolder;
  }

  /**
   * 获取最近的审查报告
   */
  async getRecentReviewDocuments(projectName, limit = 10) {
    const root = await this.getRootFolder();
    const reviewRoot = await this.client.findOrCreateFolder(root, '代码审查报告');
    const projectFolder = await this.client.findOrCreateFolder(reviewRoot, projectName);
    
    // 搜索所有文档文件
    const response = await this.client.request('POST', '/drive/v1/files/search', {
      query: '',
      parent_token: projectFolder,
      file_types: ['doc'],
      order_by: 'created_time',
      order_type: 'desc',
      page_size: limit
    });

    if (response.code === 0) {
      return response.data.files.map(file => ({
        id: file.token,
        name: file.name,
        url: `https://example.feishu.cn/docx/${file.token}`,
        createdAt: new Date(parseInt(file.created_time)).toLocaleString(),
        updatedAt: new Date(parseInt(file.updated_time)).toLocaleString()
      }));
    }

    return [];
  }

  /**
   * 创建审查报告文档
   */
  async createReviewDocument(projectName, reviewResult, options = {}) {
    const {
      titleTemplate = '代码审查报告-{date}-{project}',
      shareWith = [],
      enableComments = true
    } = options;

    // 确保文件夹存在
    const folderToken = await this.ensureReviewFolder(projectName);
    
    // 生成文档标题
    const dateStr = new Date().toISOString().split('T')[0];
    const title = titleTemplate
      .replace('{date}', dateStr)
      .replace('{project}', projectName)
      .replace('{time}', new Date().toLocaleTimeString('zh-CN', { hour12: false }));

    // 构建文档内容
    const documentBuilder = new (require('./document-builder'))();
    const blocks = documentBuilder.buildReviewReport(reviewResult, {
      projectName,
      reviewDate: new Date().toLocaleString('zh-CN')
    });

    // 创建文档
    const { documentId, url } = await this.client.createDocument(folderToken, title, blocks);

    // 分享文档
    if (shareWith.length > 0) {
      await this.client.shareDocument(documentId, shareWith, 'edit');
    }

    return {
      documentId,
      url,
      title,
      folderToken,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 追加审查结果到现有文档
   */
  async appendReviewToDocument(documentId, reviewResult, sectionTitle = '追加审查结果') {
    const documentBuilder = new (require('./document-builder'))();
    
    // 创建追加内容块
    const blocks = [
      documentBuilder.createDivider(),
      documentBuilder.createHeading(sectionTitle, 2),
      documentBuilder.createParagraph(`追加时间: ${new Date().toLocaleString('zh-CN')}`)
    ];

    // 添加摘要
    const { summary = {} } = reviewResult;
    const summaryText = `本次追加发现 ${summary.criticalIssues || 0} 个严重问题，${
      summary.warningIssues || 0
    } 个警告问题，${summary.suggestionIssues || 0} 个改进建议。`;
    
    blocks.push(documentBuilder.createParagraph(summaryText));

    // 添加严重问题
    if (reviewResult.critical && reviewResult.critical.length > 0) {
      blocks.push(documentBuilder.createHeading('🔴 新增严重问题', 3));
      reviewResult.critical.forEach(issue => {
        blocks.push(documentBuilder.createBulletItem(documentBuilder.formatIssue(issue)));
      });
    }

    // 更新文档
    await this.client.updateDocumentBlocks(documentId, blocks);

    return {
      success: true,
      appendedAt: new Date().toISOString(),
      issuesAdded: (reviewResult.critical || []).length + 
                   (reviewResult.warnings || []).length + 
                   (reviewResult.suggestions || []).length
    };
  }

  /**
   * 生成审查报告索引
   */
  async generateReviewIndex(projectName) {
    const documents = await this.getRecentReviewDocuments(projectName, 50);
    
    if (documents.length === 0) {
      return null;
    }

    const indexTitle = `代码审查报告索引 - ${projectName}`;
    const root = await this.getRootFolder();
    const reviewRoot = await this.client.findOrCreateFolder(root, '代码审查报告');
    const projectFolder = await this.client.findOrCreateFolder(reviewRoot, projectName);

    // 创建索引文档
    const documentBuilder = new (require('./document-builder'))();
    const blocks = [
      documentBuilder.createHeading(indexTitle, 1),
      documentBuilder.createParagraph(`生成时间: ${new Date().toLocaleString('zh-CN')}`),
      documentBuilder.createParagraph(`共 ${documents.length} 份审查报告`),
      documentBuilder.createDivider()
    ];

    // 按月份分组
    const groupedByMonth = {};
    documents.forEach(doc => {
      const month = doc.createdAt.substring(0, 7); // YYYY-MM
      if (!groupedByMonth[month]) {
        groupedByMonth[month] = [];
      }
      groupedByMonth[month].push(doc);
    });

    // 添加月度索引
    Object.keys(groupedByMonth).sort().reverse().forEach(month => {
      blocks.push(documentBuilder.createHeading(month, 2));
      
      groupedByMonth[month].forEach(doc => {
        const itemText = `${doc.name} (${doc.createdAt})`;
        blocks.push(documentBuilder.createBulletItem(itemText));
      });
    });

    // 创建索引文档
    const { documentId, url } = await this.client.createDocument(
      projectFolder,
      indexTitle,
      blocks
    );

    return {
      indexId: documentId,
      url,
      documentCount: documents.length,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = DriveManager;
