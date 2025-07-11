#!/bin/bash

# AAP费用分摊 - GitHub CLI 自动部署脚本
# 使用方法: ./scripts/deploy.sh

set -e

echo "🚀 AAP费用分摊 - GitHub CLI 自动部署"
echo "=================================="

# 检查必要的工具
check_dependencies() {
    echo "📋 检查依赖..."
    
    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI (gh) 未安装"
        echo "请安装: brew install gh 或访问 https://cli.github.com/"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI 未安装"
        echo "正在安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "✅ 依赖检查完成"
}

# 检查 GitHub 认证
check_github_auth() {
    echo "🔐 检查 GitHub 认证..."
    
    if ! gh auth status &> /dev/null; then
        echo "请先登录 GitHub CLI:"
        gh auth login
    fi
    
    echo "✅ GitHub 认证已就绪"
}

# 检查 Vercel 认证
check_vercel_auth() {
    echo "🔐 检查 Vercel 认证..."
    
    if ! vercel whoami &> /dev/null; then
        echo "请先登录 Vercel CLI:"
        vercel login
    fi
    
    echo "✅ Vercel 认证已就绪"
}

# 创建或更新 GitHub 仓库
setup_github_repo() {
    echo "📦 设置 GitHub 仓库..."
    
    # 检查是否已有远程仓库
    if git remote get-url origin &> /dev/null; then
        echo "✅ 已连接到 GitHub 仓库"
        return
    fi
    
    # 提示用户输入仓库名称
    read -p "请输入仓库名称 (默认: aapay): " repo_name
    repo_name=${repo_name:-aapay}
    
    # 创建 GitHub 仓库
    echo "正在创建 GitHub 仓库: $repo_name"
    gh repo create "$repo_name" --private --description "Next.js 全栈项目 - AI 收据处理应用" --source=. --remote=origin --push
    
    echo "✅ GitHub 仓库创建完成"
}

# 链接 Vercel 项目
setup_vercel_project() {
    echo "🔗 设置 Vercel 项目..."
    
    # 检查是否已链接项目
    if [ -f ".vercel/project.json" ]; then
        echo "✅ 已链接到 Vercel 项目"
        return
    fi
    
    # 链接或创建 Vercel 项目
    vercel link --yes
    
    echo "✅ Vercel 项目链接完成"
}

# 获取 Vercel 配置信息
get_vercel_config() {
    echo "📋 获取 Vercel 配置信息..."
    
    if [ ! -f ".vercel/project.json" ]; then
        echo "❌ 请先链接 Vercel 项目"
        exit 1
    fi
    
    # 读取配置
    ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)
    PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
    
    echo "组织 ID: $ORG_ID"
    echo "项目 ID: $PROJECT_ID"
    
    echo "✅ Vercel 配置信息获取完成"
}

# 设置 GitHub Secrets
setup_github_secrets() {
    echo "🔑 设置 GitHub Secrets..."
    
    # 获取 Vercel Token
    echo "请获取 Vercel API Token:"
    echo "1. 访问 https://vercel.com/account/tokens"
    echo "2. 点击 'Create Token'"
    echo "3. 输入名称如 'GitHub Actions'"
    echo "4. 复制生成的 token"
    echo ""
    read -s -p "请输入 Vercel Token: " VERCEL_TOKEN
    echo ""
    
    # 设置 AI 服务配置
    echo "请选择 AI 服务提供商:"
    echo "1. Claude (高精度，推荐)"
    echo "2. Groq (高速度，经济)"
    read -p "请选择 (1 或 2): " ai_choice
    
    if [ "$ai_choice" = "1" ]; then
        AI_PROVIDER="claude"
        read -s -p "请输入 Claude API Key: " CLAUDE_API_KEY
        echo ""
        GROQ_API_KEY=""
    else
        AI_PROVIDER="groq"
        read -s -p "请输入 Groq API Key: " GROQ_API_KEY
        echo ""
        CLAUDE_API_KEY=""
    fi
    
    # 设置 GitHub Secrets
    echo "正在设置 GitHub Secrets..."
    
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
    
    echo "✅ GitHub Secrets 设置完成"
}

# 推送代码并触发部署
deploy_project() {
    echo "🚀 部署项目..."
    
    # 确保所有文件都已提交
    git add .
    git commit -m "feat: 配置自动部署" || echo "没有新的更改需要提交"
    
    # 推送到 GitHub
    git push origin main
    
    echo "✅ 代码已推送，GitHub Actions 将自动开始部署"
    echo "📊 查看部署状态: gh run list"
    echo "🌐 查看部署日志: gh run view --log"
}

# 显示部署状态
show_deployment_status() {
    echo "📊 部署状态监控..."
    
    # 等待一下让 GitHub Actions 开始
    sleep 5
    
    # 显示最新的运行状态
    echo "最新的 GitHub Actions 运行:"
    gh run list --limit 3
    
    echo ""
    echo "🔗 有用的链接:"
    echo "- GitHub Actions: $(gh repo view --json url -q .url)/actions"
    echo "- Vercel Dashboard: https://vercel.com/dashboard"
    echo ""
    echo "📝 常用命令:"
    echo "- 查看运行状态: gh run list"
    echo "- 查看运行日志: gh run view --log"
    echo "- 重新运行失败的任务: gh run rerun [run-id]"
}

# 主函数
main() {
    echo "开始自动部署流程..."
    echo ""
    
    check_dependencies
    check_github_auth
    check_vercel_auth
    setup_github_repo
    setup_vercel_project
    get_vercel_config
    setup_github_secrets
    deploy_project
    show_deployment_status
    
    echo ""
    echo "🎉 部署配置完成！"
    echo "您的应用将在几分钟内可用。"
}

# 运行主函数
main "$@" 