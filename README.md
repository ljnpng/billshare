# AAP费用分摊

> 智能分摊餐费、税费和小费，让每个人都支付合理的份额

一个基于 Next.js 全栈架构的现代化费用分摊应用，支持 AI 图像识别自动解析收据，智能计算税费和小费分摊。

## 功能特色

### 🤖 AI 智能识别
- 使用 Claude 3.5 Haiku 自动识别收据
- 支持 JPG、PNG、GIF、WebP 格式
- 自动提取商品名称和价格
- 安全的服务器端 API 调用

### 💰 智能分摊计算
- 自动按比例分摊税费和小费
- 支持多张收据同时处理
- 精确计算每个人应付金额

### 📱 现代化界面
- 响应式设计，支持移动端
- 渐进式操作流程
- 优雅的动画和交互

### 🔧 完整功能
- 人员管理（颜色区分）
- 收据条目编辑
- 灵活的分配选项
- 详细的费用汇总

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone [项目地址]
cd aapay

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 在 .env 中设置你的 Claude API Key
CLAUDE_API_KEY=your_api_key_here
```

### 开发运行

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 使用说明

### 1. 设置人员
添加参与费用分摊的人员，至少需要2个人。每个人会自动分配颜色用于区分。

### 2. 输入账单
- **AI识别**：上传收据图片，自动识别商品和价格
- **手动添加**：创建新收据，手动输入条目信息

### 3. 分配条目
为每个收据条目选择分摊的人员。支持一个条目分配给多个人（平均分摊）。

### 4. 费用汇总
查看每个人应付的详细金额，包括原价、税费和小费的分摊。

## 技术架构

### 前端技术栈
- **Next.js 14** - 全栈 React 框架
- **React 18** + **TypeScript** - 类型安全的组件开发
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Zustand** - 轻量级状态管理
- **Lucide React** - 现代化图标库

### 后端技术栈
- **Next.js API Routes** - 服务器端 API 处理
- **Anthropic Claude 3.5 Haiku** - 高性能图像识别
- **Files API** - 安全的文件上传和处理
- **图像压缩** - 优化识别性能

### 项目结构
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   └── claude/        # Claude API 集成
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # UI 组件
│   ├── SetupStep.tsx      # 设置人员步骤
│   ├── InputStep.tsx      # 输入账单步骤
│   ├── AssignStep.tsx     # 分配条目步骤
│   └── SummaryStep.tsx    # 费用汇总步骤
├── lib/                   # 核心业务逻辑
│   ├── aiService.ts       # AI 识别服务
│   ├── dataProcessor.ts   # 数据处理和计算
│   ├── config.ts          # 配置管理
│   └── logger.ts          # 日志记录
├── store/                 # 状态管理
└── types/                 # 类型定义
```

## 安全特性

### API 密钥保护
- Claude API 密钥只在服务器端使用
- 客户端通过 Next.js API 路由与 AI 服务交互
- 不会在浏览器中暴露敏感信息

### 文件处理
- 图片预处理和格式验证
- 文件大小限制和压缩
- 临时文件自动清理

## 开发与测试

### AI 识别测试
```bash
# 测试 AI 识别功能
npm run test:ai
```

### 代码质量
```bash
# 类型检查和构建
npm run build

# 代码规范检查
npm run lint
```

## 配置说明

### 环境变量
- `CLAUDE_API_KEY` - Claude API 密钥（服务器端必需）
- `NEXT_PUBLIC_APP_NAME` - 应用名称（可选）
- `NEXT_PUBLIC_APP_VERSION` - 应用版本（可选）

### AI 配置
- 模型：Claude 3.5 Haiku
- 最大文件大小：25MB
- 支持格式：JPG、PNG、GIF、WebP
- 自动压缩：优化识别性能

## 部署

### Vercel（推荐）

#### 方法一：GitHub 集成自动部署

1. **准备 GitHub 仓库**
   ```bash
   # 创建私有仓库
   gh repo create your-project-name --private --description "Next.js 全栈项目 - AI 收据处理应用"
   
   # 添加远程仓库
   git remote add origin https://github.com/your-username/your-project-name.git
   
   # 推送代码
   git add .
   git commit -m "迁移到 Next.js 全栈项目"
   git push -u origin main
   ```

2. **Vercel 部署**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 配置环境变量（见下方）
   - 点击 "Deploy"

#### 方法二：CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```
   
   按照提示操作：
   - 选择你的 scope（个人或团队）
   - 输入项目名称
   - 确认项目目录
   - 等待构建和部署完成

#### 环境变量配置

在 Vercel 中配置以下环境变量：

| 变量名 | 值 | 描述 |
|--------|-----|------|
| `CLAUDE_API_KEY` | `your_claude_api_key_here` | Claude API 密钥（必需） |
| `NEXT_PUBLIC_APP_NAME` | `AAP费用分摊` | 应用名称（可选） |
| `NEXT_PUBLIC_APP_VERSION` | `2.0.0` | 应用版本（可选） |

**设置环境变量：**
1. 在 Vercel Dashboard 中进入你的项目
2. 点击 "Settings" 选项卡
3. 点击 "Environment Variables"
4. 添加上述变量

#### 自动部署设置

项目已配置 `vercel.json` 文件，包含以下优化：

- **区域部署**：香港 (hkg1) 和旧金山 (sfo1) 双区域
- **API 优化**：30秒最大执行时间
- **CORS 配置**：支持跨域请求
- **缓存策略**：静态资源自动缓存

### 其他部署方式

#### Docker 部署
```bash
# 构建镜像
docker build -t aapay .

# 运行容器
docker run -p 3000:3000 -e CLAUDE_API_KEY=your_api_key aapay
```

#### 传统服务器部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

#### Railway 部署
1. 连接 GitHub 仓库到 Railway
2. 配置环境变量
3. 自动构建和部署

#### Netlify 部署
1. 连接 GitHub 仓库到 Netlify
2. 构建命令：`npm run build`
3. 发布目录：`.next`
4. 配置环境变量

### 部署后验证

部署完成后，访问你的应用 URL，验证以下功能：

- [ ] 页面正常加载
- [ ] 可以添加人员
- [ ] 可以上传收据图片
- [ ] AI 识别功能正常工作
- [ ] 费用计算准确
- [ ] 移动端响应式正常

### 常见问题

**Q: API 路由返回 500 错误**
A: 检查 `CLAUDE_API_KEY` 环境变量是否正确设置

**Q: 图片上传失败**
A: 确保文件大小不超过 25MB，格式为 JPG/PNG/GIF/WebP

**Q: 部署后白屏**
A: 检查构建日志，确保没有 TypeScript 错误

**Q: 环境变量不生效**
A: 重新部署项目，环境变量更改需要重新构建

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## 许可证

MIT License 