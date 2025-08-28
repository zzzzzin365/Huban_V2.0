const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Device = require('../models/Device');
const SmsService = require('../services/SmsService');
const RedisService = require('../services/RedisService');
const logger = require('../utils/logger');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const { name, phone, password, role, email, birth_date, gender } = req.body;
      const existingUser = await User.findByPhone(phone);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '手机号码已被注册'
        });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const userData = {
        name,
        phone,
        password_hash: hashedPassword,
        role,
        email,
        birth_date,
        gender
      };
      const userId = await User.create(userData);
      const { accessToken, refreshToken } = generateTokens({ userId, role });
      await RedisService.setRefreshToken(userId, refreshToken);
      const deviceData = {
        user_id: userId,
        device_id: req.body.device_id || `web_${Date.now()}`,
        device_type: req.body.device_type || 'mobile',
        device_name: req.body.device_name || 'Unknown Device',
        platform: req.body.platform || 'unknown',
        app_version: req.body.app_version || '1.0.0',
        fcm_token: req.body.fcm_token
      };
      await Device.create(deviceData);
      logger.info(`User registered successfully: ${phone}`);
      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: {
            id: userId,
            name,
            phone,
            role,
            email
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: '注册失败，请稍后重试'
      });
    }
  }
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const { phone, password } = req.body;
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: '手机号码或密码错�?
        });
      }
        return res.status(400).json({
          success: false,
          message: '账户已被禁用，请联系管理�?
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '手机号码或密码错�?
        });
      }
      const { accessToken, refreshToken } = generateTokens({ 
        userId: user.id, 
        role: user.role 
      });
      await RedisService.setRefreshToken(user.id, refreshToken);
      await User.updateLastLogin(user.id);
        user_id: user.id,
        device_id: req.body.device_id || `web_${Date.now()}`,
        device_type: req.body.device_type || 'mobile',
        device_name: req.body.device_name || 'Unknown Device',
        platform: req.body.platform || 'unknown',
        app_version: req.body.app_version || '1.0.0',
        fcm_token: req.body.fcm_token
      };
      await Device.upsert(deviceData);
      logger.info(`User logged in successfully: ${phone}`);
      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            email: user.email,
            avatar_url: user.avatar_url
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请稍后重试'
      });
    }
  }
  async sendVerificationCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const { phone } = req.body;
      await RedisService.setVerificationCode(phone, code, 300);
      logger.info(`Verification code sent to: ${phone}`);
      res.json({
        success: true,
        message: '验证码已发�?
      });
    } catch (error) {
      logger.error('Send verification code error:', error);
      res.status(500).json({
        success: false,
        message: '发送验证码失败，请稍后重试'
      });
    }
  }
  async verifyPhone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const { phone, code } = req.body;
      if (!storedCode || storedCode !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过�?
        });
      }
      res.json({
        success: true,
        message: '手机号码验证成功'
      });
    } catch (error) {
      logger.error('Phone verification error:', error);
      res.status(500).json({
        success: false,
        message: '验证失败，请稍后重试'
      });
    }
  }
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const { phone, code, newPassword } = req.body;
      if (!storedCode || storedCode !== code) {
        return res.status(400).json({
          success: false,
          message: '验证码错误或已过�?
        });
      }
      const user = await User.findByPhone(phone);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存�?
        });
      }
      await User.updatePassword(user.id, hashedPassword);
      logger.info(`Password reset successfully for user: ${phone}`);
      res.json({
        success: true,
        message: '密码重置成功'
      });
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        message: '密码重置失败，请稍后重试'
      });
    }
  }
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: '刷新令牌不能为空'
        });
      }
      const decoded = verifyRefreshToken(refresh_token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: '刷新令牌无效'
        });
      }
      const storedToken = await RedisService.getRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refresh_token) {
        return res.status(401).json({
          success: false,
          message: '刷新令牌无效'
        });
      }
        userId: decoded.userId,
        role: decoded.role
      });
      await RedisService.setRefreshToken(decoded.userId, newRefreshToken);
      res.json({
        success: true,
        message: '令牌刷新成功',
        data: {
          access_token: accessToken,
          refresh_token: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        message: '令牌刷新失败'
      });
    }
  }
  async logout(req, res) {
    try {
      const userId = req.user.id;
      const deviceId = req.body.device_id;
      await RedisService.deleteRefreshToken(userId);
        await Device.deactivate(deviceId);
      }
      logger.info(`User logged out: ${userId}`);
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: '登出失败'
      });
    }
  }
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存�?
        });
      }
      delete user.password_hash;
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const userId = req.user.id;
      const updateData = req.body;
      delete updateData.id;
      delete updateData.phone;
      delete updateData.password_hash;
      delete updateData.role;
      delete updateData.created_at;
      await User.update(userId, updateData);
      logger.info(`User profile updated: ${userId}`);
      res.json({
        success: true,
        message: '用户信息更新成功'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: '更新用户信息失败'
      });
    }
  }
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存�?
        });
      }
      if (!isOldPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '原密码错�?
        });
      }
      await User.updatePassword(userId, hashedNewPassword);
      logger.info(`Password changed successfully for user: ${userId}`);
      res.json({
        success: true,
        message: '密码修改成功，请重新登录'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: '密码修改失败'
      });
    }
  }
  async uploadAvatar(req, res) {
    try {
      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        }
      }).single('avatar');
      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: '文件上传失败: ' + err.message
          });
        }
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: '请选择要上传的图片'
          });
        }
        const userId = req.user.id;
        const filename = `avatar_${userId}_${Date.now()}.jpg`;
        const filepath = path.join(__dirname, '../../uploads/avatars', filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await sharp(req.file.buffer)
          .resize(200, 200)
          .jpeg({ quality: 80 })
          .toFile(filepath);
        const avatarUrl = `/uploads/avatars/${filename}`;
        await User.update(userId, { avatar_url: avatarUrl });
        logger.info(`Avatar uploaded successfully for user: ${userId}`);
        res.json({
          success: true,
          message: '头像上传成功',
          data: { avatar_url: avatarUrl }
        });
      });
    } catch (error) {
      logger.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: '头像上传失败'
      });
    }
  }
  async deleteAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
      }
      const userId = req.user.id;
      const { password } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存�?
        });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: '密码错误'
        });
      }
      await User.delete(userId);
      logger.info(`Account deleted successfully for user: ${userId}`);
      res.json({
        success: true,
        message: '账户删除成功'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: '删除账户失败'
      });
    }
  }
  async getDevices(req, res) {
    try {
      const userId = req.user.id;
      const devices = await Device.findByUserId(userId);
      res.json({
        success: true,
        data: { devices }
      });
    } catch (error) {
      logger.error('Get devices error:', error);
      res.status(500).json({
        success: false,
        message: '获取设备列表失败'
      });
    }
  }
  async logoutDevice(req, res) {
    try {
      const userId = req.user.id;
      const { deviceId } = req.params;
      const device = await Device.findById(deviceId);
      if (!device || device.user_id !== userId) {
        return res.status(404).json({
          success: false,
          message: '设备不存�?
        });
      }
      await Device.delete(deviceId);
      logger.info(`Device logged out: ${deviceId}`);
      res.json({
        success: true,
        message: '设备注销成功'
      });
    } catch (error) {
      logger.error('Logout device error:', error);
      res.status(500).json({
        success: false,
        message: '设备注销失败'
      });
    }
  }
    try {
      const { phone } = req.params;
      const existingUser = await User.findByPhone(phone);
      res.json({
        success: true,
        data: {
          available: !existingUser
        }
      });
    } catch (error) {
      logger.error('Check phone available error:', error);
      res.status(500).json({
        success: false,
        message: '检查手机号码失�?
      });
    }
  }
}
module.exports = AuthController; 
