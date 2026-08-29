// AI 服务配置
export const AI_CONFIG = {
  // 图片处理配置
  image: {
    // 支持的图片格式
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
    // 最大文件大小 (25MB)
    maxFileSize: 25 * 1024 * 1024,
    // 最大图片尺寸
    maxWidth: 8000,
    maxHeight: 8000,
    // 压缩配置
    compression: {
      maxSizeMB: 20,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      initialQuality: 0.8,
    },
  },
  
  // 错误消息配置
  errors: {
    fileUploadFailed: 'File upload failed, please check your network connection or try again later',
    unsupportedFormat: 'Unsupported image format, please use JPG, PNG, GIF, WebP or HEIC format',
    fileTooLarge: 'File too large, please select an image smaller than 25MB',
    imageTooLarge: 'Image dimensions too large, please select an image smaller than 8000x8000 pixels',
    processingFailed: 'Image processing failed',
    heicConversionFailed: 'HEIC format is not supported in browser environment, please convert to JPG format',
    recognitionFailed: 'Recognition failed',
    invalidResponse: 'API response format error',
    emptyResponse: 'API response content is empty',
    parseError: 'Unable to parse AI recognition results',
    invalidFormat: 'AI recognition result format error: missing items array',
    noValidItems: 'No valid product items recognized (product name cannot be empty)',
  },
} as const;

// 检查图片格式是否支持
export const isSupportedImageFormat = (type: string): boolean => {
  return AI_CONFIG.image.supportedFormats.includes(type as any);
};


// 获取支持的图片格式信息
export const getSupportedFormatsInfo = () => {
  return {
    formats: AI_CONFIG.image.supportedFormats,
    maxSize: AI_CONFIG.image.maxFileSize,
    maxDimensions: {
      width: AI_CONFIG.image.maxWidth,
      height: AI_CONFIG.image.maxHeight,
    },
  };
};
