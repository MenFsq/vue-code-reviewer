#!/usr/bin/env node

/**
 * Vue Code Reviewer 安装脚本
 * 
 * 功能：
 * 1. 检查环境依赖
 * 2. 安装必要工具
 * 3. 配置项目
 * 4. 创建Git钩子
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class Installer {
  constructor() {
    this.projectRoot = process.cwd();
    this.openclawConfigPath = path.join(this.projectRoot, '.openclaw', 'config.json');
    this.gitHooksPath = path.join(this.projectRoot, '.git', 'hooks');
  }

  /**
   * 运行安装流程
   */
  async run() {
    console.log('🚀 开始安装 Vue Code Reviewer...\n');

    try {
      // 1. 检查环境
      this.checkEnvironment();

      // 2. 安装依赖
      this.installDependencies();

      // 3. 配置项目
      this.configureProject();

      // 4. 设置Git钩子
      this.setupGitHooks();

      // 5. 创建示例文件
      this.createExamples();

      console.log('\n✅ Vue Code Reviewer 安装完成！');
      console.log('\n📋 下一步：');
      console.log('1. 运行代码审查: npx openclaw exec --skill vue-code-reviewer --project .');
      console.log('2. 查看配置: cat .openclaw/config.json');
      console.log('3. 自定义规则: 编辑 .vue-code-reviewer-rules.js');
      console.log('4. 集成到CI: 参考 .github/workflows/code-review.yml\n');

    } catch (error) {
      console.error(`❌ 安装失败: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * 检查环境依赖
   */
  checkEnvironment() {
    console.log('🔍 检查环境依赖...');

    // 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion < 14) {
      throw new Error(`Node.js版本过低 (${nodeVersion})，需要14.0.0或更高版本`);
    }
    console.log(`   ✓ Node.js ${nodeVersion}`);

    // 检查npm/yarn
    try {
      execSync('npm --version', { stdio: 'pipe' });
      console.log('   ✓ npm 已安装');
    } catch {
      try {
        execSync('yarn --version', { stdio: 'pipe' });
        console.log('   ✓ yarn 已安装');
      } catch {
        throw new Error('需要npm或yarn包管理器');
      }
    }

    // 检查Git
    try {
      execSync('git --version', { stdio: 'pipe' });
      console.log('   ✓ Git 已安装');
    } catch {
      console.warn('   ⚠️  Git未安装，跳过Git钩子设置');
    }

    // 检查OpenClaw
    try {
      execSync('openclaw --version', { stdio: 'pipe' });
      console.log('   ✓ OpenClaw 已安装');
    } catch {
      console.warn('   ⚠️  OpenClaw未安装，请先安装: npm install -g openclaw');
    }

    // 检查项目类型
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.warn('   ⚠️  未找到package.json，可能不是Node.js项目');
    } else {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.vue) {
        console.log(`   ✓ Vue ${deps.vue}`);
      } else {
        console.warn('   ⚠️  未检测到Vue依赖，本工具专为Vue项目设计');
      }

      if (deps.typescript) {
        console.log(`   ✓ TypeScript ${deps.typescript}`);
      } else {
        console.warn('   ⚠️  未检测到TypeScript，建议使用TypeScript以获得更好的类型检查');
      }
    }
  }

  /**
   * 安装依赖
   */
  installDependencies() {
    console.log('\n📦 安装依赖...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('   跳过依赖安装（无package.json）');
      return;
    }

    const devDependencies = {
      // 代码质量工具
      'eslint': '^8.0.0',
      '@typescript-eslint/parser': '^6.0.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      'eslint-plugin-vue': '^9.0.0',
      
      // 安全工具
      'dompurify': '^3.0.0',
      
      // 性能工具
      'webpack-bundle-analyzer': '^4.0.0',
      
      // 测试工具（可选）
      'vitest': '^1.0.0',
      '@vue/test-utils': '^2.0.0'
    };

    console.log('   将安装以下开发依赖：');
    Object.entries(devDependencies).forEach(([pkg, version]) => {
      console.log(`     • ${pkg}@${version}`);
    });

    // 询问是否安装
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('\n   是否安装这些依赖？ (y/n): ', (answer) => {
        rl.close();

        if (answer.toLowerCase() === 'y') {
          try {
            console.log('   正在安装依赖...');
            
            // 安装ESLint和相关插件
            execSync(`npm install --save-dev ${Object.entries(devDependencies).map(([pkg, version]) => `${pkg}@${version}`).join(' ')}`, {
              stdio: 'inherit',
              cwd: this.projectRoot
            });

            console.log('   ✓ 依赖安装完成');
          } catch (error) {
            console.warn(`   ⚠️  依赖安装失败: ${error.message}`);
            console.log('   你可以稍后手动安装：');
            console.log('   npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-vue');
          }
        } else {
          console.log('   跳过依赖安装');
        }

        resolve();
      });
    });
  }

  /**
   * 配置项目
   */
  configureProject() {
    console.log('\n⚙️  配置项目...');

    // 创建.openclaw目录
    const openclawDir = path.join(this.projectRoot, '.openclaw');
    if (!fs.existsSync(openclawDir)) {
      fs.mkdirSync(openclawDir, { recursive: true });
      console.log('   ✓ 创建 .openclaw 目录');
    }

    // 创建配置文件
    const configTemplate = fs.readFileSync(
      path.join(__dirname, 'config-template.json'),
      'utf8'
    );

    let existingConfig = {};
    if (fs.existsSync(this.openclawConfigPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(this.openclawConfigPath, 'utf8'));
      } catch (error) {
        console.warn(`   ⚠️  无法读取现有配置: ${error.message}`);
      }
    }

    // 合并配置
    const newConfig = {
      ...existingConfig,
      vueCodeReviewer: JSON.parse(configTemplate).vueCodeReviewer
    };

    fs.writeFileSync(
      this.openclawConfigPath,
      JSON.stringify(newConfig, null, 2),
      'utf8'
    );
    console.log('   ✓ 更新 .openclaw/config.json');

    // 创建ESLint配置
    this.createEslintConfig();

    // 创建TypeScript配置
    this.createTypescriptConfig();

    // 创建自定义规则模板
    this.createCustomRulesTemplate();
  }

  /**
   * 创建ESLint配置
   */
  createEslintConfig() {
    const eslintConfigPath = path.join(this.projectRoot, '.eslintrc.js');
    
    if (fs.existsSync(eslintConfigPath)) {
      console.log('   ⚠️  .eslintrc.js已存在，跳过创建');
      return;
    }

    const eslintConfig = `module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'vue'],
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'error',
    'vue/no-unused-vars': 'error',
    'vue/require-default-prop': 'warn',
    
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
};`;

    fs.writeFileSync(eslintConfigPath, eslintConfig, 'utf8');
    console.log('   ✓ 创建 .eslintrc.js');
  }

  /**
   * 创建TypeScript配置
   */
  createTypescriptConfig() {
    const tsConfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (fs.existsSync(tsConfigPath)) {
      console.log('   ⚠️  tsconfig.json已存在，跳过创建');
      return;
    }

    const tsConfig = {
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "useUnknownInCatchVariables": true,
        "alwaysStrict": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitReturns": true,
        "noImplicitOverride": true,
        "allowUnusedLabels": false,
        "allowUnreachableCode": false
      },
      "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
      "references": [{ "path": "./tsconfig.node.json" }]
    };

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2), 'utf8');
    console.log('   ✓ 创建 tsconfig.json');

    // 创建Node.js的TypeScript配置
    const tsConfigNodePath = path.join(this.projectRoot, 'tsconfig.node.json');
    const tsConfigNode = {
      "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true,
        "strict": true
      },
      "include": ["vite.config.ts"]
    };

    fs.writeFileSync(tsConfigNodePath, JSON.stringify(tsConfigNode, null, 2), 'utf8');
    console.log('   ✓ 创建 tsconfig.node.json');
  }

  /**
   * 创建自定义规则模板
   */
  createCustomRulesTemplate() {
    const rulesTemplatePath = path.join(this.projectRoot, '.vue-code-reviewer-rules.js');
    
    if (fs.existsSync(rulesTemplatePath)) {
      console.log('   ⚠️  .vue-code-reviewer-rules.js已存在，跳过创建');
      return;
    }

    const rulesTemplate = `/**
 * Vue Code Reviewer 自定义规则
 * 
 * 在这里添加项目特定的代码审查规则
 */

module.exports = {
  rules: {
    // 示例：禁止在组件中使用全局变量
    'no-global-state-in-components': {
      check: (fileContent, filePath) => {
        const issues = [];
        
        // 检查是否直接使用了window或document
        if (fileContent.includes('window.') && !fileContent.includes('typeof window')) {
          issues.push({
            line: 1,
            message: '组件中直接使用了window对象',
            suggestion: '通过props或provide/inject传递依赖，或使用composable封装'
          });
        }
        
        return issues;
      },
      message: '避免在组件中直接使用全局状态',
      severity: 'major'
    },

    // 示例：强制使用特定的组件结构
    'enforce-component-structure': {
      check: (fileContent, filePath) => {
        const issues = [];
        const lines = fileContent.split('\\n');
        
        // 检查组件是否按照特定顺序组织
        const expectedOrder = [
          'template',
          'script',
          'style'
        ];
        
        let foundSections = [];
        
        lines.forEach((line, index) => {
          if (line.includes('<template>')) foundSections.push({ type: 'template', line: index + 1 });
          if (line.includes('<script')) foundSections.push({ type: 'script', line: index + 1 });
          if (line.includes('<style')) foundSections.push({ type: 'style', line: index + 1 });
        });
        
        // 检查顺序是否正确
        for (let i = 0; i < foundSections.length; i++) {
          if (foundSections[i].type !== expectedOrder[i]) {
            issues.push({
              line: foundSections[i].line,
              message: \`组件结构顺序不正确，期望: \${expectedOrder.join(' -> ')}, 实际: \${foundSections.map(s => s.type).join(' -> ')}\`,
              suggestion: '按照 template -> script -> style 的顺序组织组件'
            });
            break;
          }
        }
        
        return issues;
      },
      message: '组件结构不符合规范',
      severity: 'minor'
    },

    // 示例：检查特定的业务逻辑规则
    'business-logic-validation': {
      check: (fileContent, filePath) => {
        const issues = [];
        
        // 示例：检查是否对用户输入进行了验证
        if (filePath.includes('UserForm') && fileContent.includes('v-model')) {
          if (!fileContent.includes('validate') && !fileContent.includes('rules')) {
            issues.push({
              line: 1,
              message: '用户表单缺少输入验证',
              suggestion: '添加表单验证逻辑，可以使用VeeValidate或自定义验证函数'
            });
          }
        }
        
        return issues;
      },
      message: '业务逻辑验证',
      severity: 'major'
    }
  }
};`;

    fs.writeFileSync(rulesTemplatePath, rulesTemplate, 'utf8');
    console.log('   ✓ 创建 .vue-code-reviewer-rules.js');
  }

  /**
   * 设置Git钩子
   */
  setupGitHooks() {
    console.log('\n🔗 设置Git钩子...');

    // 检查是否是Git仓库
    const gitDir = path.join(this.projectRoot, '.git');
    if (!fs.existsSync(gitDir)) {
      console.log('   ⚠️  不是Git仓库，跳过Git钩子设置');
      return;
    }

    // 创建hooks目录
    if (!fs.existsSync(this.gitHooksPath)) {
      fs.mkdirSync(this.gitHooksPath, { recursive: true });
    }

    // 创建pre-commit钩子
    const preCommitHook = `#!/bin/sh

# Vue Code Reviewer - Pre-commit Hook
# 在提交前自动运行代码审查

echo "🔍 运行Vue代码审查..."

# 运行代码审查
npx openclaw exec --skill vue-code-reviewer --staged

if [ $? -ne 0 ]; then
  echo "❌ 代码审查未通过，请修复问题后再提交"
  exit 1
fi

echo "✅ 代码审查通过，可以提交"
exit 0`;

    const preCommitPath = path.join(this.gitHooksPath, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitHook, 'utf8');
    
    // 设置执行权限
    try {
      fs.chmodSync(preCommitPath, '755');
      console.log('   ✓ 创建 pre-commit 钩子');
    } catch (error) {
      console.warn(`   ⚠️  无法设置执行权限: ${error.message}`);
      console.log('   请手动设置执行权限: chmod +x .git/hooks/pre-commit');
    }

    // 创建commit-msg钩子（可选）
    const commitMsgHook = `#!/bin/sh

# Vue Code Reviewer - Commit Message Hook
# 检查提交消息格式

COMMIT_MSG_FILE=\$1
COMMIT_MSG=\$(cat "\$COMMIT_MSG_FILE")

# 检查提交消息是否为空
if [ -z "\$COMMIT_MSG" ]; then
  echo "❌ 提交消息不能为空"
  exit 1
fi

# 检查提交消息格式（可选）
# 这里可以添加更多格式检查，如Conventional Commits

echo "✅ 提交消息格式检查通过"
exit 0`;

    const commitMsgPath = path.join(this.gitHooksPath, 'commit-msg');
    fs.writeFileSync(commitMsgPath, commitMsgHook, 'utf8');
    
    try {
      fs.chmodSync(commitMsgPath, '755');
      console.log('   ✓ 创建 commit-msg 钩子');
    } catch (error) {
      console.warn(`   ⚠️  无法设置执行权限: ${error.message}`);
    }

    console.log('\n   📝 Git钩子设置完成');
    console.log('   下次提交时将自动运行代码审查');
  }

  /**
   * 创建示例文件
   */
  createExamples() {
    console.log('\n📝 创建示例文件...');

    const examplesDir = path.join(this.projectRoot, 'examples');
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
    }

    // 创建好的示例
    const goodExample = `<template>
  <div>
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
    <div>{{ sanitizedContent }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import DOMPurify from 'dompurify'

interface Item {
  id: number
  name: string
}

export default defineComponent({
  name: 'GoodComponent',
  setup() {
    const items = ref<Item[]>([])
    const userContent = ref<string>('')
    
    // 使用计算属性进行净化
    const sanitizedContent = computed(() => {
      return DOMPurify.sanitize(userContent.value)
    })
    
    // 明确的类型定义
    const processData = (data: Item[]): Item[] => {
      return data.filter(item => item.id > 0)
    }
    
    return {
      items,
      userContent,
      sanitizedContent,
      processData
    }
  }
})
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
</style>`;

    const goodExamplePath = path.join(examplesDir, 'GoodComponent.vue');
    fs.writeFileSync(goodExamplePath, goodExample, 'utf8');
    console.log('   ✓ 创建好的示例: examples/GoodComponent.vue');

    // 创建需要改进的示例
    const badExample = `<template>
  <div>
    <ul>
      <li v-for="item in items">
        {{ item.name }}
      </li>
    </ul>
    <div v-html="userContent"></div>
  </div>
</template>

<script>
export default {
  name: 'BadComponent',
  data() {
    return {
      items: [],
      userContent: ''
    }
  },
  methods: {
    processData(data) {
      return data
    }
  }
}
</script>

<style>
ul {
  list-style: none;
}
</style>`;

    const badExamplePath = path.join(examplesDir, 'BadComponent.vue');
    fs.writeFileSync(badExamplePath, badExample, 'utf8');
    console.log('   ✓ 创建需要改进的示例: examples/BadComponent.vue');

    // 创建CI/CD配置文件
    const ciConfig = `name: Vue Code Review
on: [pull_request, push]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Vue Code Review
        run: |
          npx openclaw exec --skill vue-code-reviewer --project .
          echo "✅ 代码审查完成"
      - name: Upload review report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: code-review-report
          path: |
            vue-code-review-report.json
            VUE-CODE-REVIEW-REPORT.md`;

    const ciDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(ciDir)) {
      fs.mkdirSync(ciDir, { recursive: true });
    }

    const ciPath = path.join(ciDir, 'code-review.yml');
    fs.writeFileSync(ciPath, ciConfig, 'utf8');
    console.log('   ✓ 创建CI/CD配置: .github/workflows/code-review.yml');

    console.log('\n   🎯 示例文件创建完成');
    console.log('   运行审查查看效果: npx openclaw exec --skill vue-code-reviewer --file examples/BadComponent.vue');
  }
}

// 命令行接口
if (require.main === module) {
  const installer = new Installer();
  installer.run();
}

module.exports = { Installer };