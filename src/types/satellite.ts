/**
 * TLE（两行轨道根数）数据
 */
export interface TLEData {
  name: string;
  line1: string;
  line2: string;
}

/**
 * 卫星基础信息
 */
export interface SatelliteInfo {
  noradId: number;
  name: string;
  country: string;
  launchDate: string;
  decayDate?: string;
  objectType: string;
}

/**
 * Space-Track API 返回的原始TLE数据
 */
export interface SpaceTrackTLE {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  TLE_LINE0: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
}

/**
 * 卫星3D位置
 */
export interface SatellitePosition {
  x: number;
  y: number;
  z: number;
}

/**
 * 轨道参数（用于动画计算）
 */
export interface OrbitParams {
  inclination: number;
  raan: number;
  meanMotion: number;
  meanAnomaly: number;
}

/**
 * 卫星完整数据（用于3D渲染）
 */
export interface Satellite {
  id: number;
  name: string;
  tle: TLEData;
  position?: SatellitePosition;
  velocity?: SatellitePosition;
  color?: number;
  orbitParams?: OrbitParams;
}

/**
 * API响应状态
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
