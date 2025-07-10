import Anthropic, { toFile } from '@anthropic-ai/sdk';
import { AIRecognizedReceipt, AIProcessingResult } from '../types';
import imageCompression from 'browser-image-compression';
import { AI_CONFIG, getApiKey, isSupportedImageFormat, getSupportedFormatsInfo } from './config';
import { COMPLETE_RECEIPT_PROMPT } from './prompts';
import { aiLogger } from './logger';

// Anthropic 客户端配置
const getAnthropicClient = () => {
  const apiKey = getApiKey();

  // 获取当前域名和端口
  const baseURL = `${window.location.protocol}//${window.location.host}/api/anthropic`;

  return new Anthropic({
    apiKey,
    baseURL, // 使用完整的代理 URL
    dangerouslyAllowBrowser: true, // 允许在浏览器中使用
    timeout: 60000, // 60秒超时，与 test-ai.js 保持一致
  });
};

// 配置和提示词已移动到单独的文件中

/**
 * 检查文件是否为 HEIC 格式
 */
const isHeicFormat = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
};

/**
 * 压缩和调整图片大小
 */
const compressAndResizeImage = async (file: File): Promise<File> => {
  try {
    aiLogger.info('开始压缩图片...', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      format: file.type,
    });

    const compressedFile = await imageCompression(file, AI_CONFIG.image.compression);

    aiLogger.info('图片压缩完成', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      compression: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
    });

    return compressedFile;
  } catch (error) {
    aiLogger.error('图片压缩失败:', error);
    throw new Error(AI_CONFIG.errors.processingFailed);
  }
};

/**
 * 预处理图片文件
 */
const preprocessImage = async (file: File): Promise<File> => {
  let processedFile = file;

  // 检查文件大小
  if (file.size > AI_CONFIG.image.maxFileSize) {
    throw new Error(AI_CONFIG.errors.fileTooLarge);
  }

  // 处理 HEIC 格式 - 在浏览器环境中不支持转换
  if (isHeicFormat(file)) {
    aiLogger.error('检测到 HEIC 格式文件，浏览器环境不支持转换', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });
    
    throw new Error(`检测到 HEIC 格式文件，浏览器环境暂不支持自动转换。

📱 如何将 HEIC 转换为 JPG：

iPhone/iPad 用户：
1. 打开"设置" → "相机" → "格式"
2. 选择"高兼容性"（拍照时直接保存为 JPG）
3. 或在"照片"应用中选择图片 → 分享 → 保存为文件 → 选择 JPG 格式

Android 用户：
1. 在相机设置中选择 JPG 格式
2. 或使用图片编辑应用转换格式

💻 电脑用户：
1. 使用在线转换工具（如 convertio.co）
2. 或使用图片编辑软件（如 Photoshop、GIMP）

转换完成后，请重新上传 JPG 或 PNG 格式的图片。`);
  }

  // 检查是否为支持的格式
  if (!isSupportedImageFormat(processedFile.type)) {
    throw new Error(AI_CONFIG.errors.unsupportedFormat);
  }

  // 压缩图片（如果需要）
  if (processedFile.size > AI_CONFIG.image.maxFileSize) {
    processedFile = await compressAndResizeImage(processedFile);
  }

  return processedFile;
};

/**
 * 上传文件到 Claude Files API
 */
const uploadToFilesAPI = async (file: File): Promise<string> => {
  try {
    const client = getAnthropicClient();
    
    aiLogger.info('开始上传文件到 Files API...');

    const fileUpload = await client.beta.files.upload({
      file: await toFile(file, file.name, { type: file.type }),
      betas: ['files-api-2025-04-14'],
    });

    aiLogger.info('文件上传成功', {
      fileId: fileUpload.id,
      fileName: file.name,
      fileSize: file.size,
    });

    return fileUpload.id;
  } catch (error) {
    aiLogger.error('文件上传失败:', error);
    throw new Error(AI_CONFIG.errors.fileUploadFailed);
  }
};

/**
 * 使用 Files API 识别账单
 */
export const recognizeReceipt = async (imageFile: File): Promise<AIProcessingResult> => {
  try {
    aiLogger.info('开始 AI 识别流程...');

    // 1. 预处理图片
    const processedFile = await preprocessImage(imageFile);

    // 2. 上传到 Files API
    const fileId = await uploadToFilesAPI(processedFile);

    // 3. 调用 Claude API 进行识别
    const client = getAnthropicClient();

    aiLogger.info('开始调用 Claude API...');

    const response = await client.beta.messages.create({
      model: AI_CONFIG.api.model,
      max_tokens: AI_CONFIG.api.maxTokens,
      temperature: AI_CONFIG.api.temperature,
      betas: [...AI_CONFIG.api.betas],
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
                file_id: fileId,
              },
            },
          ],
        },
      ],
    });

    aiLogger.info('Claude API 调用成功');

    // 4. 解析响应
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(AI_CONFIG.errors.invalidResponse);
    }

    const responseText = content.text;
    if (!responseText) {
      throw new Error(AI_CONFIG.errors.emptyResponse);
    }

    // 5. 解析 JSON 结果
    let recognizedData: AIRecognizedReceipt;
    try {
      recognizedData = JSON.parse(responseText);
      aiLogger.info('JSON 直接解析成功');
    } catch (e) {
      // 如果直接解析失败，尝试提取 JSON 部分
      aiLogger.warn('JSON 直接解析失败，尝试提取 JSON 部分');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recognizedData = JSON.parse(jsonMatch[0]);
        aiLogger.info('JSON 提取解析成功');
      } else {
        aiLogger.error('无法解析 JSON 响应');
        throw new Error(AI_CONFIG.errors.parseError);
      }
    }

    // 6. 基本格式验证
    if (!validateBasicFormat(recognizedData)) {
      throw new Error(AI_CONFIG.errors.invalidFormat);
    }

    // 7. 清理数据 - 只过滤掉没有商品名称的项目，保留价格为空的项目供用户填写
    recognizedData.items = recognizedData.items.filter(item => 
      item.name && typeof item.name === 'string' && item.name.trim().length > 0
    );

    // 标准化价格字段 - 将无效的价格设为 null
    const originalValidPrices = recognizedData.items.filter(item => 
      typeof item.price === 'number' && item.price >= 0
    ).length;
    
    recognizedData.items = recognizedData.items.map(item => ({
      ...item,
      price: (typeof item.price === 'number' && item.price >= 0) ? item.price : null
    }));
    
    const finalValidPrices = recognizedData.items.filter(item => 
      typeof item.price === 'number' && item.price >= 0
    ).length;
    
    aiLogger.info('价格数据处理完成', {
      totalItems: recognizedData.items.length,
      validPrices: finalValidPrices,
      nullPrices: recognizedData.items.length - finalValidPrices,
      pricesCleared: originalValidPrices - finalValidPrices,
    });

    if (recognizedData.items.length === 0) {
      throw new Error(AI_CONFIG.errors.noValidItems);
    }

    // 8. 最终验证清理后的数据
    if (!validateResponse(recognizedData)) {
      throw new Error(AI_CONFIG.errors.invalidFormat);
    }

    // 9. 清理上传的文件（可选）
    try {
      await client.beta.files.delete(fileId);
      aiLogger.info('临时文件已清理');
    } catch (cleanupError) {
      aiLogger.warn('清理临时文件失败:', cleanupError);
    }

    return {
      success: true,
      data: recognizedData,
    };

  } catch (error) {
    aiLogger.error('AI 识别失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : AI_CONFIG.errors.recognitionFailed,
    };
  }
};

/**
 * 基本格式验证（不检查 items 数组是否为空）
 */
const validateBasicFormat = (response: any): boolean => {
  // 基本结构检查
  if (typeof response !== 'object' || response === null) {
    aiLogger.warn('验证失败：响应不是有效的对象');
    return false;
  }

  // 检查 items 数组
  if (!Array.isArray(response.items)) {
    aiLogger.warn('验证失败：缺少 items 数组');
    return false;
  }

  return true;
};

/**
 * 验证AI响应格式
 */
const validateResponse = (response: any): boolean => {
  // 基本结构检查
  if (typeof response !== 'object' || response === null) {
    aiLogger.warn('验证失败：响应不是有效的对象');
    return false;
  }

  // 检查 items 数组
  if (!Array.isArray(response.items)) {
    aiLogger.warn('验证失败：缺少 items 数组');
    return false;
  }

  // 检查 items 数组是否为空
  if (response.items.length === 0) {
    aiLogger.warn('验证失败：items 数组为空');
    return false;
  }

  // 检查每个商品项目
  for (let i = 0; i < response.items.length; i++) {
    const item = response.items[i];
    if (!item.name || typeof item.name !== 'string') {
      aiLogger.warn(`验证失败：商品 ${i + 1} 缺少有效的 name`);
      return false;
    }
    // 价格可以为 null 或 undefined，允许用户后续填写
    if (item.price !== null && item.price !== undefined && 
        (typeof item.price !== 'number' || item.price < 0)) {
      aiLogger.warn(`验证失败：商品 ${i + 1} 的 price 格式错误`);
      return false;
    }
  }

  // 检查金额数据（如果存在）
  const amountFields = ['subtotal', 'tax', 'tip', 'total'];
  for (const field of amountFields) {
    if (response[field] !== undefined && response[field] !== null) {
      if (typeof response[field] !== 'number' || response[field] < 0) {
        aiLogger.warn(`验证失败：${field} 不是有效的数字`);
        return false;
      }
    }
  }

  // 检查置信度（如果存在）
  if (response.confidence !== undefined && response.confidence !== null) {
    if (typeof response.confidence !== 'number' || response.confidence < 0 || response.confidence > 1) {
      aiLogger.warn('验证失败：confidence 不在 0-1 范围内');
      return false;
    }
  }

  const validPriceItems = response.items.filter((item: any) => 
    typeof item.price === 'number' && item.price >= 0
  ).length;
  
  aiLogger.info('数据格式验证通过', {
    itemsCount: response.items.length,
    validPriceItems,
    nullPriceItems: response.items.length - validPriceItems,
    confidence: response.confidence,
    businessName: response.businessName,
  });

  return true;
};

/**
 * 获取支持的图片格式信息
 */
export const getSupportedImageFormats = () => {
  return getSupportedFormatsInfo();
};

/**
 * 预览图片处理结果（用于测试）
 */
export const previewImageProcessing = async (file: File) => {
  const originalInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeInMB: (file.size / 1024 / 1024).toFixed(2),
    isHeic: isHeicFormat(file),
  };

  try {
    const processedFile = await preprocessImage(file);
    const processedInfo = {
      name: processedFile.name,
      size: processedFile.size,
      type: processedFile.type,
      sizeInMB: (processedFile.size / 1024 / 1024).toFixed(2),
    };

    return {
      success: true,
      original: originalInfo,
      processed: processedInfo,
      compressionRatio: file.size > 0 ? ((file.size - processedFile.size) / file.size * 100).toFixed(1) + '%' : '0%',
    };
  } catch (error) {
    return {
      success: false,
      original: originalInfo,
      error: error instanceof Error ? error.message : '处理失败',
    };
  }
}; 