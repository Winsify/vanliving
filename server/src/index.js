import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (replace with database in production)
const users = new Map();
const coffeeRecords = new Map();
const knowledgeArticles = [
  { id: 1, title: '手冲咖啡入门', content: '手冲咖啡是一种古老的冲泡方式...', category: '入门' },
  { id: 2, title: '水温水质的讲究', content: '水温是影响咖啡风味的关键因素...', category: '技巧' },
  { id: 3, title: '常见咖啡豆产区', content: '埃塞俄比亚、哥伦比亚、巴西...', category: '知识' },
];

// Initialize sample data
coffeeRecords.set('demo', [
  {
    id: uuidv4(),
    userId: 'demo',
    origin: '埃塞俄比亚 耶加雪菲',
    roasts: '浅烘',
    process: '水洗',
    grindSize: '中细研磨',
    waterRatio: '1:15',
    waterAmount: 300,
    coffeeAmount: 20,
    waterTemp: 92,
    brewTime: '2:30',
    flavor: '柑橘、花香',
    notes: '酸度明亮，口感干净',
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    userId: 'demo',
    origin: '哥伦比亚 慧兰',
    roasts: '中烘',
    process: '日晒',
    grindSize: '中研磨',
    waterRatio: '1:16',
    waterAmount: 320,
    coffeeAmount: 20,
    waterTemp: 90,
    brewTime: '3:00',
    flavor: '坚果、巧克力',
    notes: 'Body饱满，甜感好',
    createdAt: new Date().toISOString(),
  },
]);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, nickname } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }
  
  if (users.has(email)) {
    return res.status(400).json({ error: '该邮箱已注册' });
  }
  
  const user = {
    id: uuidv4(),
    email,
    password, // In production, hash this password!
    nickname: nickname || email.split('@')[0],
    isMember: false,
    memberExpire: null,
    createdAt: new Date().toISOString(),
  };
  
  users.set(email, user);
  coffeeRecords.set(user.id, []);
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, nickname: user.nickname, isMember: user.isMember }
  });
});

// User login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, nickname: user.nickname, isMember: user.isMember }
  });
});

// Get user profile
app.get('/api/v1/users/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: '未登录' });
  }
  
  let user = null;
  for (const u of users.values()) {
    if (u.id === userId) {
      user = u;
      break;
    }
  }
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    isMember: user.isMember,
    memberExpire: user.memberExpire,
  });
});

// Coffee records
app.get('/api/v1/records', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo';
  const records = coffeeRecords.get(userId) || [];
  res.json(records);
});

app.post('/api/v1/records', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo';
  const record = {
    id: uuidv4(),
    userId,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  
  const records = coffeeRecords.get(userId) || [];
  records.unshift(record);
  coffeeRecords.set(userId, records);
  
  res.json({ success: true, record });
});

app.put('/api/v1/records/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo';
  const { id } = req.params;
  const records = coffeeRecords.get(userId) || [];
  
  const index = records.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  records[index] = { ...records[index], ...req.body };
  coffeeRecords.set(userId, records);
  
  res.json({ success: true, record: records[index] });
});

app.delete('/api/v1/records/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'demo';
  const { id } = req.params;
  const records = coffeeRecords.get(userId) || [];
  
  const filtered = records.filter(r => r.id !== id);
  coffeeRecords.set(userId, filtered);
  
  res.json({ success: true });
});

// Knowledge base
app.get('/api/v1/knowledge', (req, res) => {
  res.json(knowledgeArticles);
});

app.get('/api/v1/knowledge/:id', (req, res) => {
  const { id } = req.params;
  const article = knowledgeArticles.find(a => a.id === parseInt(id));
  
  if (!article) {
    return res.status(404).json({ error: '文章不存在' });
  }
  
  res.json(article);
});

// AI recommendation
app.post('/api/v1/ai/recommend', async (req, res) => {
  const { coffee, preference } = req.body;
  
  try {
    // Call LLM API for recommendations
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {
        model: 'doubao-seed-3-25-sapi',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的咖啡器具推荐师，根据用户的手冲偏好推荐合适的器具。'
          },
          {
            role: 'user',
            content: `用户偏好：${preference || '均衡口感'}\n咖啡豆：${coffee?.origin || '通用'}\n请推荐合适的手冲器具（滤杯、手冲壶、磨豆机等），并给出简要说明。`
          }
        ],
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ARK_API_KEY || ''}`,
        },
        timeout: 30000,
      }
    );
    
    const recommendation = response.data.choices?.[0]?.message?.content || '推荐系统暂时不可用';
    
    res.json({
      success: true,
      recommendation,
      tools: [
        { name: 'Hario V60', type: '滤杯', reason: '适合新手，流速可控' },
        { name: 'Kalita Wave', type: '滤杯', reason: '入门友好，口感稳定' },
        { name: 'Fellow Stagg', type: '手冲壶', reason: '控温精准，设计美观' },
      ]
    });
  } catch (error) {
    console.error('AI recommendation error:', error.message);
    // Return mock data if API fails
    res.json({
      success: true,
      recommendation: `根据您的偏好，推荐使用 Hario V60 滤杯配合 Fellow Stagg 手冲壶，这套组合适合追求${preference || '均衡'}口感的咖啡爱好者。`,
      tools: [
        { name: 'Hario V60', type: '滤杯', reason: '适合新手，流速可控' },
        { name: 'Fellow Stagg', type: '手冲壶', reason: '控温精准' },
      ]
    });
  }
});

// File upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.post('/api/v1/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }
  
  const fileUrl = `/uploads/${uuidv4()}-${req.file.originalname}`;
  
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

app.listen(PORT, () => {
  console.log(`Vanliving API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
