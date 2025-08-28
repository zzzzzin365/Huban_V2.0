const redis = require('redis');
require('dotenv').config();

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  db: process.env.REDIS_DB || 0,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // 如果服务器拒绝连接，5秒后重试
      return Math.min(options.attempt * 100, 3000);
    }
    // 重新连接
    return Math.min(options.attempt * 100, 3000);
  },
  max_attempts: 3,
};

// 创建Redis客户端
let redisClient = null;

// 初始化Redis连接
const initRedis = async () => {
  try {
    redisClient = redis.createClient(redisConfig);
    
    redisClient.on('connect', () => {
      console.log('✅ Redis连接成功');
    });
    
    redisClient.on('error', (err) => {
      console.error('❌ Redis连接错误:', err);
    });
    
    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis重新连接中...');
    });
    
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis初始化失败:', error);
    throw error;
  }
};

// 获取Redis客户端
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis客户端未初始化');
  }
  return redisClient;
};

// 关闭Redis连接
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('🔌 Redis连接已关闭');
  }
};

// Redis工具函数
const redisUtils = {
  // 设置缓存
  async set(key, value, expireTime = 3600) {
    try {
      const client = getRedisClient();
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await client.set(key, serializedValue, 'EX', expireTime);
      return true;
    } catch (error) {
      console.error('Redis SET错误:', error);
      return false;
    }
  },

  // 获取缓存
  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis GET错误:', error);
      return null;
    }
  },

  // 删除缓存
  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL错误:', error);
      return false;
    }
  },

  // 设置过期时间
  async expire(key, seconds) {
    try {
      const client = getRedisClient();
      await client.expire(key, seconds);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE错误:', error);
      return false;
    }
  },

  // 检查键是否存在
  async exists(key) {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS错误:', error);
      return false;
    }
  },

  // 获取所有匹配的键
  async keys(pattern) {
    try {
      const client = getRedisClient();
      return await client.keys(pattern);
    } catch (error) {
      console.error('Redis KEYS错误:', error);
      return [];
    }
  },
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  redisUtils,
};
