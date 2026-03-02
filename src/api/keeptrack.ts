import { twoline2satrec, SatRec } from 'satellite.js';

const API_BASE = 'https://api.keeptrack.space/v2';

/**
 * KeepTrack API 返回的卫星数据（/v2/sats 格式）
 */
export interface KeepTrackSatellite {
  id?: number;           // /v2/sats 格式
  NORAD_CAT_ID?: number; // /v2/sat/{id} 格式
  name?: string;         // /v2/sats 格式
  NAME?: string;         // /v2/sat/{id} 格式
  tle1?: string;         // /v2/sats 格式
  TLE_LINE_1?: string;   // /v2/sat/{id} 格式
  tle2?: string;         // /v2/sats 格式
  TLE_LINE_2?: string;   // /v2/sat/{id} 格式
  type?: number;         // 卫星类型: 0=未知, 1=有效载荷, 2=火箭体, 3=碎片, 4=特殊
  country?: string;
  launchDate?: string;
}

/**
 * 卫星数据（带计算能力）
 */
export interface SatelliteData {
  id: number;
  name: string;
  satrec: SatRec;  // satellite.js 的轨道记录对象
  color: number;
  type: number;
}

// 卫星类型常量
export const SAT_TYPE = {
  UNKNOWN: 0,
  PAYLOAD: 1,      // 有效载荷（工作卫星）
  ROCKET_BODY: 2,  // 火箭体
  DEBRIS: 3,       // 碎片
  SPECIAL: 4,      // 特殊
};

/**
 * KeepTrack API 客户端
 * 免费获取全球卫星 TLE 数据
 */
class KeepTrackApi {
  private cachedSatellites: KeepTrackSatellite[] | null = null;

  /**
   * 获取所有卫星数据（使用 /v2/sats 接口）
   * 数据量很大（约5万+颗）
   */
  async getAllSatellites(): Promise<KeepTrackSatellite[]> {
    if (this.cachedSatellites) {
      console.log('📦 使用缓存的卫星数据');
      return this.cachedSatellites;
    }

    console.log('🌍 正在从 KeepTrack API 获取全部卫星数据...');
    console.log('⏳ 数据量较大，请稍候...');

    try {
      const response = await fetch(`${API_BASE}/sats`);
      if (!response.ok) {
        throw new Error(`API 响应错误: ${response.status}`);
      }
      
      const data = await response.json();
      this.cachedSatellites = data;
      console.log(`✅ 成功获取 ${data.length} 颗卫星数据`);
      return data;
    } catch (error) {
      console.error('获取卫星数据失败:', error);
      return [];
    }
  }

  /**
   * 获取单颗卫星数据
   */
  async getSatellite(noradId: number): Promise<KeepTrackSatellite | null> {
    try {
      const response = await fetch(`${API_BASE}/sat/${noradId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`获取卫星 ${noradId} 失败:`, error);
      return null;
    }
  }

  /**
   * 获取热门卫星（从全部数据中筛选）
   * @param maxCount 最大返回数量
   * @param includeDebris 是否包含碎片
   */
  async getPopularSatellites(maxCount: number = 500, includeDebris: boolean = false): Promise<KeepTrackSatellite[]> {
    const allSats = await this.getAllSatellites();
    
    if (allSats.length === 0) {
      console.warn('⚠️ 未获取到卫星数据，使用备用列表');
      return this.getFallbackSatellites();
    }

    // 筛选有效数据
    let filtered = allSats.filter(sat => {
      const tle1 = sat.tle1 || sat.TLE_LINE_1;
      const tle2 = sat.tle2 || sat.TLE_LINE_2;
      if (!tle1 || !tle2) return false;
      
      // 是否过滤碎片
      if (!includeDebris && sat.type === SAT_TYPE.DEBRIS) return false;
      
      return true;
    });

    console.log(`📊 筛选后: ${filtered.length} 颗卫星 (排除碎片: ${!includeDebris})`);

    // 优先排序：有效载荷 > 特殊 > 火箭体 > 碎片
    filtered.sort((a, b) => {
      const typeOrder = (t: number | undefined) => {
        if (t === SAT_TYPE.PAYLOAD) return 0;
        if (t === SAT_TYPE.SPECIAL) return 1;
        if (t === SAT_TYPE.ROCKET_BODY) return 2;
        return 3;
      };
      return typeOrder(a.type) - typeOrder(b.type);
    });

    // 限制数量
    const result = filtered.slice(0, maxCount);
    console.log(`🛰️ 返回 ${result.length} 颗卫星用于渲染`);
    
    return result;
  }

  /**
   * 备用卫星列表（API失败时使用）
   */
  private async getFallbackSatellites(): Promise<KeepTrackSatellite[]> {
    const fallbackIds = [
      25544, 48274, 20580,  // ISS, 天宫, 哈勃
      28474, 32260, 35752, 36585, 37753,  // GPS
      36287, 36590, 37210, 37256,  // 北斗
      44713, 44714, 44715, 44716,  // Starlink
    ];
    
    const results: KeepTrackSatellite[] = [];
    for (const id of fallbackIds) {
      const sat = await this.getSatellite(id);
      if (sat) results.push(sat);
    }
    return results;
  }

  /**
   * 将 API 数据转换为可用的卫星对象
   * 支持两种 API 格式（/v2/sats 和 /v2/sat/{id}）
   */
  convertToSatelliteData(data: KeepTrackSatellite): SatelliteData | null {
    try {
      // 兼容两种 API 格式
      const id = data.id ?? data.NORAD_CAT_ID ?? 0;
      const name = data.name ?? data.NAME ?? 'Unknown';
      const tle1 = data.tle1 ?? data.TLE_LINE_1;
      const tle2 = data.tle2 ?? data.TLE_LINE_2;
      const type = data.type ?? 0;

      if (!tle1 || !tle2) {
        return null;
      }

      const satrec = twoline2satrec(tle1, tle2);

      return {
        id,
        name,
        satrec,
        color: this.getColorByName(name),
        type,
      };
    } catch (error) {
      const name = data.name ?? data.NAME ?? 'Unknown';
      console.error(`转换卫星 ${name} 失败:`, error);
      return null;
    }
  }

  /**
   * 根据卫星名称获取颜色
   */
  private getColorByName(name: string): number {
    const upperName = name.toUpperCase();
    if (upperName.includes('ISS') || upperName.includes('ZARYA')) return 0xffffff;
    if (upperName.includes('TIANGONG') || upperName.includes('CSS')) return 0xff8800;
    if (upperName.includes('STARLINK')) return 0x00ff88;
    if (upperName.includes('GPS')) return 0x4488ff;
    if (upperName.includes('BEIDOU') || upperName.includes('CZ-')) return 0xffcc00;
    if (upperName.includes('GLONASS') || upperName.includes('COSMOS')) return 0xff6666;
    if (upperName.includes('GALILEO')) return 0x8888ff;
    if (upperName.includes('GOES') || upperName.includes('FY-') || upperName.includes('NOAA')) return 0x00ffff;
    if (upperName.includes('HUBBLE') || upperName.includes('JWST')) return 0xff00ff;
    if (upperName.includes('IRIDIUM')) return 0x88ffff;
    if (upperName.includes('ONEWEB')) return 0xaaff66;
    return 0x66aaff;
  }
}

export const keepTrackApi = new KeepTrackApi();
export default KeepTrackApi;
