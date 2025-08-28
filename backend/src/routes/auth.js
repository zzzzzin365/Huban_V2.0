const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { jwtService } = require('../config/jwt');
const { redisUtils } = require('../config/redis');
const { auth, logout } = require('../middleware/auth');

const router = express.Router();

// 输入验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('phone')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('密码长度必须在6-128个字符之间'),
  body('realName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('真实姓名不能超过50个字符'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male、female 或 other'),
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('用户名、邮箱或手机号不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('刷新令牌不能为空'),
];

// 用户注册
router.post('/register', registerValidation, async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { username, email, phone, password, realName, gender, birthDate } = req.body;

    // 检查用户名是否已存在
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在',
        code: 'USERNAME_EXISTS',
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册',
        code: 'EMAIL_EXISTS',
      });
    }

    // 检查手机号是否已存在
    const existingPhone = await User.findByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: '手机号已被注册',
        code: 'PHONE_EXISTS',
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      phone,
      password, // 密码会在模型中自动哈希
      realName,
      gender,
      birthDate: birthDate ? new Date(birthDate) : null,
      role: 'user',
      status: 'active',
    });

    // 生成令牌
    const tokens = jwtService.generateTokenPair({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // 缓存用户信息
    await redisUtils.set(`user:${user.id}`, user.toJSON(), 3600);

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      message: '用户注册失败',
      code: 'REGISTRATION_FAILED',
    });
  }
});

// 用户登录
router.post('/login', loginValidation, async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { identifier, password } = req.body;

    // 验证用户凭据
    const user = await User.findByCredentials(identifier, password);
    
    // 更新登录信息
    await user.updateLoginInfo();

    // 生成令牌
    const tokens = jwtService.generateTokenPair({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // 缓存用户信息
    await redisUtils.set(`user:${user.id}`, user.toJSON(), 3600);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: user.toJSON(),
        tokens,
      },
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    
    if (error.message.includes('用户名或密码错误')) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
        code: 'INVALID_CREDENTIALS',
      });
    }
    
    if (error.message.includes('账户已被禁用')) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用',
        code: 'ACCOUNT_DISABLED',
      });
    }

    res.status(500).json({
      success: false,
      message: '登录失败',
      code: 'LOGIN_FAILED',
    });
  }
});

// 刷新令牌
router.post('/refresh', refreshTokenValidation, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // 验证刷新令牌
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // 检查令牌是否在黑名单中
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

    // 将旧刷新令牌加入黑名单
    await redisUtils.set(`blacklist:${refreshToken}`, 'true', 86400); // 24小时

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: {
        tokens: newTokens,
      },
    });
  } catch (error) {
    console.error('令牌刷新失败:', error);
    
    if (error.message.includes('过期')) {
      return res.status(401).json({
        success: false,
        message: '刷新令牌已过期',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }
    
    res.status(401).json({
      success: false,
      message: '刷新令牌无效',
      code: 'REFRESH_TOKEN_INVALID',
    });
  }
});

// 用户登出
router.post('/logout', auth, logout, async (req, res) => {
  try {
    res.json({
      success: true,
      message: '登出成功',
    });
  } catch (error) {
    console.error('用户登出失败:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      code: 'LOGOUT_FAILED',
    });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      code: 'GET_USER_INFO_FAILED',
    });
  }
});

// 更新用户信息
router.put('/me', auth, [
  body('realName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('真实姓名不能超过50个字符'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male、female 或 other'),
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('出生日期格式无效'),
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { realName, gender, birthDate, avatar } = req.body;
    const updateData = {};

    if (realName !== undefined) updateData.realName = realName;
    if (gender !== undefined) updateData.gender = gender;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (avatar !== undefined) updateData.avatar = avatar;

    // 更新用户信息
    await req.user.update(updateData);

    // 更新缓存
    await redisUtils.set(`user:${req.user.id}`, req.user.toJSON(), 3600);

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      code: 'UPDATE_USER_INFO_FAILED',
    });
  }
});

// 修改密码
router.put('/password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('新密码长度必须在6-128个字符之间'),
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // 验证当前密码
    if (!req.user.verifyPassword(currentPassword)) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误',
        code: 'CURRENT_PASSWORD_INCORRECT',
      });
    }

    // 更新密码
    await req.user.update({ password: newPassword });

    // 清除所有令牌缓存（强制重新登录）
    await redisUtils.del(`user:${req.user.id}`);

    res.json({
      success: true,
      message: '密码修改成功，请重新登录',
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      code: 'CHANGE_PASSWORD_FAILED',
    });
  }
});

// 忘记密码（发送重置邮件/短信）
router.post('/forgot-password', [
  body('identifier')
    .notEmpty()
    .withMessage('用户名、邮箱或手机号不能为空'),
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { identifier } = req.body;

    // 查找用户
    let user;
    if (identifier.includes('@')) {
      user = await User.findByEmail(identifier);
    } else if (/^1[3-9]\d{9}$/.test(identifier)) {
      user = await User.findByPhone(identifier);
    } else {
      user = await User.findByUsername(identifier);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND',
      });
    }

    // 生成重置令牌
    const resetToken = jwtService.generateRandomToken(32);
    const resetExpiry = Date.now() + 3600000; // 1小时有效期

    // 存储重置令牌到Redis
    await redisUtils.set(`reset:${resetToken}`, {
      userId: user.id,
      expiry: resetExpiry,
    }, 3600);

    // TODO: 发送重置邮件或短信
    // 这里应该集成邮件服务或短信服务

    res.json({
      success: true,
      message: '重置链接已发送，请检查您的邮箱或手机',
    });
  } catch (error) {
    console.error('忘记密码处理失败:', error);
    res.status(500).json({
      success: false,
      message: '处理失败',
      code: 'FORGOT_PASSWORD_FAILED',
    });
  }
});

// 重置密码
router.post('/reset-password', [
  body('resetToken')
    .notEmpty()
    .withMessage('重置令牌不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('新密码长度必须在6-128个字符之间'),
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        code: 'VALIDATION_ERROR',
        errors: errors.array(),
      });
    }

    const { resetToken, newPassword } = req.body;

    // 验证重置令牌
    const resetData = await redisUtils.get(`reset:${resetToken}`);
    if (!resetData) {
      return res.status(400).json({
        success: false,
        message: '重置令牌无效或已过期',
        code: 'INVALID_RESET_TOKEN',
      });
    }

    if (Date.now() > resetData.expiry) {
      // 删除过期令牌
      await redisUtils.del(`reset:${resetToken}`);
      return res.status(400).json({
        success: false,
        message: '重置令牌已过期',
        code: 'RESET_TOKEN_EXPIRED',
      });
    }

    // 更新用户密码
    const user = await User.findByPk(resetData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND',
      });
    }

    await user.update({ password: newPassword });

    // 删除重置令牌
    await redisUtils.del(`reset:${resetToken}`);

    // 清除用户缓存
    await redisUtils.del(`user:${user.id}`);

    res.json({
      success: true,
      message: '密码重置成功',
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      code: 'RESET_PASSWORD_FAILED',
    });
  }
});

module.exports = router; 
