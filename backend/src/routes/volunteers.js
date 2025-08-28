const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { User, Volunteer } = require('../models');
const { auth, requireVolunteer, requireRole } = require('../middleware/auth');
const { redisUtils } = require('../config/redis');
const { blockchainEvidenceService } = require('../services/BlockchainService');

const router = express.Router();

// 输入验证规则
const volunteerRegistrationValidation = [
  body('skills')
    .isArray({ min: 1 })
    .withMessage('至少需要选择一个技能'),
  body('skills.*')
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('技能名称长度必须在1-50个字符之间'),
  body('experience')
    .isInt({ min: 0, max: 50 })
    .withMessage('经验年限必须在0-50年之间'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('个人简介不能超过500个字符'),
  body('availability.weekdays')
    .isBoolean()
    .withMessage('工作日可用性必须是布尔值'),
  body('availability.weekends')
    .isBoolean()
    .withMessage('周末可用性必须是布尔值'),
  body('availability.hours')
    .isArray()
    .withMessage('可用时间段必须是数组'),
  body('availability.hours.*')
    .matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/)
    .withMessage('时间段格式必须是 HH:MM-HH:MM'),
  body('emergencyContact.name')
    .optional()
    .isLength({ max: 50 })
    .withMessage('紧急联系人姓名不能超过50个字符'),
  body('emergencyContact.phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('紧急联系人手机号格式无效'),
  body('emergencyContact.relationship')
    .optional()
    .isLength({ max: 50 })
    .withMessage('关系描述不能超过50个字符'),
];

const locationUpdateValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址不能超过200个字符'),
];

const searchValidation = [
  query('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  query('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('搜索半径必须在0.1到100公里之间'),
  query('skills')
    .optional()
    .isString()
    .withMessage('技能参数必须是字符串'),
  query('category')
    .optional()
    .isString()
    .withMessage('类别参数必须是字符串'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制数量必须在1到100之间'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
];

// 志愿者注册
router.post('/register', auth, volunteerRegistrationValidation, async (req, res) => {
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

    // 检查用户是否已经是志愿者
    const existingVolunteer = await Volunteer.findOne({
      where: { userId: req.user.id },
    });

    if (existingVolunteer) {
      return res.status(400).json({
        success: false,
        message: '您已经是志愿者了',
        code: 'ALREADY_VOLUNTEER',
      });
    }

    // 创建志愿者记录
    const volunteer = await Volunteer.create({
      userId: req.user.id,
      skills: req.body.skills,
      experience: req.body.experience,
      certifications: req.body.certifications || [],
      availability: req.body.availability,
      bio: req.body.bio,
      emergencyContact: req.body.emergencyContact,
      preferences: req.body.preferences || {
        maxDistance: 10,
        preferredCategories: [],
        maxHoursPerDay: 8,
      },
    });

    // 更新用户角色为志愿者
    await req.user.update({ role: 'volunteer' });

    // 缓存志愿者信息
    await redisUtils.set(`volunteer:${volunteer.id}`, volunteer.toJSON(), 3600);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeVolunteerVerification(volunteer.volunteerId, {
        type: 'registration',
        verifier: req.user.id,
        method: 'self_registration',
        additionalInfo: {
          skills: volunteer.skills,
          experience: volunteer.experience,
        },
      });
    } catch (blockchainError) {
      console.warn('区块链存证失败:', blockchainError);
      // 不影响主要流程
    }

    res.status(201).json({
      success: true,
      message: '志愿者注册成功',
      data: {
        volunteer: volunteer.toJSON(),
      },
    });
  } catch (error) {
    console.error('志愿者注册失败:', error);
    res.status(500).json({
      success: false,
      message: '志愿者注册失败',
      code: 'VOLUNTEER_REGISTRATION_FAILED',
    });
  }
});

// 获取志愿者列表
router.get('/', searchValidation, async (req, res) => {
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

    const {
      latitude,
      longitude,
      radius = 10,
      skills,
      category,
      limit = 20,
      page = 1,
    } = req.query;

    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {
      status: 'active',
      isOnline: true,
    };

    // 技能筛选
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      where.skills = {
        [require('sequelize').Op.overlap]: skillArray,
      };
    }

    // 类别筛选
    if (category) {
      where.skills = {
        [require('sequelize').Op.overlap]: [category],
      };
    }

    // 查询志愿者
    let volunteers;
    if (latitude && longitude) {
      // 地理位置搜索
      volunteers = await Volunteer.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        parseInt(limit)
      );
    } else {
      // 普通搜索
      volunteers = await Volunteer.findAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['rating', 'DESC'], ['totalHelps', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'realName', 'avatar', 'phone'],
        }],
      });
    }

    // 获取总数
    const total = await Volunteer.count({ where });

    res.json({
      success: true,
      data: {
        volunteers: volunteers.map(v => ({
          ...v.toJSON(),
          user: v.user,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取志愿者列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取志愿者列表失败',
      code: 'GET_VOLUNTEERS_FAILED',
    });
  }
});

// 获取附近志愿者
router.get('/nearby', searchValidation, async (req, res) => {
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

    const { latitude, longitude, radius = 10, skills, limit = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: '必须提供经纬度坐标',
        code: 'COORDINATES_REQUIRED',
      });
    }

    // 查询附近志愿者
    let volunteers = await Volunteer.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius),
      parseInt(limit)
    );

    // 技能筛选
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      volunteers = volunteers.filter(v => 
        v.skills.some(skill => skillArray.includes(skill))
      );
    }

    // 包含用户信息
    const volunteersWithUser = await Promise.all(
      volunteers.map(async (volunteer) => {
        const user = await User.findByPk(volunteer.userId, {
          attributes: ['id', 'username', 'realName', 'avatar', 'phone'],
        });
        return {
          ...volunteer.toJSON(),
          user,
        };
      })
    );

    res.json({
      success: true,
      data: {
        volunteers: volunteersWithUser,
        searchParams: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseFloat(radius),
          skills,
        },
      },
    });
  } catch (error) {
    console.error('获取附近志愿者失败:', error);
    res.status(500).json({
      success: false,
      message: '获取附近志愿者失败',
      code: 'GET_NEARBY_VOLUNTEERS_FAILED',
    });
  }
});

// 获取志愿者详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 先从缓存获取
    let volunteer = await redisUtils.get(`volunteer:${id}`);
    
    if (!volunteer) {
      // 缓存未命中，从数据库获取
      volunteer = await Volunteer.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'realName', 'avatar', 'phone', 'email'],
        }],
      });

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: '志愿者不存在',
          code: 'VOLUNTEER_NOT_FOUND',
        });
      }

      // 缓存志愿者信息
      await redisUtils.set(`volunteer:${id}`, volunteer.toJSON(), 3600);
    }

    res.json({
      success: true,
      data: {
        volunteer,
      },
    });
  } catch (error) {
    console.error('获取志愿者详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取志愿者详情失败',
      code: 'GET_VOLUNTEER_DETAIL_FAILED',
    });
  }
});

// 更新志愿者信息
router.put('/:id', requireVolunteer, async (req, res) => {
  try {
    const { id } = req.params;
    const volunteer = req.volunteer;

    // 验证权限
    if (volunteer.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此志愿者信息',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    const updateData = {};
    const allowedFields = [
      'skills', 'experience', 'certifications', 'availability', 
      'bio', 'emergencyContact', 'preferences'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // 更新志愿者信息
    await volunteer.update(updateData);

    // 更新缓存
    await redisUtils.set(`volunteer:${id}`, volunteer.toJSON(), 3600);

    res.json({
      success: true,
      message: '志愿者信息更新成功',
      data: {
        volunteer: volunteer.toJSON(),
      },
    });
  } catch (error) {
    console.error('更新志愿者信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新志愿者信息失败',
      code: 'UPDATE_VOLUNTEER_FAILED',
    });
  }
});

// 更新志愿者位置
router.put('/:id/location', requireVolunteer, locationUpdateValidation, async (req, res) => {
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

    const { id } = req.params;
    const volunteer = req.volunteer;

    // 验证权限
    if (volunteer.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此志愿者位置',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    const { latitude, longitude, address } = req.body;

    // 更新位置
    await volunteer.updateLocation(latitude, longitude, address);

    // 更新缓存
    await redisUtils.set(`volunteer:${id}`, volunteer.toJSON(), 3600);

    res.json({
      success: true,
      message: '位置更新成功',
      data: {
        location: volunteer.location,
      },
    });
  } catch (error) {
    console.error('更新志愿者位置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新位置失败',
      code: 'UPDATE_LOCATION_FAILED',
    });
  }
});

// 更新志愿者在线状态
router.put('/:id/status', requireVolunteer, [
  body('isOnline')
    .isBoolean()
    .withMessage('在线状态必须是布尔值'),
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

    const { id } = req.params;
    const volunteer = req.volunteer;
    const { isOnline } = req.body;

    // 验证权限
    if (volunteer.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此志愿者状态',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // 更新在线状态
    await volunteer.update({
      isOnline,
      lastActive: isOnline ? new Date() : volunteer.lastActive,
    });

    // 更新缓存
    await redisUtils.set(`volunteer:${id}`, volunteer.toJSON(), 3600);

    res.json({
      success: true,
      message: `已${isOnline ? '上线' : '下线'}`,
      data: {
        isOnline,
        lastActive: volunteer.lastActive,
      },
    });
  } catch (error) {
    console.error('更新志愿者状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      code: 'UPDATE_STATUS_FAILED',
    });
  }
});

// 获取志愿者统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const volunteer = await Volunteer.findByPk(id, {
      attributes: ['id', 'totalHelps', 'totalHours', 'rating', 'totalRatings'],
    });

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: '志愿者不存在',
        code: 'VOLUNTEER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalHelps: volunteer.totalHelps,
          totalHours: volunteer.totalHours,
          rating: volunteer.rating,
          totalRatings: volunteer.totalRatings,
        },
      },
    });
  } catch (error) {
    console.error('获取志愿者统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计失败',
      code: 'GET_VOLUNTEER_STATS_FAILED',
    });
  }
});

// 管理员：获取所有志愿者（分页）
router.get('/admin/all', requireRole(['admin', 'super_admin']), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('限制数量必须在1到100之间'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended', 'pending_verification'])
    .withMessage('状态值无效'),
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

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const where = {};
    if (status) {
      where.status = status;
    }

    // 查询志愿者
    const { count, rows: volunteers } = await Volunteer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'realName', 'email', 'phone', 'status'],
      }],
    });

    res.json({
      success: true,
      data: {
        volunteers: volunteers.map(v => ({
          ...v.toJSON(),
          user: v.user,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('管理员获取志愿者列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取志愿者列表失败',
      code: 'ADMIN_GET_VOLUNTEERS_FAILED',
    });
  }
});

// 管理员：更新志愿者状态
router.put('/admin/:id/status', requireRole(['admin', 'super_admin']), [
  body('status')
    .isIn(['active', 'inactive', 'suspended', 'pending_verification'])
    .withMessage('状态值无效'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('原因不能超过200个字符'),
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

    const { id } = req.params;
    const { status, reason } = req.body;

    const volunteer = await Volunteer.findByPk(id);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: '志愿者不存在',
        code: 'VOLUNTEER_NOT_FOUND',
      });
    }

    // 更新状态
    await volunteer.update({ status });

    // 更新缓存
    await redisUtils.set(`volunteer:${id}`, volunteer.toJSON(), 3600);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeVolunteerVerification(volunteer.volunteerId, {
        type: 'status_change',
        verifier: req.user.id,
        method: 'admin_action',
        additionalInfo: {
          oldStatus: volunteer.status,
          newStatus: status,
          reason,
          adminId: req.user.id,
        },
      });
    } catch (blockchainError) {
      console.warn('区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '志愿者状态更新成功',
      data: {
        volunteer: volunteer.toJSON(),
      },
    });
  } catch (error) {
    console.error('管理员更新志愿者状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新状态失败',
      code: 'ADMIN_UPDATE_VOLUNTEER_STATUS_FAILED',
    });
  }
});

module.exports = router; 
