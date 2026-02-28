import * as THREE from 'three';

/**
 * 地球纹理配置
 * 根据性能需求选择不同分辨率
 */
export const EARTH_TEXTURES = {
  // 日间底图 - 推荐使用 4k，平衡清晰度和性能
  dayMap: {
    low: '/textures/earthmap1k.jpg',      // 78KB - 低配设备
    medium: '/textures/earthmap2k.jpg',   // 241KB - 中等配置
    high: '/textures/earthmap4k.jpg',     // 753KB - 高配设备
  },

  // 夜间灯光图
  nightMap: {
    low: '/textures/earthmap-night1k.jpg',   // 43KB
    medium: '/textures/earthmap-night2k.jpg', // 143KB
    high: '/textures/earthmap-night4k.jpg',   // 460KB
  },
  // 凹凸贴图（地形起伏）
  bumpMap: {
    low: '/textures/earthbump256.jpg',    // 10KB
    high: '/textures/earthbump4k.jpg',    // 723KB
  },
  // 高光贴图（海洋反光）
  specularMap: {
    low: '/textures/earthspec256.jpg',    // 14KB
    medium: '/textures/earthspec2k.jpg',  // 143KB
    high: '/textures/earthspec4k.jpg',    // 591KB
  },
  // 云层
  clouds: {
    low: '/textures/clouds512.jpg',       // 40KB
    medium: '/textures/clouds2k.jpg',     // 534KB
    high: '/textures/clouds4k.jpg',       // 2.1MB
  },
  // 备选风格底图（更鲜艳的颜色）
  altMap: {
    low: '/textures/earthmapalt1k.jpg',   // 110KB
    medium: '/textures/earthmapalt2k.jpg', // 378KB
    high: '/textures/earthmapalt4k.jpg',   // 1.3MB
  },
  // NASA蓝色大理石风格
  blueMarble: '/textures/earth-blue-marble.jpg', // 1.4MB
};

type QualityLevel = 'low' | 'medium' | 'high';

/**
 * 地球模型工厂类
 * 负责创建和管理3D地球模型
 */
class Earth {
  /**
   * 创建地球模型
   * @param quality 纹理质量等级
   * @returns THREE.Mesh 地球网格对象
   */
  static create(quality: QualityLevel = 'medium'): THREE.Mesh {
    // 创建球体几何体
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // 创建纹理加载器
    const textureLoader = new THREE.TextureLoader();

    // 根据质量等级加载纹理
    const earthTexture = textureLoader.load(EARTH_TEXTURES.dayMap[quality]);
    const bumpTexture = textureLoader.load(
      quality === 'low' ? EARTH_TEXTURES.bumpMap.low : EARTH_TEXTURES.bumpMap.high
    );
    const specularTexture = textureLoader.load(EARTH_TEXTURES.specularMap[quality]);

    // 创建材质
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      specularMap: specularTexture,
      specular: new THREE.Color(0x333333),
      shininess: 25,
    });

    // 创建网格
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Earth';

    return mesh;
  }

  /**
   * 创建使用NASA蓝色大理石纹理的地球
   * @returns THREE.Mesh 地球网格对象
   */
  static createBlueMarble(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    const earthTexture = textureLoader.load(EARTH_TEXTURES.blueMarble);

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 15,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Earth';

    return mesh;
  }

  /**
   * 创建使用备选风格纹理的地球（更鲜艳的颜色）
   * @param quality 纹理质量等级
   * @returns THREE.Mesh 地球网格对象
   */
  static createAltStyle(quality: QualityLevel = 'medium'): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const textureLoader = new THREE.TextureLoader();

    const earthTexture = textureLoader.load(EARTH_TEXTURES.altMap[quality]);
    const bumpTexture = textureLoader.load(EARTH_TEXTURES.bumpMap.high);
    const specularTexture = textureLoader.load(EARTH_TEXTURES.specularMap[quality]);

    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.05,
      specularMap: specularTexture,
      specular: new THREE.Color(0x333333),
      shininess: 25,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Earth';

    return mesh;
  }

  /**
   * 创建简单的地球模型（不使用纹理）
   * 用于在纹理加载失败时作为备选
   * @returns THREE.Mesh 地球网格对象
   */
  static createSimple(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x2194ce,
      wireframe: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Earth';

    return mesh;
  }

  /**
   * 创建带云层的地球
   * @param quality 纹理质量等级
   * @returns THREE.Group 包含地球和云层的组
   */
  static createWithClouds(quality: QualityLevel = 'medium'): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EarthGroup';

    // 创建地球
    const earth = this.create(quality);
    group.add(earth);

    // 创建云层
    const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load(EARTH_TEXTURES.clouds[quality]);

    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    clouds.name = 'Clouds';
    group.add(clouds);

    return group;
  }
}

export default Earth;
