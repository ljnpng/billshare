/**
 * AI识别错误消息国际化映射
 */

export type ErrorType = 
  | 'formatError'
  | 'noItemsFound'
  | 'networkError'
  | 'recognitionFailed'
  | 'parseError'
  | 'invalidFile'
  | 'processingFailed'
  | 'apiError';

/**
 * 根据错误消息内容判断错误类型
 */
export const getErrorType = (errorMessage: string): ErrorType => {
  const message = errorMessage.toLowerCase();
  
  if (message.includes('解析') || message.includes('json') || message.includes('格式有误') || 
      message.includes('parse') || message.includes('format')) {
    return 'formatError';
  }
  
  if (message.includes('商品信息') || message.includes('清晰度') || message.includes('重新拍照') ||
      message.includes('no valid items') || message.includes('clarity') || message.includes('retake')) {
    return 'noItemsFound';
  }
  
  if (message.includes('网络') || message.includes('连接') || message.includes('api') ||
      message.includes('network') || message.includes('connection')) {
    return 'networkError';
  }
  
  if (message.includes('文件') || message.includes('格式') || message.includes('大小') ||
      message.includes('file') || message.includes('format') || message.includes('size')) {
    return 'invalidFile';
  }
  
  if (message.includes('处理失败') || message.includes('processing')) {
    return 'processingFailed';
  }
  
  if (message.includes('服务') || message.includes('暂时') || message.includes('不可用') ||
      message.includes('service') || message.includes('unavailable')) {
    return 'apiError';
  }
  
  return 'recognitionFailed';
};

/**
 * 获取国际化错误消息的键
 */
export const getErrorMessageKey = (errorMessage: string): string => {
  const errorType = getErrorType(errorMessage);
  return `aiRecognition.errors.${errorType}`;
};