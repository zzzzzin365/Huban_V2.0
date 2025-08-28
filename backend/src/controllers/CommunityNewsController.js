const CommunityNewsService = require('../services/CommunityNewsService');
const logger = require('../utils/logger');
class CommunityNewsController {
  static async getNewsList(req, res) {
    try {
      const userId = req.user.id;
      const {
        category,
        limit = 20,
        offset = 0,
        includeExpired = false,
        onlyImportant = false
      } = req.query;
      const options = {
        category,
        limit: parseInt(limit),
        offset: parseInt(offset),
        includeExpired: includeExpired === 'true',
        onlyImportant: onlyImportant === 'true'
      };
      const result = await CommunityNewsService.getNewsList(userId, options);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('获取社区资讯列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取社区资讯失败'
      });
    }
  }
  static async getNewsDetail(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await CommunityNewsService.getNewsDetail(id, userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('获取资讯详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取资讯详情失败'
      });
    }
  }
    try {
      const userId = req.user.id;
      const newsData = req.body;
      if (!newsData.title || !newsData.content) {
        return res.status(400).json({
          success: false,
          message: '标题和内容不能为�?
        });
      }
      const result = await CommunityNewsService.createNews(newsData, userId);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('创建资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '创建资讯失败'
      });
    }
  }
  static async updateNews(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;
      const result = await CommunityNewsService.updateNews(id, updateData, userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('更新资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '更新资讯失败'
      });
    }
  }
  static async deleteNews(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await CommunityNewsService.deleteNews(id, userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      logger.error('删除资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '删除资讯失败'
      });
    }
  }
  static async getNewsStats(req, res) {
    try {
      const result = await CommunityNewsService.getNewsStats();
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('获取资讯统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取资讯统计失败'
      });
    }
  }
  static async getUserRelevantNews(req, res) {
    try {
      const userId = req.user.id;
      const userProfile = req.user; 
      const result = await CommunityNewsService.getUserRelevantNews(userId, userProfile);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('获取用户相关资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '获取相关资讯失败'
      });
    }
  }
    try {
      const userId = req.user.id;
      const { id } = req.params;
      res.json({
        success: true,
        message: '标记已读成功'
      });
    } catch (error) {
      logger.error('标记已读错误:', error);
      res.status(500).json({
        success: false,
        message: '标记已读失败'
      });
    }
  }
  static async getCategories(req, res) {
    try {
      const categories = [
        { id: 'announcement', name: '公告', icon: '📢', count: 0 },
        { id: 'activity', name: '活动', icon: '🎉', count: 0 },
        { id: 'health', name: '健康', icon: '🏥', count: 0 },
        { id: 'safety', name: '安全', icon: '🛡�?, count: 0 },
        { id: 'maintenance', name: '维护', icon: '🔧', count: 0 },
        { id: 'entertainment', name: '娱乐', icon: '🎭', count: 0 },
        { id: 'education', name: '教育', icon: '📚', count: 0 },
        { id: 'emergency', name: '紧�?, icon: '🚨', count: 0 },
        { id: 'other', name: '其他', icon: '📄', count: 0 }
      ];
      if (stats.success) {
        categories.forEach(category => {
          category.count = stats.stats.by_category[category.id] || 0;
        });
      }
      res.json({
        success: true,
        categories: categories
      });
    } catch (error) {
      logger.error('获取资讯分类错误:', error);
      res.status(500).json({
        success: false,
        message: '获取资讯分类失败'
      });
    }
  }
    try {
      const userId = req.user.id;
      const { category } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      const options = {
        category,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
      const result = await CommunityNewsService.getNewsList(userId, options);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('按分类获取资讯错�?', error);
      res.status(500).json({
        success: false,
        message: '获取分类资讯失败'
      });
    }
  }
  static async searchNews(req, res) {
    try {
      const userId = req.user.id;
      const { q, category, limit = 20, offset = 0 } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词不能为�?
        });
      }
        category,
        limit: 100, 
        offset: 0
      });
      if (!result.success) {
        return res.status(500).json(result);
      }
      const searchResults = result.news.filter(news => 
        news.title.toLowerCase().includes(q.toLowerCase()) ||
        news.content.toLowerCase().includes(q.toLowerCase()) ||
        news.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
      );
      const paginatedResults = searchResults.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );
      res.json({
        success: true,
        news: paginatedResults,
        total: searchResults.length,
        has_more: parseInt(offset) + parseInt(limit) < searchResults.length,
        search_query: q
      });
    } catch (error) {
      logger.error('搜索资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '搜索资讯失败'
      });
    }
  }
  static async getPopularNews(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
        limit: 50
      });
      if (!result.success) {
        return res.status(500).json(result);
      }
        .sort((a, b) => {
          if (a.is_important && !b.is_important) return -1;
          if (!a.is_important && b.is_important) return 1;
          return b.priority - a.priority;
        })
        .slice(0, parseInt(limit));
      res.json({
        success: true,
        news: popularNews,
        total: popularNews.length
      });
    } catch (error) {
      logger.error('获取热门资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '获取热门资讯失败'
      });
    }
  }
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
      const result = await CommunityNewsService.getNewsList(userId, {
        limit: parseInt(limit)
      });
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('获取最新资讯错�?', error);
      res.status(500).json({
        success: false,
        message: '获取最新资讯失�?
      });
    }
  }
  static async getImportantNews(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
      const result = await CommunityNewsService.getNewsList(userId, {
        onlyImportant: true,
        limit: parseInt(limit)
      });
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      logger.error('获取重要资讯错误:', error);
      res.status(500).json({
        success: false,
        message: '获取重要资讯失败'
      });
    }
  }
}
module.exports = CommunityNewsController; 
