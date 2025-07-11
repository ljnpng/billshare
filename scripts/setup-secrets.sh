#!/bin/bash

# 设置 GitHub Secrets 的简化脚本

set -e

echo "🔑 设置 GitHub Secrets"
echo "====================="

# Vercel 配置（已知）
ORG_ID="team_efbARdmOJcSsfvrtl9T1XgjJ"
PROJECT_ID="prj_8w2h96gll61hVQVZJtNgUaRjnaX5"

echo "✅ Vercel 配置信息:"
echo "   组织 ID: $ORG_ID"
echo "   项目 ID: $PROJECT_ID"
echo ""

# 获取 Vercel Token
echo "📋 请获取 Vercel API Token:"
echo "1. 访问 https://vercel.com/account/tokens"
echo "2. 点击 'Create Token'"
echo "3. 输入名称如 'GitHub Actions'"
echo "4. 复制生成的 token"
echo ""
read -s -p "请输入 Vercel Token: " VERCEL_TOKEN
echo ""

# 选择 AI 服务
echo "🤖 请选择 AI 服务提供商:"
echo "1. Claude (高精度，推荐)"
echo "2. Groq (高速度，经济)"
read -p "请选择 (1 或 2): " ai_choice

if [ "$ai_choice" = "1" ]; then
    AI_PROVIDER="claude"
    echo "请获取 Claude API Key:"
    echo "访问 https://console.anthropic.com/"
    read -s -p "请输入 Claude API Key: " CLAUDE_API_KEY
    echo ""
    GROQ_API_KEY=""
else
    AI_PROVIDER="groq"
    echo "请获取 Groq API Key:"
    echo "访问 https://console.groq.com/"
    read -s -p "请输入 Groq API Key: " GROQ_API_KEY
    echo ""
    CLAUDE_API_KEY=""
fi

# 设置 GitHub Secrets
echo "🔧 正在设置 GitHub Secrets..."

gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --body "$ORG_ID"
gh secret set VERCEL_PROJECT_ID --body "$PROJECT_ID"
gh secret set AI_PROVIDER --body "$AI_PROVIDER"

if [ -n "$CLAUDE_API_KEY" ]; then
    gh secret set CLAUDE_API_KEY --body "$CLAUDE_API_KEY"
fi

if [ -n "$GROQ_API_KEY" ]; then
    gh secret set GROQ_API_KEY --body "$GROQ_API_KEY"
fi

echo "✅ GitHub Secrets 设置完成！"
echo ""
echo "📋 已设置的 Secrets:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo "   - AI_PROVIDER ($AI_PROVIDER)"
if [ -n "$CLAUDE_API_KEY" ]; then
    echo "   - CLAUDE_API_KEY"
fi
if [ -n "$GROQ_API_KEY" ]; then
    echo "   - GROQ_API_KEY"
fi

echo ""
echo "🚀 现在可以触发部署了！"
echo "   推送代码到 main 分支将自动部署到生产环境"
echo "   创建 Pull Request 将自动部署到预览环境"
echo ""
echo "📊 查看部署状态: gh run list"
echo "🌐 查看部署日志: gh run view --log" 