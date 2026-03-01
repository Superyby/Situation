import { useRef, useEffect, useState } from 'react';
import { Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4 } from '@babylonjs/core';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import Earth from './Earth';
import { satelliteService } from '../services/satellite-service';

interface SceneProps {
  className?: string;
}

/**
 * Babylon.js 场景组件 - WebGPU 版本
 */
const SceneComponent: React.FC<SceneProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WebGPUEngine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('初始化 WebGPU...');
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [webgpuSupported, setWebgpuSupported] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: WebGPUEngine | null = null;
    let isDisposed = false;

    const init = async () => {
      // 检查 WebGPU 支持
      if (!navigator.gpu) {
        setWebgpuSupported(false);
        setLoadingText('您的浏览器不支持 WebGPU');
        return;
      }

      // 创建 WebGPU 引擎
      setLoadingText('初始化 WebGPU 渲染器...');
      engine = new WebGPUEngine(canvasRef.current!, {
        antialias: true,
        adaptToDeviceRatio: true,
      });
      await engine.initAsync();
      engineRef.current = engine;
      console.log('✅ WebGPU 渲染器初始化成功');

      // 创建场景
      const scene = new Scene(engine);
      scene.clearColor = new Color4(0, 0, 0.03, 1);
      sceneRef.current = scene;

      // 相机 - ArcRotateCamera 自带鼠标交互
      const camera = new ArcRotateCamera(
        'camera',
        Math.PI / 2,  // alpha - 水平角度
        Math.PI / 3,  // beta - 垂直角度
        3,            // radius - 距离
        Vector3.Zero(),
        scene
      );
      camera.attachControl(canvasRef.current!, true);
      camera.wheelPrecision = 50;
      camera.lowerRadiusLimit = 2.2;  // 地球半径1，保持安全距离
      camera.upperRadiusLimit = 15;
      camera.panningSensibility = 0; // 禁用平移
      camera.inertia = 0.9; // 惯性

      // 灯光
      const hemisphericLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
      hemisphericLight.intensity = 0.3;
      hemisphericLight.groundColor = new Color3(0.1, 0.1, 0.2);

      const sunLight = new DirectionalLight('sunLight', new Vector3(-1, -0.5, -1), scene);
      sunLight.intensity = 1.8;
      sunLight.diffuse = new Color3(1, 1, 0.95);

      // 星空背景
      setLoadingText('加载星空背景...');
      Earth.createSkybox(scene);

      // 地球
      setLoadingText('加载地球模型...');
      Earth.create(scene);

      // 加载卫星
      setLoadingText('从 KeepTrack API 加载卫星数据...');
      try {
        await satelliteService.loadSatellites();
        setSatelliteCount(satelliteService.count);

        setLoadingText('创建卫星点云...');
        await satelliteService.createSatelliteMeshes(scene);
        console.log(`✅ 加载 ${satelliteService.count} 颗卫星完成`);
      } catch (error) {
        console.error('加载卫星失败:', error);
      }

      setIsLoading(false);

      // 渲染循环
      let lastUpdate = 0;
      engine.runRenderLoop(() => {
        if (isDisposed) return;

        // 每帧插值卫星位置
        satelliteService.interpolatePositions();

        // 每秒计算新目标位置
        const now = Date.now();
        if (now - lastUpdate > 1000) {
          satelliteService.updateTargetPositions();
          lastUpdate = now;
        }

        scene.render();
      });

      // 窗口大小变化处理
      const handleResize = () => {
        engine?.resize();
      };
      window.addEventListener('resize', handleResize);

      // 清理函数
      return () => {
        isDisposed = true;
        window.removeEventListener('resize', handleResize);
        satelliteService.dispose();
        scene.dispose();
        engine?.dispose();
      };
    };

    const cleanup = init();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);

  return (
    <div className={`scene-container ${className || ''}`}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

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

export default SceneComponent;
