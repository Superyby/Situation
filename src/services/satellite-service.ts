import { PointsCloudSystem, Scene, Color4, Vector3, CloudPoint } from '@babylonjs/core';
import { Satellite } from 'ootk';
import { keepTrackApi, SatelliteData } from '../api/keeptrack';

export type { SatelliteData };

const EARTH_RADIUS_KM = 6371;

/**
 * 卫星服务 - Babylon.js PointsCloudSystem 版本
 */
class SatelliteService {
  private satellites: SatelliteData[] = [];
  private pcs: PointsCloudSystem | null = null;
  private scene: Scene | null = null;
  private currentPositions: Float32Array | null = null;
  private targetPositions: Float32Array | null = null;
  private readonly lerp = 0.1;
  private frameCount = 0;  // 用于控制更新频率

  /**
   * 加载全部卫星数据
   */
  async loadSatellites(): Promise<SatelliteData[]> {
    console.log('🛰️ 正在加载卫星数据...');

    const rawData = await keepTrackApi.getPopularSatellites(5000, false);  // 限制数量保证流畅

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
   * 计算卫星位置（带有效性验证）- 公开方法
   */
  calculatePosition(satellite: Satellite): { x: number; y: number; z: number } | null {
    try {
      const eci = satellite.eci();
      if (!eci || !eci.position) return null;

      const scale = 1 / EARTH_RADIUS_KM;
      const x = eci.position.x * scale;
      const y = eci.position.z * scale;
      const z = -eci.position.y * scale;

      // 过滤无效值
      if (!isFinite(x) || !isFinite(y) || !isFinite(z)) return null;

      // 过滤距离地心太近或太远的异常点
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 1.01 || dist > 20) return null;

      return { x, y, z };
    } catch {
      return null;
    }
  }

  /**
   * 创建卫星点云 - 使用 PointsCloudSystem
   */
  async createSatelliteMeshes(scene: Scene): Promise<PointsCloudSystem | null> {
    if (this.pcs) return this.pcs;

    this.scene = scene;
    const count = this.satellites.length;
    if (count === 0) return null;

    console.log(`🚀 创建 ${count} 颗卫星点云...`);

    // 初始化位置数组
    this.currentPositions = new Float32Array(count * 3);
    this.targetPositions = new Float32Array(count * 3);

    // 创建 PointsCloudSystem
    const pcs = new PointsCloudSystem('satellites', 1, scene, { updatable: true });

    // 添加所有点
    pcs.addPoints(count, (particle: CloudPoint, i: number) => {
      const sat = this.satellites[i];
      const pos = this.calculatePosition(sat.satellite);
      const i3 = i * 3;

      if (pos) {
        particle.position = new Vector3(pos.x, pos.y, pos.z);
        this.currentPositions![i3] = pos.x;
        this.currentPositions![i3 + 1] = pos.y;
        this.currentPositions![i3 + 2] = pos.z;
        this.targetPositions![i3] = pos.x;
        this.targetPositions![i3 + 1] = pos.y;
        this.targetPositions![i3 + 2] = pos.z;
      } else {
        particle.position = new Vector3(0, 0, 0);
        this.currentPositions![i3] = 0;
        this.currentPositions![i3 + 1] = 0;
        this.currentPositions![i3 + 2] = 0;
        this.targetPositions![i3] = 0;
        this.targetPositions![i3 + 1] = 0;
        this.targetPositions![i3 + 2] = 0;
      }

      // 设置颜色 - 统一使用柔和的青绿色
      particle.color = new Color4(0.3, 0.9, 0.7, 0.85);
    });

    // 构建网格
    await pcs.buildMeshAsync();

    // 设置点大小
    if (pcs.mesh) {
      pcs.mesh.material!.pointSize = 5;
      pcs.mesh.isPickable = true;  // 启用拾取
    }

    this.pcs = pcs;
    console.log(`✅ 卫星点云创建完成`);
    return pcs;
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
   * 平滑插值到目标位置（每帧调用，但降低更新频率）
   */
  interpolatePositions(): void {
    if (!this.pcs || !this.currentPositions || !this.targetPositions) return;

    // 每 5 帧更新一次，减少 GPU 负载
    this.frameCount++;
    if (this.frameCount % 5 !== 0) return;

    // 直接更新位置数组
    for (let i = 0; i < this.currentPositions.length; i++) {
      this.currentPositions[i] += (this.targetPositions[i] - this.currentPositions[i]) * this.lerp;
    }

    // 更新粒子位置
    this.pcs.updateParticle = (particle) => {
      const i3 = particle.idx * 3;
      particle.position.x = this.currentPositions![i3];
      particle.position.y = this.currentPositions![i3 + 1];
      particle.position.z = this.currentPositions![i3 + 2];
      return particle;
    };

    this.pcs.setParticles();
  }

  getSatellites(): SatelliteData[] {
    return this.satellites;
  }

  /**
   * 获取卫星详细信息（高度、速度、周期）
   */
  getSatelliteDetails(satellite: Satellite): { altitude: number; velocity: number; period: number } | null {
    try {
      const eci = satellite.eci();
      if (!eci || !eci.position || !eci.velocity) return null;

      // 计算高度 (km) - 距离地心距离减去地球半径
      const r = Math.sqrt(
        eci.position.x ** 2 + eci.position.y ** 2 + eci.position.z ** 2
      );
      const altitude = r - EARTH_RADIUS_KM;

      // 计算速度 (km/s)
      const velocity = Math.sqrt(
        eci.velocity.x ** 2 + eci.velocity.y ** 2 + eci.velocity.z ** 2
      );

      // 计算轨道周期 (分钟) - 简化计算
      const period = (2 * Math.PI * r) / velocity / 60;

      return {
        altitude: Math.round(altitude),
        velocity: Math.round(velocity * 100) / 100,
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
   * 获取点云mesh
   */
  getMesh() {
    return this.pcs?.mesh || null;
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
    if (this.pcs) {
      this.pcs.dispose();
      this.pcs = null;
    }
    this.scene = null;
    this.satellites = [];
    this.currentPositions = null;
    this.targetPositions = null;
  }
}

export const satelliteService = new SatelliteService();
export default SatelliteService;
