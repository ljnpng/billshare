# AAP费用分摊

> 智能分摊餐费、税费和小费，让每个人都支付合理的份额

一个基于 React + TypeScript 的现代化费用分摊应用，支持 AI 图像识别自动解析收据，智能计算税费和小费分摊。

## 功能特色

### 🤖 AI 智能识别
- 使用 Claude 3.5 Haiku 自动识别收据
- 支持 JPG、PNG、GIF、WebP 格式
- 自动提取商品名称和价格

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
VITE_CLAUDE_API_KEY=your_api_key_here
```

### 开发运行

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
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
- **React 18** + **TypeScript** - 类型安全的组件开发
- **Vite** - 快速的开发和构建工具
- **Zustand** - 轻量级状态管理
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Lucide React** - 现代化图标库

### AI 服务
- **Anthropic Claude 3.5 Haiku** - 高性能图像识别
- **Files API** - 安全的文件上传和处理
- **图像压缩** - 优化识别性能

### 项目结构
```
src/
├── components/         # UI 组件
│   ├── SetupStep.tsx      # 设置人员步骤
│   ├── InputStep.tsx      # 输入账单步骤
│   ├── AssignStep.tsx     # 分配条目步骤
│   └── SummaryStep.tsx    # 费用汇总步骤
├── lib/                # 核心业务逻辑
│   ├── aiService.ts       # AI 识别服务
│   ├── dataProcessor.ts   # 数据处理和计算
│   ├── config.ts          # 配置管理
│   └── logger.ts          # 日志记录
├── store/              # 状态管理
├── types/              # 类型定义
└── App.tsx             # 主应用组件
```

## 开发与测试

### AI 识别测试
```bash
# 测试 AI 识别功能
npm run test:ai
```

### 代码质量
```bash
# 类型检查
npm run build

# 代码规范检查
npm run lint
```

## 配置说明

### 环境变量
- `VITE_CLAUDE_API_KEY` - Claude API 密钥（必需）

### AI 配置
- 模型：Claude 3.5 Haiku
- 最大文件大小：25MB
- 支持格式：JPG、PNG、GIF、WebP
- 自动压缩：优化识别性能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 发起 Pull Request

## 许可证

MIT License 