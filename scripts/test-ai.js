#!/usr/bin/env node

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic, { toFile } from '@anthropic-ai/sdk';
import convert from 'heic-convert';

// 优化后的 prompt 内容
const COMPLETE_RECEIPT_PROMPT = `
你是一个专业的账单识别专家。请仔细分析这张账单图片，使用以下结构化方法：

## 第一步：图片内容确认
首先确认这是一张有效的账单/收据图片。

## 第二步：信息提取
请逐一提取以下信息：

### 商家信息
- 商家名称（店铺名称）
- 地址（如果可见）
- 日期和时间

### 商品明细分析
**重要提示：请特别关注价格数字的识别**
- 仔细查看每个商品行，确保价格数字准确
- 注意区分商品名称和价格列
- 如果价格模糊，请在 description 中说明"价格不清晰"

### 费用计算
- 小计（所有商品价格总和）
- 税费（Tax/GST/VAT）
- 小费（Tip/Service Charge）
- 总计（最终支付金额）

## 第三步：数据验证
- 检查商品价格总和是否与小计一致
- 验证总计 = 小计 + 税费 + 小费
- 如果数字不匹配，请在 confidence 中降低分数

## 响应格式
请严格按照以下 JSON 格式返回：

\`\`\`json
{
  "businessName": "具体商家名称",
  "items": [
    {
      "name": "商品名称（保持原文）",
      "price": 准确的数字价格,
      "description": "额外信息或价格识别说明"
    }
  ],
  "subtotal": 小计数字,
  "tax": 税费数字,
  "tip": 小费数字,
  "total": 总计数字,
  "date": "YYYY-MM-DD",
  "confidence": 0.0到1.0的置信度分数
}
\`\`\`

## 特别要求：
1. **价格识别**：如果单个商品价格无法清晰识别，请设置为 null，并在 description 中说明
2. **数字格式**：所有价格必须是纯数字，不包含货币符号
3. **置信度评估**：
   - 0.9+：所有信息都很清晰
   - 0.7-0.9：大部分信息清晰，少量模糊
   - 0.5-0.7：关键信息识别困难
   - 0.5以下：图片质量差或不是有效账单

## 错误处理
如果图片不是账单或无法识别，返回：
\`\`\`json
{
  "businessName": null,
  "items": [],
  "subtotal": null,
  "tax": null,
  "tip": null,
  "total": null,
  "date": null,
  "confidence": 0.0,
  "error": "具体错误原因"
}
\`\`\`

现在请分析这张账单图片：
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 模拟浏览器环境的 API Key 获取
const getApiKey = () => {
  const apiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('请设置 VITE_CLAUDE_API_KEY 或 CLAUDE_API_KEY 环境变量');
  }
  return apiKey;
};

// 创建 Anthropic 客户端
const getClient = () => {
  return new Anthropic({
    apiKey: getApiKey(),
    timeout: 60000, // 60秒超时
  });
};

// 支持的图片格式
const supportedFormats = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif'
};

// 获取文件 MIME 类型
const getContentType = (filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return supportedFormats[ext] || 'application/octet-stream';
};

// 检查文件是否为 HEIC 格式
const isHeicFormat = (filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext === '.heic' || ext === '.heif';
};

// 转换 HEIC 格式到 JPEG
const convertHeicToJpeg = async (inputPath, outputPath) => {
  try {
    console.log('🔄 开始转换 HEIC 格式...');
    
    const inputBuffer = readFileSync(inputPath);
    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    writeFileSync(outputPath, outputBuffer);
    console.log('✅ HEIC 转换完成');
    
    return outputPath;
  } catch (error) {
    console.error('❌ HEIC 转换失败:', error.message);
    throw new Error(`HEIC 转换失败: ${error.message}`);
  }
};

// 识别单张图片
const recognizeImage = async (imagePath) => {
  let tempFilePath = null;
  
  try {
    console.log(`\n🔍 正在识别图片: ${imagePath}`);
    
    let processedImagePath = imagePath;
    let processedContentType = getContentType(imagePath);
    
    // 检查是否为 HEIC 格式，如果是则转换
    if (isHeicFormat(imagePath)) {
      tempFilePath = imagePath.replace(/\.(heic|heif)$/i, '_converted.jpg');
      processedImagePath = await convertHeicToJpeg(imagePath, tempFilePath);
      processedContentType = 'image/jpeg';
    }
    
    // 读取处理后的图片文件
    const imageBuffer = readFileSync(processedImagePath);
    
    console.log(`📁 文件大小: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🎨 文件类型: ${processedContentType}`);
    
    // 创建客户端
    const client = getClient();
    
    // 上传文件到 Files API
    console.log('⬆️  正在上传文件...');
    const fileName = processedImagePath.split('/').pop();
    const fileUpload = await client.beta.files.upload({
      file: await toFile(imageBuffer, fileName, { type: processedContentType }),
      betas: ['files-api-2025-04-14'],
    });
    
    console.log(`✅ 文件上传成功: ${fileUpload.id}`);
    
    // 调用 Claude API 进行识别
    console.log('🤖 正在调用 Claude API...');
    const response = await client.beta.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
      temperature: 0.3,
      betas: ['files-api-2025-04-14'],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: COMPLETE_RECEIPT_PROMPT,
            },
            {
              type: 'image',
              source: {
                type: 'file',
                file_id: fileUpload.id,
              },
            },
          ],
        },
      ],
    });
    
    console.log('✅ API 调用成功');
    
    // 解析响应
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('API 响应格式错误');
    }
    
    const responseText = content.text;
    console.log('\n📝 原始响应:');
    console.log(responseText);
    
    // 解析 JSON
    let recognizedData;
    try {
      // 尝试直接解析
      recognizedData = JSON.parse(responseText);
    } catch (e) {
      // 如果直接解析失败，尝试提取 JSON 部分
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recognizedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 JSON 响应');
      }
    }
    
    // 清理上传的文件
    try {
      await client.beta.files.delete(fileUpload.id);
      console.log('🗑️  Claude 临时文件已清理');
    } catch (cleanupError) {
      console.warn('⚠️  清理 Claude 临时文件失败:', cleanupError.message);
    }
    
    return {
      success: true,
      filePath: imagePath,
      data: recognizedData,
      rawResponse: responseText,
    };
    
  } catch (error) {
    console.error(`❌ 识别失败: ${error.message}`);
    return {
      success: false,
      filePath: imagePath,
      error: error.message,
    };
  } finally {
    // 清理本地临时文件
    if (tempFilePath) {
      try {
        unlinkSync(tempFilePath);
        console.log('🗑️  本地临时文件已清理');
      } catch (cleanupError) {
        console.warn('⚠️  清理本地临时文件失败:', cleanupError.message);
      }
    }
  }
};

// 验证识别结果
const validateResult = (result) => {
  if (!result.success) {
    return { valid: false, issues: ['识别失败'] };
  }
  
  const data = result.data;
  const issues = [];
  
  // 检查基本结构
  if (!data || typeof data !== 'object') {
    issues.push('响应不是有效的对象');
    return { valid: false, issues };
  }
  
  // 检查 items 数组
  if (!Array.isArray(data.items)) {
    issues.push('缺少 items 数组');
  } else {
    if (data.items.length === 0) {
      issues.push('items 数组为空');
    } else {
      // 检查每个商品项目
      data.items.forEach((item, index) => {
        if (!item.name || typeof item.name !== 'string') {
          issues.push(`商品 ${index + 1} 缺少有效的 name`);
        }
        // 价格可以为 null，允许用户后续填写
        if (item.price !== null && item.price !== undefined && 
            (typeof item.price !== 'number' || item.price < 0)) {
          issues.push(`商品 ${index + 1} 的 price 格式错误`);
        }
      });
    }
  }
  
  // 检查金额字段
  ['subtotal', 'tax', 'tip', 'total'].forEach(field => {
    if (data[field] !== null && data[field] !== undefined) {
      if (typeof data[field] !== 'number' || data[field] < 0) {
        issues.push(`${field} 不是有效的数字`);
      }
    }
  });
  
  // 检查置信度
  if (data.confidence !== null && data.confidence !== undefined) {
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
      issues.push('confidence 不在 0-1 范围内');
    }
  }
  
  return { valid: issues.length === 0, issues };
};

// 格式化输出结果
const formatResult = (result) => {
  if (!result.success) {
    return `❌ 失败: ${result.error}`;
  }
  
  const data = result.data;
  const validation = validateResult(result);
  
  let output = `✅ 识别成功\n`;
  output += `📊 置信度: ${data.confidence || 'N/A'}\n`;
  output += `🏪 商家: ${data.businessName || 'N/A'}\n`;
  output += `📅 日期: ${data.date || 'N/A'}\n`;
  output += `🛍️  商品数量: ${data.items ? data.items.length : 0}\n`;
  
  if (data.items && data.items.length > 0) {
    output += `\n📝 商品明细:\n`;
    data.items.forEach((item, index) => {
      const priceText = item.price !== null ? `$${item.price}` : '价格待填写';
      output += `  ${index + 1}. ${item.name} - ${priceText}`;
      if (item.description) {
        output += ` (${item.description})`;
      }
      output += '\n';
    });
  }
  
  output += `\n💰 费用明细:\n`;
  output += `  小计: $${data.subtotal || 'N/A'}\n`;
  output += `  税费: $${data.tax || 'N/A'}\n`;
  output += `  小费: $${data.tip || 'N/A'}\n`;
  output += `  总计: $${data.total || 'N/A'}\n`;
  
  // 验证结果
  if (!validation.valid) {
    output += `\n⚠️  验证问题:\n`;
    validation.issues.forEach(issue => {
      output += `  - ${issue}\n`;
    });
  } else {
    output += `\n✅ 数据格式验证通过\n`;
  }
  
  return output;
};

// 主函数
const main = async () => {
  console.log('🚀 开始 AI 识别测试\n');
  
  try {
    // 检查 API Key
    getApiKey();
    console.log('✅ API Key 验证通过');
  } catch (error) {
    console.error('❌ API Key 验证失败:', error.message);
    process.exit(1);
  }
  
  // 测试图片路径
  const testImages = [
    join(__dirname, '..', 'test-receipts', 'IMG_7596.JPG'),
    join(__dirname, '..', 'test-receipts', 'IMG_7600.heic'),
  ];
  
  const results = [];
  
  // 识别每张图片
  for (const imagePath of testImages) {
    try {
      const result = await recognizeImage(imagePath);
      results.push(result);
      
      console.log('\n' + '='.repeat(60));
      console.log(`📋 结果报告: ${imagePath.split('/').pop()}`);
      console.log('='.repeat(60));
      console.log(formatResult(result));
      
    } catch (error) {
      console.error(`❌ 处理图片失败: ${imagePath}`, error);
      results.push({
        success: false,
        filePath: imagePath,
        error: error.message,
      });
    }
  }
  
  // 总结报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ 成功识别: ${successCount}/${totalCount}`);
  console.log(`❌ 识别失败: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount > 0) {
    console.log('\n🎯 识别质量分析:');
    results.filter(r => r.success).forEach(result => {
      const validation = validateResult(result);
      const fileName = result.filePath.split('/').pop();
      const validPrices = result.data.items.filter(item => 
        typeof item.price === 'number' && item.price >= 0
      ).length;
      const nullPrices = result.data.items.length - validPrices;
      
      console.log(`  ${fileName}: ${validation.valid ? '✅ 通过' : '⚠️ 有问题'}`);
      console.log(`    - 有效价格: ${validPrices}, 待填写价格: ${nullPrices}`);
    });
  }
  
  console.log('\n✨ 测试完成');
};

// 运行主函数
main().catch(console.error); 