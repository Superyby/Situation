import * as THREE from 'three';
import { propagate, EciVec3, SatRec } from 'satellite.js';
import { keepTrackApi, SatelliteData } from '../api/keeptrack';

export type { SatelliteData };

const EARTH_RADIUS_KM = 6371;

/**
 * 卫星服务 - Three.js Points 版本
 */
class SatelliteService {
  private satellites: SatelliteData[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private currentPositions: Float32Array | null = null;
  private targetPositions: Float32Array | null = null;
  private readonly lerp = 0.1;
  private frameCount = 0;

  /**
   * 加载全部卫星数据
   */
  async loadSatellites(): Promise<SatelliteData[]> {
    console.log('🛰️ 正在加载卫星数据...');

    const rawData = await keepTrackApi.getPopularSatellites(5000, false);

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
  calculatePosition(satrec: SatRec): { x: number; y: number; z: number } | null {
    try {
      const positionAndVelocity = propagate(satrec, new Date());
      const position = positionAndVelocity.position as EciVec3<number> | false;

      if (!position) return null;

      const scale = 1 / EARTH_RADIUS_KM;
      const x = position.x * scale;
      const y = position.z * scale;
      const z = -position.y * scale;

      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return null;

      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 1.01 || dist > 20) return null;

      return { x, y, z };
    } catch {
      return null;
    }
  }

  /**
   * 创建卫星点云 - 使用 Three.js Points
   */
  async createSatelliteMeshes(scene: THREE.Scene): Promise<THREE.Points | null> {
    if (this.points) return this.points;
    const count = this.satellites.length;
    if (count === 0) return null;

    console.log(`🚀 创建 ${count} 颗卫星点云...`);

    // 初始化位置数组
    this.currentPositions = new Float32Array(count * 3);
    this.targetPositions = new Float32Array(count * 3);

    // 计算初始位置
    for (let i = 0; i < count; i++) {
      const sat = this.satellites[i];
      const pos = this.calculatePosition(sat.satrec);
      const i3 = i * 3;

      if (pos) {
        this.currentPositions[i3] = pos.x;
        this.currentPositions[i3 + 1] = pos.y;
        this.currentPositions[i3 + 2] = pos.z;
        this.targetPositions[i3] = pos.x;
        this.targetPositions[i3 + 1] = pos.y;
        this.targetPositions[i3 + 2] = pos.z;
      }
    }

    // 创建 BufferGeometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));

    // 创建材质
    const material = new THREE.PointsMaterial({
      color: 0x4de8b2,
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
    });

    // 创建 Points
    this.points = new THREE.Points(this.geometry, material);
    this.points.name = 'satellites';
    scene.add(this.points);

    console.log(`✅ 卫星点云创建完成`);
    return this.points;
  }

  /**
   * 计算新的目标位置（每秒调用一次）
   */
  updateTargetPositions(): void {
    if (!this.targetPositions || !this.currentPositions) return;

    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      const pos = this.calculatePosition(sat.satrec);
      const i3 = i * 3;

      if (pos) {
        this.targetPositions[i3] = pos.x;
        this.targetPositions[i3 + 1] = pos.y;
        this.targetPositions[i3 + 2] = pos.z;
      } else {
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
    if (!this.geometry || !this.currentPositions || !this.targetPositions) return;

    this.frameCount++;
    if (this.frameCount % 5 !== 0) return;

    // 插值更新位置
    for (let i = 0; i < this.currentPositions.length; i++) {
      this.currentPositions[i] += (this.targetPositions[i] - this.currentPositions[i]) * this.lerp;
    }

    // 更新 BufferGeometry
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
  }

  getSatellites(): SatelliteData[] {
    return this.satellites;
  }

  /**
   * 获取卫星详细信息（高度、速度、周期）
   */
  getSatelliteDetails(satrec: SatRec): { altitude: number; velocity: number; period: number } | null {
    try {
      const positionAndVelocity = propagate(satrec, new Date());
      const position = positionAndVelocity.position as EciVec3<number> | false;
      const velocity = positionAndVelocity.velocity as EciVec3<number> | false;

      if (!position || !velocity) return null;

      const r = Math.sqrt(
        position.x ** 2 + position.y ** 2 + position.z ** 2
      );
      const altitude = r - EARTH_RADIUS_KM;

      const vel = Math.sqrt(
        velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2
      );

      const period = (2 * Math.PI * r) / vel / 60;

      return {
        altitude: Math.round(altitude),
        velocity: Math.round(vel * 100) / 100,
        period: Math.round(period * 10) / 10
      };
    } catch {
      return null;
    }
  }

  /**
   * 根据索引获取单颗卫星数据
   */
  getSatelliteByIndex(index: number): SatelliteData | null {
    if (index >= 0 && index < this.satellites.length) {
      return this.satellites[index];
    }
    return null;
  }

  /**
   * 获取点云 mesh
   */
  getMesh(): THREE.Points | null {
    return this.points;
  }

  /**
   * 搜索卫星
   */
  searchSatellites(query: string): SatelliteData[] {
    const q = query.toLowerCase();
    return this.satellites.filter(sat =>
      sat.name.toLowerCase().includes(q) ||
      sat.id.toString().includes(q)
    );
  }

  get count(): number {
    return this.satellites.length;
  }

  dispose(): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.points = null;
    }
    this.geometry = null;
    this.satellites = [];
    this.currentPositions = null;
    this.targetPositions = null;
  }
}

export const satelliteService = new SatelliteService();
export default SatelliteService;
