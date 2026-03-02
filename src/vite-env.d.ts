/// <reference types="vite/client" />

// ============================================
// 环境变量类型定义
// ============================================

interface ImportMetaEnv {
  /** 环境标识: development | test | production */
  readonly VITE_APP_ENV: 'development' | 'test' | 'production';
  
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string;
  
  /** 后端服务地址 */
  readonly VITE_BACKEND_URL: string;
  
  /** KeepTrack API 地址 */
  readonly VITE_KEEPTRACK_API: string;
  
  /** Space-Track 代理地址 */
  readonly VITE_SPACETRACK_PROXY: string;
  
  /** 调试模式 */
  readonly VITE_DEBUG: string;
  
  /** 日志级别 */
  readonly VITE_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  /** 卫星加载数量限制 */
  readonly VITE_SATELLITE_LIMIT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ============================================
// 静态资源模块声明
// ============================================

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const src: string;
  export default src;
}

declare module '*.hdr' {
  const src: string;
  export default src;
}
