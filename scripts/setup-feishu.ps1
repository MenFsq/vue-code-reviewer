#!/usr/bin/env pwsh
# 飞书集成快速配置脚本

Write-Host "🚀 飞书集成快速配置脚本" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# 检查环境
Write-Host "📋 环境检查..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green

# 检查项目结构
Write-Host "`n📁 项目结构检查..." -ForegroundColor Yellow
$requiredFiles = @(
    "package.json",
    "reviewer.js", 
    "src/integrations/feishu-integration.js",
    "config/feishu.config.js",
    "examples/feishu-integration-example.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (缺失)" -ForegroundColor Red
    }
}

# 配置选项
Write-Host "`n⚙️  配置选项:" -ForegroundColor Cyan
Write-Host "1. 创建环境变量配置文件 (.env)" -ForegroundColor Yellow
Write-Host "2. 创建本地配置文件 (feishu.config.local.js)" -ForegroundColor Yellow
Write-Host "3. 测试当前配置" -ForegroundColor Yellow
Write-Host "4. 运行示例测试" -ForegroundColor Yellow
Write-Host "5. 退出" -ForegroundColor Gray

$choice = Read-Host "`n请选择 (1-5)"

switch ($choice) {
    "1" {
        # 创建 .env 文件
        Write-Host "`n📝 创建环境变量配置文件..." -ForegroundColor Yellow
        
        $envContent = @"
# 飞书应用凭证（必需）
# 从飞书开放平台获取: https://open.feishu.cn
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here

# 可选配置
# FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx
# FEISHU_FOLDER_TOKEN=fldcnxxxxxxxxxx
# FEISHU_SHARE_USERS=ou_xxxxxx,ou_yyyyyy

# 调试模式
# DEBUG=feishu:*
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Host "✅ 已创建 .env 文件" -ForegroundColor Green
        Write-Host "   请编辑 .env 文件，设置你的飞书应用凭证" -ForegroundColor Gray
    }
    
    "2" {
        # 创建本地配置文件
        Write-Host "`n📝 创建本地配置文件..." -ForegroundColor Yellow
        
        if (Test-Path "config/feishu.config.js") {
            Copy-Item "config/feishu.config.js" "config/feishu.config.local.js"
            Write-Host "✅ 已创建 config/feishu.config.local.js" -ForegroundColor Green
            Write-Host "   请编辑该文件，设置你的飞书应用凭证" -ForegroundColor Gray
        } else {
            Write-Host "❌ 配置文件模板不存在" -ForegroundColor Red
        }
    }
    
    "3" {
        # 测试当前配置
        Write-Host "`n🔧 测试当前配置..." -ForegroundColor Yellow
        
        # 检查环境变量
        $appId = $env:FEISHU_APP_ID
        $appSecret = $env:FEISHU_APP_SECRET
        
        if ($appId -and $appSecret) {
            Write-Host "✅ 环境变量已设置" -ForegroundColor Green
            Write-Host "   App ID: $appId" -ForegroundColor Gray
            Write-Host "   App Secret: ********" -ForegroundColor Gray
        } else {
            Write-Host "⚠️  环境变量未设置" -ForegroundColor Yellow
            Write-Host "   请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET" -ForegroundColor Gray
        }
        
        # 检查本地配置文件
        if (Test-Path "config/feishu.config.local.js") {
            Write-Host "✅ 本地配置文件存在" -ForegroundColor Green
        } else {
            Write-Host "⚠️  本地配置文件不存在" -ForegroundColor Yellow
        }
        
        # 测试模块加载
        Write-Host "`n📦 测试模块加载..." -ForegroundColor Yellow
        try {
            $moduleTest = node -e "try { const FeishuIntegration = require('./src/integrations/feishu-integration'); console.log('✅ FeishuIntegration 模块可加载'); } catch(e) { console.log('❌ 模块加载失败:', e.message); }"
            Write-Host $moduleTest -ForegroundColor Green
        } catch {
            Write-Host "❌ 模块测试失败" -ForegroundColor Red
        }
    }
    
    "4" {
        # 运行示例测试
        Write-Host "`n🧪 运行示例测试..." -ForegroundColor Yellow
        
        # 检查环境变量
        if (-not $env:FEISHU_APP_ID -or -not $env:FEISHU_APP_SECRET) {
            Write-Host "⚠️  环境变量未设置，使用模拟测试" -ForegroundColor Yellow
            
            # 创建模拟测试
            $testScript = @"
console.log('🧪 飞书集成模拟测试...');
console.log('');

// 测试模块结构
try {
    const FeishuIntegration = require('./src/integrations/feishu-integration');
    console.log('✅ 1. FeishuIntegration 模块加载成功');
    
    // 创建模拟配置
    const mockConfig = {
        appId: 'mock_app_id',
        appSecret: 'mock_app_secret'
    };
    
    const integration = new FeishuIntegration(mockConfig);
    console.log('✅ 2. FeishuIntegration 实例创建成功');
    
    // 测试方法
    const methods = ['createReviewReport', 'batchCreateReports'];
    methods.forEach(method => {
        if (typeof integration[method] === 'function') {
            console.log(\`   ✅ \${method} 方法存在\`);
        } else {
            console.log(\`   ❌ \${method} 方法缺失\`);
        }
    });
    
    console.log('');
    console.log('📋 下一步:');
    console.log('1. 设置环境变量 FEISHU_APP_ID 和 FEISHU_APP_SECRET');
    console.log('2. 运行: node examples/feishu-integration-example.js');
    console.log('3. 或运行: npm test -- --feishu');
    
} catch (error) {
    console.error('❌ 测试失败:', error.message);
}
"@
            
            $testScript | Out-File -FilePath "test-feishu-mock.js" -Encoding UTF8
            node test-feishu-mock.js
            Remove-Item "test-feishu-mock.js" -Force
        } else {
            # 运行实际示例
            Write-Host "✅ 环境变量已设置，运行实际示例..." -ForegroundColor Green
            try {
                node examples/feishu-integration-example.js
            } catch {
                Write-Host "❌ 示例运行失败: $_" -ForegroundColor Red
            }
        }
    }
    
    "5" {
        Write-Host "`n👋 退出配置脚本" -ForegroundColor Cyan
        exit 0
    }
    
    default {
        Write-Host "❌ 无效选择" -ForegroundColor Red
    }
}

Write-Host "`n📚 相关资源:" -ForegroundColor Cyan
Write-Host "• 飞书开放平台: https://open.feishu.cn" -ForegroundColor Gray
Write-Host "• 配置指南: docs/feishu-setup-guide.md" -ForegroundColor Gray
Write-Host "• GitHub: https://github.com/MenFsq/vue-code-reviewer" -ForegroundColor Gray
Write-Host "• BotLearn 社区: https://www.botlearn.ai/community" -ForegroundColor Gray

Write-Host "`n🎯 配置完成！" -ForegroundColor Green
Write-Host "下一步: 在飞书开放平台创建应用，获取 App ID 和 App Secret" -ForegroundColor Yellow