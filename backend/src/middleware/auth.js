const { jwtService } = require('../config/jwt');
const { redisUtils } = require('../config/redis');
const { User } = require('../models');

// 认证中间件
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING',
      });
    }

    // 验证令牌
    const decoded = jwtService.verifyAccessToken(token);
    
    // 检查令牌是否在黑名单中
    const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '令牌已失效',
        code: 'TOKEN_INVALID',
      });
    }

    // 从缓存获取用户信息
    let user = await redisUtils.get(`user:${decoded.id}`);
    
    if (!user) {
      // 缓存未命中，从数据库获取
      user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
      }

      // 缓存用户信息（1小时）
      await redisUtils.set(`user:${decoded.id}`, user.toJSON(), 3600);
    }

    // 检查用户状态
    if (!user.isActive()) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用',
        code: 'ACCOUNT_DISABLED',
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    // 检查令牌是否即将过期
    if (jwtService.isTokenExpiringSoon(token, 5)) {
      res.setHeader('X-Token-Expiring-Soon', 'true');
    }

    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    
    if (error.message.includes('过期')) {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.message.includes('无效')) {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        code: 'TOKEN_INVALID',
      });
    }

    return res.status(500).json({
      success: false,
      message: '认证服务错误',
      code: 'AUTH_SERVICE_ERROR',
    });
  }
};

// 可选认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwtService.verifyAccessToken(token);
        const isBlacklisted = await redisUtils.get(`blacklist:${token}`);
        
        if (!isBlacklisted) {
          let user = await redisUtils.get(`user:${decoded.id}`);
          
          if (!user) {
            user = await User.findByPk(decoded.id);
            if (user) {
              await redisUtils.set(`user:${decoded.id}`, user.toJSON(), 3600);
            }
          }
          
          if (user && user.isActive()) {
            req.user = user;
            req.token = token;
          }
        }
      } catch (error) {
        // 令牌无效，但不影响请求继续
        console.log('可选认证失败:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    next();
  }
};

// 角色验证中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要认证',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole,
      });
    }

    next();
  };
};

// 志愿者权限中间件
const requireVolunteer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要认证',
        code: 'AUTHENTICATION_REQUIRED',
      });
    }

    // 检查用户是否为志愿者
    if (!req.user.canVolunteer()) {
      return res.status(403).json({
        success: false,
        message: '需要志愿者权限',
        code: 'VOLUNTEER_PERMISSION_REQUIRED',
      });
    }

    // 获取志愿者详细信息
    const { Volunteer } = require('../models');
    const volunteer = await Volunteer.findOne({
      where: { userId: req.user.id, status: 'active' },
    });

    if (!volunteer) {
      return res.status(403).json({
        success: false,
        message: '志愿者信息未完善',
        code: 'VOLUNTEER_PROFILE_INCOMPLETE',
      });
    }

    req.volunteer = volunteer;
    next();
  } catch (error) {
    console.error('志愿者权限验证错误:', error);
    return res.status(500).json({
      success: false,
      message: '权限验证服务错误',
      code: 'PERMISSION_SERVICE_ERROR',
    });
  }
};

// 刷新令牌中间件
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌缺失',
        code: 'REFRESH_TOKEN_MISSING',
      });
    }

    // 验证刷新令牌
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // 检查刷新令牌是否在黑名单中
    const isBlacklisted = await redisUtils.get(`blacklist:${refreshToken}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌已失效',
        code: 'REFRESH_TOKEN_INVALID',
      });
    }

    // 获取用户信息
    let user = await redisUtils.get(`user:${decoded.id}`);
    
    if (!user) {
      user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在',
          code: 'USER_NOT_FOUND',
        });
      }
    }

    // 检查用户状态
    if (!user.isActive()) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用',
        code: 'ACCOUNT_DISABLED',
      });
    }

    // 生成新的令牌对
    const newTokens = jwtService.generateTokenPair({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // 将旧令牌加入黑名单
    await redisUtils.set(`blacklist:${refreshToken}`, 'true', 86400); // 24小时

    req.user = user;
    req.newTokens = newTokens;
    
    next();
  } catch (error) {
    console.error('刷新令牌中间件错误:', error);
    
    if (error.message.includes('过期')) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌已过期',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: '刷新令牌无效',
      code: 'REFRESH_TOKEN_INVALID',
    });
  }
};

// 登出中间件
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    
    if (token) {
      // 将令牌加入黑名单
      await redisUtils.set(`blacklist:${token}`, 'true', 86400); // 24小时
      
      // 清除用户缓存
      if (req.user) {
        await redisUtils.del(`user:${req.user.id}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('登出中间件错误:', error);
    next();
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireVolunteer,
  refreshToken,
  logout,
}; 
