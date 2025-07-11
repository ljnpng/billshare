import { AI_CONFIG } from './config';
import { aiLogger } from './logger';
import convert from 'heic-convert';

/**
 * 检查文件是否为支持的图片格式
 */
export const isSupportedImageFormat = (mimeType: string): boolean => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  return supportedTypes.includes(mimeType);
};

/**
 * 检查文件是否为 HEIC 格式
 */
export const isHeicFormat = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
};

/**
 * 转换 HEIC 格式到 JPEG
 */
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    aiLogger.info('开始转换 HEIC 格式...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const outputBuffer = await convert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.9
    });
    
    const jpegFile = new File([outputBuffer], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    
    aiLogger.info('HEIC 转换完成', {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      convertedSize: `${(jpegFile.size / 1024 / 1024).toFixed(2)}MB`,
    });
    
    return jpegFile;
  } catch (error) {
    aiLogger.error('HEIC 转换失败:', error);
    throw new Error(`HEIC 转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 验证并预处理图片文件
 */
export const validateAndPreprocessImage = async (file: File): Promise<File> => {
  // 验证文件格式
  if (!isSupportedImageFormat(file.type)) {
    throw new Error('不支持的文件格式');
  }

  // 验证文件大小
  if (file.size > AI_CONFIG.image.maxFileSize) {
    throw new Error('文件过大');
  }

  // 转换 HEIC 格式
  let processedFile = file;
  if (isHeicFormat(file)) {
    processedFile = await convertHeicToJpeg(file);
  }

  return processedFile;
};

/**
 * 基本格式验证
 */
export const validateBasicFormat = (response: any): boolean => {
  if (typeof response !== 'object' || response === null) {
    aiLogger.warn('验证失败：响应不是有效的对象');
    return false;
  }

  if (!Array.isArray(response.items)) {
    aiLogger.warn('验证失败：缺少 items 数组');
    return false;
  }

  return true;
};

/**
 * 验证AI响应格式
 */
export const validateAIResponse = (response: any): boolean => {
  if (!validateBasicFormat(response)) {
    return false;
  }

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
    if (item.price !== null && item.price !== undefined && 
        (typeof item.price !== 'number' || item.price < 0)) {
      aiLogger.warn(`验证失败：商品 ${i + 1} 的 price 格式错误`);
      return false;
    }
  }

  // 检查金额数据
  const amountFields = ['subtotal', 'tax', 'tip', 'total'];
  for (const field of amountFields) {
    if (response[field] !== undefined && response[field] !== null) {
      if (typeof response[field] !== 'number' || response[field] < 0) {
        aiLogger.warn(`验证失败：${field} 不是有效的数字`);
        return false;
      }
    }
  }

  return true;
};

/**
 * 解析AI响应JSON
 */
export const parseAIResponse = (responseText: string): any => {
  try {
    const recognizedData = JSON.parse(responseText);
    aiLogger.info('JSON 直接解析成功');
    return recognizedData;
  } catch (e) {
    // 如果直接解析失败，尝试提取 JSON 部分
    aiLogger.warn('JSON 直接解析失败，尝试提取 JSON 部分');
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const recognizedData = JSON.parse(jsonMatch[0]);
      aiLogger.info('JSON 提取解析成功');
      return recognizedData;
    } else {
      aiLogger.error('无法解析 JSON 响应');
      throw new Error('无法解析识别结果');
    }
  }
}; 