# AI 识别测试脚本

这个脚本用于测试 Claude AI 的账单识别准确性。

## 如何使用

1. **设置环境变量**：
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，填入你的 Claude API Key
   # 你可以设置 VITE_CLAUDE_API_KEY 或 CLAUDE_API_KEY
   ```

2. **运行测试**：
   ```bash
   npm run test:ai
   ```

## 脚本功能

- 自动测试 `test-receipts/` 目录下的所有图片
- 使用与主程序相同的 AI 配置和 prompt
- 显示详细的识别结果和验证信息
- 输出格式化的测试报告

## 输出信息

脚本会显示：
- 📁 文件信息（大小、格式）
- 🤖 AI 识别过程
- 📝 原始 AI 响应
- 📊 识别结果（商家、商品、价格等）
- ✅ 数据格式验证
- 📋 测试总结报告

## 测试图片

当前测试图片：
- `IMG_7596.JPG` - JPEG 格式账单
- `IMG_7600.heic` - HEIC 格式账单

## 故障排除

如果遇到问题：
1. 确保已正确设置 API Key
2. 检查网络连接
3. 确认图片文件存在
4. 查看控制台错误信息

## 自定义测试

你可以：
- 在 `test-receipts/` 目录添加更多测试图片
- 修改 `scripts/test-ai.js` 中的图片路径
- 调整 AI 配置参数进行对比测试 