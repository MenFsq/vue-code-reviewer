// vue-code-reviewer BotLearn 0.4.2 Actionable Learning 集成模块
// 版本: 1.1.0
// 作者: LittleTiger 🐯

/**
 * BotLearn Actionable Learning 集成
 * 将vue-code-reviewer与BotLearn 0.4.2的Actionable Learning功能集成
 */

const fs = require('fs');
const path = require('path');

class BotLearnActionableLearning {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.BOTLEARN_API_KEY,
      apiBase: config.apiBase || 'https://www.botlearn.ai',
      learningActionableInstall: config.learningActionableInstall || false,
      matchThreshold: config.matchThreshold || 0.7,
      ...config
    };
    
    this.discoveredSkills = [];
    this.installedSkills = [];
  }

  /**
   * 初始化BotLearn集成
   */
  async initialize() {
    console.log('🔄 初始化 BotLearn 0.4.2 Actionable Learning 集成...');
    
    try {
      // 检查API密钥
      if (!this.config.apiKey) {
        throw new Error('BotLearn API密钥未配置');
      }

      // 测试API连接
      await this.testConnection();
      
      console.log('✅ BotLearn 集成初始化成功');
      console.log(`📊 配置: actionable_install=${this.config.learningActionableInstall}, threshold=${this.config.matchThreshold}`);
      
      return true;
    } catch (error) {
      console.error('❌ BotLearn 集成初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 测试API连接
   */
  async testConnection() {
    const response = await this._apiRequest('/api/v2/agents/me', 'GET');
    if (response && response.data) {
      console.log(`👤 连接成功: ${response.data.name || '未知用户'}`);
      return true;
    }
    throw new Error('API连接测试失败');
  }

  /**
   * 从代码审查结果中发现相关技能
   * @param {Array} reviewResults 代码审查结果
   * @returns {Array} 发现的技能
   */
  async discoverSkillsFromReview(reviewResults) {
    console.log('🔍 从代码审查结果中发现技能...');
    
    const skills = [];
    
    // 分析审查结果，提取技术关键词
    const techKeywords = this._extractTechKeywords(reviewResults);
    
    // 使用BotLearn API搜索相关技能
    for (const keyword of techKeywords) {
      try {
        const relatedSkills = await this._searchSkills(keyword);
        skills.push(...relatedSkills.map(skill => ({
          ...skill,
          source: 'code-review',
          matchKeyword: keyword
        })));
      } catch (error) {
        console.warn(`⚠️ 搜索技能 "${keyword}" 失败:`, error.message);
      }
    }
    
    // 去重和排序
    const uniqueSkills = this._deduplicateSkills(skills);
    this.discoveredSkills = uniqueSkills;
    
    console.log(`📊 发现 ${uniqueSkills.length} 个相关技能`);
    return uniqueSkills;
  }

  /**
   * 自动安装高匹配度技能
   */
  async autoInstallHighMatchSkills() {
    if (!this.config.learningActionableInstall) {
      console.log('⏸️ 自动安装已禁用，跳过安装');
      return [];
    }

    const highMatchSkills = this.discoveredSkills.filter(
      skill => skill.matchScore >= this.config.matchThreshold
    );

    console.log(`🚀 准备安装 ${highMatchSkills.length} 个高匹配度技能...`);
    
    const installed = [];
    for (const skill of highMatchSkills) {
      try {
        const result = await this._installSkill(skill.id, 'learning');
        installed.push({
          skill: skill.name,
          id: skill.id,
          result
        });
        console.log(`✅ 已安装技能: ${skill.name}`);
      } catch (error) {
        console.error(`❌ 安装技能 "${skill.name}" 失败:`, error.message);
      }
    }

    this.installedSkills.push(...installed);
    return installed;
  }

  /**
   * 生成学习报告
   */
  generateLearningReport() {
    const report = {
      timestamp: new Date().toISOString(),
      botlearnVersion: '0.4.2',
      config: {
        learningActionableInstall: this.config.learningActionableInstall,
        matchThreshold: this.config.matchThreshold
      },
      discoveredSkills: this.discoveredSkills.map(skill => ({
        name: skill.name,
        matchScore: skill.matchScore,
        source: skill.source,
        installable: skill.installable
      })),
      installedSkills: this.installedSkills.map(install => ({
        skill: install.skill,
        id: install.id
      })),
      summary: {
        totalDiscovered: this.discoveredSkills.length,
        highMatch: this.discoveredSkills.filter(s => s.matchScore >= 0.8).length,
        totalInstalled: this.installedSkills.length
      }
    };

    return report;
  }

  /**
   * 保存报告到文件
   */
  saveReportToFile(report, filePath = 'botlearn-learning-report.json') {
    try {
      const fullPath = path.resolve(filePath);
      fs.writeFileSync(fullPath, JSON.stringify(report, null, 2));
      console.log(`📄 学习报告已保存: ${fullPath}`);
      return true;
    } catch (error) {
      console.error('❌ 保存报告失败:', error.message);
      return false;
    }
  }

  // 私有方法

  async _apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${this.config.apiBase}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`API请求错误: ${error.message}`);
    }
  }

  _extractTechKeywords(reviewResults) {
    const keywords = new Set();
    
    // 从审查结果中提取技术关键词
    reviewResults.forEach(result => {
      if (result.category) {
        keywords.add(result.category.toLowerCase());
      }
      
      if (result.suggestions) {
        result.suggestions.forEach(suggestion => {
          // 提取技术术语
          const techTerms = suggestion.match(/\b(vue|typescript|composition|reactivity|hook|component|props|emit)\b/gi);
          if (techTerms) {
            techTerms.forEach(term => keywords.add(term.toLowerCase()));
          }
        });
      }
    });

    return Array.from(keywords);
  }

  async _searchSkills(keyword) {
    // 模拟搜索技能
    // 实际实现应调用BotLearn API
    return [
      {
        id: `skill_${keyword}_001`,
        name: `${keyword} 最佳实践`,
        description: `关于 ${keyword} 的最佳实践和模式`,
        matchScore: 0.85,
        installable: true
      },
      {
        id: `skill_${keyword}_002`,
        name: `${keyword} 代码审查规则`,
        description: `用于 ${keyword} 代码审查的规则集`,
        matchScore: 0.75,
        installable: true
      }
    ];
  }

  async _installSkill(skillId, source = 'learning') {
    // 模拟安装技能
    // 实际实现应调用BotLearn API
    return {
      success: true,
      skillId,
      source,
      installedAt: new Date().toISOString()
    };
  }

  _deduplicateSkills(skills) {
    const seen = new Set();
    return skills.filter(skill => {
      const key = `${skill.id}_${skill.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// 导出模块
module.exports = {
  BotLearnActionableLearning,
  
  // 工具函数
  createIntegration: (config) => new BotLearnActionableLearning(config),
  
  // 默认配置
  defaultConfig: {
    learningActionableInstall: false,
    matchThreshold: 0.7,
    autoSaveReport: true
  }
};

// 如果直接运行，显示使用说明
if (require.main === module) {
  console.log(`
🎯 vue-code-reviewer BotLearn 0.4.2 Actionable Learning 集成模块

使用方法:
1. 配置环境变量 BOTLEARN_API_KEY
2. 在代码中导入并使用:

   const { BotLearnActionableLearning } = require('./integrations/botlearn-actionable-learning');
   const integration = new BotLearnActionableLearning({
     learningActionableInstall: true,
     matchThreshold: 0.8
   });
   
   await integration.initialize();
   const skills = await integration.discoverSkillsFromReview(reviewResults);
   await integration.autoInstallHighMatchSkills();
   const report = integration.generateLearningReport();

功能:
- 🔍 从代码审查结果中发现相关技能
- 🚀 自动安装高匹配度技能
- 📊 生成详细的学习报告
- 💾 保存报告到文件

版本: 1.1.0
集成: BotLearn 0.4.2 Actionable Learning
  `);
}