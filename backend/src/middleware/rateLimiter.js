const rateLimit = require('express-rate-limit');
const RedisService = require('../services/RedisService');
  incr: async (key) => {
    const redis = new RedisService();
    await redis.connect();
    const current = await redis.get(key) || 0;
    const newValue = parseInt(current) + 1;
    await redis.set(key, newValue, 60); 
    await redis.disconnect();
    return { totalHits: newValue, resetTime: new Date(Date.now() + 60000) };
  },
  decrement: async (key) => {
    const redis = new RedisService();
    await redis.connect();
    const current = await redis.get(key) || 0;
    const newValue = Math.max(0, parseInt(current) - 1);
    await redis.set(key, newValue, 60);
    await redis.disconnect();
  },
  resetKey: async (key) => {
    const redis = new RedisService();
    await redis.connect();
    await redis.delete(key);
    await redis.disconnect();
  }
};
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
    success: false,
    message: '注册请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
    success: false,
    message: '登录请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const sendCodeLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 3, 
    success: false,
    message: '发送验证码过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const verifyPhoneLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 10, 
    success: false,
    message: '验证请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
    success: false,
    message: '重置密码请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const refreshTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 20, 
    success: false,
    message: '刷新令牌请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
  windowMs: 60 * 1000, 
  max: 10, 
    success: false,
    message: '检查请求过于频繁，请稍后再�?
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore
});
module.exports = {
  register: registerLimiter,
  login: loginLimiter,
  sendCode: sendCodeLimiter,
  verifyPhone: verifyPhoneLimiter,
  resetPassword: resetPasswordLimiter,
  refreshToken: refreshTokenLimiter,
  checkPhone: checkPhoneLimiter,
  api: apiLimiter
}; 
