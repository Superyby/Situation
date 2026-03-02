import { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

/**
 * 地球纹理配置
 */
export const EARTH_TEXTURES = {
  dayMap: '/textures/earth.jpg',
  skybox: '/textures/skybox8k.jpg',
};

/**
 * 星空背景组件 - Three.js R3F 版本
 */
export function Skybox() {
  const texture = useLoader(TextureLoader, EARTH_TEXTURES.skybox);

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[100, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

/**
 * 地球组件 - Three.js R3F 版本
 */
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, EARTH_TEXTURES.dayMap);

  // 可选：添加自转动画
  // useFrame((state, delta) => {
  //   if (earthRef.current) {
  //     earthRef.current.rotation.y += delta * 0.05;
  //   }
  // });

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default Earth;
