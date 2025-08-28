// 用户相关类型
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
  };
  skills: string[];
  rating: number;
  isOnline: boolean;
  lastActive: Date;
}

// 志愿者类型
export interface Volunteer extends User {
  volunteerId: string;
  experience: number;
  certifications: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    hours: string[];
  };
}

// 求助请求类型
export interface HelpRequest {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  location: {
    latitude: number;
    longitude: number;
    geohash: string;
    address: string;
  };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  assignedVolunteerId?: string;
  estimatedDuration?: number;
  photos?: string[];
}

// 聊天消息类型
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  timestamp: Date;
  isRead: boolean;
}

// AI代理类型
export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  capabilities: string[];
  isActive: boolean;
}

// 社区新闻类型
export interface CommunityNews {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  publishedAt: Date;
  imageUrl?: string;
  tags: string[];
  likes: number;
  comments: number;
}

// 位置类型
export interface Location {
  latitude: number;
  longitude: number;
  geohash: string;
  address: string;
  accuracy?: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 地图标记类型
export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  type: 'volunteer' | 'help_request' | 'emergency';
  data: Volunteer | HelpRequest;
}
