#!/bin/bash

# Vercel 环境变量部署脚本
# 用法: ./deploy-env.sh [environment] [env-file]
# 环境: production, preview, development, all (默认: all)
# 配置文件: .env (默认) 或指定文件

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认值
ENV_FILE=".env"
TARGET_ENV="all"

# 解析命令行参数
if [ $# -ge 1 ]; then
    TARGET_ENV="$1"
fi

if [ $# -ge 2 ]; then
    ENV_FILE="$2"
fi

# 帮助信息
show_help() {
    echo -e "${BLUE}Vercel 环境变量部署脚本${NC}"
    echo ""
    echo "用法: $0 [environment] [env-file]"
    echo ""
    echo "参数:"
    echo "  environment    目标环境 (production|preview|development|all) [默认: all]"
    echo "  env-file       环境变量文件路径 [默认: .env]"
    echo ""
    echo "示例:"
    echo "  $0                          # 部署所有环境，使用 .env"
    echo "  $0 production               # 只部署到生产环境"
    echo "  $0 preview .env.staging     # 部署到预览环境，使用 .env.staging"
    echo ""
    echo "支持的环境变量:"
    echo "  - CLAUDE_API_KEY"
    echo "  - GROQ_API_KEY"
    echo "  - AI_PROVIDER"
    echo "  - UPSTASH_REDIS_REST_URL"
    echo "  - UPSTASH_REDIS_REST_TOKEN"
}

# 检查帮助参数
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
    exit 0
fi

# 验证环境参数
if [[ "$TARGET_ENV" != "production" && "$TARGET_ENV" != "preview" && "$TARGET_ENV" != "development" && "$TARGET_ENV" != "all" ]]; then
    echo -e "${RED}错误: 无效的环境参数 '$TARGET_ENV'${NC}"
    echo -e "支持的环境: production, preview, development, all"
    exit 1
fi

# 检查必要的工具
check_requirements() {
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}错误: 未找到 Vercel CLI${NC}"
        echo "请先安装: npm install -g vercel"
        exit 1
    fi
}

# 检查环境变量文件
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        echo -e "${RED}错误: 环境变量文件 '$ENV_FILE' 不存在${NC}"
        exit 1
    fi
}

# 从 .env 文件读取变量值
get_env_value() {
    local var_name="$1"
    local value=$(grep "^${var_name}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | sed 's/^"//;s/"$//')
    echo "$value"
}

# 添加环境变量到指定环境
add_env_var() {
    local var_name="$1"
    local var_value="$2"
    local env="$3"
    
    if [[ -n "$var_value" ]]; then
        echo -e "${BLUE}添加 $var_name 到 $env 环境...${NC}"
        if echo "$var_value" | vercel env add "$var_name" "$env" --force > /dev/null 2>&1; then
            echo -e "${GREEN}✓ $var_name 添加成功${NC}"
        else
            echo -e "${YELLOW}⚠ $var_name 可能已存在或添加失败${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ 跳过 $var_name (未在 $ENV_FILE 中找到)${NC}"
    fi
}

# 部署环境变量到指定环境
deploy_to_env() {
    local env="$1"
    echo -e "\n${BLUE}=== 部署到 $env 环境 ===${NC}"
    
    # 需要部署的环境变量列表
    local env_vars=(
        "CLAUDE_API_KEY"
        "GROQ_API_KEY"
        "AI_PROVIDER"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    for var_name in "${env_vars[@]}"; do
        local var_value=$(get_env_value "$var_name")
        add_env_var "$var_name" "$var_value" "$env"
    done
}

# 验证部署结果
verify_deployment() {
    echo -e "\n${BLUE}=== 验证部署结果 ===${NC}"
    vercel env ls
}

# 主函数
main() {
    echo -e "${GREEN}🚀 Vercel 环境变量部署脚本启动${NC}"
    echo -e "目标环境: ${YELLOW}$TARGET_ENV${NC}"
    echo -e "配置文件: ${YELLOW}$ENV_FILE${NC}"
    
    # 检查前置条件
    check_requirements
    check_env_file
    
    # 检查是否已链接到 Vercel 项目
    if [[ ! -d ".vercel" ]]; then
        echo -e "${RED}错误: 当前目录未链接到 Vercel 项目${NC}"
        echo "请先运行: vercel link"
        exit 1
    fi
    
    # 部署环境变量
    if [[ "$TARGET_ENV" == "all" ]]; then
        deploy_to_env "production"
        deploy_to_env "preview"
        deploy_to_env "development"
    else
        deploy_to_env "$TARGET_ENV"
    fi
    
    # 验证结果
    verify_deployment
    
    echo -e "\n${GREEN}✅ 环境变量部署完成！${NC}"
}

# 执行主函数
main "$@"