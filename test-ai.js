#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// API 端点
const API_ENDPOINT = 'http://localhost:3000/api/claude/recognize';

// 测试单张图片
const testImage = async (imagePath) => {
  try {
    console.log(`\n🔍 正在测试图片: ${imagePath}`);
    
    // 检查文件是否存在
    if (!existsSync(imagePath)) {
      console.log(`❌ 文件不存在: ${imagePath}`);
      return { success: false, error: '文件不存在' };
    }

    // 读取文件
    const fileBuffer = readFileSync(imagePath);
    const fileName = imagePath.split('/').pop();
    
    console.log(`📁 文件大小: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // 准备 FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: getContentType(fileName),
    });

    // 发送请求
    console.log('📤 正在发送请求...');
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API 调用失败: ${response.status} ${response.statusText}`);
      console.log(`错误详情: ${errorText}`);
      return { success: false, error: `API 调用失败: ${response.status}` };
    }

    const result = await response.json();
    console.log('✅ API 调用成功');
    
    return {
      success: true,
      filePath: imagePath,
      data: result,
    };

  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return {
      success: false,
      filePath: imagePath,
      error: error.message,
    };
  }
};

// 获取文件 MIME 类型
const getContentType = (filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.heif': 'image/heif'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// 格式化输出结果
const formatResult = (result) => {
  if (!result.success) {
    return `❌ 失败: ${result.error}`;
  }
  
  const { success, data, error } = result.data;
  
  if (!success) {
    return `❌ 识别失败: ${error}`;
  }
  
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
  
  return output;
};

// 检查服务器是否运行
const checkServer = async () => {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await fetch('http://localhost:3000/api/claude/recognize', {
      method: 'HEAD',
    });
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动开发服务器: npm run dev');
    return false;
  }
};

// 主函数
const main = async () => {
  console.log('🚀 开始 AI 识别测试（调用 Next.js API）\n');
  
  // 检查服务器
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  console.log('✅ 服务器运行正常');
  
  // 测试图片路径
  const testImages = [
    join(__dirname, 'test-receipts', 'IMG_7596.JPG'),
    join(__dirname, 'test-receipts', 'IMG_7600.heic'),
  ];
  
  const results = [];
  
  // 测试每张图片
  for (const imagePath of testImages) {
    const result = await testImage(imagePath);
    results.push(result);
    
    console.log('\n' + '='.repeat(60));
    console.log(`📋 结果报告: ${imagePath.split('/').pop()}`);
    console.log('='.repeat(60));
    console.log(formatResult(result));
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
      if (result.data.success) {
        const fileName = result.filePath.split('/').pop();
        const data = result.data.data;
        const validPrices = data.items.filter(item => 
          typeof item.price === 'number' && item.price >= 0
        ).length;
        const nullPrices = data.items.length - validPrices;
        
        console.log(`  ${fileName}: ✅ 识别成功`);
        console.log(`    - 有效价格: ${validPrices}, 待填写价格: ${nullPrices}`);
        console.log(`    - 置信度: ${data.confidence || 'N/A'}`);
      }
    });
  }
  
  console.log('\n✨ 测试完成');
};

// 运行主函数
main().catch(console.error); 