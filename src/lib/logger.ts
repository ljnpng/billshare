import log from 'loglevel';

// 配置日志级别
const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// 在开发环境显示所有日志，生产环境只显示 warn 和 error
if (isDev || isTest) {
  log.setLevel(log.levels.DEBUG);
} else {
  log.setLevel(log.levels.WARN);
}

// 创建带前缀的日志器
const createLogger = (prefix: string) => {
  return {
    trace: (message: any, ...args: any[]) => log.trace(`[${prefix}]`, message, ...args),
    debug: (message: any, ...args: any[]) => log.debug(`[${prefix}]`, message, ...args),
    info: (message: any, ...args: any[]) => log.info(`[${prefix}]`, message, ...args),
    warn: (message: any, ...args: any[]) => log.warn(`[${prefix}]`, message, ...args),
    error: (message: any, ...args: any[]) => log.error(`[${prefix}]`, message, ...args),
  };
};

// 导出不同模块的日志器
export const aiLogger = createLogger('AI');
export const uiLogger = createLogger('UI');
export const storeLogger = createLogger('Store');
export const dataLogger = createLogger('Data');

// 导出默认日志器
export const logger = createLogger('App');
export default logger; 