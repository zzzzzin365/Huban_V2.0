const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { auth, optionalAuth, requireRole } = require('../middleware/auth');
const { redisUtils } = require('../config/redis');
const { blockchainEvidenceService } = require('../services/BlockchainService');

const router = express.Router();

// 输入验证规则
const newsValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200个字符之间'),
  body('content')
    .isLength({ min: 10, max: 5000 })
    .withMessage('内容长度必须在10-5000个字符之间'),
  body('category')
    .isIn(['news', 'event', 'announcement', 'story', 'guide'])
    .withMessage('类别无效'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('tags.*')
    .isLength({ min: 1, max: 20 })
    .withMessage('标签长度必须在1-20个字符之间'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('图片URL格式无效'),
];

const eventValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('标题长度必须在5-200个字符之间'),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('描述长度必须在10-2000个字符之间'),
  body('startTime')
    .isISO8601()
    .withMessage('开始时间格式无效'),
  body('endTime')
    .isISO8601()
    .withMessage('结束时间格式无效'),
  body('location')
    .isLength({ min: 5, max: 200 })
    .withMessage('地点长度必须在5-200个字符之间'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('最大参与人数必须在1-1000之间'),
  body('category')
    .isIn(['volunteer', 'social', 'education', 'health', 'entertainment'])
    .withMessage('活动类别无效'),
];

const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('评论内容长度必须在1-500个字符之间'),
];

// 获取社区新闻列表
router.get('/news', optionalAuth, [
  query('category')
    .optional()
    .isIn(['news', 'event', 'announcement', 'story', 'guide'])
    .withMessage('类别无效'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须大于0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('限制数量必须在1到50之间'),
  query('sort')
    .optional()
    .isIn(['latest', 'popular', 'trending'])
    .withMessage('排序方式无效'),
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

    const { category, page = 1, limit = 20, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;

    // 从缓存获取新闻列表
    const cacheKey = `news:${category || 'all'}:${sort}:${page}:${limit}`;
    let newsList = await redisUtils.get(cacheKey);

    if (!newsList) {
      // 缓存未命中，生成模拟数据
      newsList = generateMockNews(category, sort, parseInt(limit));
      
      // 缓存结果（5分钟）
      await redisUtils.set(cacheKey, newsList, 300);
    }

    res.json({
      success: true,
      data: {
        news: newsList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 100, // 模拟总数
          totalPages: Math.ceil(100 / limit),
        },
        filters: {
          category,
          sort,
        },
      },
    });
  } catch (error) {
    console.error('获取社区新闻失败:', error);
    res.status(500).json({
      success: false,
      message: '获取社区新闻失败',
      code: 'GET_COMMUNITY_NEWS_FAILED',
    });
  }
});

// 获取新闻详情
router.get('/news/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // 从缓存获取新闻详情
    let newsDetail = await redisUtils.get(`news:detail:${id}`);

    if (!newsDetail) {
      // 缓存未命中，生成模拟数据
      newsDetail = generateMockNewsDetail(id);
      
      // 缓存结果（10分钟）
      await redisUtils.set(`news:detail:${id}`, newsDetail, 600);
    }

    // 增加浏览次数
    if (newsDetail) {
      newsDetail.views = (newsDetail.views || 0) + 1;
      await redisUtils.set(`news:detail:${id}`, newsDetail, 600);
    }

    if (!newsDetail) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在',
        code: 'NEWS_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: {
        news: newsDetail,
      },
    });
  } catch (error) {
    console.error('获取新闻详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取新闻详情失败',
      code: 'GET_NEWS_DETAIL_FAILED',
    });
  }
});

// 发布新闻（需要管理员权限）
router.post('/news', auth, requireRole(['admin', 'super_admin']), newsValidation, async (req, res) => {
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

    const { title, content, category, tags = [], imageUrl } = req.body;

    // 创建新闻对象
    const news = {
      id: `news_${Date.now()}`,
      title,
      content,
      category,
      tags,
      imageUrl,
      author: {
        id: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      publishTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      views: 0,
      likes: 0,
      comments: 0,
      status: 'published',
    };

    // 缓存新闻
    await redisUtils.set(`news:detail:${news.id}`, news, 86400); // 24小时

    // 清除相关缓存
    await clearNewsCache(category);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'community_news',
        newsId: news.id,
        authorId: req.user.id,
        title,
        category,
        publishTime: news.publishTime,
      }, {
        type: 'community_content',
        category: 'news',
        authorRole: req.user.role,
      });
    } catch (blockchainError) {
      console.warn('新闻发布区块链存证失败:', blockchainError);
    }

    res.status(201).json({
      success: true,
      message: '新闻发布成功',
      data: {
        news,
      },
    });
  } catch (error) {
    console.error('发布新闻失败:', error);
    res.status(500).json({
      success: false,
      message: '发布新闻失败',
      code: 'PUBLISH_NEWS_FAILED',
    });
  }
});

// 更新新闻
router.put('/news/:id', auth, requireRole(['admin', 'super_admin']), newsValidation, async (req, res) => {
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
    const { title, content, category, tags, imageUrl } = req.body;

    // 获取原新闻
    let news = await redisUtils.get(`news:detail:${id}`);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在',
        code: 'NEWS_NOT_FOUND',
      });
    }

    // 更新新闻
    const updatedNews = {
      ...news,
      title: title || news.title,
      content: content || news.content,
      category: category || news.category,
      tags: tags || news.tags,
      imageUrl: imageUrl || news.imageUrl,
      updateTime: new Date().toISOString(),
    };

    // 更新缓存
    await redisUtils.set(`news:detail:${id}`, updatedNews, 86400);

    // 清除相关缓存
    await clearNewsCache(updatedNews.category);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'community_news_update',
        newsId: id,
        editorId: req.user.id,
        updateTime: updatedNews.updateTime,
        changes: {
          title: title !== news.title,
          content: content !== news.content,
          category: category !== news.category,
        },
      }, {
        type: 'community_content',
        category: 'news_update',
        editorRole: req.user.role,
      });
    } catch (blockchainError) {
      console.warn('新闻更新区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '新闻更新成功',
      data: {
        news: updatedNews,
      },
    });
  } catch (error) {
    console.error('更新新闻失败:', error);
    res.status(500).json({
      success: false,
      message: '更新新闻失败',
      code: 'UPDATE_NEWS_FAILED',
    });
  }
});

// 删除新闻
router.delete('/news/:id', auth, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // 获取新闻信息
    const news = await redisUtils.get(`news:detail:${id}`);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: '新闻不存在',
        code: 'NEWS_NOT_FOUND',
      });
    }

    // 删除缓存
    await redisUtils.del(`news:detail:${id}`);

    // 清除相关缓存
    await clearNewsCache(news.category);

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'community_news_delete',
        newsId: id,
        deleterId: req.user.id,
        deleteTime: new Date().toISOString(),
        originalNews: news,
      }, {
        type: 'community_content',
        category: 'news_delete',
        deleterRole: req.user.role,
      });
    } catch (blockchainError) {
      console.warn('新闻删除区块链存证失败:', blockchainError);
    }

    res.json({
      success: true,
      message: '新闻删除成功',
    });
  } catch (error) {
    console.error('删除新闻失败:', error);
    res.status(500).json({
      success: false,
      message: '删除新闻失败',
      code: 'DELETE_NEWS_FAILED',
    });
  }
});

// 点赞新闻
router.post('/news/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查是否已点赞
    const likeKey = `news:like:${id}:${userId}`;
    const hasLiked = await redisUtils.exists(likeKey);

    if (hasLiked) {
      return res.status(400).json({
        success: false,
        message: '您已经点赞过了',
        code: 'ALREADY_LIKED',
      });
    }

    // 记录点赞
    await redisUtils.set(likeKey, {
      userId,
      newsId: id,
      timestamp: new Date().toISOString(),
    }, 86400 * 365); // 1年

    // 更新新闻点赞数
    const news = await redisUtils.get(`news:detail:${id}`);
    if (news) {
      news.likes = (news.likes || 0) + 1;
      await redisUtils.set(`news:detail:${id}`, news, 86400);
    }

    res.json({
      success: true,
      message: '点赞成功',
      data: {
        likes: news?.likes || 1,
      },
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '点赞失败',
      code: 'LIKE_NEWS_FAILED',
    });
  }
});

// 取消点赞
router.delete('/news/:id/like', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查是否已点赞
    const likeKey = `news:like:${id}:${userId}`;
    const hasLiked = await redisUtils.exists(likeKey);

    if (!hasLiked) {
      return res.status(400).json({
        success: false,
        message: '您还没有点赞',
        code: 'NOT_LIKED',
      });
    }

    // 删除点赞记录
    await redisUtils.del(likeKey);

    // 更新新闻点赞数
    const news = await redisUtils.get(`news:detail:${id}`);
    if (news && news.likes > 0) {
      news.likes = news.likes - 1;
      await redisUtils.set(`news:detail:${id}`, news, 86400);
    }

    res.json({
      success: true,
      message: '取消点赞成功',
      data: {
        likes: news?.likes || 0,
      },
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({
      success: false,
      message: '取消点赞失败',
      code: 'UNLIKE_NEWS_FAILED',
    });
  }
});

// 获取社区活动列表
router.get('/events', optionalAuth, [
  query('category')
    .optional()
    .isIn(['volunteer', 'social', 'education', 'health', 'entertainment'])
    .withMessage('活动类别无效'),
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('状态无效'),
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

    const { category, status = 'upcoming', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 从缓存获取活动列表
    const cacheKey = `events:${category || 'all'}:${status}:${page}:${limit}`;
    let eventsList = await redisUtils.get(cacheKey);

    if (!eventsList) {
      // 缓存未命中，生成模拟数据
      eventsList = generateMockEvents(category, status, parseInt(limit));
      
      // 缓存结果（5分钟）
      await redisUtils.set(cacheKey, eventsList, 300);
    }

    res.json({
      success: true,
      data: {
        events: eventsList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 50, // 模拟总数
          totalPages: Math.ceil(50 / limit),
        },
        filters: {
          category,
          status,
        },
      },
    });
  } catch (error) {
    console.error('获取社区活动失败:', error);
    res.status(500).json({
      success: false,
      message: '获取社区活动失败',
      code: 'GET_COMMUNITY_EVENTS_FAILED',
    });
  }
});

// 创建社区活动
router.post('/events', auth, eventValidation, async (req, res) => {
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
      title,
      description,
      startTime,
      endTime,
      location,
      maxParticipants,
      category,
      imageUrl,
    } = req.body;

    // 验证时间
    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: '开始时间必须在当前时间之后',
        code: 'INVALID_START_TIME',
      });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        success: false,
        message: '结束时间必须在开始时间之后',
        code: 'INVALID_END_TIME',
      });
    }

    // 创建活动对象
    const event = {
      id: `event_${Date.now()}`,
      title,
      description,
      startTime,
      endTime,
      location,
      maxParticipants: maxParticipants || 50,
      currentParticipants: 0,
      category,
      imageUrl,
      organizer: {
        id: req.user.id,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      createTime: new Date().toISOString(),
      status: 'upcoming',
      participants: [],
    };

    // 缓存活动
    await redisUtils.set(`event:detail:${event.id}`, event, 86400);

    // 清除相关缓存
    await clearEventsCache(category, 'upcoming');

    // 区块链存证
    try {
      await blockchainEvidenceService.storeEvidence({
        type: 'community_event',
        eventId: event.id,
        organizerId: req.user.id,
        title,
        category,
        startTime,
        location,
      }, {
        type: 'community_content',
        category: 'event',
        organizerRole: req.user.role,
      });
    } catch (blockchainError) {
      console.warn('活动创建区块链存证失败:', blockchainError);
    }

    res.status(201).json({
      success: true,
      message: '活动创建成功',
      data: {
        event,
      },
    });
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({
      success: false,
      message: '创建活动失败',
      code: 'CREATE_EVENT_FAILED',
    });
  }
});

// 参与活动
router.post('/events/:id/join', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 获取活动信息
    const event = await redisUtils.get(`event:detail:${id}`);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '活动不存在',
        code: 'EVENT_NOT_FOUND',
      });
    }

    // 检查活动状态
    if (event.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: '活动已结束或已取消',
        code: 'EVENT_NOT_AVAILABLE',
      });
    }

    // 检查是否已参与
    const isParticipant = event.participants.some(p => p.id === userId);
    if (isParticipant) {
      return res.status(400).json({
        success: false,
        message: '您已经参与此活动了',
        code: 'ALREADY_JOINED',
      });
    }

    // 检查人数限制
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '活动人数已满',
        code: 'EVENT_FULL',
      });
    }

    // 添加参与者
    event.participants.push({
      id: userId,
      username: req.user.username,
      avatar: req.user.avatar,
      joinTime: new Date().toISOString(),
    });
    event.currentParticipants += 1;

    // 更新缓存
    await redisUtils.set(`event:detail:${id}`, event, 86400);

    // 清除相关缓存
    await clearEventsCache(event.category, 'upcoming');

    res.json({
      success: true,
      message: '参与活动成功',
      data: {
        currentParticipants: event.currentParticipants,
        maxParticipants: event.maxParticipants,
      },
    });
  } catch (error) {
    console.error('参与活动失败:', error);
    res.status(500).json({
      success: false,
      message: '参与活动失败',
      code: 'JOIN_EVENT_FAILED',
    });
  }
});

// 获取热门话题
router.get('/topics', optionalAuth, async (req, res) => {
  try {
    // 从缓存获取热门话题
    let topics = await redisUtils.get('community:topics');

    if (!topics) {
      // 缓存未命中，生成模拟数据
      topics = generateMockTopics();
      
      // 缓存结果（1小时）
      await redisUtils.set('community:topics', topics, 3600);
    }

    res.json({
      success: true,
      data: {
        topics,
      },
    });
  } catch (error) {
    console.error('获取热门话题失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门话题失败',
      code: 'GET_TOPICS_FAILED',
    });
  }
});

// 获取社区统计
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    // 从缓存获取统计数据
    let stats = await redisUtils.get('community:stats');

    if (!stats) {
      // 缓存未命中，生成模拟数据
      stats = generateMockStats();
      
      // 缓存结果（30分钟）
      await redisUtils.set('community:stats', stats, 1800);
    }

    res.json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error('获取社区统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取社区统计失败',
      code: 'GET_STATS_FAILED',
    });
  }
});

// 清除新闻缓存
async function clearNewsCache(category) {
  const patterns = [
    `news:${category || 'all'}:*`,
    'news:detail:*',
  ];
  
  for (const pattern of patterns) {
    const keys = await redisUtils.keys(pattern);
    for (const key of keys) {
      await redisUtils.del(key);
    }
  }
}

// 清除活动缓存
async function clearEventsCache(category, status) {
  const patterns = [
    `events:${category || 'all'}:${status || '*'}:*`,
    'event:detail:*',
  ];
  
  for (const pattern of patterns) {
    const keys = await redisUtils.keys(pattern);
    for (const key of keys) {
      await redisUtils.del(key);
    }
  }
}

// 生成模拟新闻数据
function generateMockNews(category, sort, limit) {
  const categories = category ? [category] : ['news', 'event', 'announcement', 'story', 'guide'];
  const news = [];
  
  for (let i = 0; i < limit; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    news.push({
      id: `news_${Date.now()}_${i}`,
      title: `模拟${randomCategory}标题 ${i + 1}`,
      summary: `这是模拟${randomCategory}的摘要内容，描述了相关的重要信息...`,
      category: randomCategory,
      tags: ['模拟', '测试', randomCategory],
      imageUrl: `https://picsum.photos/400/300?random=${i}`,
      author: {
        id: `user_${i}`,
        username: `用户${i}`,
        avatar: `https://picsum.photos/50/50?random=${i}`,
      },
      publishTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
    });
  }

  // 根据排序方式排序
  if (sort === 'popular') {
    news.sort((a, b) => b.views - a.views);
  } else if (sort === 'trending') {
    news.sort((a, b) => b.likes - a.likes);
  } else {
    news.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));
  }

  return news;
}

// 生成模拟新闻详情
function generateMockNewsDetail(id) {
  const categories = ['news', 'event', 'announcement', 'story', 'guide'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id,
    title: `模拟${randomCategory}详细标题`,
    content: `这是模拟${randomCategory}的详细内容。这里包含了完整的文章内容，涵盖了相关的所有重要信息。\n\n段落1：介绍部分\n这是第一段内容，主要介绍相关背景和基本信息。\n\n段落2：详细说明\n这是第二段内容，详细说明了具体的细节和要点。\n\n段落3：总结部分\n这是第三段内容，对整个内容进行总结和展望。`,
    category: randomCategory,
    tags: ['模拟', '测试', randomCategory, '详细'],
    imageUrl: `https://picsum.photos/800/400?random=${Math.random()}`,
    author: {
      id: 'user_1',
      username: '模拟用户',
      avatar: 'https://picsum.photos/50/50?random=1',
    },
    publishTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    updateTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    views: Math.floor(Math.random() * 1000),
    likes: Math.floor(Math.random() * 100),
    comments: Math.floor(Math.random() * 50),
    status: 'published',
  };
}

// 生成模拟活动数据
function generateMockEvents(category, status, limit) {
  const categories = category ? [category] : ['volunteer', 'social', 'education', 'health', 'entertainment'];
  const events = [];
  
  for (let i = 0; i < limit; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const startTime = new Date(Date.now() + Math.random() * 86400000 * 30); // 未来30天内
    const endTime = new Date(startTime.getTime() + Math.random() * 86400000 * 2); // 持续1-2天
    
    events.push({
      id: `event_${Date.now()}_${i}`,
      title: `模拟${randomCategory}活动 ${i + 1}`,
      description: `这是模拟${randomCategory}活动的详细描述，包含了活动的时间、地点、内容等信息。`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      location: `模拟地点 ${i + 1}`,
      maxParticipants: Math.floor(Math.random() * 50) + 10,
      currentParticipants: Math.floor(Math.random() * 20),
      category: randomCategory,
      imageUrl: `https://picsum.photos/400/300?random=${i}`,
      organizer: {
        id: `user_${i}`,
        username: `组织者${i}`,
        avatar: `https://picsum.photos/50/50?random=${i}`,
      },
      createTime: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      status,
      participants: [],
    });
  }

  return events;
}

// 生成模拟热门话题
function generateMockTopics() {
  return [
    {
      id: 'topic_1',
      title: '社区志愿服务',
      description: '讨论如何更好地开展社区志愿服务',
      participants: 156,
      posts: 89,
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    },
    {
      id: 'topic_2',
      title: '邻里互助',
      description: '分享邻里互助的温暖故事',
      participants: 234,
      posts: 156,
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    },
    {
      id: 'topic_3',
      title: '健康生活',
      description: '交流健康生活的小贴士',
      participants: 189,
      posts: 123,
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    },
  ];
}

// 生成模拟统计数据
function generateMockStats() {
  return {
    totalUsers: 12580,
    activeUsers: 3420,
    totalNews: 156,
    totalEvents: 89,
    totalVolunteers: 2340,
    totalHelpRequests: 567,
    completedHelps: 1234,
    communityRating: 4.8,
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = router; 
