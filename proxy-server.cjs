const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// 存储session cookie
let sessionCookie = null;

// 中间件
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Space-Track 登录
app.post('/api/spacetrack/login', async (req, res) => {
  try {
    const { identity, password } = req.body;
    
    if (!identity || !password) {
      return res.status(400).json({ error: '缺少认证信息' });
    }
    
    console.log('🔐 正在登录 Space-Track...', identity);
    
    const params = new URLSearchParams();
    params.append('identity', identity);
    params.append('password', password);
    
    const response = await axios.post(
      'https://www.space-track.org/ajaxauth/login',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      }
    );
    
    // 保存session cookie
    if (response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
      console.log('✅ 登录成功，Cookie已保存');
      console.log('📝 响应:', response.data);
    }
    
    // 返回原始响应
    res.send(response.data);
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Space-Track 查询 TLE 数据
app.get('/api/spacetrack/tle', async (req, res) => {
  try {
    if (!sessionCookie) {
      console.log('❌ 未登录，无法查询');
      return res.status(401).json({ error: '未登录' });
    }
    
    const limit = req.query.limit || 50;
    const orderby = req.query.orderby || 'NORAD_CAT_ID asc';
    
    // Space-Track GP (General Perturbations) 数据查询
    // 格式: /basicspacedata/query/class/gp/orderby/{field}/limit/{num}/format/json
    const url = `https://www.space-track.org/basicspacedata/query/class/gp/orderby/${encodeURIComponent(orderby)}/limit/${limit}/format/json`;
    
    console.log('📡 查询TLE:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Cookie': sessionCookie
      },
      timeout: 120000  // 2分钟超时，支持大量数据
    });
    
    console.log(`✅ 获取到 ${Array.isArray(response.data) ? response.data.length : 0} 条数据`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ 查询失败:', error.response?.status, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// 按NORAD ID查询
app.get('/api/spacetrack/satellite/:noradId', async (req, res) => {
  try {
    if (!sessionCookie) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const { noradId } = req.params;
    const url = `https://www.space-track.org/basicspacedata/query/class/gp/NORAD_CAT_ID/${noradId}/orderby/EPOCH desc/limit/1/format/json`;
    
    console.log('📡 查询卫星:', noradId);
    
    const response = await axios.get(url, {
      headers: {
        'Cookie': sessionCookie
      },
      timeout: 30000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 注销
app.get('/api/spacetrack/logout', async (req, res) => {
  try {
    if (sessionCookie) {
      await axios.get('https://www.space-track.org/ajaxauth/logout', {
        headers: { 'Cookie': sessionCookie }
      });
      sessionCookie = null;
      console.log('✅ 已注销');
    }
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 注销失败:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 检查登录状态
app.get('/api/spacetrack/status', (req, res) => {
  res.json({ 
    authenticated: !!sessionCookie,
    message: sessionCookie ? '已登录' : '未登录'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Space-Track 代理服务器`);
  console.log(`📍 地址: http://localhost:${PORT}`);
  console.log('📌 端点:');
  console.log('   POST /api/spacetrack/login     - 登录');
  console.log('   GET  /api/spacetrack/tle       - 获取TLE数据');
  console.log('   GET  /api/spacetrack/satellite/:id - 按ID查询');
  console.log('   GET  /api/spacetrack/status    - 检查状态');
  console.log('   GET  /api/spacetrack/logout    - 注销');
});
