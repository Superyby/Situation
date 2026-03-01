import { MeshBuilder, StandardMaterial, Texture, Scene, Mesh } from '@babylonjs/core';

/**
 * 地球纹理配置
 */
export const EARTH_TEXTURES = {
  dayMap: '/textures/earth.jpg',
  skybox: '/textures/skybox8k.jpg',
};

/**
 * 地球模型 - Babylon.js WebGPU 版本
 */
class Earth {
  /**
   * 创建地球
   */
  static create(scene: Scene): Mesh {
    const earth = MeshBuilder.CreateSphere('Earth', {
      diameter: 2,
      segments: 64,  // 降低分段数减少GPU负载
    }, scene);

    const material = new StandardMaterial('earthMat', scene);
    const texture = new Texture(EARTH_TEXTURES.dayMap, scene);
    texture.uScale = -1;
    texture.vScale = -1;
    material.emissiveTexture = texture;  // 纯贴图
    material.disableLighting = true;     // 禁用光照
    earth.material = material;

    return earth;
  }

  /**
   * 创建星空背景
   */
  static createSkybox(scene: Scene): Mesh {
    const skybox = MeshBuilder.CreateSphere('Skybox', {
      diameter: 200,
      segments: 32,  // 降低分段数
    }, scene);

    // 翻转使内部可见
    skybox.scaling.x = -1;

    const material = new StandardMaterial('skyMat', scene);
    material.diffuseTexture = new Texture(EARTH_TEXTURES.skybox, scene);
    material.emissiveTexture = material.diffuseTexture;
    material.disableLighting = true;
    material.backFaceCulling = false;
    skybox.material = material;

    return skybox;
  }
}

export default Earth;
