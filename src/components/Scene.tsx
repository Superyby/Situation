import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three/webgpu';
import { gsap } from 'gsap';
import Earth from './Earth';
import { satelliteService } from '../services/satellite-service';

interface SceneProps {
  className?: string;
}

/**
 * Three.js 场景组件 - WebGPU 版本
 */
const Scene: React.FC<SceneProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rotationGroupRef = useRef<THREE.Group | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('初始化 WebGPU...');
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [webgpuSupported, setWebgpuSupported] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: THREE.WebGPURenderer | null = null;
    let animationId: number;
    let isDisposed = false;

    const init = async () => {
      if (!navigator.gpu) {
        setWebgpuSupported(false);
        setLoadingText('您的浏览器不支持 WebGPU');
        return;
      }

      // 场景
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000008);
      sceneRef.current = scene;

      // 相机
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 3;
      cameraRef.current = camera;

      // WebGPU 渲染器
      setLoadingText('初始化 WebGPU 渲染器...');
      renderer = new THREE.WebGPURenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      await renderer.init();
      console.log('✅ WebGPU 渲染器初始化成功');

      // 灯光
      scene.add(new THREE.AmbientLight(0xffffff, 0.3));
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
      sunLight.position.set(5, 3, 5);
      scene.add(sunLight);

      // 旋转组
      const rotationGroup = new THREE.Group();
      rotationGroup.name = 'RotationGroup';
      rotationGroupRef.current = rotationGroup;
      scene.add(rotationGroup);

      // 星空背景
      rotationGroup.add(Earth.createSkybox());

      // 地球
      setLoadingText('加载地球模型...');
      rotationGroup.add(Earth.create());

      // 云层
      const clouds = Earth.createClouds();
      rotationGroup.add(clouds);

      // 云层动画
      gsap.to(clouds.rotation, { y: Math.PI * 2, duration: 300, repeat: -1, ease: 'none' });

      // 加载卫星
      setLoadingText('从 KeepTrack API 加载卫星数据...');
      try {
        await satelliteService.loadSatellites();
        setSatelliteCount(satelliteService.count);

        setLoadingText('创建卫星和轨道...');
        rotationGroup.add(satelliteService.createSatelliteMeshes());
        console.log(`✅ 加载 ${satelliteService.count} 颗卫星完成`);
      } catch (error) {
        console.error('加载卫星失败:', error);
      }

      setIsLoading(false);

      // 鼠标交互 - 丝滑版本
      let isDragging = false;
      let prevX = 0, prevY = 0;
      let targetRotY = 0, targetRotX = 0;
      let velX = 0, velY = 0;

      // 初始化目标旋转值
      if (rotationGroupRef.current) {
        targetRotY = rotationGroupRef.current.rotation.y;
        targetRotX = rotationGroupRef.current.rotation.x;
      }

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
        document.body.style.cursor = 'grabbing';
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;

        // 累加到目标旋转值
        targetRotY += dx * 0.004;
        targetRotX += dy * 0.004;
        targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotX));

        // 记录速度用于惯性
        velX = dx * 0.004;
        velY = dy * 0.004;

        prevX = e.clientX;
        prevY = e.clientY;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.body.style.cursor = 'grab';
      };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!cameraRef.current) return;
        const z = Math.max(1.5, Math.min(12, cameraRef.current.position.z + e.deltaY * 0.003));
        gsap.to(cameraRef.current.position, { z, duration: 0.3, ease: 'power2.out' });
      };

      const container = containerRef.current!;
      container.style.cursor = 'grab';
      container.addEventListener('mousedown', onMouseDown);
      container.addEventListener('mousemove', onMouseMove);
      container.addEventListener('mouseup', onMouseUp);
      container.addEventListener('mouseleave', onMouseUp);
      container.addEventListener('wheel', onWheel, { passive: false });

      const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // 动画循环 - 丝滑插值
      let lastUpdate = 0;
      const lerp = 0.08; // 插值系数，越小越丝滑

      const animate = () => {
        if (isDisposed) return;
        animationId = requestAnimationFrame(animate);

        if (rotationGroupRef.current) {
          // 惯性旋转（松开鼠标后继续滚动）
          if (!isDragging) {
            velX *= 0.98; // 更小的阻尼，惯性更长
            velY *= 0.98;
            if (Math.abs(velX) > 0.00005) targetRotY += velX;
            if (Math.abs(velY) > 0.00005) {
              targetRotX += velY;
              targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotX));
            }
          }

          // 平滑插值到目标旋转（这是丝滑的关键）
          rotationGroupRef.current.rotation.y += (targetRotY - rotationGroupRef.current.rotation.y) * lerp;
          rotationGroupRef.current.rotation.x += (targetRotX - rotationGroupRef.current.rotation.x) * lerp;
        }

        // 每帧插值卫星位置（丝滑移动）
        satelliteService.interpolatePositions();

        // 每秒计算新目标位置
        const now = Date.now();
        if (now - lastUpdate > 1000) {
          satelliteService.updateTargetPositions();
          lastUpdate = now;
        }

        renderer!.render(scene, camera);
      };
      animate();

      // 清理函数
      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mousemove', onMouseMove);
        container.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mouseleave', onMouseUp);
        container.removeEventListener('wheel', onWheel);
        if (renderer && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        // 不调用 dispose，避免 WebGPU bug
        satelliteService.dispose();
      };
    };

    const cleanup = init();
    return () => { cleanup.then(fn => fn?.()); };
  }, []);

  return (
    <div className={`scene-container ${className || ''}`}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div className="ui-overlay">
        <div className="title-section">
          <div className="title-glow">
            <h1>ORBITAL TRACKER</h1>
            <span className="subtitle">WebGPU Powered</span>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">SATELLITES</span>
              <span className="stat-value">{satelliteCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">DATA SOURCE</span>
              <span className="stat-value">KeepTrack API</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">PREDICTION</span>
              <span className="stat-value">24H</span>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">{loadingText}</div>
        </div>
      )}

      {!webgpuSupported && !isLoading && (
        <div className="loading-screen">
          <div className="loading-text error">
            您的浏览器不支持 WebGPU<br />
            请使用最新版 Chrome、Edge 或 Firefox
          </div>
        </div>
      )}
    </div>
  );
};

export default Scene;
