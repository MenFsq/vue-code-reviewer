/**
 * 飞书文档构建器
 * 将代码审查结果转换为飞书文档块
 */

class DocumentBuilder {
  constructor() {
    // 飞书文档块类型映射
    this.blockTypes = {
      heading1: 1,
      heading2: 2,
      heading3: 3,
      paragraph: 4,
      bullet: 5,
      ordered: 6,
      code: 7,
      quote: 8,
      todo: 9,
      divider: 10
    };
  }

  /**
   * 创建标题块
   */
  createHeading(text, level = 1) {
    return {
      block_type: this.blockTypes[`heading${level}`],
      heading: {
        elements: [this.createTextElement(text)],
        style: {
          align: 1 // 左对齐
        }
      }
    };
  }

  /**
   * 创建段落块
   */
  createParagraph(text, style = {}) {
    return {
      block_type: this.blockTypes.paragraph,
      paragraph: {
        elements: [this.createTextElement(text)],
        style: {
          align: 1,
          ...style
        }
      }
    };
  }

  /**
   * 创建代码块
   */
  createCodeBlock(code, language = 'javascript') {
    return {
      block_type: this.blockTypes.code,
      code: {
        elements: [this.createTextElement(code)],
        style: {
          language: language.toUpperCase()
        }
      }
    };
  }

  /**
   * 创建项目符号列表项
   */
  createBulletItem(text, children = []) {
    return {
      block_type: this.blockTypes.bullet,
      bullet: {
        elements: [this.createTextElement(text)],
        style: {},
        children: children.map(child => this.createBulletItem(child))
      }
    };
  }

  /**
   * 创建待办事项
   */
  createTodoItem(text, checked = false) {
    return {
      block_type: this.blockTypes.todo,
      todo: {
        elements: [this.createTextElement(text)],
        style: {
          checked
        }
      }
    };
  }

  /**
   * 创建分割线
   */
  createDivider() {
    return {
      block_type: this.blockTypes.divider,
      divider: {}
    };
  }

  /**
   * 创建文本元素
   */
  createTextElement(text, style = {}) {
    return {
      text_run: {
        content: text,
        style: {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code_inline: false,
          ...style
        }
      }
    };
  }

  /**
   * 创建加粗文本元素
   */
  createBoldText(text) {
    return this.createTextElement(text, { bold: true });
  }

  /**
   * 创建行内代码元素
   */
  createInlineCode(text) {
    return this.createTextElement(text, { code_inline: true });
  }

  /**
   * 构建代码审查报告文档块
   */
  buildReviewReport(reviewResult, options = {}) {
    const {
      projectName = '未命名项目',
      reviewDate = new Date().toLocaleString('zh-CN'),
      reviewer = 'Vue Code Reviewer'
    } = options;

    const blocks = [];

    // 标题
    blocks.push(this.createHeading(`代码审查报告 - ${projectName}`, 1));
    blocks.push(this.createParagraph(`审查时间: ${reviewDate}`));
    blocks.push(this.createParagraph(`审查工具: ${reviewer}`));
    blocks.push(this.createDivider());

    // 摘要统计
    const { summary = {} } = reviewResult;
    blocks.push(this.createHeading('审查摘要', 2));
    
    const summaryText = `共审查 ${summary.totalFiles || 0} 个文件，发现 ${
      summary.criticalIssues || 0
    } 个严重问题，${summary.warningIssues || 0} 个警告问题，${
      summary.suggestionIssues || 0
    } 个改进建议。`;
    
    blocks.push(this.createParagraph(summaryText));

    // 严重问题
    if (reviewResult.critical && reviewResult.critical.length > 0) {
      blocks.push(this.createHeading('🔴 严重问题', 2));
      reviewResult.critical.forEach((issue, index) => {
        blocks.push(this.createBulletItem(this.formatIssue(issue)));
        if (issue.codeSnippet) {
          blocks.push(this.createCodeBlock(issue.codeSnippet, issue.language || 'vue'));
        }
      });
    }

    // 警告问题
    if (reviewResult.warnings && reviewResult.warnings.length > 0) {
      blocks.push(this.createHeading('🟡 警告问题', 2));
      reviewResult.warnings.forEach((issue, index) => {
        blocks.push(this.createBulletItem(this.formatIssue(issue)));
      });
    }

    // 改进建议
    if (reviewResult.suggestions && reviewResult.suggestions.length > 0) {
      blocks.push(this.createHeading('🟢 改进建议', 2));
      reviewResult.suggestions.forEach((issue, index) => {
        blocks.push(this.createBulletItem(this.formatIssue(issue)));
      });
    }

    // 修复建议
    if (reviewResult.fixes && reviewResult.fixes.length > 0) {
      blocks.push(this.createHeading('🔧 修复建议', 2));
      reviewResult.fixes.forEach((fix, index) => {
        blocks.push(this.createTodoItem(fix.description, false));
        if (fix.example) {
          blocks.push(this.createCodeBlock(fix.example, 'vue'));
        }
      });
    }

    // 总结
    blocks.push(this.createDivider());
    blocks.push(this.createHeading('总结', 2));
    
    const conclusion = reviewResult.passed 
      ? '✅ 代码质量良好，可以通过审查。'
      : '❌ 存在严重问题，需要修复后才能通过。';
    
    blocks.push(this.createParagraph(conclusion));

    if (reviewResult.recommendations) {
      blocks.push(this.createParagraph('后续建议:'));
      reviewResult.recommendations.forEach(rec => {
        blocks.push(this.createBulletItem(rec));
      });
    }

    return blocks;
  }

  /**
   * 格式化问题描述
   */
  formatIssue(issue) {
    const parts = [];
    
    if (issue.file) {
      parts.push(`文件: ${this.createInlineCode(issue.file)}`);
    }
    
    if (issue.line) {
      parts.push(`行号: ${issue.line}`);
    }
    
    if (issue.rule) {
      parts.push(`规则: ${issue.rule}`);
    }
    
    parts.push(`描述: ${issue.message}`);
    
    if (issue.suggestion) {
      parts.push(`建议: ${issue.suggestion}`);
    }
    
    return parts.join(' | ');
  }

  /**
   * 将 Markdown 转换为飞书文档块（简化版）
   */
  markdownToBlocks(markdown) {
    const lines = markdown.split('\n');
    const blocks = [];
    let inCodeBlock = false;
    let codeContent = [];
    let codeLanguage = '';

    for (const line of lines) {
      // 代码块开始
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // 代码块结束
          blocks.push(this.createCodeBlock(codeContent.join('\n'), codeLanguage));
          inCodeBlock = false;
          codeContent = [];
        } else {
          // 代码块开始
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim() || 'text';
        }
        continue;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }

      // 标题
      if (line.startsWith('# ')) {
        blocks.push(this.createHeading(line.slice(2).trim(), 1));
      } else if (line.startsWith('## ')) {
        blocks.push(this.createHeading(line.slice(3).trim(), 2));
      } else if (line.startsWith('### ')) {
        blocks.push(this.createHeading(line.slice(4).trim(), 3));
      }
      // 列表项
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        blocks.push(this.createBulletItem(line.slice(2).trim()));
      }
      // 分割线
      else if (line.match(/^[-*_]{3,}$/)) {
        blocks.push(this.createDivider());
      }
      // 普通段落
      else if (line.trim()) {
        blocks.push(this.createParagraph(line.trim()));
      }
    }

    return blocks;
  }
}

module.exports = DocumentBuilder;
