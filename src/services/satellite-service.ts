import * as THREE from 'three/webgpu';
import { Satellite } from 'ootk';
import { keepTrackApi, SatelliteData } from '../api/keeptrack';

const EARTH_RADIUS_KM = 6371;

/**
 * 卫星服务 - 丝滑版
 */
class SatelliteService {
  private satellites: SatelliteData[] = [];
  private mainGroup: THREE.Group | null = null;
  private currentPositions: Float32Array | null = null;
  private targetPositions: Float32Array | null = null;
  private readonly lerp = 0.05; // 插值系数

  /**
   * 加载全部卫星数据
   */
  async loadSatellites(): Promise<SatelliteData[]> {
    console.log('🛰️ 正在加载卫星数据...');
    
    const rawData = await keepTrackApi.getPopularSatellites(20000, false);
    
    this.satellites = [];
    for (const data of rawData) {
      const satData = keepTrackApi.convertToSatelliteData(data);
      if (satData) {
        this.satellites.push(satData);
      }
    }
    
    console.log(`✅ 成功加载 ${this.satellites.length} 颗卫星`);
    return this.satellites;
  }

  /**
   * 计算卫星位置（带有效性验证）
   */
  calculatePosition(satellite: Satellite): { x: number; y: number; z: number } | null {
    try {
      const eci = satellite.eci();
      if (!eci || !eci.position) return null;
      
      const scale = 1 / EARTH_RADIUS_KM;
      const x = eci.position.x * scale;
      const y = eci.position.z * scale;
      const z = -eci.position.y * scale;
      
      // 过滤无效值（NaN、Infinity、距离异常）
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return null;
      
      // 过滤距离地心太近或太远的异常点（地球半径=1）
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 1.01 || dist > 20) return null; // 卫星应该在地球外且不超过 GEO 轨道太多
      
      return { x, y, z };
    } catch {
      return null;
    }
  }

  /**
   * 创建卫星点
   */
  createSatelliteMeshes(): THREE.Group {
    if (this.mainGroup) return this.mainGroup;

    const group = new THREE.Group();
    group.name = 'Satellites';
    this.mainGroup = group;
    
    const count = this.satellites.length;
    if (count === 0) return group;

    console.log(`🚀 创建 ${count} 颗卫星...`);

    // 初始化位置数组
    this.currentPositions = new Float32Array(count * 3);
    this.targetPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    
    for (let i = 0; i < count; i++) {
      const sat = this.satellites[i];
      const i3 = i * 3;
      
      const pos = this.calculatePosition(sat.satellite);
      if (pos) {
        // 当前位置和目标位置初始化相同
        this.currentPositions[i3] = pos.x;
        this.currentPositions[i3 + 1] = pos.y;
        this.currentPositions[i3 + 2] = pos.z;
        this.targetPositions[i3] = pos.x;
        this.targetPositions[i3 + 1] = pos.y;
        this.targetPositions[i3 + 2] = pos.z;
      }
      
      color.setHex(sat.color);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.012,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });
    
    const points = new THREE.Points(geometry, material);
    points.name = 'SatellitePoints';
    group.add(points);
    
    console.log(`✅ 卫星创建完成`);
    return group;
  }

  /**
   * 计算新的目标位置（每秒调用一次）
   */
  updateTargetPositions(): void {
    if (!this.targetPositions || !this.currentPositions) return;

    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      const pos = this.calculatePosition(sat.satellite);
      const i3 = i * 3;
      
      if (pos) {
        this.targetPositions[i3] = pos.x;
        this.targetPositions[i3 + 1] = pos.y;
        this.targetPositions[i3 + 2] = pos.z;
      } else {
        // 计算失败时保持当前位置不变
        this.targetPositions[i3] = this.currentPositions[i3];
        this.targetPositions[i3 + 1] = this.currentPositions[i3 + 1];
        this.targetPositions[i3 + 2] = this.currentPositions[i3 + 2];
      }
    }
  }

  /**
   * 平滑插值到目标位置（每帧调用）
   */
  interpolatePositions(): void {
    if (!this.mainGroup || !this.currentPositions || !this.targetPositions) return;
    
    const points = this.mainGroup.getObjectByName('SatellitePoints') as THREE.Points;
    if (!points || !points.geometry) return;

    const positions = points.geometry.attributes.position;
    if (!positions) return;

    // 插值当前位置到目标位置
    for (let i = 0; i < this.currentPositions.length; i++) {
      this.currentPositions[i] += (this.targetPositions[i] - this.currentPositions[i]) * this.lerp;
    }
    
    positions.needsUpdate = true;
  }

  getSatellites(): SatelliteData[] {
    return this.satellites;
  }

  get count(): number {
    return this.satellites.length;
  }

  dispose(): void {
    this.mainGroup = null;
    this.satellites = [];
    this.currentPositions = null;
    this.targetPositions = null;
  }
}

export const satelliteService = new SatelliteService();
export default SatelliteService;
