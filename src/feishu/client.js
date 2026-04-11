/**
 * 飞书 API 客户端
 * 基于飞书开放平台 REST API
 * https://open.feishu.cn/document/server-docs/docs
 */

const https = require('https');
const { URL } = require('url');

class FeishuClient {
  constructor(config = {}) {
    this.appId = config.appId || process.env.FEISHU_APP_ID;
    this.appSecret = config.appSecret || process.env.FEISHU_APP_SECRET;
    this.baseUrl = 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    // 如果令牌有效且未过期，直接返回
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    const response = await this.request('POST', '/auth/v3/tenant_access_token/internal', {
      app_id: this.appId,
      app_secret: this.appSecret
    });

    if (response.code === 0) {
      this.accessToken = response.tenant_access_token;
      this.tokenExpiresAt = Date.now() + response.expire * 1000;
      return this.accessToken;
    } else {
      throw new Error(`获取访问令牌失败: ${response.msg}`);
    }
  }

  /**
   * 发送 HTTP 请求
   */
  async request(method, path, data = null, options = {}) {
    const url = new URL(path.startsWith('http') ? path : this.baseUrl + path);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // 如果需要认证且不是获取令牌的请求，添加令牌
    if (!path.includes('/auth/v3/tenant_access_token') && !options.skipAuth) {
      const token = await this.getAccessToken();
      headers.Authorization = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`解析响应失败: ${e.message}, 原始数据: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * 创建文档
   * @param {string} folderToken 文件夹 token
   * @param {string} title 文档标题
   * @param {Array} blocks 文档内容块
   * @returns {Promise<{documentId: string, url: string}>}
   */
  async createDocument(folderToken, title, blocks = []) {
    const response = await this.request('POST', '/drive/v1/files/create', {
      folder_token: folderToken,
      title,
      type: 'doc'
    });

    if (response.code === 0) {
      const documentId = response.data.file.token;
      
      // 如果有内容块，写入文档
      if (blocks.length > 0) {
        await this.updateDocumentBlocks(documentId, blocks);
      }

      return {
        documentId,
        url: `https://example.feishu.cn/docx/${documentId}` // 实际URL需要根据租户确定
      };
    } else {
      throw new Error(`创建文档失败: ${response.msg}`);
    }
  }

  /**
   * 更新文档内容块
   */
  async updateDocumentBlocks(documentId, blocks) {
    const response = await this.request('PATCH', `/docx/v1/documents/${documentId}/blocks`, {
      document_revision_id: -1, // -1 表示最新版本
      requests: blocks.map((block, index) => ({
        block_id: `block_${index}`,
        update_block: block
      }))
    });

    if (response.code !== 0) {
      throw new Error(`更新文档内容失败: ${response.msg}`);
    }
  }

  /**
   * 在文件夹中搜索或创建文件夹
   */
  async findOrCreateFolder(parentToken, folderName) {
    // 先搜索现有文件夹
    const searchResponse = await this.request('POST', '/drive/v1/files/search', {
      query: `name matches "${folderName}"`,
      parent_token: parentToken,
      file_types: ['folder']
    });

    if (searchResponse.code === 0 && searchResponse.data.files.length > 0) {
      return searchResponse.data.files[0].token;
    }

    // 创建新文件夹
    const createResponse = await this.request('POST', '/drive/v1/files/create', {
      folder_token: parentToken,
      title: folderName,
      type: 'folder'
    });

    if (createResponse.code === 0) {
      return createResponse.data.file.token;
    } else {
      throw new Error(`创建文件夹失败: ${createResponse.msg}`);
    }
  }

  /**
   * 分享文档
   */
  async shareDocument(documentId, members = [], permission = 'view') {
    const response = await this.request('POST', `/drive/v1/permissions/${documentId}/members`, {
      member_type: 'user',
      type: permission,
      members: members.map(id => ({ id, type: 'user' }))
    });

    if (response.code !== 0) {
      throw new Error(`分享文档失败: ${response.msg}`);
    }
  }
}

module.exports = FeishuClient;
