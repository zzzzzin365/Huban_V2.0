const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const { redisUtils } = require('../config/redis');
const { blockchainEvidenceService } = require('../services/BlockchainService');

const router = express.Router();

// 输入验证规则
const emergencyContactValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('联系人姓名长度必须在2-50个字符之间'),
  body('phone')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号格式无效'),
  body('relationship')
    .isLength({ min: 2, max: 50 })
    .withMessage('关系描述长度必须在2-50个字符之间'),
  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('紧急联系人标识必须是布尔值'),
];

const helpRequestValidation = [
  body('type')
    .isIn(['medical', 'safety', 'transport', 'other'])
    .withMessage('求助类型无效'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('求助描述长度必须在10-500个字符之间'),
  body('location')
    .isObject()
    .withMessage('位置信息必须是对象'),
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('纬度必须在-90到90之间'),
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('经度必须在-180到180之间'),
  body('location.address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('地址不能超过200个字符'),
  body('urgency')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('紧急程度无效'),
];

// 获取紧急联系人列表
router.get('/contacts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 从缓存获取紧急联系人
    let contacts = await redisUtils.get(`emergency:contacts:${userId}`);
    
    if (!contacts) {
      // 缓存未命中，返回空数组
      contacts = [];
    }

    res.json({
      success: true,
      data: {
        contacts,
      },
    });
  } catch (error) {
    console.error('获取紧急联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '获取紧急联系人失败',
      code: 'GET_EMERGENCY_CONTACTS_FAILED',
    });
  }
});

// 添加紧急联系人
router.post('/contacts', auth, emergencyContactValidation, async (req, res) => {
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

    const { name, phone, relationship, isEmergency = false } = req.body;
    const userId = req.user.id;

    // 检查是否已存在相同手机号的联系人
    let contacts = await redisUtils.get(`emergency:contacts:${userId}`) || [];
    const existingContact = contacts.find(c => c.phone === phone);
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: '该手机号的联系人已存在',
        code: 'CONTACT_ALREADY_EXISTS',
      });
    }

    // 创建新联系人
    const newContact = {
      id: `contact_${Date.now()}`,
      name,
      phone,
      relationship,
      isEmergency,
      createTime: new Date().toISOString(),
    };

    // 添加到联系人列表
    contacts.push(newContact);
    
    // 更新缓存
    await redisUtils.set(`emergency:contacts:${userId}`, contacts, 86400 * 30); // 30天

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'emergency_contact',
        userId,
        contactId: newContact.id,
        contactName: name,
        contactPhone: phone,
        relationship,
        isEmergency,
        createTime: newContact.createTime,
      }, {
        type: 'emergency_service',
        category: 'contact_management',
        action: 'add',
      });
    } catch (blockchainError) {
      console.warn('紧急联系人区块链存证失败:', blockchainError);
    }

    res.status(201).json({
      success: true,
      message: '紧急联系人添加成功',
      data: {
        contact: newContact,
      },
    });
  } catch (error) {
    console.error('添加紧急联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '添加紧急联系人失败',
      code: 'ADD_EMERGENCY_CONTACT_FAILED',
    });
  }
});

// 更新紧急联系人
router.put('/contacts/:id', auth, emergencyContactValidation, async (req, res) => {
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
    const { name, phone, relationship, isEmergency } = req.body;
    const userId = req.user.id;

    // 获取联系人列表
    let contacts = await redisUtils.get(`emergency:contacts:${userId}`) || [];
    const contactIndex = contacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在',
        code: 'CONTACT_NOT_FOUND',
      });
    }

    // 检查手机号是否与其他联系人重复
    const otherContacts = contacts.filter(c => c.id !== id);
    const duplicatePhone = otherContacts.find(c => c.phone === phone);
    
    if (duplicatePhone) {
      return res.status(400).json({
        success: false,
        message: '该手机号已被其他联系人使用',
        code: 'PHONE_ALREADY_USED',
      });
    }

    // 更新联系人信息
    const oldContact = contacts[contactIndex];
    contacts[contactIndex] = {
      ...oldContact,
      name: name || oldContact.name,
      phone: phone || oldContact.phone,
      relationship: relationship || oldContact.relationship,
      isEmergency: isEmergency !== undefined ? isEmergency : oldContact.isEmergency,
      updateTime: new Date().toISOString(),
    };

    // 更新缓存
    await redisUtils.set(`emergency:contacts:${userId}`, contacts, 86400 * 30);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'emergency_contact_update',
        userId,
        contactId: id,
        oldContact,
        newContact: contacts[contactIndex],
        updateTime: contacts[contactIndex].updateTime,
      }, {
        type: 'emergency_service',
        category: 'contact_management',
        action: 'update',
      });
    } catch (blockchainError) {
      console.warn('紧急联系人更新区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '紧急联系人更新成功',
      data: {
        contact: contacts[contactIndex],
      },
    });
  } catch (error) {
    console.error('更新紧急联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '更新紧急联系人失败',
      code: 'UPDATE_EMERGENCY_CONTACT_FAILED',
    });
  }
});

// 删除紧急联系人
router.delete('/contacts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取联系人列表
    let contacts = await redisUtils.get(`emergency:contacts:${userId}`) || [];
    const contactIndex = contacts.findIndex(c => c.id === id);
    
    if (contactIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在',
        code: 'CONTACT_NOT_FOUND',
      });
    }

    // 获取要删除的联系人信息
    const deletedContact = contacts[contactIndex];

    // 从列表中删除
    contacts.splice(contactIndex, 1);
    
    // 更新缓存
    await redisUtils.set(`emergency:contacts:${userId}`, contacts, 86400 * 30);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'emergency_contact_delete',
        userId,
        contactId: id,
        deletedContact,
        deleteTime: new Date().toISOString(),
      }, {
        type: 'emergency_service',
        category: 'contact_management',
        action: 'delete',
      });
    } catch (blockchainError) {
      console.warn('紧急联系人删除区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '紧急联系人删除成功',
    });
  } catch (error) {
    console.error('删除紧急联系人失败:', error);
    res.status(500).json({
      success: false,
      message: '删除紧急联系人失败',
      code: 'DELETE_EMERGENCY_CONTACT_FAILED',
    });
  }
});

// 一键求助
router.post('/help', auth, helpRequestValidation, async (req, res) => {
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

    const { type, description, location, urgency } = req.body;
    const userId = req.user.id;

    // 创建求助请求
    const helpRequest = {
      id: `help_${Date.now()}`,
      userId,
      user: {
        id: req.user.id,
        username: req.user.username,
        phone: req.user.phone,
        realName: req.user.realName,
      },
      type,
      description,
      location,
      urgency,
      status: 'pending',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      volunteers: [],
      responses: [],
    };

    // 缓存求助请求
    await redisUtils.set(`emergency:help:${helpRequest.id}`, helpRequest, 86400); // 24小时

    // 添加到用户的求助历史
    let userHelpHistory = await redisUtils.get(`emergency:user_help_history:${userId}`) || [];
    userHelpHistory.unshift(helpRequest);
    
    // 限制历史记录数量（保留最近20条）
    if (userHelpHistory.length > 20) {
      userHelpHistory = userHelpHistory.slice(0, 20);
    }
    
    await redisUtils.set(`emergency:user_help_history:${userId}`, userHelpHistory, 86400 * 7); // 7天

    // 添加到紧急求助队列
    let emergencyQueue = await redisUtils.get('emergency:queue') || [];
    emergencyQueue.unshift(helpRequest);
    
    // 限制队列长度（保留最近100条）
    if (emergencyQueue.length > 100) {
      emergencyQueue = emergencyQueue.slice(0, 100);
    }
    
    await redisUtils.set('emergency:queue', emergencyQueue, 3600); // 1小时

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'emergency_help_request',
        helpId: helpRequest.id,
        userId,
        helpType: type,
        urgency,
        location,
        createTime: helpRequest.createTime,
      }, {
        type: 'emergency_service',
        category: 'help_request',
        urgency,
        location: `${location.latitude},${location.longitude}`,
      });
    } catch (blockchainError) {
      console.warn('紧急求助区块链存证失败:', blockchainError);
    }

    // TODO: 发送通知给附近的志愿者
    // 这里应该集成推送服务

    res.status(201).json({
      success: true,
      message: '求助请求已发送',
      data: {
        helpRequest,
        estimatedResponseTime: getEstimatedResponseTime(urgency),
      },
    });
  } catch (error) {
    console.error('发送求助请求失败:', error);
    res.status(500).json({
      success: false,
      message: '发送求助请求失败',
      code: 'SEND_HELP_REQUEST_FAILED',
    });
  }
});

// 获取求助历史
router.get('/help/history', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1到50之间'),
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

    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // 获取用户的求助历史
    let userHelpHistory = await redisUtils.get(`emergency:user_help_history:${userId}`) || [];
    
    // 分页处理
    const paginatedHistory = userHelpHistory.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        history: paginatedHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: userHelpHistory.length,
          totalPages: Math.ceil(userHelpHistory.length / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取求助历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取求助历史失败',
      code: 'GET_HELP_HISTORY_FAILED',
    });
  }
});

// 获取求助请求详情
router.get('/help/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取求助请求详情
    const helpRequest = await redisUtils.get(`emergency:help:${id}`);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '求助请求不存在',
        code: 'HELP_REQUEST_NOT_FOUND',
      });
    }

    // 检查权限（只能查看自己的求助请求）
    if (helpRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此求助请求',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    res.json({
      success: true,
      data: {
        helpRequest,
      },
    });
  } catch (error) {
    console.error('获取求助请求详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取求助请求详情失败',
      code: 'GET_HELP_REQUEST_DETAIL_FAILED',
    });
  }
});

// 取消求助请求
router.put('/help/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取求助请求详情
    const helpRequest = await redisUtils.get(`emergency:help:${id}`);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '求助请求不存在',
        code: 'HELP_REQUEST_NOT_FOUND',
      });
    }

    // 检查权限
    if (helpRequest.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '没有权限取消此求助请求',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    // 检查状态
    if (helpRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能取消待处理的求助请求',
        code: 'INVALID_STATUS_FOR_CANCELLATION',
      });
    }

    // 更新状态
    helpRequest.status = 'cancelled';
    helpRequest.updateTime = new Date().toISOString();
    helpRequest.cancelTime = new Date().toISOString();

    // 更新缓存
    await redisUtils.set(`emergency:help:${id}`, helpRequest, 86400);

    // 更新用户历史
    let userHelpHistory = await redisUtils.get(`emergency:user_help_history:${userId}`) || [];
    const historyIndex = userHelpHistory.findIndex(h => h.id === id);
    if (historyIndex !== -1) {
      userHelpHistory[historyIndex] = helpRequest;
      await redisUtils.set(`emergency:user_help_history:${userId}`, userHelpHistory, 86400 * 7);
    }

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'emergency_help_cancellation',
        helpId: id,
        userId,
        cancelTime: helpRequest.cancelTime,
        originalStatus: 'pending',
      }, {
        type: 'emergency_service',
        category: 'help_request',
        action: 'cancel',
      });
    } catch (blockchainError) {
      console.warn('求助取消区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '求助请求已取消',
      data: {
        helpRequest,
      },
    });
  } catch (error) {
    console.error('取消求助请求失败:', error);
    res.status(500).json({
      success: false,
      message: '取消求助请求失败',
      code: 'CANCEL_HELP_REQUEST_FAILED',
    });
  }
});

// 获取紧急服务信息
router.get('/services', optionalAuth, async (req, res) => {
  try {
    // 从缓存获取紧急服务信息
    let services = await redisUtils.get('emergency:services');

    if (!services) {
      // 缓存未命中，生成默认服务信息
      services = generateDefaultEmergencyServices();
      
      // 缓存结果（1小时）
      await redisUtils.set('emergency:services', services, 3600);
    }

    res.json({
      success: true,
      data: {
        services,
      },
    });
  } catch (error) {
    console.error('获取紧急服务信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取紧急服务信息失败',
      code: 'GET_EMERGENCY_SERVICES_FAILED',
    });
  }
});

// 获取安全提示
router.get('/safety-tips', optionalAuth, async (req, res) => {
  try {
    const { category } = req.query;
    
    // 从缓存获取安全提示
    let tips = await redisUtils.get(`emergency:safety_tips:${category || 'general'}`);

    if (!tips) {
      // 缓存未命中，生成默认提示
      tips = generateSafetyTips(category);
      
      // 缓存结果（2小时）
      await redisUtils.set(`emergency:safety_tips:${category || 'general'}`, tips, 7200);
    }

    res.json({
      success: true,
      data: {
        tips,
        category: category || 'general',
      },
    });
  } catch (error) {
    console.error('获取安全提示失败:', error);
    res.status(500).json({
      success: false,
      message: '获取安全提示失败',
      code: 'GET_SAFETY_TIPS_FAILED',
    });
  }
});

// 获取紧急求助统计
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户的求助统计
    let userStats = await redisUtils.get(`emergency:user_stats:${userId}`);

    if (!userStats) {
      // 缓存未命中，计算统计信息
      const userHelpHistory = await redisUtils.get(`emergency:user_help_history:${userId}`) || [];
      
      userStats = {
        totalRequests: userHelpHistory.length,
        pendingRequests: userHelpHistory.filter(h => h.status === 'pending').length,
        completedRequests: userHelpHistory.filter(h => h.status === 'completed').length,
        cancelledRequests: userHelpHistory.filter(h => h.status === 'cancelled').length,
        averageResponseTime: calculateAverageResponseTime(userHelpHistory),
        lastRequestTime: userHelpHistory.length > 0 ? userHelpHistory[0].createTime : null,
      };

      // 缓存统计信息（1小时）
      await redisUtils.set(`emergency:user_stats:${userId}`, userStats, 3600);
    }

    res.json({
      success: true,
      data: {
        stats: userStats,
      },
    });
  } catch (error) {
    console.error('获取紧急求助统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取紧急求助统计失败',
      code: 'GET_EMERGENCY_STATS_FAILED',
    });
  }
});

// 辅助函数

// 获取预估响应时间
function getEstimatedResponseTime(urgency) {
  const responseTimes = {
    low: '30-60分钟',
    medium: '15-30分钟',
    high: '5-15分钟',
    critical: '立即响应',
  };
  
  return responseTimes[urgency] || '15-30分钟';
}

// 生成默认紧急服务信息
function generateDefaultEmergencyServices() {
  return {
    police: {
      name: '警察',
      phone: '110',
      description: '紧急报警、治安事件、交通事故等',
      responseTime: '5-10分钟',
    },
    ambulance: {
      name: '急救',
      phone: '120',
      description: '医疗急救、突发疾病、意外伤害等',
      responseTime: '5-15分钟',
    },
    fire: {
      name: '消防',
      phone: '119',
      description: '火灾、救援、危险品事故等',
      responseTime: '5-10分钟',
    },
    traffic: {
      name: '交通',
      phone: '122',
      description: '交通事故、交通违法、道路救援等',
      responseTime: '10-20分钟',
    },
  };
}

// 生成安全提示
function generateSafetyTips(category) {
  const tipsByCategory = {
    home: [
      '确保门窗锁好，安装防盗报警器',
      '定期检查电器设备，避免火灾隐患',
      '准备应急包，包含手电筒、急救用品等',
      '熟悉逃生路线，定期进行安全演练',
    ],
    outdoor: [
      '外出时告知家人去向和预计返回时间',
      '避免单独在偏僻地方行走',
      '随身携带手机和紧急联系人信息',
      '注意周围环境，发现异常及时报警',
    ],
    travel: [
      '提前了解目的地安全情况',
      '保存当地紧急联系电话',
      '避免携带大量现金和贵重物品',
      '保持与家人联系，及时报告行程',
    ],
    general: [
      '记住紧急联系电话：110、120、119、122',
      '保持冷静，理性应对紧急情况',
      '及时向家人和朋友报告位置',
      '学习基本的急救知识和技能',
    ],
  };

  return tipsByCategory[category] || tipsByCategory.general;
}

// 计算平均响应时间
function calculateAverageResponseTime(helpHistory) {
  const completedRequests = helpHistory.filter(h => h.status === 'completed' && h.responseTime);
  
  if (completedRequests.length === 0) {
    return '暂无数据';
  }

  const totalResponseTime = completedRequests.reduce((sum, request) => {
    return sum + (request.responseTime || 0);
  }, 0);

  const averageMinutes = Math.round(totalResponseTime / completedRequests.length);
  
  if (averageMinutes < 60) {
    return `${averageMinutes}分钟`;
  } else {
    const hours = Math.floor(averageMinutes / 60);
    const minutes = averageMinutes % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
}

module.exports = router; 
