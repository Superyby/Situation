import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Earth, { Skybox } from './Earth';
import { satelliteService, SatelliteData } from '../services/satellite-service';

interface SceneProps {
  className?: string;
}

/**
 * 卫星点云组件
 */
function Satellites() {
  const meshRef = useRef<THREE.Points>(null);
  const { scene } = useThree();

  useEffect(() => {
    // 创建卫星点云
    const createSatelliteMeshes = async () => {
      await satelliteService.createSatelliteMeshes(scene);
    };
    createSatelliteMeshes();

    return () => {
      satelliteService.dispose();
    };
  }, [scene]);

  // 每帧更新卫星位置
  useFrame(() => {
    satelliteService.interpolatePositions();
  });

  // 每秒计算新目标位置
  useEffect(() => {
    const timer = setInterval(() => {
      satelliteService.updateTargetPositions();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <points ref={meshRef} />;
}

/**
 * Three.js 场景组件 - R3F 版本
 */
const SceneComponent: React.FC<SceneProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('初始化 Three.js...');
  const [satelliteCount, setSatelliteCount] = useState(0);
  const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);
  const [utcTime, setUtcTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SatelliteData[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<any>(null);

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
    const controls = controlsRef.current;
    if (camera && controls) {
      const pos = satelliteService.calculatePosition(sat.satrec);
      if (pos) {
        // 使用 GSAP 或简单动画移动相机
        controls.target.set(pos.x, pos.y, pos.z);
        camera.position.set(pos.x + 2, pos.y + 1, pos.z + 2);
        controls.update();
      }
    }
  };

  // 加载卫星数据
  useEffect(() => {
    const loadSatellites = async () => {
      try {
        setLoadingText('从 KeepTrack API 加载卫星数据...');
        await satelliteService.loadSatellites();
        setSatelliteCount(satelliteService.count);
        setLoadingText('创建卫星点云...');
        console.log(`✅ 加载 ${satelliteService.count} 颗卫星完成`);
        setIsLoading(false);
      } catch (error) {
        console.error('加载卫星失败:', error);
        setIsLoading(false);
      }
    };
    loadSatellites();
  }, []);

  return (
    <div className={`scene-container ${className || ''}`}>
      <Canvas
        style={{ width: '100%', height: '100%', background: '#000008' }}
        gl={{ antialias: true, alpha: false }}
      >
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[3, 2, 3]}
          fov={50}
          near={0.01}
          far={1000}
        />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={1.2}
          maxDistance={15}
          dampingFactor={0.05}
          enableDamping
        />

        {/* 灯光 */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[-5, -2, -5]}
          intensity={1.8}
          color="#fffff2"
        />

        <Suspense fallback={null}>
          {/* 星空背景 */}
          <Skybox />
          {/* 地球 */}
          <Earth />
          {/* 卫星 */}
          {!isLoading && <Satellites />}
        </Suspense>
      </Canvas>

      <div className="ui-overlay">
        <div className="title-section">
          <div className="title-glow">
            <h1>ORBITAL TRACKER</h1>
            <span className="subtitle">Three.js Powered</span>
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
        const details = satelliteService.getSatelliteDetails(selectedSat.satrec);
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
    </div>
  );
};

export default SceneComponent;
