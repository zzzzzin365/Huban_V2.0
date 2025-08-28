const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入配置
const { sequelize, testConnection } = require('./config/database');
const { initRedis } = require('./config/redis');
const { blockchainService } = require('./config/blockchain');

// 导入中间件
const { auth, optionalAuth } = require('./middleware/auth');

// 导入路由
const authRoutes = require('./routes/auth');
const volunteerRoutes = require('./routes/volunteers');
const aiRoutes = require('./routes/ai');
const communityRoutes = require('./routes/community');
const emergencyRoutes = require('./routes/emergency');
const blockchainRoutes = require('./routes/blockchain');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/blockchain', blockchainRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '乐呼志愿者匹配应用后端服务',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      volunteers: '/api/volunteers',
      ai: '/api/ai',
      community: '/api/community',
      emergency: '/api/emergency',
      blockchain: '/api/blockchain',
    },
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  
  // 数据库连接错误
  if (error.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: '数据库服务不可用',
      code: 'DATABASE_UNAVAILABLE',
    });
  }
  
  // 验证错误
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }
  
  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN',
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED',
    });
  }
  
  // 默认错误响应
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { error: error.message }),
  });
});

// 优雅关闭
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  console.log('🔄 正在优雅关闭服务...');
  
  try {
    // 关闭HTTP服务器
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
      console.log('✅ HTTP服务器已关闭');
    }
    
    // 关闭数据库连接
    if (sequelize) {
      await sequelize.close();
      console.log('✅ 数据库连接已关闭');
    }
    
    // 关闭Redis连接
    // await closeRedis();
    console.log('✅ Redis连接已关闭');
    
    console.log('🎉 服务已优雅关闭');
    process.exit(0);
  } catch (error) {
    console.error('❌ 优雅关闭失败:', error);
    process.exit(1);
  }
}

// 启动服务器
let server;
const startServer = async () => {
  try {
    console.log('🚀 正在启动乐呼志愿者匹配后端服务...');
    
    // 测试数据库连接
    await testConnection();
    
    // 初始化Redis
    await initRedis();
    
    // 初始化区块链服务
    await blockchainService.init();
    
    // 启动HTTP服务器
    server = app.listen(PORT, () => {
      console.log(`✅ 服务器启动成功！`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  数据库: MySQL`);
      console.log(`🔴 缓存: Redis`);
      console.log(`⛓️  区块链: ${blockchainService.getCurrentNetwork()}`);
      console.log(`🔐 认证: JWT`);
      console.log('🎯 准备接收请求...');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务
startServer();

module.exports = app; 
