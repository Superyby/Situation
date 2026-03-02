import { gsap } from 'gsap';
import * as THREE from 'three';

/**
 * GSAP 动画工具函数
 * 封装常用的动画效果 - 适配 Three.js
 */

/**
 * 淡入动画
 */
export function fadeIn(
  element: gsap.TweenTarget,
  duration: number = 0.5,
  delay: number = 0
): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { opacity: 0 },
    { opacity: 1, duration, delay, ease: 'power2.out' }
  );
}

/**
 * 淡出动画
 */
export function fadeOut(
  element: gsap.TweenTarget,
  duration: number = 0.5,
  delay: number = 0
): gsap.core.Tween {
  return gsap.to(element, {
    opacity: 0,
    duration,
    delay,
    ease: 'power2.in',
  });
}

/**
 * 缩放动画
 */
export function scaleIn(
  element: gsap.TweenTarget,
  duration: number = 0.5,
  delay: number = 0
): gsap.core.Tween {
  return gsap.fromTo(
    element,
    { scale: 0 },
    { scale: 1, duration, delay, ease: 'back.out(1.7)' }
  );
}

/**
 * 3D旋转动画 - Three.js 版本
 */
export function rotate3D(
  target: THREE.Object3D,
  axis: 'x' | 'y' | 'z',
  duration: number = 10,
  repeat: number = -1
): gsap.core.Tween {
  return gsap.to(target.rotation, {
    [axis]: Math.PI * 2,
    duration,
    repeat,
    ease: 'none',
  });
}

/**
 * 相机平滑移动 - Three.js 版本
 */
export function smoothCameraMove(
  camera: THREE.Camera,
  targetPosition: { x: number; y: number; z: number },
  duration: number = 1
): gsap.core.Tween {
  return gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease: 'power2.inOut',
  });
}

/**
 * 脉冲动画
 */
export function pulse(
  element: gsap.TweenTarget,
  scale: number = 1.1,
  duration: number = 0.5
): gsap.core.Tween {
  return gsap.to(element, {
    scale,
    duration,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut',
  });
}

/**
 * 停止所有动画
 */
export function killAllTweens(target: gsap.TweenTarget): void {
  gsap.killTweensOf(target);
}

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  rotate3D,
  smoothCameraMove,
  pulse,
  killAllTweens,
};
