import * as THREE from 'three';
import { spaceTrackApi } from '../api/space-track';
import { RENDER_CONFIG } from '../config';
import type { Satellite, SpaceTrackTLE } from '../types/satellite';

/**
 * 卫星服务
 * 使用 Three.js Points 系统渲染卫星
 */
class SatelliteService {
  private satellites: Satellite[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private positions: Float32Array | null = null;

  async initialize(username: string, password: string): Promise<boolean> {
    return await spaceTrackApi.login(username, password);
  }

  async loadSatellites(limit: number = 500): Promise<Satellite[]> {
    console.log(`📡 正在加载 ${limit} 颗卫星数据...`);
    const startTime = performance.now();
    
    const response = await spaceTrackApi.getTLE({ limit });
    
    if (!response.success || !response.data) {
      console.error('❌ 加载卫星数据失败:', response.error);
      return [];
    }

    this.satellites = response.data.map((tle: SpaceTrackTLE) => 
      this.convertToSatellite(tle)
    );
    
    const elapsed = (performance.now() - startTime).toFixed(0);
    console.log(`✅ 成功加载 ${this.satellites.length} 颗卫星 (${elapsed}ms)`);
    return this.satellites;
  }

  private convertToSatellite(tle: SpaceTrackTLE): Satellite {
    return {
      id: tle.NORAD_CAT_ID,
      name: tle.OBJECT_NAME,
      tle: {
        name: tle.TLE_LINE0 || tle.OBJECT_NAME,
        line1: tle.TLE_LINE1,
        line2: tle.TLE_LINE2,
      },
      position: this.calculatePosition(tle),
      color: this.getColorByType(tle.OBJECT_NAME),
      orbitParams: {
        inclination: tle.INCLINATION,
        raan: tle.RA_OF_ASC_NODE,
        meanMotion: tle.MEAN_MOTION,
        meanAnomaly: tle.MEAN_ANOMALY,
      }
    };
  }

  private calculatePosition(tle: SpaceTrackTLE): { x: number; y: number; z: number } {
    const inclination = tle.INCLINATION * (Math.PI / 180);
    const raan = tle.RA_OF_ASC_NODE * (Math.PI / 180);
    const meanAnomaly = tle.MEAN_ANOMALY * (Math.PI / 180);
    
    // 计算半长轴
    const a = Math.pow(398600.4418 / Math.pow(tle.MEAN_MOTION * 2 * Math.PI / 86400, 2), 1/3);
    // 缩放到场景尺寸 (地球半径 = 1)
    const radius = (a / 6371) * RENDER_CONFIG.earthRadius;
    
    // 轨道位置计算
    const x = radius * (Math.cos(raan) * Math.cos(meanAnomaly) - Math.sin(raan) * Math.sin(meanAnomaly) * Math.cos(inclination));
    const y = radius * Math.sin(meanAnomaly) * Math.sin(inclination);
    const z = radius * (Math.sin(raan) * Math.cos(meanAnomaly) + Math.cos(raan) * Math.sin(meanAnomaly) * Math.cos(inclination));
    
    return { x, y, z };
  }

  private getColorByType(name: string): number {
    const upperName = name.toUpperCase();
    if (upperName.includes('STARLINK')) return 0x00ff88;  // 绿色
    if (upperName.includes('ONEWEB')) return 0x00ffff;    // 青色
    if (upperName.includes('GPS')) return 0x4488ff;       // 蓝色
    if (upperName.includes('GLONASS')) return 0xff6666;   // 红色
    if (upperName.includes('COSMOS')) return 0xff4444;    // 深红
    if (upperName.includes('BEIDOU')) return 0xffcc00;    // 金色
    if (upperName.includes('GALILEO')) return 0x8888ff;   // 紫色
    if (upperName.includes('ISS')) return 0xffffff;       // 白色
    if (upperName.includes('TIANGONG')) return 0xff8800;  // 橙色
    if (upperName.includes('IRIDIUM')) return 0x88ff88;   // 浅绿
    return 0xaaaaaa;  // 灰色
  }

  /**
   * 创建卫星 3D 对象
   */
  createSatelliteMeshes(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'Satellites';
    
    const count = this.satellites.length;
    if (count === 0) return group;

    console.log(`🚀 创建 ${count} 颗卫星...`);

    // 创建几何体
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      const sat = this.satellites[i];
      const i3 = i * 3;
      
      if (sat.position) {
        this.positions[i3] = sat.position.x;
        this.positions[i3 + 1] = sat.position.y;
        this.positions[i3 + 2] = sat.position.z;
      }
      
      color.setHex(sat.color || 0xaaaaaa);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 加载圆形纹理
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    
    // 绘制圆形渐变
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    // 创建材质
    const material = new THREE.PointsMaterial({
      size: 0.03,
      map: texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    
    // 创建点云
    this.points = new THREE.Points(this.geometry, material);
    this.points.name = 'SatellitePoints';
    group.add(this.points);
    
    console.log(`✅ 卫星创建完成`);
    return group;
  }

  /**
   * 更新卫星位置（动画）
   */
  updatePositions(deltaTime: number): void {
    if (!this.geometry || !this.positions) return;
    
    // 根据轨道周期旋转
    const angle = deltaTime * 0.00002;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      if (!sat.position) continue;
      
      const i3 = i * 3;
      
      // 绕 Y 轴旋转
      const x = sat.position.x;
      const z = sat.position.z;
      sat.position.x = x * cosA - z * sinA;
      sat.position.z = x * sinA + z * cosA;
      
      this.positions[i3] = sat.position.x;
      this.positions[i3 + 1] = sat.position.y;
      this.positions[i3 + 2] = sat.position.z;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
  }

  getSatellites(): Satellite[] {
    return this.satellites;
  }

  get count(): number {
    return this.satellites.length;
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.points) {
      const material = this.points.material as THREE.PointsMaterial;
      material.map?.dispose();
      material.dispose();
    }
    this.satellites = [];
    spaceTrackApi.logout();
  }
}

export const satelliteService = new SatelliteService();
export default SatelliteService;
