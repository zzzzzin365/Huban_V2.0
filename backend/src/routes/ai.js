const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, optionalAuth } = require('../middleware/auth');
const { redisUtils } = require('../config/redis');
const { blockchainEvidenceService } = require('../services/BlockchainService');

const router = express.Router();

// 输入验证规则
const chatValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('消息长度必须在1-1000个字符之间'),
  body('context')
    .optional()
    .isObject()
    .withMessage('上下文必须是对象'),
  body('model')
    .optional()
    .isIn(['gpt-3.5-turbo', 'gpt-4', 'claude-3', 'custom'])
    .withMessage('模型选择无效'),
];

const speechToTextValidation = [
  body('audioData')
    .notEmpty()
    .withMessage('音频数据不能为空'),
  body('format')
    .optional()
    .isIn(['wav', 'mp3', 'm4a', 'flac'])
    .withMessage('音频格式不支持'),
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
    .withMessage('语言不支持'),
];

const textToSpeechValidation = [
  body('text')
    .isLength({ min: 1, max: 1000 })
    .withMessage('文本长度必须在1-1000个字符之间'),
  body('voice')
    .optional()
    .isIn(['male', 'female', 'child', 'elderly'])
    .withMessage('语音类型无效'),
  body('speed')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage('语速必须在0.5到2.0之间'),
  body('language')
    .optional()
    .isIn(['zh-CN', 'en-US', 'ja-JP', 'ko-KR'])
    .withMessage('语言不支持'),
];

// AI智能对话
router.post('/chat', optionalAuth, chatValidation, async (req, res) => {
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

    const { message, context = {}, model = 'gpt-3.5-turbo' } = req.body;
    const userId = req.user?.id || 'anonymous';

    // 构建对话上下文
    const conversationContext = {
      userId,
      timestamp: new Date().toISOString(),
      model,
      context,
      message,
    };

    // 从缓存获取历史对话
    const cacheKey = `chat:${userId}`;
    let chatHistory = await redisUtils.get(cacheKey) || [];
    
    // 添加当前消息到历史
    chatHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // 限制历史记录长度（保留最近20条）
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    // 调用AI服务（这里使用模拟响应）
    const aiResponse = await generateAIResponse(message, chatHistory, model);

    // 添加AI响应到历史
    chatHistory.push({
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date().toISOString(),
    });

    // 更新缓存
    await redisUtils.set(cacheKey, chatHistory, 3600); // 1小时过期

    // 区块链存证（如果用户已认证）
    if (req.user) {
      try {
        await blockchainEvidenceService.storeEvidence({
          type: 'ai_chat',
          userId: req.user.id,
          message,
          response: aiResponse.content,
          model,
          timestamp: new Date().toISOString(),
        }, {
          type: 'ai_interaction',
          category: 'chat',
          model,
        });
      } catch (blockchainError) {
        console.warn('AI对话区块链存证失败:', blockchainError);
      }
    }

    res.json({
      success: true,
      data: {
        response: aiResponse.content,
        model,
        timestamp: new Date().toISOString(),
        conversationId: cacheKey,
      },
    });
  } catch (error) {
    console.error('AI对话失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI对话失败',
      code: 'AI_CHAT_FAILED',
    });
  }
});

// 语音转文字
router.post('/speech-to-text', optionalAuth, speechToTextValidation, async (req, res) => {
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

    const { audioData, format = 'wav', language = 'zh-CN' } = req.body;
    const userId = req.user?.id || 'anonymous';

    // 模拟语音识别处理
    const transcript = await processSpeechToText(audioData, format, language);

    // 缓存识别结果
    const cacheKey = `stt:${userId}:${Date.now()}`;
    await redisUtils.set(cacheKey, {
      transcript,
      format,
      language,
      timestamp: new Date().toISOString(),
    }, 86400); // 24小时过期

    // 区块链存证（如果用户已认证）
    if (req.user) {
      try {
        await blockchainEvidenceService.storeEvidence({
          type: 'speech_to_text',
          userId: req.user.id,
          transcript,
          format,
          language,
          timestamp: new Date().toISOString(),
        }, {
          type: 'ai_interaction',
          category: 'speech_recognition',
          format,
          language,
        });
      } catch (blockchainError) {
        console.warn('语音识别区块链存证失败:', blockchainError);
      }
    }

    res.json({
      success: true,
      data: {
        transcript,
        confidence: 0.95, // 模拟置信度
        format,
        language,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    });
  } catch (error) {
    console.error('语音转文字失败:', error);
    res.status(500).json({
      success: false,
      message: '语音转文字失败',
      code: 'SPEECH_TO_TEXT_FAILED',
    });
  }
});

// 文字转语音
router.post('/text-to-speech', optionalAuth, textToSpeechValidation, async (req, res) => {
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

    const { text, voice = 'female', speed = 1.0, language = 'zh-CN' } = req.body;
    const userId = req.user?.id || 'anonymous';

    // 模拟语音合成处理
    const audioUrl = await processTextToSpeech(text, voice, speed, language);

    // 缓存合成结果
    const cacheKey = `tts:${userId}:${Date.now()}`;
    await redisUtils.set(cacheKey, {
      text,
      voice,
      speed,
      language,
      audioUrl,
      timestamp: new Date().toISOString(),
    }, 86400); // 24小时过期

    // 区块链存证（如果用户已认证）
    if (req.user) {
      try {
        await blockchainEvidenceService.storeEvidence({
          type: 'text_to_speech',
          userId: req.user.id,
          text,
          voice,
          speed,
          language,
          audioUrl,
          timestamp: new Date().toISOString(),
        }, {
          type: 'ai_interaction',
          category: 'speech_synthesis',
          voice,
          language,
        });
      } catch (blockchainError) {
        console.warn('语音合成区块链存证失败:', blockchainError);
      }
    }

    res.json({
      success: true,
      data: {
        audioUrl,
        duration: Math.ceil(text.length * 0.3), // 模拟音频时长
        voice,
        speed,
        language,
        timestamp: new Date().toISOString(),
        cacheKey,
      },
    });
  } catch (error) {
    console.error('文字转语音失败:', error);
    res.status(500).json({
      success: false,
      message: '文字转语音失败',
      code: 'TEXT_TO_SPEECH_FAILED',
    });
  }
});

// 获取AI建议
router.post('/advice', auth, [
  body('category')
    .isIn(['volunteer', 'emergency', 'community', 'health', 'general'])
    .withMessage('建议类别无效'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('问题描述长度必须在10-500个字符之间'),
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

    const { category, description } = req.body;

    // 生成AI建议
    const advice = await generateAIAdvice(category, description, req.user);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'ai_advice',
        userId: req.user.id,
        category,
        description,
        advice: advice.content,
        timestamp: new Date().toISOString(),
      }, {
        type: 'ai_interaction',
        category: 'advice',
        adviceType: category,
      });
    } catch (blockchainError) {
      console.warn('AI建议区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      data: {
        advice: advice.content,
        category,
        confidence: advice.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('获取AI建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取AI建议失败',
      code: 'AI_ADVICE_FAILED',
    });
  }
});

// 获取对话历史
router.get('/chat/history', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    // 从缓存获取对话历史
    const cacheKey = `chat:${userId}`;
    let chatHistory = await redisUtils.get(cacheKey) || [];

    // 分页处理
    const paginatedHistory = chatHistory.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        history: paginatedHistory,
        pagination: {
          total: chatHistory.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + parseInt(limit) < chatHistory.length,
        },
      },
    });
  } catch (error) {
    console.error('获取对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取对话历史失败',
      code: 'GET_CHAT_HISTORY_FAILED',
    });
  }
});

// 清除对话历史
router.delete('/chat/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `chat:${userId}`;

    // 清除缓存
    await redisUtils.del(cacheKey);

    res.json({
      success: true,
      message: '对话历史已清除',
    });
  } catch (error) {
    console.error('清除对话历史失败:', error);
    res.status(500).json({
      success: false,
      message: '清除对话历史失败',
      code: 'CLEAR_CHAT_HISTORY_FAILED',
    });
  }
});

// 获取AI服务状态
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'operational',
        services: {
          chat: 'available',
          speechToText: 'available',
          textToSpeech: 'available',
          advice: 'available',
        },
        models: [
          'gpt-3.5-turbo',
          'gpt-4',
          'claude-3',
          'custom',
        ],
        languages: [
          'zh-CN',
          'en-US',
          'ja-JP',
          'ko-KR',
        ],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('获取AI服务状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取服务状态失败',
      code: 'GET_AI_STATUS_FAILED',
    });
  }
});

// 模拟AI响应生成
async function generateAIResponse(message, history, model) {
  // 这里应该调用真实的AI服务
  // 目前使用模拟响应
  
  const responses = {
    'gpt-3.5-turbo': [
      '我理解您的问题，让我为您提供一些建议...',
      '根据您的情况，我建议您可以考虑以下方案...',
      '这是一个很好的问题，让我来分析一下...',
    ],
    'gpt-4': [
      '基于我的分析，我为您提供以下专业建议...',
      '考虑到您的具体情况，我推荐以下解决方案...',
      '这是一个复杂的问题，让我从多个角度为您分析...',
    ],
    'claude-3': [
      '从专业角度来看，我建议您...',
      '基于最佳实践，您可以考虑...',
      '让我为您提供一些实用的建议...',
    ],
    'custom': [
      '根据我们的定制模型，我建议...',
      '基于您的特定需求，我推荐...',
      '让我为您提供个性化的建议...',
    ],
  };

  const modelResponses = responses[model] || responses['gpt-3.5-turbo'];
  const randomResponse = modelResponses[Math.floor(Math.random() * modelResponses.length)];

  return {
    content: randomResponse,
    model,
    timestamp: new Date().toISOString(),
  };
}

// 模拟语音识别处理
async function processSpeechToText(audioData, format, language) {
  // 这里应该调用真实的语音识别服务
  // 目前返回模拟结果
  
  const mockTranscripts = {
    'zh-CN': '您好，我是志愿者，有什么可以帮助您的吗？',
    'en-US': 'Hello, I am a volunteer. How can I help you?',
    'ja-JP': 'こんにちは、ボランティアです。何かお手伝いできることはありますか？',
    'ko-KR': '안녕하세요, 저는 자원봉사자입니다. 도움이 필요한 것이 있나요?',
  };

  return mockTranscripts[language] || mockTranscripts['zh-CN'];
}

// 模拟语音合成处理
async function processTextToSpeech(text, voice, speed, language) {
  // 这里应该调用真实的语音合成服务
  // 目前返回模拟音频URL
  
  const timestamp = Date.now();
  return `https://api.example.com/tts/audio/${timestamp}.mp3`;
}

// 模拟AI建议生成
async function generateAIAdvice(category, description, user) {
  // 这里应该调用真实的AI服务
  // 目前返回模拟建议
  
  const categoryAdvice = {
    volunteer: '作为志愿者，我建议您首先了解自己的技能和可用时间，然后选择合适的服务项目。',
    emergency: '在紧急情况下，请保持冷静，立即联系相关紧急服务，并确保自身安全。',
    community: '参与社区活动是建立良好邻里关系的好方法，建议您多参加社区组织的活动。',
    health: '健康是人生最重要的财富，建议您定期体检，保持健康的生活方式。',
    general: '根据您的描述，我建议您仔细分析问题的根源，制定具体的解决方案。',
  };

  return {
    content: categoryAdvice[category] || categoryAdvice.general,
    confidence: 0.92,
    category,
    timestamp: new Date().toISOString(),
  };
}

module.exports = router; 
