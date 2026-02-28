import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Space-Track 代理插件
function spaceTrackProxyPlugin(): PluginOption {
  let sessionCookie: string | null = null;

  return {
    name: 'space-track-proxy',
    configureServer(server) {
      // 解析请求体
      const parseBody = (req: IncomingMessage): Promise<Record<string, string>> => {
        return new Promise((resolve) => {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve({});
            }
          });
        });
      };

      // 登录接口
      server.middlewares.use('/api/spacetrack/login', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          const { identity, password } = await parseBody(req);
          console.log('🔐 正在登录 Space-Track...', identity);

          const params = new URLSearchParams({ identity, password });
          const response = await fetch('https://www.space-track.org/ajaxauth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
            redirect: 'manual',
          });

          // 保存 Cookie
          const cookies = response.headers.getSetCookie?.() || [];
          if (cookies.length > 0) {
            sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
            console.log('✅ 登录成功');
          }

          const text = await response.text();
          res.setHeader('Content-Type', 'text/plain');
          res.end(text);
        } catch (error: unknown) {
          console.error('❌ 登录失败:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });

      // 获取 TLE 数据
      server.middlewares.use('/api/spacetrack/tle', async (req: IncomingMessage, res: ServerResponse) => {
        if (!sessionCookie) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: '未登录' }));
          return;
        }

        try {
          const url = new URL(req.url || '', 'http://localhost');
          const limit = url.searchParams.get('limit') || '50';
          const orderby = url.searchParams.get('orderby') || 'NORAD_CAT_ID asc';

          const apiUrl = `https://www.space-track.org/basicspacedata/query/class/gp/orderby/${encodeURIComponent(orderby)}/limit/${limit}/format/json`;
          console.log('📡 查询TLE:', limit, '条');

          const response = await fetch(apiUrl, {
            headers: { Cookie: sessionCookie },
          });

          const data = await response.json();
          console.log(`✅ 获取到 ${Array.isArray(data) ? data.length : 0} 条数据`);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (error: unknown) {
          console.error('❌ 查询失败:', error);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(error) }));
        }
      });

      // 注销
      server.middlewares.use('/api/spacetrack/logout', async (_req: IncomingMessage, res: ServerResponse) => {
        if (sessionCookie) {
          await fetch('https://www.space-track.org/ajaxauth/logout', {
            headers: { Cookie: sessionCookie },
          }).catch(() => {});
          sessionCookie = null;
          console.log('✅ 已注销');
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaceTrackProxyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
    },
  },
  server: {
    port: 5544,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'gsap': ['gsap'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  // 静态资源目录
  publicDir: 'public',
});
