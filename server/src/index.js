import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://erfywhbknzqkddrafxtb.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZnl3aGJrbnpxa2RkcmFmeHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTUzOTIsImV4cCI6MjA2NDc3MTM5Mn0.AEaQ--zCcS9jtyROAdtbig_buZoOK9GXXwJqJpj2Y4gI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDatabase() {
  // Create users table
  const { error: usersError } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT DEFAULT '',
        is_member BOOLEAN DEFAULT false,
        member_expire TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  }).catch(() => {
    // RPC might not exist, create table directly
    return supabase.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nickname TEXT DEFAULT '',
        is_member BOOLEAN DEFAULT false,
        member_expire TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  });

  // Create coffee_records table
  await supabase.rpc('exec', { sql: `
    CREATE TABLE IF NOT EXISTS coffee_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      origin TEXT,
      roasts TEXT,
      process TEXT,
      grind_size TEXT,
      water_ratio TEXT,
      water_amount INTEGER,
      coffee_amount INTEGER,
      water_temp INTEGER,
      brew_time TEXT,
      flavor TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `}).catch(() => {});

  // Create knowledge_articles table
  await supabase.rpc('exec', { sql: `
    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `}).catch(() => {});

  console.log('Database initialized');
}

// Initialize sample data
async function initSampleData() {
  // Check if sample data exists
  const { data } = await supabase.from('knowledge_articles').select('id').limit(1);
  
  if (!data || data.length === 0) {
    // Insert sample knowledge articles
    await supabase.from('knowledge_articles').insert([
      { title: '手冲咖啡入门', content: '手冲咖啡是一种古老的冲泡方式...', category: '入门' },
      { title: '水温水质的讲究', content: '水温是影响咖啡风味的关键因素...', category: '技巧' },
      { title: '常见咖啡豆产区', content: '埃塞俄比亚、哥伦比亚、巴西...', category: '知识' },
      { title: '粉水比的重要性', content: '粉水比决定了咖啡的浓度和口感...', category: '技巧' },
      { title: '研磨度对风味的影响', content: '不同研磨度会影响萃取率和风味...', category: '技巧' },
    ]);
    
    console.log('Sample data inserted');
  }
}

// Initialize on startup
initDatabase().then(initSampleData).catch(console.error);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(400).json({ error: '该邮箱已注册' });
    }
    
    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        nickname: nickname || email.split('@')[0],
        is_member: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      user: { id: data.id, email: data.email, nickname: data.nickname, isMember: data.is_member }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// User login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }
    
    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Find user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', hashedPassword)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    res.json({
      success: true,
      user: { id: data.id, email: data.email, nickname: data.nickname, isMember: data.is_member }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// Get coffee records
app.get('/api/v1/records', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const { data, error } = await supabase
      .from('coffee_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ records: data || [] });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// Create coffee record
app.post('/api/v1/records', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const { data, error } = await supabase
      .from('coffee_records')
      .insert({ ...req.body, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, record: data });
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ error: '创建记录失败' });
  }
});

// Delete coffee record
app.delete('/api/v1/records/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }
    
    const { error } = await supabase
      .from('coffee_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ error: '删除记录失败' });
  }
});

// Get knowledge articles
app.get('/api/v1/knowledge', async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = supabase.from('knowledge_articles').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ articles: data || [] });
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: '获取知识库失败' });
  }
});

// AI recommendation endpoint
app.post('/api/v1/ai/recommend', async (req, res) => {
  try {
    const { origin, roasts, process: processMethod } = req.body;
    
    // Mock AI recommendation based on input
    const recommendations = [];
    
    if (origin) {
      recommendations.push({
        type: 'origin',
        text: `推荐使用 92-94°C 的水温冲泡 ${origin}，可以更好地展现其风味特点。`
      });
    }
    
    if (roasts === '浅烘') {
      recommendations.push({
        type: 'temperature',
        text: '浅烘咖啡建议使用较高水温（93-96°C）和较长萃取时间（2:30-3:00）。'
      });
    } else if (roasts === '深烘') {
      recommendations.push({
        type: 'temperature',
        text: '深烘咖啡建议使用较低水温（88-91°C）和较短萃取时间（1:45-2:15）。'
      });
    }
    
    if (processMethod === '水洗') {
      recommendations.push({
        type: 'process',
        text: '水洗处理的咖啡酸度更明亮，建议搭配细研磨。'
      });
    } else if (processMethod === '日晒') {
      recommendations.push({
        type: 'process',
        text: '日晒处理的咖啡甜度更高，建议使用中等研磨。'
      });
    }
    
    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'general',
        text: '推荐使用 1:15 的粉水比，中细研磨，水温 92-94°C，萃取时间 2:00-2:30。'
      });
    }
    
    res.json({ recommendations });
  } catch (error) {
    console.error('AI recommend error:', error);
    res.status(500).json({ error: 'AI推荐失败' });
  }
});

// Membership upgrade (mock)
app.post('/api/v1/membership/upgrade', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }
    
    // Mock upgrade - in production, integrate with payment
    const expireDate = new Date();
    expireDate.setFullYear(expireDate.getFullYear() + 1);
    
    const { error } = await supabase
      .from('users')
      .update({ is_member: true, member_expire: expireDate.toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    
    res.json({ success: true, message: '会员开通成功', expireDate: expireDate.toISOString() });
  } catch (error) {
    console.error('Membership upgrade error:', error);
    res.status(500).json({ error: '开通会员失败' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
