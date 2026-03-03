# Orbital Tracker 后端开发规范

> Go + Fiber 后端服务开发指南

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [环境配置](#4-环境配置)
5. [API 规范](#5-api-规范)
6. [数据格式规范](#6-数据格式规范)
7. [错误处理规范](#7-错误处理规范)
8. [认证授权](#8-认证授权)
9. [数据库设计](#9-数据库设计)
10. [WebSocket 规范](#10-websocket-规范)
11. [日志规范](#11-日志规范)
12. [部署配置](#12-部署配置)
13. [开发流程](#13-开发流程)

---

## 1. 项目概述

### 1.1 项目简介

Orbital Tracker 后端服务，为前端卫星轨道追踪可视化系统提供：

- 🔐 用户认证与授权
- 🛰️ 卫星数据管理与缓存
- 📡 第三方 API 代理（Space-Track、KeepTrack）
- 💾 用户数据持久化（收藏、设置等）
- 🔄 WebSocket 实时数据推送

### 1.2 前端技术栈

| 技术 | 说明 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型系统 |
| Three.js + R3F | 3D 渲染 |
| satellite.js | 轨道计算（前端完成） |

### 1.3 前后端职责划分

| 功能 | 前端 | 后端 |
|------|:----:|:----:|
| 3D 渲染 | ✅ | - |
| 轨道计算 | ✅ | - |
| TLE 数据获取 | - | ✅ |
| 用户认证 | - | ✅ |
| 数据存储 | - | ✅ |
| API 代理 | - | ✅ |

---

## 2. 技术栈

### 2.1 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Go | 1.22+ | 编程语言 |
| Fiber | v2.52+ | Web 框架 |
| GORM | v2 | ORM |
| PostgreSQL | 16+ | 主数据库 |
| Redis | 7+ | 缓存 |
| JWT | - | 认证 |

### 2.2 推荐依赖

```go
// go.mod
module orbital-tracker-api

go 1.22

require (
    github.com/gofiber/fiber/v2 v2.52.0
    github.com/gofiber/websocket/v2 v2.2.1
    github.com/gofiber/jwt/v3 v3.3.10
    github.com/gofiber/swagger v1.0.0
    gorm.io/gorm v1.25.0
    gorm.io/driver/postgres v1.5.0
    github.com/redis/go-redis/v9 v9.5.0
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/go-playground/validator/v10 v10.18.0
    github.com/spf13/viper v1.18.0
    go.uber.org/zap v1.27.0
)
```

---

## 3. 项目结构

```
orbital-tracker-api/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
│
├── internal/
│   ├── config/                  # 配置管理
│   │   ├── config.go            # 配置结构体
│   │   └── loader.go            # 配置加载器
│   │
│   ├── handler/                 # HTTP 处理器（Controller）
│   │   ├── auth_handler.go      # 认证相关
│   │   ├── user_handler.go      # 用户相关
│   │   ├── satellite_handler.go # 卫星相关
│   │   └── proxy_handler.go     # API 代理
│   │
│   ├── middleware/              # 中间件
│   │   ├── auth.go              # JWT 认证
│   │   ├── cors.go              # CORS 配置
│   │   ├── logger.go            # 请求日志
│   │   ├── ratelimit.go         # 限流
│   │   └── recovery.go          # 异常恢复
│   │
│   ├── model/                   # 数据模型
│   │   ├── user.go              # 用户模型
│   │   ├── satellite.go         # 卫星模型
│   │   └── favorite.go          # 收藏模型
│   │
│   ├── repository/              # 数据访问层
│   │   ├── user_repo.go
│   │   ├── satellite_repo.go
│   │   └── favorite_repo.go
│   │
│   ├── service/                 # 业务逻辑层
│   │   ├── auth_service.go
│   │   ├── user_service.go
│   │   ├── satellite_service.go
│   │   └── proxy_service.go
│   │
│   ├── dto/                     # 数据传输对象
│   │   ├── request/             # 请求 DTO
│   │   │   ├── auth.go
│   │   │   └── satellite.go
│   │   └── response/            # 响应 DTO
│   │       ├── common.go        # 通用响应结构
│   │       └── satellite.go
│   │
│   ├── router/                  # 路由配置
│   │   └── router.go
│   │
│   ├── websocket/               # WebSocket 处理
│   │   ├── hub.go               # 连接管理
│   │   └── handler.go           # 消息处理
│   │
│   └── pkg/                     # 内部工具包
│       ├── errors/              # 错误定义
│       ├── logger/              # 日志工具
│       ├── validator/           # 验证工具
│       └── utils/               # 通用工具
│
├── migrations/                  # 数据库迁移
│   ├── 000001_create_users.up.sql
│   └── 000001_create_users.down.sql
│
├── configs/                     # 配置文件
│   ├── config.yaml              # 默认配置
│   ├── config.dev.yaml          # 开发环境
│   ├── config.test.yaml         # 测试环境
│   └── config.prod.yaml         # 生产环境
│
├── docs/                        # API 文档（Swagger）
│   └── swagger.json
│
├── scripts/                     # 脚本
│   ├── build.sh
│   └── migrate.sh
│
├── Dockerfile
├── docker-compose.yaml
├── Makefile
├── go.mod
├── go.sum
└── README.md
```

---

## 4. 环境配置

### 4.1 配置文件结构

```yaml
# configs/config.yaml

# 应用配置
app:
  name: "Orbital Tracker API"
  env: "development"          # development | test | production
  port: 4000
  debug: true

# 数据库配置
database:
  host: "localhost"
  port: 5432
  user: "postgres"
  password: "your_password"
  dbname: "orbital_tracker"
  sslmode: "disable"
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 3600     # 秒

# Redis 配置
redis:
  host: "localhost"
  port: 6379
  password: ""
  db: 0
  pool_size: 100

# JWT 配置
jwt:
  secret: "your-secret-key-min-32-chars-long"
  expire_hours: 24
  refresh_expire_hours: 168   # 7 天

# 日志配置
log:
  level: "debug"              # debug | info | warn | error
  format: "json"              # json | text
  output: "stdout"            # stdout | file
  file_path: "./logs/app.log"

# 限流配置
ratelimit:
  requests_per_second: 100
  burst: 200

# 第三方 API
external:
  keeptrack:
    base_url: "https://api.keeptrack.space/v2"
    timeout: 30               # 秒
  spacetrack:
    base_url: "https://www.space-track.org"
    username: ""              # Space-Track 账号
    password: ""              # Space-Track 密码
    timeout: 120              # 秒

# CORS 配置
cors:
  allowed_origins:
    - "http://localhost:5544"
    - "https://your-domain.com"
  allowed_methods:
    - "GET"
    - "POST"
    - "PUT"
    - "DELETE"
    - "OPTIONS"
  allowed_headers:
    - "Origin"
    - "Content-Type"
    - "Authorization"
  expose_headers:
    - "Content-Length"
  allow_credentials: true
  max_age: 86400              # 秒
```

### 4.2 环境变量

```bash
# .env（敏感信息通过环境变量覆盖配置文件）

# 应用
APP_ENV=production
APP_PORT=4000

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=orbital_tracker

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-production-secret-key-min-32-chars

# Space-Track
SPACETRACK_USERNAME=your_username
SPACETRACK_PASSWORD=your_password
```

### 4.3 配置加载优先级

```
环境变量 > 环境配置文件 > 默认配置文件
```

---

## 5. API 规范

### 5.1 基础路径

| 环境 | 基础路径 |
|------|----------|
| 开发 | `http://localhost:4000/api` |
| 测试 | `https://test-api.your-domain.com/api` |
| 生产 | `https://api.your-domain.com/api` |

### 5.2 API 版本

```
/api/v1/...
```

### 5.3 RESTful 规范

| 操作 | HTTP 方法 | 路径示例 |
|------|-----------|----------|
| 获取列表 | GET | `/api/v1/satellites` |
| 获取详情 | GET | `/api/v1/satellites/:id` |
| 创建 | POST | `/api/v1/satellites` |
| 更新 | PUT | `/api/v1/satellites/:id` |
| 部分更新 | PATCH | `/api/v1/satellites/:id` |
| 删除 | DELETE | `/api/v1/satellites/:id` |

### 5.4 接口列表

#### 5.4.1 认证接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| POST | `/api/v1/auth/register` | 用户注册 | ❌ |
| POST | `/api/v1/auth/login` | 用户登录 | ❌ |
| POST | `/api/v1/auth/logout` | 用户登出 | ✅ |
| POST | `/api/v1/auth/refresh` | 刷新 Token | ✅ |
| GET | `/api/v1/auth/me` | 获取当前用户 | ✅ |

#### 5.4.2 用户接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | `/api/v1/user/profile` | 获取用户信息 | ✅ |
| PUT | `/api/v1/user/profile` | 更新用户信息 | ✅ |
| PUT | `/api/v1/user/password` | 修改密码 | ✅ |
| GET | `/api/v1/user/settings` | 获取用户设置 | ✅ |
| PUT | `/api/v1/user/settings` | 更新用户设置 | ✅ |

#### 5.4.3 卫星接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | `/api/v1/satellites` | 获取卫星列表 | ❌ |
| GET | `/api/v1/satellites/:id` | 获取卫星详情 | ❌ |
| GET | `/api/v1/satellites/:id/tle` | 获取卫星 TLE | ❌ |
| GET | `/api/v1/satellites/search` | 搜索卫星 | ❌ |
| GET | `/api/v1/satellites/categories` | 获取卫星分类 | ❌ |

#### 5.4.4 收藏接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | `/api/v1/favorites` | 获取收藏列表 | ✅ |
| POST | `/api/v1/favorites` | 添加收藏 | ✅ |
| DELETE | `/api/v1/favorites/:id` | 删除收藏 | ✅ |

#### 5.4.5 代理接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:----:|
| GET | `/api/v1/proxy/keeptrack/sats` | 代理 KeepTrack | ❌ |
| POST | `/api/v1/proxy/spacetrack/login` | Space-Track 登录 | ✅ |
| GET | `/api/v1/proxy/spacetrack/tle` | Space-Track TLE | ✅ |

#### 5.4.6 WebSocket

| 路径 | 说明 |
|------|------|
| `/ws` | WebSocket 连接端点 |

---

## 6. 数据格式规范

### 6.1 统一响应结构

**所有 API 必须返回统一格式：**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "success": true
}
```

#### 响应字段说明

| 字段 | 类型 | 必须 | 说明 |
|------|------|:----:|------|
| code | number | ✅ | 业务状态码，0 表示成功 |
| message | string | ✅ | 提示信息 |
| data | any | ❌ | 响应数据 |
| success | boolean | ✅ | 是否成功 |

#### Go 结构体定义

```go
// internal/dto/response/common.go

// Response 统一响应结构
type Response struct {
    Code    int         `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
    Success bool        `json:"success"`
}

// 成功响应
func Success(data interface{}) *Response {
    return &Response{
        Code:    0,
        Message: "success",
        Data:    data,
        Success: true,
    }
}

// 失败响应
func Fail(code int, message string) *Response {
    return &Response{
        Code:    code,
        Message: message,
        Data:    nil,
        Success: false,
    }
}
```

### 6.2 分页响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  },
  "success": true
}
```

#### Go 结构体定义

```go
// Pagination 分页信息
type Pagination struct {
    Page       int   `json:"page"`
    PageSize   int   `json:"page_size"`
    Total      int64 `json:"total"`
    TotalPages int   `json:"total_pages"`
}

// PagedResponse 分页响应
type PagedResponse struct {
    Items      interface{} `json:"items"`
    Pagination Pagination  `json:"pagination"`
}
```

### 6.3 请求参数规范

#### 6.3.1 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|:------:|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大 100） |

#### 6.3.2 排序参数

| 参数 | 类型 | 示例 | 说明 |
|------|------|------|------|
| sort_by | string | `created_at` | 排序字段 |
| sort_order | string | `desc` | 排序方向：asc/desc |

#### 6.3.3 示例请求

```
GET /api/v1/satellites?page=1&page_size=20&sort_by=name&sort_order=asc
```

### 6.4 时间格式

**统一使用 ISO 8601 格式（UTC 时区）：**

```json
{
  "created_at": "2026-03-02T08:30:00Z",
  "updated_at": "2026-03-02T10:15:30Z"
}
```

---

## 7. 错误处理规范

### 7.1 业务状态码

| 范围 | 说明 |
|------|------|
| 0 | 成功 |
| 1000-1999 | 通用错误 |
| 2000-2999 | 认证/授权错误 |
| 3000-3999 | 用户相关错误 |
| 4000-4999 | 卫星数据错误 |
| 5000-5999 | 第三方服务错误 |

### 7.2 错误码定义

```go
// internal/pkg/errors/codes.go

const (
    // 成功
    CodeSuccess = 0

    // 通用错误 1000-1999
    CodeUnknown         = 1000  // 未知错误
    CodeInvalidParams   = 1001  // 参数错误
    CodeNotFound        = 1002  // 资源不存在
    CodeAlreadyExists   = 1003  // 资源已存在
    CodeTooManyRequests = 1004  // 请求过于频繁

    // 认证授权 2000-2999
    CodeUnauthorized    = 2000  // 未登录
    CodeTokenExpired    = 2001  // Token 过期
    CodeTokenInvalid    = 2002  // Token 无效
    CodeForbidden       = 2003  // 无权限
    CodeLoginFailed     = 2004  // 登录失败

    // 用户相关 3000-3999
    CodeUserNotFound    = 3000  // 用户不存在
    CodeUserExists      = 3001  // 用户已存在
    CodePasswordWrong   = 3002  // 密码错误
    CodeEmailExists     = 3003  // 邮箱已存在

    // 卫星相关 4000-4999
    CodeSatelliteNotFound = 4000  // 卫星不存在
    CodeTLEExpired        = 4001  // TLE 数据过期
    CodeTLEInvalid        = 4002  // TLE 数据无效

    // 第三方服务 5000-5999
    CodeExternalError      = 5000  // 外部服务错误
    CodeKeepTrackError     = 5001  // KeepTrack API 错误
    CodeSpaceTrackError    = 5002  // Space-Track API 错误
    CodeSpaceTrackAuthFail = 5003  // Space-Track 认证失败
)
```

### 7.3 错误响应示例

```json
{
  "code": 2001,
  "message": "Token 已过期，请重新登录",
  "data": null,
  "success": false
}
```

### 7.4 HTTP 状态码映射

| 业务场景 | HTTP 状态码 |
|----------|:-----------:|
| 成功 | 200 |
| 创建成功 | 201 |
| 参数错误 | 400 |
| 未认证 | 401 |
| 无权限 | 403 |
| 资源不存在 | 404 |
| 请求过多 | 429 |
| 服务器错误 | 500 |

---

## 8. 认证授权

### 8.1 认证方式

使用 **JWT Bearer Token** 认证：

```
Authorization: Bearer <token>
```

### 8.2 Token 结构

```go
// JWT Claims
type Claims struct {
    UserID   uint   `json:"user_id"`
    Username string `json:"username"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}
```

### 8.3 登录响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "success": true
}
```

### 8.4 Token 刷新

当 access_token 过期时，使用 refresh_token 获取新 Token：

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 9. 数据库设计

### 9.1 用户表

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 9.2 收藏表

```sql
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    norad_id INTEGER NOT NULL,
    satellite_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, norad_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
```

### 9.3 用户设置表

```sql
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    satellite_limit INTEGER DEFAULT 5000,
    show_debris BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'zh-CN',
    settings_json JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9.4 TLE 缓存表（可选）

```sql
CREATE TABLE tle_cache (
    norad_id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    tle_line1 VARCHAR(70),
    tle_line2 VARCHAR(70),
    epoch TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tle_cache_epoch ON tle_cache(epoch);
```

---

## 10. WebSocket 规范

### 10.1 连接

```
ws://localhost:4000/ws?token=<jwt_token>
```

### 10.2 消息格式

```json
{
  "type": "message_type",
  "payload": { ... },
  "timestamp": "2026-03-02T08:30:00Z"
}
```

### 10.3 消息类型

| 类型 | 方向 | 说明 |
|------|:----:|------|
| `ping` | 客户端→服务端 | 心跳检测 |
| `pong` | 服务端→客户端 | 心跳响应 |
| `subscribe` | 客户端→服务端 | 订阅卫星 |
| `unsubscribe` | 客户端→服务端 | 取消订阅 |
| `satellite_update` | 服务端→客户端 | 卫星位置更新 |
| `notification` | 服务端→客户端 | 系统通知 |
| `error` | 服务端→客户端 | 错误消息 |

### 10.4 示例消息

#### 订阅卫星

```json
{
  "type": "subscribe",
  "payload": {
    "norad_ids": [25544, 48274]
  }
}
```

#### 位置更新推送

```json
{
  "type": "satellite_update",
  "payload": {
    "satellites": [
      {
        "norad_id": 25544,
        "name": "ISS",
        "position": { "x": 1.23, "y": 2.34, "z": 3.45 },
        "velocity": { "x": 0.1, "y": 0.2, "z": 0.3 }
      }
    ]
  },
  "timestamp": "2026-03-02T08:30:00Z"
}
```

---

## 11. 日志规范

### 11.1 日志级别

| 级别 | 使用场景 |
|------|----------|
| DEBUG | 开发调试信息 |
| INFO | 关键业务流程 |
| WARN | 警告信息 |
| ERROR | 错误信息 |

### 11.2 日志格式

```json
{
  "level": "info",
  "time": "2026-03-02T08:30:00Z",
  "caller": "handler/auth_handler.go:45",
  "msg": "user login success",
  "user_id": 1,
  "ip": "192.168.1.1",
  "request_id": "abc123"
}
```

### 11.3 请求日志

每个请求记录：

- 请求 ID
- 请求方法和路径
- 响应状态码
- 响应时间
- 客户端 IP
- User-Agent

---

## 12. 部署配置

### 12.1 Docker 配置

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/server .
COPY configs/ ./configs/

EXPOSE 4000
CMD ["./server"]
```

### 12.2 Docker Compose

```yaml
# docker-compose.yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - APP_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: orbital_tracker
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 12.3 Makefile

```makefile
.PHONY: dev build test docker

# 开发模式
dev:
	go run cmd/server/main.go

# 构建
build:
	CGO_ENABLED=0 go build -o bin/server ./cmd/server

# 测试
test:
	go test -v ./...

# Docker 构建
docker:
	docker build -t orbital-tracker-api .

# 数据库迁移
migrate-up:
	migrate -path migrations -database "postgres://..." up

migrate-down:
	migrate -path migrations -database "postgres://..." down

# 生成 Swagger 文档
swagger:
	swag init -g cmd/server/main.go -o docs
```

---

## 13. 开发流程

### 13.1 新增功能步骤

1. **定义数据模型** → `internal/model/`
2. **创建数据库迁移** → `migrations/`
3. **实现数据访问层** → `internal/repository/`
4. **实现业务逻辑层** → `internal/service/`
5. **定义 DTO** → `internal/dto/`
6. **实现 Handler** → `internal/handler/`
7. **注册路由** → `internal/router/`
8. **编写测试**
9. **更新 Swagger 文档**

### 13.2 代码规范

- 使用 `gofmt` 格式化代码
- 使用 `golangci-lint` 进行代码检查
- 遵循 Go 官方代码规范
- 关键函数必须有注释

### 13.3 Git 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

示例：
```
feat(satellite): 添加卫星搜索接口

- 支持按名称搜索
- 支持按 NORAD ID 搜索
- 添加分页支持
```

---

## 附录 A：前后端对接检查清单

| 项目 | 状态 |
|------|:----:|
| API 基础路径一致 | ☐ |
| 响应格式一致 | ☐ |
| 错误码定义一致 | ☐ |
| 时间格式一致（ISO 8601） | ☐ |
| 分页参数一致 | ☐ |
| 认证方式一致（JWT Bearer） | ☐ |
| CORS 配置正确 | ☐ |
| WebSocket 消息格式一致 | ☐ |

---

## 附录 B：联系方式

如有疑问，请联系前端开发负责人。

---

> 📅 文档版本：1.0.0  
> 📅 最后更新：2026-03-02
