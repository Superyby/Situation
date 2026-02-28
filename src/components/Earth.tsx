import * as THREE from 'three/webgpu';

/**
 * 地球纹理配置
 */
export const EARTH_TEXTURES = {
  dayMap: '/textures/earth.jpg',
  clouds: '/textures/clouds4k.jpg',
  skybox: '/textures/skybox8k.jpg',
};

/**
 * 地球模型 - WebGPU 兼容版本
 */
class Earth {
  /**
   * 创建地球 - 使用 MeshStandardMaterial
   */
  static create(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1, 128, 128);
    const textureLoader = new THREE.TextureLoader();

    const earthTexture = textureLoader.load(EARTH_TEXTURES.dayMap);
    earthTexture.anisotropy = 16;
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    // WebGPU 兼容的 MeshStandardMaterial
    const material = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.8,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'Earth';
    return mesh;
  }

  /**
   * 创建云层
   */
  static createClouds(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.008, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const cloudTexture = textureLoader.load(EARTH_TEXTURES.clouds);

    // WebGPU 兼容的 MeshBasicMaterial
    const material = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    const clouds = new THREE.Mesh(geometry, material);
    clouds.name = 'Clouds';
    return clouds;
  }

  /**
   * 创建大气层光晕效果
   */
  static createAtmosphere(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.15, 64, 64);

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x4488ff),
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false,
    });

    const atmosphere = new THREE.Mesh(geometry, material);
    atmosphere.name = 'Atmosphere';
    return atmosphere;
  }

  /**
   * 创建星空背景
   */
  static createSkybox(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(100, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(EARTH_TEXTURES.skybox);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });

    const skybox = new THREE.Mesh(geometry, material);
    skybox.name = 'Skybox';
    return skybox;
  }
}

export default Earth;
