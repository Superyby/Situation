/**
 * ============================================
 * 环境配置 - 统一管理环境变量
 * ============================================
 */

/** 当前环境 */
export const ENV = import.meta.env.VITE_APP_ENV || 'development';

/** 是否为开发环境 */
export const isDev = ENV === 'development';

/** 是否为生产环境 */
export const isProd = ENV === 'production';

/** 是否为测试环境 */
export const isTest = ENV === 'test';

/** 是否启用调试 */
export const isDebug = import.meta.env.VITE_DEBUG === 'true';

/**
 * 环境配置对象
 */
export const envConfig = {
  /** 环境标识 */
  env: ENV,
  
  /** API 基础地址 */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  
  /** 后端服务地址 */
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000',
  
  /** KeepTrack API */
  keeptrackApi: import.meta.env.VITE_KEEPTRACK_API || 'https://api.keeptrack.space/v2',
  
  /** Space-Track 代理 */
  spacetrackProxy: import.meta.env.VITE_SPACETRACK_PROXY || '/api/spacetrack',
  
  /** 日志级别 */
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  
  /** 卫星加载数量 */
  satelliteLimit: parseInt(import.meta.env.VITE_SATELLITE_LIMIT || '5000', 10),
} as const;

export default envConfig;
