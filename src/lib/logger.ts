import log from 'loglevel';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

if (isDev || isTest) {
  log.setLevel(log.levels.DEBUG);
} else {
  log.setLevel(log.levels.WARN);
}

const createLogger = (prefix: string) => {
  return {
    trace: (message: any, ...args: any[]) => log.trace(`[${prefix}]`, message, ...args),
    debug: (message: any, ...args: any[]) => log.debug(`[${prefix}]`, message, ...args),
    info: (message: any, ...args: any[]) => log.info(`[${prefix}]`, message, ...args),
    warn: (message: any, ...args: any[]) => log.warn(`[${prefix}]`, message, ...args),
    error: (message: any, ...args: any[]) => log.error(`[${prefix}]`, message, ...args),
  };
};

export const aiLogger = createLogger('AI');
export const uiLogger = createLogger('UI');
export const storeLogger = createLogger('Store');
export const dataLogger = createLogger('Data');

export const logger = createLogger('App');
export default logger;
