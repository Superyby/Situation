/**
 * Space-Track API 配置
 */
export const SPACE_TRACK_CONFIG = {
  // 代理服务器地址（集成在 Vite 开发服务器中）
  proxyBaseUrl: '/api/spacetrack',
  
  // 直接API地址（仅服务端使用）
  directBaseUrl: 'https://www.space-track.org',
  
  // 请求超时时间（毫秒）- 2分钟支持大量数据
  timeout: 120000,
  
  // 默认请求限制
  defaultLimit: 100,
  
  // 最大请求限制
  maxLimit: 5000,
};

/**
 * 卫星分类配置
 */
export const SATELLITE_CATEGORIES = {
  active: { name: '活跃卫星', class: 'tle_latest' },
  weather: { name: '气象卫星', class: 'weather' },
  gps: { name: 'GPS卫星', class: 'gps-ops' },
  glonass: { name: 'GLONASS卫星', class: 'glo-ops' },
  galileo: { name: 'Galileo卫星', class: 'galileo' },
  beidou: { name: '北斗卫星', class: 'beidou' },
  science: { name: '科学卫星', class: 'science' },
  starlink: { name: 'Starlink卫星', class: 'starlink' },
  iss: { name: '国际空间站', noradId: 25544 },
} as const;

/**
 * 3D渲染配置
 */
export const RENDER_CONFIG = {
  // 地球半径（单位）
  earthRadius: 1,
  
  // 卫星轨道高度缩放因子
  orbitScale: 0.0001,
  
  // 卫星标记大小
  satelliteMarkerSize: 0.02,
  
  // 最大显示卫星数量
  maxVisibleSatellites: 100,
};
