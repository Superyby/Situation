# Orbital Tracker 开发指南

> React + Three.js (R3F) + GSAP 在轨卫星追踪可视化项目

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [环境配置](#4-环境配置)
5. [快速开始](#5-快速开始)
6. [开发规范](#6-开发规范)
7. [新功能开发流程](#7-新功能开发流程)
8. [后端接口对接](#8-后端接口对接)
9. [3D 渲染开发](#9-3d-渲染开发)
10. [构建与部署](#10-构建与部署)
11. [常见问题](#11-常见问题)

---

## 1. 项目概述

Orbital Tracker 是一个实时在轨卫星追踪可视化系统，支持：

- 🌍 3D 地球渲染与卫星轨道可视化
- 🛰️ 5000+ 颗卫星实时位置计算
- 🔍 卫星搜索与详情展示
- ⚡ 高性能 WebGL 渲染

---

## 2. 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | 5.9.3 | 类型系统 |
| Vite | 7.x | 构建工具 |

### 3D 渲染

| 技术 | 版本 | 用途 |
|------|------|------|
| Three.js | 0.171.0 | 3D 渲染引擎 |
| React Three Fiber | 8.17.10 | React 3D 绑定 |
| @react-three/drei | 9.117.3 | R3F 工具库 |
| GSAP | 3.14.2 | 动画库 |

### 业务库

| 技术 | 版本 | 用途 |
|------|------|------|
| satellite.js | 5.0.0 | 卫星轨道计算 |
| axios | 1.7.9 | HTTP 请求 |

---

## 3. 项目结构

```
orbital-tracker/
├── public/                     # 静态资源
│   ├── textures/              # 纹理贴图
│   │   ├── earth.jpg          # 地球贴图
│   │   ├── skybox8k.jpg       # 星空背景
│   │   └── ...
│   └── img/                   # 图片资源
│
├── src/
│   ├── api/                   # API 接口层
│   │   ├── keeptrack.ts       # KeepTrack API
│   │   └── space-track.ts     # Space-Track API
│   │
│   ├── components/            # React 组件
│   │   ├── Scene.tsx          # 主场景组件
│   │   ├── Earth.tsx          # 地球组件
│   │   └── ...
│   │
│   ├── config/                # 配置文件
│   │   ├── env.ts             # 环境变量封装
│   │   ├── index.ts           # 业务配置
│   │   └── credentials.ts     # 凭证配置
│   │
│   ├── constants/             # 常量定义
│   │   └── index.ts           # 全局常量
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   └── index.ts           # Hooks 导出
│   │
│   ├── services/              # 业务服务层
│   │   └── satellite-service.ts
│   │
│   ├── stores/                # 状态管理
│   │   └── index.ts           # Store 导出
│   │
│   ├── types/                 # TypeScript 类型
│   │   └── satellite.ts       # 卫星相关类型
│   │
│   ├── utils/                 # 工具函数
│   │   ├── http.ts            # HTTP 请求封装
│   │   └── animation.ts       # 动画工具
│   │
│   ├── App.tsx                # 应用入口
│   ├── main.tsx               # 渲染入口
│   ├── index.css              # 全局样式
│   └── vite-env.d.ts          # 类型声明
│
├── .env.development           # 开发环境配置
├── .env.test                  # 测试环境配置
├── .env.production            # 生产环境配置
├── vite.config.ts             # Vite 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目配置
```

---

## 4. 环境配置

### 4.1 环境变量

项目支持三种环境：`development`、`test`、`production`

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_APP_ENV` | 环境标识 | development |
| `VITE_API_BASE_URL` | API 基础地址 | /api |
| `VITE_BACKEND_URL` | 后端服务地址 | http://localhost:4000 |
| `VITE_KEEPTRACK_API` | KeepTrack API | https://api.keeptrack.space/v2 |
| `VITE_DEBUG` | 调试模式 | true |
| `VITE_SATELLITE_LIMIT` | 卫星加载数量 | 1000 |

### 4.2 使用环境变量

```typescript
// 方式一：直接使用
const apiUrl = import.meta.env.VITE_API_BASE_URL;

// 方式二：使用封装（推荐）
import { envConfig, isDev, isProd } from '@/config/env';

console.log(envConfig.apiBaseUrl);
console.log(isDev);  // true/false
```

### 4.3 添加新环境变量

1. 在 `.env.*` 文件中添加变量（必须以 `VITE_` 开头）
2. 在 `src/vite-env.d.ts` 中添加类型定义
3. 在 `src/config/env.ts` 中添加封装

---

## 5. 快速开始

### 5.1 安装依赖

```bash
pnpm install
```

### 5.2 启动开发服务器

```bash
# 开发环境
pnpm dev

# 测试环境配置
pnpm dev:test
```

### 5.3 构建生产版本

```bash
# 生产环境
pnpm build

# 测试环境
pnpm build:test
```

### 5.4 预览构建结果

```bash
pnpm preview
```

---

## 6. 开发规范

### 6.1 目录职责

| 目录 | 职责 | 示例 |
|------|------|------|
| `api/` | 外部 API 调用 | keeptrack.ts, space-track.ts |
| `components/` | UI 组件 | Scene.tsx, Earth.tsx |
| `hooks/` | 自定义 Hooks | useSatellites.ts |
| `services/` | 业务逻辑 | satellite-service.ts |
| `stores/` | 全局状态 | appStore.ts |
| `utils/` | 通用工具 | http.ts, animation.ts |
| `constants/` | 常量定义 | SAT_TYPE, COLORS |
| `types/` | 类型定义 | SatelliteData |

### 6.2 导入路径别名

```typescript
// ✅ 推荐：使用别名
import { http } from '@/utils/http';
import { SatelliteData } from '@/types/satellite';
import { envConfig } from '@/config/env';
import { COLORS } from '@/constants';

// ❌ 避免：相对路径过深
import { http } from '../../../utils/http';
```

### 6.3 命名规范

```typescript
// 组件：PascalCase
SatellitePanel.tsx
OrbitRenderer.tsx

// Hooks：camelCase，use 前缀
useSatellites.ts
useOrbitCamera.ts

// 服务/工具：camelCase
satelliteService.ts
orbitCalculator.ts

// 常量：UPPER_SNAKE_CASE
const EARTH_RADIUS_KM = 6371;
const SAT_TYPE = { ... };

// 类型/接口：PascalCase
interface SatelliteData { ... }
type SatType = number;
```

---

## 7. 新功能开发流程

### 7.1 添加新组件

**示例：添加卫星轨道线组件**

#### Step 1: 创建组件文件

```typescript
// src/components/OrbitLine.tsx
import { useRef } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitLineProps {
  points: THREE.Vector3[];
  color?: string;
}

export function OrbitLine({ points, color = '#4de8b2' }: OrbitLineProps) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.6}
    />
  );
}

export default OrbitLine;
```

#### Step 2: 在场景中使用

```typescript
// src/components/Scene.tsx
import OrbitLine from './OrbitLine';

// 在 Canvas 内使用
<OrbitLine points={orbitPoints} />
```

### 7.2 添加新的 API 接口

**示例：添加后端卫星收藏接口**

#### Step 1: 定义类型

```typescript
// src/types/favorite.ts
export interface FavoriteSatellite {
  id: number;
  noradId: number;
  name: string;
  addedAt: string;
}
```

#### Step 2: 创建 API 模块

```typescript
// src/api/favorite.ts
import { http, ApiResponse } from '@/utils/http';
import { FavoriteSatellite } from '@/types/favorite';

export const favoriteApi = {
  /** 获取收藏列表 */
  getList(): Promise<ApiResponse<FavoriteSatellite[]>> {
    return http.get('/favorites');
  },

  /** 添加收藏 */
  add(noradId: number): Promise<ApiResponse<FavoriteSatellite>> {
    return http.post('/favorites', { noradId });
  },

  /** 移除收藏 */
  remove(id: number): Promise<ApiResponse<void>> {
    return http.delete(`/favorites/${id}`);
  },
};
```

#### Step 3: 创建 Hook（可选）

```typescript
// src/hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { favoriteApi } from '@/api/favorite';
import { FavoriteSatellite } from '@/types/favorite';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteSatellite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await favoriteApi.getList();
      if (res.success) {
        setFavorites(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (noradId: number) => {
    const res = await favoriteApi.add(noradId);
    if (res.success) {
      setFavorites([...favorites, res.data]);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  return { favorites, loading, addFavorite };
}
```

#### Step 4: 在 hooks/index.ts 导出

```typescript
// src/hooks/index.ts
export { useFavorites } from './useFavorites';
```

### 7.3 添加状态管理

**示例：使用 Zustand 管理全局状态**

#### Step 1: 安装 Zustand

```bash
pnpm add zustand
```

#### Step 2: 创建 Store

```typescript
// src/stores/appStore.ts
import { create } from 'zustand';
import { SatelliteData } from '@/api/keeptrack';

interface AppState {
  // 状态
  selectedSatellite: SatelliteData | null;
  isLoading: boolean;
  
  // 操作
  setSelectedSatellite: (sat: SatelliteData | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSatellite: null,
  isLoading: false,
  
  setSelectedSatellite: (sat) => set({ selectedSatellite: sat }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
```

#### Step 3: 在组件中使用

```typescript
import { useAppStore } from '@/stores/appStore';

function SatelliteInfo() {
  const { selectedSatellite, setSelectedSatellite } = useAppStore();
  
  return selectedSatellite ? (
    <div>
      <h2>{selectedSatellite.name}</h2>
      <button onClick={() => setSelectedSatellite(null)}>关闭</button>
    </div>
  ) : null;
}
```

---

## 8. 后端接口对接

### 8.1 HTTP 请求规范

使用统一封装的 `http` 工具：

```typescript
import { http, ApiResponse } from '@/utils/http';

// GET 请求
const users = await http.get<User[]>('/users', {
  params: { page: 1, limit: 10 }
});

// POST 请求
const result = await http.post<LoginResult>('/auth/login', {
  username: 'admin',
  password: '123456'
});

// 带自定义配置
const data = await http.get('/data', {
  timeout: 60000,
  skipErrorHandler: true,
  baseURL: 'https://other-api.com'
});
```

### 8.2 API 响应结构

与后端约定的统一响应格式：

```typescript
interface ApiResponse<T> {
  code: number;      // 业务状态码：0 成功，其他失败
  data: T;           // 响应数据
  message: string;   // 提示信息
  success: boolean;  // 是否成功
}
```

### 8.3 后端技术栈建议

| 语言 | 框架 | 特点 |
|------|------|------|
| **Rust** | Actix-web / Axum | 极致性能，适合高并发计算 |
| **Elixir** | Phoenix | 实时通信，适合 WebSocket |
| **Java** | Spring Boot | 生态成熟，企业级方案 |
| **TypeScript** | NestJS / Fastify | 全栈统一，开发效率高 |

### 8.4 WebSocket 实时通信（预留）

```typescript
// src/utils/websocket.ts
export class SatelliteSocket {
  private ws: WebSocket | null = null;
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // 处理实时卫星位置更新
    };
  }
  
  disconnect() {
    this.ws?.close();
  }
}
```

---

## 9. 3D 渲染开发

### 9.1 R3F 组件结构

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

function Scene() {
  return (
    <Canvas>
      {/* 相机 */}
      <PerspectiveCamera makeDefault position={[3, 2, 3]} />
      <OrbitControls />
      
      {/* 灯光 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} />
      
      {/* 3D 对象 */}
      <Earth />
      <Satellites />
    </Canvas>
  );
}
```

### 9.2 添加新的 3D 对象

```tsx
// src/components/SatelliteMarker.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MarkerProps {
  position: [number, number, number];
  color?: string;
}

export function SatelliteMarker({ position, color = '#4de8b2' }: MarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // 每帧动画
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });
  
  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

### 9.3 性能优化技巧

```typescript
// 1. 使用 BufferGeometry 批量渲染
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 2. 使用 InstancedMesh 渲染大量相同物体
<instancedMesh args={[geometry, material, count]} />

// 3. 使用 useMemo 缓存计算
const points = useMemo(() => calculateOrbitPoints(tle), [tle]);

// 4. 降低更新频率
useFrame((state, delta) => {
  frameCount.current++;
  if (frameCount.current % 5 !== 0) return; // 每5帧更新一次
  // ...
});
```

---

## 10. 构建与部署

### 10.1 构建命令

```bash
# 生产环境构建
pnpm build

# 测试环境构建
pnpm build:test

# 类型检查
pnpm type-check

# 清理缓存
pnpm clean
```

### 10.2 构建输出

```
dist/
├── assets/           # 静态资源（图片、字体等）
├── js/               # JavaScript 代码
│   ├── index-[hash].js
│   ├── three-[hash].js
│   ├── react-vendor-[hash].js
│   └── ...
└── index.html        # 入口 HTML
```

### 10.3 部署配置

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/orbital-tracker/dist;
    
    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://backend:4000/;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain application/javascript application/json;
}
```

---

## 11. 常见问题

### Q1: 如何添加新的依赖？

```bash
# 运行时依赖
pnpm add package-name

# 开发依赖
pnpm add -D package-name

# 添加类型声明
pnpm add -D @types/package-name
```

### Q2: 如何调试 3D 场景？

1. 使用 `@react-three/drei` 的 `Stats` 组件监控性能
2. 使用 Chrome DevTools 的 Performance 面板
3. 启用 Three.js 的 WebGL Inspector 扩展

```tsx
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* ... */}
</Canvas>
```

### Q3: 卫星位置计算不准确？

检查以下几点：
1. TLE 数据是否过期（TLE 有效期约 1-2 周）
2. 时间是否正确传入 `propagate()` 函数
3. 坐标系转换是否正确（ECI → 场景坐标）

### Q4: 如何优化首屏加载？

1. 减少卫星加载数量（`VITE_SATELLITE_LIMIT`）
2. 使用 `Suspense` 延迟加载 3D 组件
3. 压缩纹理图片
4. 启用 Gzip/Brotli 压缩

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 2.0.0 | 2026-03 | 迁移至 Three.js + R3F，重构项目结构 |

---

> 📝 **贡献指南**: 如有问题或建议，请创建 Issue 或 PR。
