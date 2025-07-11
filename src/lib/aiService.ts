import { AIRecognizedReceipt, AIProcessingResult } from '../types';
import imageCompression from 'browser-image-compression';
import { AI_CONFIG, isSupportedImageFormat, getSupportedFormatsInfo } from './config';
import { aiLogger } from './logger';

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
 * 调用Next.js API路由进行识别
 */
const callRecognitionAPI = async (file: File): Promise<AIProcessingResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/claude/recognize', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '服务器错误');
    }

    const result: AIProcessingResult = await response.json();
    return result;
  } catch (error) {
    aiLogger.error('API调用失败:', error);
    throw error;
  }
};

/**
 * 使用 Next.js API 路由识别账单
 */
export const recognizeReceipt = async (imageFile: File): Promise<AIProcessingResult> => {
  try {
    aiLogger.info('开始 AI 识别流程...');

    // 1. 预处理图片
    const processedFile = await preprocessImage(imageFile);

    // 2. 调用 Next.js API 路由
    const result = await callRecognitionAPI(processedFile);

    if (result.success) {
      aiLogger.info('AI 识别成功', {
        itemsCount: result.data?.items?.length || 0,
        businessName: result.data?.businessName,
      });
    } else {
      aiLogger.error('AI 识别失败:', result.error);
    }

    return result;

  } catch (error) {
    aiLogger.error('AI 识别失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : AI_CONFIG.errors.recognitionFailed,
    };
  }
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