import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import Earth from './Earth';
import { satelliteService } from '../services/satellite-service';
import { SPACE_TRACK_CREDENTIALS } from '../config/credentials';

interface SceneProps {
  className?: string;
}

/**
 * Three.js 场景组件
 * 整合地球渲染和卫星可视化
 */
const Scene: React.FC<SceneProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const earthRef = useRef<THREE.Mesh | null>(null);
  const satelliteGroupRef = useRef<THREE.Group | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [satelliteCount, setSatelliteCount] = useState(0);
  
  // 缩放控制
  const [zoom, setZoom] = useState(3);
  const zoomSpeed = 0.3;
  const minZoom = 1.5;
  const maxZoom = 20;

  useEffect(() => {
    if (!containerRef.current) return;

    // ========== 场景初始化 ==========
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = zoom;
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ========== 灯光 ==========
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // ========== 地球 ==========
    const earth = Earth.create('high');
    earthRef.current = earth;
    scene.add(earth);

    // 地球自转动画
    gsap.to(earth.rotation, {
      y: Math.PI * 2,
      duration: 60,
      repeat: -1,
      ease: 'none',
    });

    // 相机入场动画
    gsap.from(camera.position, {
      z: 10,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => setZoom(camera.position.z),
      onComplete: () => setIsLoading(false),
    });

    // ========== 星空背景 ==========
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ========== 加载卫星数据 ==========
    const loadSatellites = async () => {
      try {
        console.log('🚀 开始加载卫星数据...');
        
        // 认证
        const authSuccess = await satelliteService.initialize(
          SPACE_TRACK_CREDENTIALS.username,
          SPACE_TRACK_CREDENTIALS.password
        );

        if (!authSuccess) {
          console.error('❌ Space-Track 认证失败！请检查代理服务器是否运行');
          return;
        }

        // 加载卫星数据 - 加载500颗（快速加载）
        const satellites = await satelliteService.loadSatellites(500);
        
        if (satellites.length === 0) {
          console.error('❌ 未获取到卫星数据');
          return;
        }
        
        setSatelliteCount(satellites.length);

        // 创建3D对象
        const satelliteGroup = satelliteService.createSatelliteMeshes();
        satelliteGroupRef.current = satelliteGroup;
        scene.add(satelliteGroup);
        
        console.log(`🛰️ 成功加载 ${satellites.length} 颗卫星到场景`);
        
      } catch (error) {
        console.error('❌ 加载卫星失败:', error);
      }
    };

    // 立即加载卫星
    loadSatellites();

    // ========== 动画循环 ==========
    let lastTime = 0;
    const animate = (time: number) => {
      requestAnimationFrame(animate);
      
      const deltaTime = time - lastTime;
      lastTime = time;
      
      // 更新卫星位置
      if (satelliteGroupRef.current) {
        satelliteService.updatePositions(deltaTime);
      }
      
      // 渲染
      renderer.render(scene, camera);
    };
    animate(0);

    // ========== 事件处理 ==========
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (event: MouseEvent) => {
      if (!cameraRef.current) return;
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      gsap.to(cameraRef.current.position, {
        x: mouseX * 0.5,
        y: mouseY * 0.5,
        duration: 0.5,
        ease: 'power2.out',
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom(prev => {
        const newZoom = prev + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed);
        return Math.max(minZoom, Math.min(maxZoom, newZoom));
      });
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    // ========== 清理 ==========
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleWheel);

      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      renderer.dispose();
      gsap.killTweensOf(earth.rotation);
      gsap.killTweensOf(camera.position);
      
      satelliteService.dispose();
    };
  }, []);

  // 监听zoom变化更新相机
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.z = zoom;
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, [zoom]);

  return (
    <div className={`scene-container ${className || ''}`}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* UI覆盖层 */}
      <div className="ui-overlay">
        <h1>Satellite Tracker</h1>
        <p>卫星数量: {satelliteCount}</p>
      </div>

      {isLoading && (
        <div className="loading">
          加载中...
        </div>
      )}
    </div>
  );
};

export default Scene;
