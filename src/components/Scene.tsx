import { useRef, useEffect, useState } from 'react';
import { Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, PointerEventTypes, Animation, CubicEase, EasingFunction } from '@babylonjs/core';
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import Earth from './Earth';
import { satelliteService, SatelliteData } from '../services/satellite-service';

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
  const cameraRef = useRef<ArcRotateCamera | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('初始化 WebGPU...');
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [webgpuSupported, setWebgpuSupported] = useState(true);
  const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);
  const [utcTime, setUtcTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SatelliteData[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // UTC 时间更新
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSat(null);
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
      if (e.key === '/' && !showSearch) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // 搜索逻辑
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = satelliteService.searchSatellites(query).slice(0, 8);
    setSearchResults(results);
  };

  const selectSatellite = (sat: SatelliteData) => {
    setSelectedSat(sat);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // 相机动画拉近到卫星
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (camera && scene) {
      const pos = satelliteService.calculatePosition(sat.satellite);
      if (pos) {
        // 先拉远视角
        camera.radius = 12;
        
        // 目标位置动画
        const targetAnim = new Animation('targetAnim', 'target', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
        targetAnim.setKeys([
          { frame: 0, value: camera.target.clone() },
          { frame: 90, value: new Vector3(pos.x, pos.y, pos.z) }
        ]);
        
        // 距离拉近动画 - 拉到更近的位置
        const radiusAnim = new Animation('radiusAnim', 'radius', 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        radiusAnim.setKeys([
          { frame: 0, value: 12 },
          { frame: 90, value: 1.3 }  // 更近的距离，能看到卫星点
        ]);
        
        // 缓动函数
        const easingFunction = new CubicEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        targetAnim.setEasingFunction(easingFunction);
        radiusAnim.setEasingFunction(easingFunction);
        
        camera.animations = [targetAnim, radiusAnim];
        scene.beginAnimation(camera, 0, 90, false);
      }
    }
  };

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
      camera.minZ = 0.01;  // 近裁切面，防止近距离黑屏
      camera.lowerRadiusLimit = 1.2;  // 允许更近的距离
      camera.upperRadiusLimit = 15;
      camera.panningSensibility = 0; // 禁用平移
      camera.inertia = 0.9; // 惯性
      cameraRef.current = camera;

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

      // 点击事件 - 检测卫星点击
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERPICK) {
          const pickResult = pointerInfo.pickInfo;
          if (pickResult?.hit && pickResult.pickedMesh?.name === 'satellites') {
            // 获取点击的点索引
            const faceId = pickResult.faceId;
            if (faceId >= 0) {
              const sat = satelliteService.getSatelliteByIndex(faceId);
              if (sat) {
                setSelectedSat(sat);
                // 拉近相机到卫星位置
                const pos = satelliteService.calculatePosition(sat.satellite);
                if (pos) {
                  camera.setTarget(new Vector3(pos.x, pos.y, pos.z));
                  camera.radius = 2.5;
                }
              }
            }
          } else {
            // 点击空白处关闭面板
            setSelectedSat(null);
            camera.setTarget(Vector3.Zero());
          }
        }
      });

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
              <span className="stat-label">TIME</span>
              <span className="stat-value time">{utcTime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">TRACKED</span>
              <span className="stat-value">{satelliteCount.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SOURCE</span>
              <span className="stat-value">KeepTrack</span>
            </div>
          </div>
        </div>
      </div>

      {/* 系统状态指示器 */}
      {!isLoading && (
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span className="status-text">System Active</span>
        </div>
      )}

      {/* 搜索框 */}
      {showSearch && (
        <div className="search-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索卫星名称或 NORAD ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            <span className="search-hint">ESC 关闭</span>
          </div>
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((sat) => (
                <div
                  key={sat.id}
                  className="search-result-item"
                  onClick={() => selectSatellite(sat)}
                >
                  <span className="result-name">{sat.name}</span>
                  <span className="result-id">#{sat.id}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 快捷键提示 */}
      {!isLoading && !showSearch && !selectedSat && (
        <div className="shortcut-hint">
          按 <kbd>/</kbd> 搜索卫星
        </div>
      )}

      {/* 卫星信息面板 */}
      {selectedSat && (() => {
        const details = satelliteService.getSatelliteDetails(selectedSat.satellite);
        return (
          <div className="satellite-panel">
            <div className="panel-header">
              <span>{selectedSat.name}</span>
              <button onClick={() => setSelectedSat(null)}>×</button>
            </div>
            <div className="panel-body">
              <div className="info-row">
                <span className="info-label">NORAD ID</span>
                <span className="info-value">{selectedSat.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">TYPE</span>
                <span className="info-value">{selectedSat.type === 1 ? 'Payload' : selectedSat.type === 2 ? 'Rocket Body' : 'Debris'}</span>
              </div>
              {details && (
                <>
                  <div className="info-row">
                    <span className="info-label">ALTITUDE</span>
                    <span className="info-value">{details.altitude.toLocaleString()} km</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">VELOCITY</span>
                    <span className="info-value">{details.velocity} km/s</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">PERIOD</span>
                    <span className="info-value">{details.period} min</span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

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
