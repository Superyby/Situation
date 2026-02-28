import axios from 'axios';
import { SPACE_TRACK_CONFIG } from '../config';
import type { SpaceTrackTLE, ApiResponse } from '../types/satellite';

/**
 * Space-Track API 客户端
 * 通过代理服务器访问，解决CORS问题
 */
class SpaceTrackApi {
  private baseUrl: string;
  private isAuthenticated: boolean = false;
  constructor() {
    this.baseUrl = SPACE_TRACK_CONFIG.proxyBaseUrl;
  }

  /**
   * 登录认证
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('🔐 正在连接 Space-Track...');


      const response = await axios.post(
        `${this.baseUrl}/login`,
        { identity: username, password: password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: SPACE_TRACK_CONFIG.timeout,
        }
      );
      // Space-Track 登录成功返回空响应或 "Success"
      // 状态码 200 且无错误即表示成功
      const data = String(response.data || '');
      this.isAuthenticated = response.status === 200 && !data.includes('Failed');
      
      if (this.isAuthenticated) {
        console.log('✅ Space-Track 认证成功');
      } else {
        console.error('❌ Space-Track 认证失败，响应:', data);
      }
      
      return this.isAuthenticated;
    } catch (error: any) {
      console.error('❌ Space-Track 登录异常:', error.message);
      return false;
    }
  }

  /**
   * 获取TLE数据
   */
  async getTLE(options: {
    limit?: number;
    orderby?: string;
  } = {}): Promise<ApiResponse<SpaceTrackTLE[]>> {
    if (!this.isAuthenticated) {
      console.error('❌ 未认证，无法获取数据');
      return { success: false, error: '未认证' };
    }

    try {
      console.log('📡 正在获取卫星数据...');
      
      const params = new URLSearchParams({
        limit: (options.limit || SPACE_TRACK_CONFIG.defaultLimit).toString(),
        orderby: options.orderby || 'NORAD_CAT_ID asc',
      });

      const response = await axios.get(
        `${this.baseUrl}/tle?${params}`,
        { timeout: SPACE_TRACK_CONFIG.timeout }
      );

      const data = response.data;
      
      if (Array.isArray(data)) {
        console.log(`✅ 获取到 ${data.length} 颗卫星数据`);
        return { success: true, data };
      } else {
        console.error('❌ 返回数据格式错误:', data);
        return { success: false, error: '数据格式错误' };
      }
    } catch (error: any) {
      console.error('❌ 获取TLE失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 按NORAD ID获取卫星
   */
  async getSatelliteById(noradId: number): Promise<ApiResponse<SpaceTrackTLE>> {
    if (!this.isAuthenticated) {
      return { success: false, error: '未认证' };
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/satellite/${noradId}`,
        { timeout: SPACE_TRACK_CONFIG.timeout }
      );

      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data: data[0] };
      }
      return { success: false, error: '未找到卫星' };
    } catch (error: any) {
      console.error(`❌ 获取卫星 ${noradId} 失败:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 注销
   */
  async logout(): Promise<void> {
    if (!this.isAuthenticated) return;
    
    try {
      await axios.get(`${this.baseUrl}/logout`);
      this.isAuthenticated = false;
      console.log('✅ 已注销');
    } catch (error) {
      console.error('❌ 注销失败:', error);
    }
  }

  /**
   * 检查认证状态
   */
  get authenticated(): boolean {
    return this.isAuthenticated;
  }
}

export const spaceTrackApi = new SpaceTrackApi();
export default SpaceTrackApi;
