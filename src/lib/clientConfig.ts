// 客户端安全的配置文件 - 不包含环境变量
export const CLIENT_CONFIG = {
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
    fileUploadFailed: '文件上传失败，请检查网络连接或稍后重试',
    unsupportedFormat: '不支持的图片格式，请使用 JPG、PNG、GIF、WebP 或 HEIC 格式',
    fileTooLarge: '文件太大，请选择小于 25MB 的图片',
    imageTooLarge: '图片尺寸过大，请选择小于 8000x8000 像素的图片',
    processingFailed: '图片处理失败',
    heicConversionFailed: 'HEIC 格式在浏览器环境中不支持，请转换为 JPG 格式',
    recognitionFailed: '识别失败',
    invalidResponse: 'API 响应格式错误',
    emptyResponse: 'API 响应内容为空',
    parseError: '无法解析 AI 识别结果',
    invalidFormat: 'AI 识别结果格式错误：缺少 items 数组',
    noValidItems: '未识别到任何有效的商品项目（商品名称不能为空）',
  },
} as const;

// 检查图片格式是否支持
export const isSupportedImageFormat = (type: string): boolean => {
  return CLIENT_CONFIG.image.supportedFormats.includes(type as any);
};

// 获取支持的图片格式信息
export const getSupportedFormatsInfo = () => {
  return {
    formats: CLIENT_CONFIG.image.supportedFormats,
    maxSize: CLIENT_CONFIG.image.maxFileSize,
    maxDimensions: {
      width: CLIENT_CONFIG.image.maxWidth,
      height: CLIENT_CONFIG.image.maxHeight,
    },
  };
}; 