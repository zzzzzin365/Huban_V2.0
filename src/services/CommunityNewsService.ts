import {CommunityNews} from '../types';
import {ApiConfig} from '../config/apiConfig';

class CommunityNewsService {
  private static instance: CommunityNewsService;
  private baseURL: string;

  private constructor() {
    this.baseURL = ApiConfig.baseURL;
  }

  static getInstance(): CommunityNewsService {
    if (!CommunityNewsService.instance) {
      CommunityNewsService.instance = new CommunityNewsService();
    }
    return CommunityNewsService.instance;
  }

  /**
   * 获取新闻列表
   */
  async getNews(category?: string, page: number = 1, limit: number = 20): Promise<CommunityNews[]> {
    try {
      // 这里应该调用实际的API
      // 暂时返回模拟数据
      const news = this.getMockNews();
      
      // 根据分类过滤
      if (category && category !== 'all') {
        return news.filter(item => item.category === category);
      }
      
      return news;
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      throw new Error('获取新闻列表失败');
    }
  }

  /**
   * 获取新闻详情
   */
  async getNewsDetail(newsId: string): Promise<CommunityNews | null> {
    try {
      // 这里应该调用实际的API
      const news = this.getMockNews();
      return news.find(item => item.id === newsId) || null;
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      throw new Error('获取新闻详情失败');
    }
  }

  /**
   * 搜索新闻
   */
  async searchNews(keyword: string): Promise<CommunityNews[]> {
    try {
      // 这里应该调用实际的搜索API
      const news = this.getMockNews();
      return news.filter(item => 
        item.title.includes(keyword) || 
        item.content.includes(keyword) ||
        item.tags.some(tag => tag.includes(keyword))
      );
    } catch (error) {
      console.error('搜索新闻失败:', error);
      throw new Error('搜索新闻失败');
    }
  }

  /**
   * 点赞新闻
   */
  async likeNews(newsId: string): Promise<boolean> {
    try {
      // 这里应该调用实际的API
      console.log('点赞新闻:', newsId);
      return true;
    } catch (error) {
      console.error('点赞新闻失败:', error);
      throw new Error('点赞新闻失败');
    }
  }

  /**
   * 评论新闻
   */
  async commentNews(newsId: string, comment: string): Promise<boolean> {
    try {
      // 这里应该调用实际的API
      console.log('评论新闻:', {newsId, comment});
      return true;
    } catch (error) {
      console.error('评论新闻失败:', error);
      throw new Error('评论新闻失败');
    }
  }

  /**
   * 获取热门新闻
   */
  async getHotNews(): Promise<CommunityNews[]> {
    try {
      // 这里应该调用实际的API
      const news = this.getMockNews();
      return news
        .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
        .slice(0, 5);
    } catch (error) {
      console.error('获取热门新闻失败:', error);
      throw new Error('获取热门新闻失败');
    }
  }

  /**
   * 获取模拟新闻数据
   */
  private getMockNews(): CommunityNews[] {
    return [
      {
        id: '1',
        title: '社区志愿者服务活动圆满结束',
        content: '上周六，我们社区举办了一场大型志愿者服务活动，共有50余名志愿者参与，为社区老人提供了医疗咨询、理发、清洁等服务。活动得到了社区居民的一致好评，展现了我们社区的温暖和团结。',
        author: '社区管理员',
        category: 'community',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news1.jpg',
        tags: ['志愿者', '社区服务', '公益活动'],
        likes: 128,
        comments: 32,
      },
      {
        id: '2',
        title: '志愿者李阿姨的感人故事',
        content: '李阿姨今年65岁，退休后一直坚持做志愿者，每周都会去敬老院陪伴老人聊天，为行动不便的老人提供帮助。她的无私奉献精神感动了很多人，成为了我们社区的榜样。',
        author: '社区记者',
        category: 'volunteer',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news2.jpg',
        tags: ['志愿者故事', '敬老院', '无私奉献'],
        likes: 89,
        comments: 18,
      },
      {
        id: '3',
        title: '紧急通知：暴雨天气安全提醒',
        content: '根据气象部门预报，今晚到明天将有强降雨天气，请社区居民注意安全，减少外出，关好门窗，注意用电安全。如有紧急情况，请及时联系社区工作人员。',
        author: '社区安全员',
        category: 'emergency',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news3.jpg',
        tags: ['紧急通知', '天气预警', '安全提醒'],
        likes: 45,
        comments: 12,
      },
      {
        id: '4',
        title: '夏季健康生活小贴士',
        content: '夏季来临，天气炎热，提醒大家注意防暑降温，多喝水，避免长时间在户外活动。同时要注意饮食卫生，多吃新鲜蔬果，保持健康的生活方式。',
        author: '社区医生',
        category: 'tips',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news4.jpg',
        tags: ['健康贴士', '夏季养生', '防暑降温'],
        likes: 67,
        comments: 15,
      },
      {
        id: '5',
        title: '社区图书馆重新开放',
        content: '经过装修升级，社区图书馆将于本周六重新开放。新图书馆环境更加舒适，藏书更加丰富，还增加了电子阅览区。欢迎社区居民前来借阅图书，享受阅读的乐趣。',
        author: '图书馆管理员',
        category: 'community',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news5.jpg',
        tags: ['图书馆', '重新开放', '阅读'],
        likes: 56,
        comments: 8,
      },
      {
        id: '6',
        title: '志愿者培训活动报名开始',
        content: '为了提高志愿者服务质量，我们将举办一期志愿者培训活动，内容包括急救知识、沟通技巧、服务礼仪等。培训时间为下周六全天，地点在社区活动中心，欢迎有意愿的居民报名参加。',
        author: '志愿者协会',
        category: 'volunteer',
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        imageUrl: 'https://example.com/news6.jpg',
        tags: ['志愿者培训', '急救知识', '服务技能'],
        likes: 78,
        comments: 25,
      },
    ];
  }
}

export default CommunityNewsService.getInstance();
