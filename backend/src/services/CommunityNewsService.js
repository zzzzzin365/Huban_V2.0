const logger = require('../utils/logger');
const RedisService = require('./RedisService');
class CommunityNewsService {
  static async getNewsList(userId, options = {}) {
    try {
      const {
        category,
        limit = 20,
        offset = 0,
        includeExpired = false,
        onlyImportant = false
      } = options;
      let newsList = await RedisService.lrange('community_news', 0, -1);
      if (!newsList || newsList.length === 0) {
        newsList = await CommunityNewsService._generateMockNews();
        await CommunityNewsService._saveNewsToRedis(newsList);
      }
      let parsedNews = newsList.map(item => JSON.parse(item));
      if (!includeExpired) {
        parsedNews = parsedNews.filter(news => !CommunityNewsService._isExpired(news));
      }
        parsedNews = parsedNews.filter(news => news.category === category);
      }
        parsedNews = parsedNews.filter(news => news.is_important);
      }
      const paginatedNews = parsedNews.slice(offset, offset + limit);
      await CommunityNewsService._logNewsView(userId, paginatedNews.map(news => news.id));
      return {
        success: true,
        news: paginatedNews,
        total: parsedNews.length,
        has_more: offset + limit < parsedNews.length
      };
    } catch (error) {
      logger.error('获取社区资讯错误:', error);
      return {
        success: false,
        message: '获取社区资讯失败',
        news: [],
        total: 0,
        has_more: false
      };
    }
  }
  static async getNewsDetail(newsId, userId) {
    try {
      const newsList = await RedisService.lrange('community_news', 0, -1);
      const news = newsList
        .map(item => JSON.parse(item))
        .find(item => item.id === newsId);
      if (!news) {
        return {
          success: false,
          message: '资讯不存�?
        };
      }
      await CommunityNewsService._logNewsDetailView(userId, newsId);
      return {
        success: true,
        news: news
      };
    } catch (error) {
      logger.error('获取资讯详情错误:', error);
      return {
        success: false,
        message: '获取资讯详情失败'
      };
    }
  }
    try {
      const news = {
        id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: newsData.title,
        content: newsData.content,
        category: newsData.category || 'other',
        image_url: newsData.image_url,
        publish_time: new Date().toISOString(),
        expire_time: newsData.expire_time,
        is_important: newsData.is_important || false,
        is_active: true,
        tags: newsData.tags || [],
        author: newsData.author || '系统',
        priority: newsData.priority || 0,
        creator_id: creatorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await RedisService.lpush('community_news', JSON.stringify(news));
      if (news.is_important) {
        await CommunityNewsService._sendImportantNewsNotification(news);
      }
      logger.info('创建新资�?', news.id);
      return {
        success: true,
        news: news
      };
    } catch (error) {
      logger.error('创建资讯错误:', error);
      return {
        success: false,
        message: '创建资讯失败'
      };
    }
  }
  static async updateNews(newsId, updateData, updaterId) {
    try {
      const newsList = await RedisService.lrange('community_news', 0, -1);
      const newsIndex = newsList.findIndex(item => {
        const news = JSON.parse(item);
        return news.id === newsId;
      });
      if (newsIndex === -1) {
        return {
          success: false,
          message: '资讯不存�?
        };
      }
      const originalNews = JSON.parse(newsList[newsIndex]);
      const updatedNews = {
        ...originalNews,
        ...updateData,
        updated_at: new Date().toISOString(),
        updater_id: updaterId
      };
      newsList[newsIndex] = JSON.stringify(updatedNews);
      await RedisService.del('community_news');
      for (const news of newsList) {
        await RedisService.rpush('community_news', news);
      }
      logger.info('更新资讯:', newsId);
      return {
        success: true,
        news: updatedNews
      };
    } catch (error) {
      logger.error('更新资讯错误:', error);
      return {
        success: false,
        message: '更新资讯失败'
      };
    }
  }
  static async deleteNews(newsId, deleterId) {
    try {
      const newsList = await RedisService.lrange('community_news', 0, -1);
      const filteredNews = newsList.filter(item => {
        const news = JSON.parse(item);
        return news.id !== newsId;
      });
      if (filteredNews.length === newsList.length) {
        return {
          success: false,
          message: '资讯不存�?
        };
      }
      await RedisService.del('community_news');
      for (const news of filteredNews) {
        await RedisService.rpush('community_news', news);
      }
      logger.info('删除资讯:', newsId);
      return {
        success: true,
        message: '资讯删除成功'
      };
    } catch (error) {
      logger.error('删除资讯错误:', error);
      return {
        success: false,
        message: '删除资讯失败'
      };
    }
  }
  static async getNewsStats() {
    try {
      const newsList = await RedisService.lrange('community_news', 0, -1);
      const parsedNews = newsList.map(item => JSON.parse(item));
      const stats = {
        total: parsedNews.length,
        active: parsedNews.filter(news => news.is_active && !CommunityNewsService._isExpired(news)).length,
        important: parsedNews.filter(news => news.is_important).length,
        recent: parsedNews.filter(news => CommunityNewsService._isRecent(news)).length,
        by_category: {},
        by_author: {}
      };
        stats.by_category[news.category] = (stats.by_category[news.category] || 0) + 1;
        stats.by_author[news.author] = (stats.by_author[news.author] || 0) + 1;
      });
      return {
        success: true,
        stats: stats
      };
    } catch (error) {
      logger.error('获取资讯统计错误:', error);
      return {
        success: false,
        message: '获取资讯统计失败'
      };
    }
  }
    try {
      const newsList = await RedisService.lrange('community_news', 0, -1);
      let parsedNews = newsList.map(item => JSON.parse(item));
      parsedNews = parsedNews.filter(news => !CommunityNewsService._isExpired(news));
      return {
        success: true,
        news: relevantNews.slice(0, 10) 
    } catch (error) {
      logger.error('获取用户相关资讯错误:', error);
      return {
        success: false,
        message: '获取相关资讯失败',
        news: []
      };
    }
  }
  static async _generateMockNews() {
    const mockNews = [
      {
        id: 'news_1',
        title: '明天停水通知',
        content: '明天上午9点到下午3点，小区将进行水管维修，请提前储水。维修期间可能影响正常用水，请居民做好准备工作�?,
        category: 'maintenance',
        image_url: null,
        publish_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
        is_active: true,
        tags: ['停水', '维修', '通知'],
        author: '物业公司',
        priority: 10,
        creator_id: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'news_2',
        title: '插画课堂活动',
        content: '后天下午2点，社区活动中心将举办插画课堂，欢迎所有居民参加！活动免费，材料由社区提供�?,
        category: 'activity',
        image_url: 'https:
        publish_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), 
        is_important: false,
        is_active: true,
        tags: ['活动', '插画', '免费'],
        author: '社区活动中心',
        priority: 5,
        creator_id: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'news_3',
        title: '健康讲座通知',
        content: '本周六上�?0点，社区医院将举办老年人健康讲座，主题�?预防心血管疾�?�?,
        category: 'health',
        image_url: null,
        publish_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), 
        is_important: false,
        is_active: true,
        tags: ['健康', '讲座', '心血�?],
        author: '社区医院',
        priority: 7,
        creator_id: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'news_4',
        title: '垃圾分类新规',
        content: '从下周开始，小区将实施新的垃圾分类规定，请居民按照新的分类标准进行垃圾分类�?,
        category: 'announcement',
        image_url: null,
        publish_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), 
        is_important: true,
        is_active: true,
        tags: ['垃圾分类', '新规', '环保'],
        author: '居委�?,
        priority: 8,
        creator_id: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    return mockNews;
  }
  static async _saveNewsToRedis(newsList) {
    try {
      for (const news of newsList) {
        await RedisService.rpush('community_news', JSON.stringify(news));
      }
    } catch (error) {
      logger.error('保存资讯到Redis错误:', error);
    }
  }
    if (!news.expire_time) return false;
    return new Date() > new Date(news.expire_time);
  }
  static _isRecent(news) {
    const publishTime = new Date(news.publish_time);
    const now = new Date();
    const diffHours = (now - publishTime) / (1000 * 60 * 60);
    return diffHours < 24;
  }
  static async _logNewsView(userId, newsIds) {
    try {
      const viewLog = {
        userId,
        newsIds,
        timestamp: new Date().toISOString()
      };
      await RedisService.lpush(`news_views:${userId}`, JSON.stringify(viewLog));
    } catch (error) {
      logger.error('记录资讯查看错误:', error);
    }
  }
  static async _logNewsDetailView(userId, newsId) {
    try {
      const detailViewLog = {
        userId,
        newsId,
        timestamp: new Date().toISOString()
      };
      await RedisService.lpush(`news_detail_views:${userId}`, JSON.stringify(detailViewLog));
    } catch (error) {
      logger.error('记录资讯详情查看错误:', error);
    }
  }
  static async _sendImportantNewsNotification(news) {
    try {
      logger.info('发送重要资讯通知:', news.title);
    } catch (error) {
      logger.error('发送重要资讯通知错误:', error);
    }
  }
  static _filterRelevantNews(newsList, userProfile) {
    return newsList.sort((a, b) => {
      if (a.is_important && !b.is_important) return -1;
      if (!a.is_important && b.is_important) return 1;
    });
  }
}
module.exports = CommunityNewsService; 
