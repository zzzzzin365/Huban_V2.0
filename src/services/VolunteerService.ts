import {Volunteer, HelpRequest, ApiResponse} from '../types';
import {ApiConfig} from '../config/apiConfig';

class VolunteerService {
  private static instance: VolunteerService;
  private baseURL: string;

  private constructor() {
    this.baseURL = ApiConfig.baseURL;
  }

  static getInstance(): VolunteerService {
    if (!VolunteerService.instance) {
      VolunteerService.instance = new VolunteerService();
    }
    return VolunteerService.instance;
  }

  /**
   * 获取志愿者列表
   */
  async getVolunteers(): Promise<Volunteer[]> {
    try {
      // 这里应该调用实际的API
      // 暂时返回模拟数据
      return this.getMockVolunteers();
    } catch (error) {
      console.error('获取志愿者列表失败:', error);
      throw new Error('获取志愿者列表失败');
    }
  }

  /**
   * 获取求助请求列表
   */
  async getHelpRequests(): Promise<HelpRequest[]> {
    try {
      // 这里应该调用实际的API
      // 暂时返回模拟数据
      return this.getMockHelpRequests();
    } catch (error) {
      console.error('获取求助请求列表失败:', error);
      throw new Error('获取求助请求列表失败');
    }
  }

  /**
   * 创建求助请求
   */
  async createHelpRequest(request: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<HelpRequest> {
    try {
      // 这里应该调用实际的API
      const newRequest: HelpRequest = {
        ...request,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('创建求助请求:', newRequest);
      return newRequest;
    } catch (error) {
      console.error('创建求助请求失败:', error);
      throw new Error('创建求助请求失败');
    }
  }

  /**
   * 更新求助请求状态
   */
  async updateHelpRequestStatus(
    requestId: string,
    status: HelpRequest['status'],
    volunteerId?: string
  ): Promise<boolean> {
    try {
      // 这里应该调用实际的API
      console.log('更新求助请求状态:', {requestId, status, volunteerId});
      return true;
    } catch (error) {
      console.error('更新求助请求状态失败:', error);
      throw new Error('更新求助请求状态失败');
    }
  }

  /**
   * 搜索附近的志愿者
   */
  async searchNearbyVolunteers(
    latitude: number,
    longitude: number,
    radius: number,
    skills?: string[]
  ): Promise<Volunteer[]> {
    try {
      // 这里应该调用实际的API
      const volunteers = this.getMockVolunteers();
      
      // 过滤技能
      let filteredVolunteers = volunteers;
      if (skills && skills.length > 0) {
        filteredVolunteers = volunteers.filter(v =>
          skills.some(skill => v.skills.includes(skill))
        );
      }
      
      return filteredVolunteers;
    } catch (error) {
      console.error('搜索附近志愿者失败:', error);
      throw new Error('搜索附近志愿者失败');
    }
  }

  /**
   * 获取志愿者详情
   */
  async getVolunteerDetail(volunteerId: string): Promise<Volunteer | null> {
    try {
      // 这里应该调用实际的API
      const volunteers = this.getMockVolunteers();
      return volunteers.find(v => v.id === volunteerId) || null;
    } catch (error) {
      console.error('获取志愿者详情失败:', error);
      throw new Error('获取志愿者详情失败');
    }
  }

  /**
   * 联系志愿者
   */
  async contactVolunteer(volunteerId: string, message: string): Promise<boolean> {
    try {
      // 这里应该调用实际的API
      console.log('联系志愿者:', {volunteerId, message});
      return true;
    } catch (error) {
      console.error('联系志愿者失败:', error);
      throw new Error('联系志愿者失败');
    }
  }

  /**
   * 评价志愿者
   */
  async rateVolunteer(volunteerId: string, rating: number, comment?: string): Promise<boolean> {
    try {
      // 这里应该调用实际的API
      console.log('评价志愿者:', {volunteerId, rating, comment});
      return true;
    } catch (error) {
      console.error('评价志愿者失败:', error);
      throw new Error('评价志愿者失败');
    }
  }

  /**
   * 获取模拟志愿者数据
   */
  private getMockVolunteers(): Volunteer[] {
    return [
      {
        id: '1',
        name: '张三',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        avatar: 'https://example.com/avatar1.jpg',
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          geohash: 'wx4g0e',
          address: '北京市朝阳区某某街道1号',
        },
        skills: ['医疗救助', '心理咨询', '紧急救援'],
        rating: 4.8,
        isOnline: true,
        lastActive: new Date(),
        volunteerId: 'V001',
        experience: 5,
        certifications: ['急救证书', '心理咨询师证书'],
        availability: {
          weekdays: true,
          weekends: true,
          hours: ['09:00-18:00'],
        },
      },
      {
        id: '2',
        name: '李四',
        phone: '13800138002',
        email: 'lisi@example.com',
        avatar: 'https://example.com/avatar2.jpg',
        location: {
          latitude: 39.9142,
          longitude: 116.4174,
          geohash: 'wx4g0f',
          address: '北京市朝阳区某某街道2号',
        },
        skills: ['老人陪护', '儿童教育', '社区服务'],
        rating: 4.6,
        isOnline: false,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        volunteerId: 'V002',
        experience: 3,
        certifications: ['社工证书'],
        availability: {
          weekdays: true,
          weekends: false,
          hours: ['19:00-22:00'],
        },
      },
      {
        id: '3',
        name: '王五',
        phone: '13800138003',
        email: 'wangwu@example.com',
        avatar: 'https://example.com/avatar3.jpg',
        location: {
          latitude: 39.9242,
          longitude: 116.4274,
          geohash: 'wx4g0g',
          address: '北京市朝阳区某某街道3号',
        },
        skills: ['技术维修', '翻译服务', '法律咨询'],
        rating: 4.9,
        isOnline: true,
        lastActive: new Date(),
        volunteerId: 'V003',
        experience: 7,
        certifications: ['工程师证书', '律师证书'],
        availability: {
          weekdays: false,
          weekends: true,
          hours: ['10:00-16:00'],
        },
      },
    ];
  }

  /**
   * 获取模拟求助请求数据
   */
  private getMockHelpRequests(): HelpRequest[] {
    return [
      {
        id: '1',
        requesterId: 'user1',
        title: '老人需要陪护服务',
        description: '我父亲今年75岁，行动不便，需要有人陪伴聊天和照顾日常生活。希望有经验的志愿者能够提供帮助。',
        category: '老人陪护',
        urgency: 'medium',
        location: {
          latitude: 39.9042,
          longitude: 116.4074,
          geohash: 'wx4g0e',
          address: '北京市朝阳区某某街道1号',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        estimatedDuration: 4,
      },
      {
        id: '2',
        requesterId: 'user2',
        title: '紧急医疗救助',
        description: '家中有老人突发心脏病，需要紧急医疗救助，希望有医疗背景的志愿者能够提供帮助。',
        category: '医疗救助',
        urgency: 'emergency',
        location: {
          latitude: 39.9142,
          longitude: 116.4174,
          geohash: 'wx4g0f',
          address: '北京市朝阳区某某街道2号',
        },
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        estimatedDuration: 2,
      },
      {
        id: '3',
        requesterId: 'user3',
        title: '儿童教育辅导',
        description: '孩子今年上小学三年级，数学成绩不太好，希望有教育经验的志愿者能够提供学习辅导。',
        category: '儿童教育',
        urgency: 'low',
        location: {
          latitude: 39.9242,
          longitude: 116.4274,
          geohash: 'wx4g0g',
          address: '北京市朝阳区某某街道3号',
        },
        status: 'accepted',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        assignedVolunteerId: 'V001',
        estimatedDuration: 3,
      },
    ];
  }
}

export default VolunteerService.getInstance();
