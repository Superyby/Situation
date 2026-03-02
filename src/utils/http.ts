/**
 * ============================================
 * HTTP 请求封装 - 统一的后端 API 交互层
 * ============================================
 * 
 * 使用方法:
 * import { http } from '@/utils/http';
 * 
 * // GET 请求
 * const data = await http.get<UserInfo>('/user/info');
 * 
 * // POST 请求
 * const result = await http.post<LoginResult>('/auth/login', { username, password });
 */

import { envConfig, isDebug } from '@/config/env';

// ============================================
// 类型定义
// ============================================

/** API 响应基础结构（根据后端实际情况调整） */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
  success: boolean;
}

/** 请求配置 */
export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** 请求参数（GET 请求会拼接到 URL） */
  params?: Record<string, string | number | boolean | undefined>;
  /** 请求体 */
  data?: unknown;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否跳过统一错误处理 */
  skipErrorHandler?: boolean;
  /** 基础 URL（覆盖默认） */
  baseURL?: string;
}

/** HTTP 错误 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public response?: unknown
  ) {
    super(`HTTP Error ${statusCode}: ${statusText}`);
    this.name = 'HttpError';
  }
}

// ============================================
// 请求工具函数
// ============================================

/**
 * 构建带查询参数的 URL
 */
function buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return url;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  if (!queryString) return url;
  
  return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
}

/**
 * 请求日志
 */
function logRequest(method: string, url: string, config?: RequestConfig) {
  if (!isDebug) return;
  console.log(`🌐 [${method}] ${url}`, config?.data || config?.params || '');
}

/**
 * 响应日志
 */
function logResponse(method: string, url: string, data: unknown, duration: number) {
  if (!isDebug) return;
  console.log(`✅ [${method}] ${url} (${duration}ms)`, data);
}

/**
 * 错误日志
 */
function logError(method: string, url: string, error: unknown) {
  console.error(`❌ [${method}] ${url}`, error);
}

// ============================================
// 核心请求函数
// ============================================

/**
 * 发起 HTTP 请求
 */
async function request<T>(
  method: string,
  url: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    params,
    data,
    timeout = 30000,
    skipErrorHandler = false,
    baseURL = envConfig.apiBaseUrl,
    headers: customHeaders,
    ...restConfig
  } = config;

  // 构建完整 URL
  const fullUrl = buildUrl(`${baseURL}${url}`, params);
  
  // 构建请求头
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // 构建请求配置
  const fetchConfig: RequestInit = {
    method,
    headers,
    ...restConfig,
  };

  // 添加请求体
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchConfig.body = JSON.stringify(data);
  }

  logRequest(method, fullUrl, config);
  const startTime = Date.now();

  // 超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchConfig.signal = controller.signal;

  try {
    const response = await fetch(fullUrl, fetchConfig);
    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    // 检查 HTTP 状态
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new HttpError(response.status, response.statusText, errorBody);
    }

    // 解析响应
    const contentType = response.headers.get('content-type');
    let result: T;

    if (contentType?.includes('application/json')) {
      result = await response.json();
    } else {
      result = (await response.text()) as unknown as T;
    }

    logResponse(method, fullUrl, result, duration);
    return result;

  } catch (error) {
    clearTimeout(timeoutId);
    logError(method, fullUrl, error);

    if (!skipErrorHandler) {
      // 统一错误处理（可以在这里添加全局错误提示）
      if (error instanceof HttpError) {
        // 处理特定状态码
        if (error.statusCode === 401) {
          // TODO: 跳转登录页或刷新 token
          console.warn('认证失败，请重新登录');
        }
      }
    }

    throw error;
  }
}

// ============================================
// HTTP 方法封装
// ============================================

export const http = {
  /**
   * GET 请求
   */
  get<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>('GET', url, config);
  },

  /**
   * POST 请求
   */
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>('POST', url, { ...config, data });
  },

  /**
   * PUT 请求
   */
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>('PUT', url, { ...config, data });
  },

  /**
   * PATCH 请求
   */
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>('PATCH', url, { ...config, data });
  },

  /**
   * DELETE 请求
   */
  delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return request<T>('DELETE', url, config);
  },

  /**
   * 原始请求（完全自定义）
   */
  request<T>(method: string, url: string, config?: RequestConfig): Promise<T> {
    return request<T>(method, url, config);
  },
};

export default http;
