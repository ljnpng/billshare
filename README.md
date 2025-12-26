# BillShare 智能费用分摊

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20%2B%20Groq-8A2BE2)](https://www.anthropic.com)
[![Redis](https://img.shields.io/badge/Redis-7.4-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](https://github.com/ljnpng/billshare/releases)


基于 Next.js 全栈架构的现代化费用分摊应用，利用 AI 图像识别技术自动解析收据，智能计算每个人的应付金额。支持税费、小费按比例分摊，让每个人都支付公平的份额。

## 🎯 在线体验

**🚀 [立即体验 Demo](https://billshare.amoy.day)**

<div align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://billshare.amoy.day" alt="扫码体验" />
  <p><em>扫码用手机体验</em></p>
</div>

## ✨ 功能特性

### 🤖 AI 智能识别

| 功能 | 描述 | 状态 |
|------|------|------|
| **多服务支持** | Claude 3.5 Haiku (高精度) / Groq Llama Vision (高速度) | ✅ |
| **格式支持** | JPG, PNG, GIF, WebP, HEIC/HEIF 自动转换 | ✅ |
| **客户端优化** | 上传前图片压缩，提升识别速度 | ✅ |
| **智能提示** | 根据用户语言环境使用不同提示语 | ✅ |
| **OCR 备选** | 离线 OCR 识别（计划中） | 🔄 |

### 💰 智能分摊计算

| 功能 | 描述 | 状态 |
|------|------|------|
| **按比例分摊** | 税费、小费按商品价格比例精确分摊 | ✅ |
| **多人共享** | 单个商品可分配给多人，费用自动平均分摊 | ✅ |
| **多账单处理** | 一次性处理多张收据，汇总最终账单 | ✅ |
| **货币换算** | 多币种支持（计划中） | 🔄 |

### 📱 现代化用户体验

| 功能 | 描述 | 状态 |
|------|------|------|
| **响应式设计** | 完美适配桌面和移动设备 | ✅ |
| **渐进式操作** | 分步流程引导，简单清晰 | ✅ |
| **国际化** | 中文、英文双语支持 | ✅ |
| **PWA 支持** | 离线使用、添加到主屏幕（计划中） | 🔄 |


## 🚀 快速开始

### 环境要求
- **Node.js**: 18+ (推荐 20+)
- **包管理器**: npm 或 yarn
- **浏览器**: 支持现代 ES6+ 语法的浏览器
- **AI 服务**: Claude API 或 Groq API

### 一键安装

```bash
# 克隆项目
git clone https://github.com/ljnpng/billshare.git
cd billshare

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 启动开发服务器
npm run dev
```

应用将在 `http://localhost:3000` 启动，并自动在浏览器中打开。

<details>
<summary>📋 .env 配置示例</summary>

```bash
# --- 环境变量 ---

# AI 服务提供商 (claude 或 groq, 默认为 claude)
AI_PROVIDER=claude

# Claude API 密钥 (使用 claude 时必需)
CLAUDE_API_KEY=your_claude_api_key_here

# Groq API 密钥 (使用 groq 时必需)
GROQ_API_KEY=your_groq_api_key_here
```

</details>


## 🔧 环境变量说明

| 变量名 | 类型 | 必填 | 默认值 | 作用域 | 说明 |
|--------|------|------|--------|--------|------|
| `AI_PROVIDER` | string | 否 | `claude` | server | AI 服务提供商选择 |
| `CLAUDE_API_KEY` | string | 条件 | - | server | Claude API 密钥 |
| `GROQ_API_KEY` | string | 条件 | - | server | Groq API 密钥 |
| `REDIS_HOST` | string | 是 | - | server | Redis 服务器地址 |
| `REDIS_PORT` | string | 是 | - | server | Redis 服务器端口 |
| `REDIS_PASSWORD` | string | 是 | - | server | Redis 服务器密码 |

**获取服务配置**：
- **Claude**: [Anthropic Console](https://console.anthropic.com/)
- **Groq**: [Groq Console](https://console.groq.com/)
- **Redis**: 可使用自建服务器、云服务商（如 Railway、Upstash）或 VPS 部署

## 🔀 开发工作流

### Git 分支策略
- `main`: 生产分支
- `develop`: 开发分支
- `feat/*`: 新功能分支
- `fix/*`: 错误修复分支
- `chore/*`: 杂务分支

### Commit 规范
遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 约定：

```bash
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式化
refactor: 重构代码
test: 添加测试
chore: 构建、工具链更新
```


## 🚀 部署文档

### Vercel 部署

项目已为 Vercel 平台高度优化，支持无缝部署。

#### 1. 基础部署步骤

1. **Fork 项目** 到你的 GitHub 账户
2. 在 Vercel Dashboard 中，点击 "Add New... -> Project"
3. 选择你刚才 Fork 的 GitHub 仓库并导入
4. 点击 "Deploy"，Vercel 将自动完成构建和部署

#### 2. 配置环境变量

部署成功后，在项目设置中配置环境变量：

1. 进入 Vercel Dashboard → 你的项目 → Settings → Environment Variables
2. 逐一添加以下必需的环境变量：

| 变量名 | 环境 | 值 | 说明 |
|--------|------|-----|------|
| `AI_PROVIDER` | Production, Preview, Development | `claude` 或 `groq` | AI 服务提供商选择 |
| `CLAUDE_API_KEY` | Production, Preview, Development | `sk-ant-api...` | Claude API 密钥（选择 claude 时必需） |
| `GROQ_API_KEY` | Production, Preview, Development | `gsk_...` | Groq API 密钥（选择 groq 时必需） |
| `REDIS_HOST` | Production, Preview, Development | `your-redis-host` | Redis 服务器地址 |
| `REDIS_PORT` | Production, Preview, Development | `6379` | Redis 服务器端口 |
| `REDIS_PASSWORD` | Production, Preview, Development | `your-password` | Redis 服务器密码 |

#### 3. 获取环境变量值

**AI 服务密钥**：
- **Claude**: 访问 [Anthropic Console](https://console.anthropic.com/) → API Keys
- **Groq**: 访问 [Groq Console](https://console.groq.com/) → API Keys

**Redis 存储**：
1. **自建 VPS**: 在你的服务器上安装并配置 Redis
2. **云服务商**:
   - [Railway](https://railway.app/) → 创建 Redis 插件
   - [Upstash](https://upstash.com/) → 创建 Redis 数据库
   - [Redis Cloud](https://redis.com/) → 创建云实例
3. 获取连接信息：主机地址、端口号、密码

#### 4. 环境变量配置说明

- **Environment**: 选择 `Production`, `Preview`, `Development` 三个环境
- **Value**: 粘贴对应的密钥或配置值
- 配置完成后，点击 "Redeploy" 重新部署应用

#### 5. Redis 网络配置注意事项

**部署到 Vercel 时使用自建 Redis**：
- 确保 Redis 服务器允许外部连接（修改 `bind` 配置）
- 开放相应端口的防火墙规则
- 建议使用强密码并定期轮换
- 考虑使用 SSL/TLS 加密连接（Redis 6.0+）

#### 6. GitHub Actions 自动部署

项目包含 GitHub Actions 配置文件 `.github/workflows/deploy.yml`，支持：
- **推送到 main 分支**：自动触发生产环境部署
- **Pull Request**：自动创建预览环境
- **环境变量**：从 Vercel Dashboard 自动读取，无需在 GitHub 中重复配置

### 自动化部署
- 推送到 `main` 分支将自动触发生产部署
- 推送到其他分支将创建预览部署
- 支持自定义域名和 SSL 证书
- 内置 CI/CD 流水线和性能监控

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

<div align="center">
  <p>如果这个项目对你有帮助，请给我们一个 ⭐️ 支持！</p>
  <p>Made with ❤️ by <a href="https://github.com/ljnpng">ljnpng</a></p>
</div>
