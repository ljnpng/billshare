// 获取环境变量的安全函数
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof process === 'undefined' || !process.env) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
};

// AI 服务配置
export const AI_CONFIG = {
  // AI 服务提供商选择
  provider: getEnvVar('AI_PROVIDER', 'claude') as 'claude' | 'groq',
  
  // Claude API 配置
  claude: {
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 8192, // Claude 3.5 Haiku 最大支持 8192 tokens
    temperature: 0.3,
    betas: ['files-api-2025-04-14'] as const,
  },

  // Groq API 配置
  groq: {
    model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Groq 视觉模型
    maxTokens: 4096,
    temperature: 0.3,
  },
  
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