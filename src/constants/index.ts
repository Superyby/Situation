/**
 * ============================================
 * 全局常量定义
 * ============================================
 */

// ============================================
// 地球相关常量
// ============================================

/** 地球半径（公里） */
export const EARTH_RADIUS_KM = 6371;

/** 地球赤道周长（公里） */
export const EARTH_CIRCUMFERENCE_KM = 40075;

/** 地球自转周期（秒） */
export const EARTH_ROTATION_PERIOD = 86164;

// ============================================
// 3D 渲染常量
// ============================================

/** 场景单位中的地球半径 */
export const EARTH_RADIUS_UNITS = 1;

/** 卫星轨道缩放因子 */
export const ORBIT_SCALE = 1 / EARTH_RADIUS_KM;

/** 默认相机位置 */
export const DEFAULT_CAMERA_POSITION = { x: 3, y: 2, z: 3 };

/** 相机最小距离 */
export const CAMERA_MIN_DISTANCE = 1.2;

/** 相机最大距离 */
export const CAMERA_MAX_DISTANCE = 15;

// ============================================
// 卫星类型常量
// ============================================

export const SAT_TYPE = {
  UNKNOWN: 0,
  PAYLOAD: 1,
  ROCKET_BODY: 2,
  DEBRIS: 3,
  SPECIAL: 4,
} as const;

export type SatType = typeof SAT_TYPE[keyof typeof SAT_TYPE];

/** 卫星类型标签 */
export const SAT_TYPE_LABELS: Record<SatType, string> = {
  [SAT_TYPE.UNKNOWN]: '未知',
  [SAT_TYPE.PAYLOAD]: '有效载荷',
  [SAT_TYPE.ROCKET_BODY]: '火箭体',
  [SAT_TYPE.DEBRIS]: '碎片',
  [SAT_TYPE.SPECIAL]: '特殊',
};

// ============================================
// 颜色常量
// ============================================

export const COLORS = {
  /** 卫星默认颜色 */
  SATELLITE_DEFAULT: 0x4de8b2,
  
  /** ISS 颜色 */
  ISS: 0xffffff,
  
  /** 天宫颜色 */
  TIANGONG: 0xff8800,
  
  /** Starlink 颜色 */
  STARLINK: 0x00ff88,
  
  /** GPS 颜色 */
  GPS: 0x4488ff,
  
  /** 北斗颜色 */
  BEIDOU: 0xffcc00,
} as const;

// ============================================
// API 路由常量
// ============================================

export const API_ROUTES = {
  /** 认证相关 */
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  
  /** 卫星数据 */
  SATELLITE: {
    LIST: '/satellites',
    DETAIL: '/satellites/:id',
    TLE: '/satellites/:id/tle',
  },
  
  /** 用户相关 */
  USER: {
    INFO: '/user/info',
    SETTINGS: '/user/settings',
  },
} as const;

// ============================================
// 本地存储 Key
// ============================================

export const STORAGE_KEYS = {
  /** 用户 Token */
  TOKEN: 'orbital_tracker_token',
  
  /** 用户偏好设置 */
  USER_PREFERENCES: 'orbital_tracker_preferences',
  
  /** 上次选中的卫星 */
  LAST_SELECTED_SATELLITE: 'orbital_tracker_last_sat',
} as const;

// ============================================
// 事件名称
// ============================================

export const EVENTS = {
  /** 卫星选中事件 */
  SATELLITE_SELECTED: 'satellite:selected',
  
  /** 相机移动事件 */
  CAMERA_MOVED: 'camera:moved',
  
  /** 数据加载完成 */
  DATA_LOADED: 'data:loaded',
} as const;
