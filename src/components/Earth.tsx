import { MeshBuilder, PBRMaterial, StandardMaterial, Texture, Scene, Mesh, Color3 } from '@babylonjs/core';

/**
 * 地球纹理配置
 */
export const EARTH_TEXTURES = {
  dayMap: '/textures/earth.jpg',
  clouds: '/textures/clouds4k.jpg',
  skybox: '/textures/skybox8k.jpg',
};

/**
 * 地球模型 - Babylon.js WebGPU 版本
 */
class Earth {
  /**
   * 创建地球 - 使用 PBRMaterial
   */
  static create(scene: Scene): Mesh {
    const earth = MeshBuilder.CreateSphere('Earth', {
      diameter: 2,
      segments: 128,
    }, scene);

    const material = new PBRMaterial('earthMat', scene);
    material.albedoTexture = new Texture(EARTH_TEXTURES.dayMap, scene);
    material.roughness = 0.8;
    material.metallic = 0.1;
    earth.material = material;

    return earth;
  }

  /**
   * 创建云层
   */
  static createClouds(scene: Scene): Mesh {
    const clouds = MeshBuilder.CreateSphere('Clouds', {
      diameter: 2.016,
      segments: 64,
    }, scene);

    const material = new StandardMaterial('cloudMat', scene);
    material.diffuseTexture = new Texture(EARTH_TEXTURES.clouds, scene);
    material.opacityTexture = material.diffuseTexture;
    material.useAlphaFromDiffuseTexture = true;
    material.alpha = 0.35;
    material.backFaceCulling = false;
    clouds.material = material;

    return clouds;
  }

  /**
   * 创建大气层光晕效果
   */
  static createAtmosphere(scene: Scene): Mesh {
    const atmosphere = MeshBuilder.CreateSphere('Atmosphere', {
      diameter: 2.3,
      segments: 64,
    }, scene);

    const material = new StandardMaterial('atmosphereMat', scene);
    material.emissiveColor = new Color3(0.27, 0.53, 1);
    material.alpha = 0.15;
    material.backFaceCulling = true;
    atmosphere.material = material;

    // 翻转法线使其从内部可见
    atmosphere.scaling.x = -1;

    return atmosphere;
  }

  /**
   * 创建星空背景
   */
  static createSkybox(scene: Scene): Mesh {
    const skybox = MeshBuilder.CreateSphere('Skybox', {
      diameter: 200,
      segments: 64,
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
