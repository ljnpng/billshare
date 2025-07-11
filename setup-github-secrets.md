# GitHub Secrets 设置指南

## 必需的 Secrets

为了让 GitHub Actions 正常工作，您需要设置以下 secrets：

### 1. API Keys (已设置)
- `CLAUDE_API_KEY`: ✅ 已设置
- `GROQ_API_KEY`: ⚠️ 已设置占位符，需要更新真实的 API Key
- `AI_PROVIDER`: ✅ 已设置为 "claude"

### 2. Vercel 部署配置 (需要设置)
- `VERCEL_TOKEN`: Vercel 部署令牌
- `VERCEL_ORG_ID`: Vercel 组织 ID
- `VERCEL_PROJECT_ID`: Vercel 项目 ID

## 设置步骤

### 获取 Groq API Key
1. 访问 https://console.groq.com/
2. 注册/登录账户
3. 创建 API Key
4. 运行以下命令更新：
   ```bash
   gh secret set GROQ_API_KEY --body "your-actual-groq-api-key"
   ```

### 获取 Vercel 配置
1. 访问 https://vercel.com/
2. 登录您的账户
3. 创建或选择项目
4. 获取以下信息：
   - Token: Settings > Tokens > Create Token
   - Org ID: Settings > General > Organization ID
   - Project ID: 项目设置页面的 Project ID

5. 运行以下命令设置：
   ```bash
   gh secret set VERCEL_TOKEN --body "your-vercel-token"
   gh secret set VERCEL_ORG_ID --body "your-vercel-org-id"
   gh secret set VERCEL_PROJECT_ID --body "your-vercel-project-id"
   ```

## 验证设置
运行以下命令验证所有 secrets 是否已设置：
```bash
gh secret list
```

## 当前状态
- ✅ 构建错误已修复
- ✅ TypeScript 类型声明已添加
- ✅ API 客户端延迟初始化已实现
- ✅ Claude API Key 已设置
- ⚠️ Groq API Key 需要更新
- ❌ Vercel 配置需要设置

## 下一步
1. 获取真实的 Groq API Key 并更新
2. 设置 Vercel 相关的 secrets
3. 推送代码触发新的部署 