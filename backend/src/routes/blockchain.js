const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const { redisUtils } = require('../config/redis');
const { blockchainEvidenceService } = require('../services/BlockchainService');

const router = express.Router();

// 输入验证规则
const evidenceValidation = [
  body('type')
    .isLength({ min: 2, max: 100 })
    .withMessage('证据类型长度必须在2-100个字符之间'),
  body('data')
    .isObject()
    .withMessage('证据数据必须是对象'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('元数据必须是对象'),
  body('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('分类不能超过100个字符'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('过期日期格式无效'),
];

const batchEvidenceValidation = [
  body('evidences')
    .isArray({ min: 1, max: 100 })
    .withMessage('证据数组长度必须在1-100之间'),
  body('evidences.*.type')
    .isLength({ min: 2, max: 100 })
    .withMessage('证据类型长度必须在2-100个字符之间'),
  body('evidences.*.data')
    .isObject()
    .withMessage('证据数据必须是对象'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('元数据必须是对象'),
];

const verificationValidation = [
  body('evidenceId')
    .isLength({ min: 1, max: 100 })
    .withMessage('证据ID长度必须在1-100个字符之间'),
  body('verificationMethod')
    .isIn(['blockchain', 'cache', 'both'])
    .withMessage('验证方法无效'),
  body('includeProof')
    .optional()
    .isBoolean()
    .withMessage('包含证明必须是布尔值'),
];

// 存储单个证据
router.post('/evidence', auth, evidenceValidation, async (req, res) => {
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

    const { type, data, metadata = {}, category, tags = [], expiryDate } = req.body;
    const userId = req.user.id;

    // 生成证据哈希
    const evidenceHash = await blockchainEvidenceService.generateHash({
      type,
      data,
      metadata,
      userId,
      timestamp: new Date().toISOString(),
    });

    // 存储证据到区块链和缓存
    const evidence = await blockchainEvidenceService.storeEvidence({
      type,
      data,
      metadata: {
        ...metadata,
        userId,
        category,
        tags,
        createTime: new Date().toISOString(),
        expiryDate,
      },
      hash: evidenceHash,
    }, {
      type: 'evidence_storage',
      category: category || 'general',
      action: 'store',
      userId,
    });

    // 缓存证据信息
    await redisUtils.set(`blockchain:evidence:${evidence.hash}`, evidence, 86400 * 30); // 30天

    // 添加到用户证据列表
    let userEvidenceList = await redisUtils.get(`blockchain:user_evidence:${userId}`) || [];
    userEvidenceList.unshift({
      hash: evidence.hash,
      type,
      category,
      createTime: evidence.createTime,
      status: evidence.status,
    });
    
    // 限制列表长度（保留最近100条）
    if (userEvidenceList.length > 100) {
      userEvidenceList = userEvidenceList.slice(0, 100);
    }
    
    await redisUtils.set(`blockchain:user_evidence:${userId}`, userEvidenceList, 86400 * 30);

    res.status(201).json({
      success: true,
      message: '证据存储成功',
      data: {
        evidence: {
          hash: evidence.hash,
          type,
          category,
          createTime: evidence.createTime,
          status: evidence.status,
          network: evidence.network,
          transactionHash: evidence.transactionHash,
        },
      },
    });
  } catch (error) {
    console.error('存储证据失败:', error);
    res.status(500).json({
      success: false,
      message: '存储证据失败',
      code: 'STORE_EVIDENCE_FAILED',
      error: error.message,
    });
  }
});

// 批量存储证据
router.post('/evidence/batch', auth, batchEvidenceValidation, async (req, res) => {
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

    const { evidences, metadata = {} } = req.body;
    const userId = req.user.id;

    // 批量存储证据
    const results = await blockchainEvidenceService.storeMultipleEvidence(
      evidences.map(evidence => ({
        ...evidence,
        metadata: {
          ...evidence.metadata,
          userId,
          batchId: `batch_${Date.now()}`,
          createTime: new Date().toISOString(),
        },
      })),
      {
        type: 'evidence_storage',
        category: 'batch',
        action: 'store_multiple',
        userId,
        count: evidences.length,
      }
    );

    // 缓存批量证据信息
    const batchId = `batch_${Date.now()}`;
    await redisUtils.set(`blockchain:batch:${batchId}`, {
      batchId,
      userId,
      count: evidences.length,
      results,
      createTime: new Date().toISOString(),
    }, 86400 * 30);

    // 更新用户证据列表
    let userEvidenceList = await redisUtils.get(`blockchain:user_evidence:${userId}`) || [];
    const newEvidenceItems = results.map(result => ({
      hash: result.hash,
      type: result.type,
      category: result.metadata?.category || 'general',
      createTime: result.createTime,
      status: result.status,
      batchId,
    }));
    
    userEvidenceList.unshift(...newEvidenceItems);
    
    // 限制列表长度
    if (userEvidenceList.length > 100) {
      userEvidenceList = userEvidenceList.slice(0, 100);
    }
    
    await redisUtils.set(`blockchain:user_evidence:${userId}`, userEvidenceList, 86400 * 30);

    res.status(201).json({
      success: true,
      message: '批量证据存储成功',
      data: {
        batchId,
        count: evidences.length,
        results: results.map(result => ({
          hash: result.hash,
          type: result.type,
          status: result.status,
          network: result.network,
          transactionHash: result.transactionHash,
        })),
      },
    });
  } catch (error) {
    console.error('批量存储证据失败:', error);
    res.status(500).json({
      success: false,
      message: '批量存储证据失败',
      code: 'STORE_BATCH_EVIDENCE_FAILED',
      error: error.message,
    });
  }
});

// 验证证据
router.post('/evidence/verify', auth, verificationValidation, async (req, res) => {
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

    const { evidenceId, verificationMethod = 'both', includeProof = false } = req.body;

    // 验证证据
    const verificationResult = await blockchainEvidenceService.verifyEvidence(
      evidenceId,
      verificationMethod,
      includeProof
    );

    res.json({
      success: true,
      message: '证据验证完成',
      data: {
        evidenceId,
        isValid: verificationResult.isValid,
        verificationMethod,
        verificationTime: new Date().toISOString(),
        details: verificationResult.details,
        proof: includeProof ? verificationResult.proof : undefined,
      },
    });
  } catch (error) {
    console.error('验证证据失败:', error);
    res.status(500).json({
      success: false,
      message: '验证证据失败',
      code: 'VERIFY_EVIDENCE_FAILED',
      error: error.message,
    });
  }
});

// 获取证据详情
router.get('/evidence/:hash', auth, async (req, res) => {
  try {
    const { hash } = req.params;
    const userId = req.user.id;

    // 从缓存获取证据信息
    let evidence = await redisUtils.get(`blockchain:evidence:${hash}`);
    
    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: '证据不存在',
        code: 'EVIDENCE_NOT_FOUND',
      });
    }

    // 检查权限（只能查看自己的证据，除非是管理员）
    if (evidence.metadata?.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此证据',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    res.json({
      success: true,
      data: {
        evidence: {
          hash: evidence.hash,
          type: evidence.type,
          data: evidence.data,
          metadata: evidence.metadata,
          createTime: evidence.createTime,
          status: evidence.status,
          network: evidence.network,
          transactionHash: evidence.transactionHash,
        },
      },
    });
  } catch (error) {
    console.error('获取证据详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取证据详情失败',
      code: 'GET_EVIDENCE_DETAIL_FAILED',
    });
  }
});

// 获取用户证据列表
router.get('/evidence', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1到50之间'),
  query('type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('类型不能超过100个字符'),
  query('category')
    .optional()
    .isLength({ max: 100 })
    .withMessage('分类不能超过100个字符'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'failed'])
    .withMessage('状态无效'),
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

    const { page = 1, limit = 20, type, category, status } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // 获取用户证据列表
    let userEvidenceList = await redisUtils.get(`blockchain:user_evidence:${userId}`) || [];
    
    // 应用过滤条件
    let filteredList = userEvidenceList;
    
    if (type) {
      filteredList = filteredList.filter(item => item.type === type);
    }
    
    if (category) {
      filteredList = filteredList.filter(item => item.category === category);
    }
    
    if (status) {
      filteredList = filteredList.filter(item => item.status === status);
    }

    // 分页处理
    const paginatedList = filteredList.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        evidence: paginatedList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredList.length,
          totalPages: Math.ceil(filteredList.length / limit),
        },
        filters: {
          type,
          category,
          status,
        },
      },
    });
  } catch (error) {
    console.error('获取用户证据列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户证据列表失败',
      code: 'GET_USER_EVIDENCE_LIST_FAILED',
    });
  }
});

// 获取证据统计信息
router.get('/evidence/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用户证据统计
    let userStats = await redisUtils.get(`blockchain:user_stats:${userId}`);

    if (!userStats) {
      // 缓存未命中，计算统计信息
      const userEvidenceList = await redisUtils.get(`blockchain:user_evidence:${userId}`) || [];
      
      userStats = {
        totalEvidence: userEvidenceList.length,
        confirmedEvidence: userEvidenceList.filter(item => item.status === 'confirmed').length,
        pendingEvidence: userEvidenceList.filter(item => item.status === 'pending').length,
        failedEvidence: userEvidenceList.filter(item => item.status === 'failed').length,
        byType: {},
        byCategory: {},
        lastEvidenceTime: userEvidenceList.length > 0 ? userEvidenceList[0].createTime : null,
      };

      // 按类型统计
      userEvidenceList.forEach(item => {
        userStats.byType[item.type] = (userStats.byType[item.type] || 0) + 1;
        userStats.byCategory[item.category] = (userStats.byCategory[item.category] || 0) + 1;
      });

      // 缓存统计信息（1小时）
      await redisUtils.set(`blockchain:user_stats:${userId}`, userStats, 3600);
    }

    res.json({
      success: true,
      data: {
        stats: userStats,
      },
    });
  } catch (error) {
    console.error('获取证据统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取证据统计失败',
      code: 'GET_EVIDENCE_STATS_FAILED',
    });
  }
});

// 获取区块链网络信息
router.get('/network/info', auth, async (req, res) => {
  try {
    const { network = 'default' } = req.query;

    // 获取网络信息
    const networkInfo = await blockchainEvidenceService.getNetworkInfo(network);

    res.json({
      success: true,
      data: {
        network,
        info: networkInfo,
      },
    });
  } catch (error) {
    console.error('获取网络信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取网络信息失败',
      code: 'GET_NETWORK_INFO_FAILED',
      error: error.message,
    });
  }
});

// 获取钱包余额
router.get('/wallet/balance', auth, async (req, res) => {
  try {
    const { network = 'default' } = req.query;

    // 获取钱包余额
    const balance = await blockchainEvidenceService.getBalance(network);

    res.json({
      success: true,
      data: {
        network,
        balance: {
          wei: balance.toString(),
          ether: (parseFloat(balance) / 1e18).toFixed(6),
        },
      },
    });
  } catch (error) {
    console.error('获取钱包余额失败:', error);
    res.status(500).json({
      success: false,
      message: '获取钱包余额失败',
      code: 'GET_WALLET_BALANCE_FAILED',
      error: error.message,
    });
  }
});

// 切换区块链网络
router.post('/network/switch', auth, [
  body('network')
    .isIn(['ethereum', 'polygon', 'bsc'])
    .withMessage('网络类型无效'),
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

    const { network } = req.body;

    // 切换网络
    const result = await blockchainEvidenceService.switchNetwork(network);

    res.json({
      success: true,
      message: '网络切换成功',
      data: {
        network,
        result,
      },
    });
  } catch (error) {
    console.error('切换网络失败:', error);
    res.status(500).json({
      success: false,
      message: '切换网络失败',
      code: 'SWITCH_NETWORK_FAILED',
      error: error.message,
    });
  }
});

// 获取系统统计信息（管理员专用）
router.get('/system/stats', requireRole('admin'), async (req, res) => {
  try {
    // 获取系统级统计信息
    const systemStats = await blockchainEvidenceService.getEvidenceStats();

    res.json({
      success: true,
      data: {
        systemStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统统计失败',
      code: 'GET_SYSTEM_STATS_FAILED',
      error: error.message,
    });
  }
});

// 重新同步证据状态
router.post('/evidence/sync', requireRole('admin'), [
  body('evidenceHashes')
    .isArray({ min: 1, max: 100 })
    .withMessage('证据哈希数组长度必须在1-100之间'),
  body('force')
    .optional()
    .isBoolean()
    .withMessage('强制同步必须是布尔值'),
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

    const { evidenceHashes, force = false } = req.body;

    // 重新同步证据状态
    const syncResults = [];
    
    for (const hash of evidenceHashes) {
      try {
        const result = await blockchainEvidenceService.verifyEvidence(hash, 'blockchain', false);
        syncResults.push({
          hash,
          success: true,
          status: result.details?.status || 'unknown',
        });
        
        // 更新缓存中的状态
        const cachedEvidence = await redisUtils.get(`blockchain:evidence:${hash}`);
        if (cachedEvidence) {
          cachedEvidence.status = result.details?.status || 'unknown';
          cachedEvidence.lastSyncTime = new Date().toISOString();
          await redisUtils.set(`blockchain:evidence:${hash}`, cachedEvidence, 86400 * 30);
        }
      } catch (error) {
        syncResults.push({
          hash,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: '证据状态同步完成',
      data: {
        totalCount: evidenceHashes.length,
        successCount: syncResults.filter(r => r.success).length,
        failedCount: syncResults.filter(r => !r.success).length,
        results: syncResults,
      },
    });
  } catch (error) {
    console.error('同步证据状态失败:', error);
    res.status(500).json({
      success: false,
      message: '同步证据状态失败',
      code: 'SYNC_EVIDENCE_STATUS_FAILED',
      error: error.message,
    });
  }
});

// 清理过期证据
router.post('/evidence/cleanup', requireRole('admin'), [
  body('dryRun')
    .optional()
    .isBoolean()
    .withMessage('试运行必须是布尔值'),
  body('maxAge')
    .optional()
    .isInt({ min: 1 })
    .withMessage('最大年龄必须是正整数'),
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

    const { dryRun = true, maxAge = 365 } = req.query; // 默认365天

    // 获取所有证据
    const allEvidenceKeys = await redisUtils.keys('blockchain:evidence:*');
    const expiredEvidence = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);

    // 检查过期证据
    for (const key of allEvidenceKeys) {
      const evidence = await redisUtils.get(key);
      if (evidence && evidence.metadata?.expiryDate) {
        const expiryDate = new Date(evidence.metadata.expiryDate);
        if (expiryDate < cutoffDate) {
          expiredEvidence.push({
            key,
            hash: evidence.hash,
            expiryDate: evidence.metadata.expiryDate,
          });
        }
      }
    }

    if (dryRun) {
      res.json({
        success: true,
        message: '试运行完成',
        data: {
          dryRun: true,
          totalEvidence: allEvidenceKeys.length,
          expiredEvidence: expiredEvidence.length,
          expiredList: expiredEvidence,
          cutoffDate: cutoffDate.toISOString(),
        },
      });
    } else {
      // 实际清理
      let cleanedCount = 0;
      for (const item of expiredEvidence) {
        try {
          await redisUtils.del(item.key);
          cleanedCount++;
        } catch (error) {
          console.error(`清理证据失败: ${item.key}`, error);
        }
      }

      res.json({
        success: true,
        message: '证据清理完成',
        data: {
          dryRun: false,
          totalEvidence: allEvidenceKeys.length,
          expiredEvidence: expiredEvidence.length,
          cleanedCount,
          cutoffDate: cutoffDate.toISOString(),
        },
      });
    }
  } catch (error) {
    console.error('清理过期证据失败:', error);
    res.status(500).json({
      success: false,
      message: '清理过期证据失败',
      code: 'CLEANUP_EXPIRED_EVIDENCE_FAILED',
      error: error.message,
    });
  }
});

module.exports = router; 
