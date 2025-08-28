const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// JWT配置
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'volunteer-matching-app',
  audience: process.env.JWT_AUDIENCE || 'volunteer-matching-users',
  algorithm: 'HS256',
};

// JWT工具类
class JWTService {
  constructor() {
    this.secret = jwtConfig.secret;
    this.expiresIn = jwtConfig.expiresIn;
    this.refreshExpiresIn = jwtConfig.refreshExpiresIn;
    this.issuer = jwtConfig.issuer;
    this.audience = jwtConfig.audience;
    this.algorithm = jwtConfig.algorithm;
  }

  // 生成访问令牌
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.expiresIn,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: this.algorithm,
      });
    } catch (error) {
      console.error('生成访问令牌失败:', error);
      throw new Error('令牌生成失败');
    }
  }

  // 生成刷新令牌
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        ...payload,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.refreshExpiresIn,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: this.algorithm,
      });
    } catch (error) {
      console.error('生成刷新令牌失败:', error);
      throw new Error('刷新令牌生成失败');
    }
  }

  // 生成令牌对
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.expiresIn,
      refreshExpiresIn: this.refreshExpiresIn,
    };
  }

  // 验证令牌
  verifyToken(token, type = 'access') {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: [this.algorithm],
      });

      // 检查令牌类型
      if (decoded.type !== type) {
        throw new Error('令牌类型不匹配');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      } else {
        throw new Error('令牌验证失败');
      }
    }
  }

  // 验证访问令牌
  verifyAccessToken(token) {
    return this.verifyToken(token, 'access');
  }

  // 验证刷新令牌
  verifyRefreshToken(token) {
    return this.verifyToken(token, 'refresh');
  }

  // 解码令牌（不验证）
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('解码令牌失败:', error);
      return null;
    }
  }

  // 获取令牌过期时间
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      console.error('获取令牌过期时间失败:', error);
      return null;
    }
  }

  // 检查令牌是否即将过期
  isTokenExpiringSoon(token, thresholdMinutes = 5) {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return false;

      const now = new Date();
      const thresholdMs = thresholdMinutes * 60 * 1000;
      
      return (expiration.getTime() - now.getTime()) <= thresholdMs;
    } catch (error) {
      console.error('检查令牌过期状态失败:', error);
      return false;
    }
  }

  // 生成随机密钥
  static generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  // 生成密码哈希
  static hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // 验证密码
  static verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // 生成随机令牌
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

// 创建JWT服务实例
const jwtService = new JWTService();

module.exports = {
  jwtService,
  jwtConfig,
  JWTService,
};
