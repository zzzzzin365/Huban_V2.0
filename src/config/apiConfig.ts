export const ApiConfig = {
  // 应用配置
  appName: '乐呼志愿者匹配',
  version: '1.0.0',
  enableDebugLogs: __DEV__,
  
  // API配置
  baseURL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://your-production-api.com/api',
  
  // 高德地图配置
  amap: {
    apiKey: 'your_amap_api_key',
    securityJsCode: 'your_security_js_code',
  },
  
  // 超时配置
  timeout: 10000,
  
  // 重试配置
  retryCount: 3,
  retryDelay: 1000,
  
  // 缓存配置
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  
  // 文件上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  },
  
  // 语音配置
  voice: {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16,
  },
  
  // AR配置
  ar: {
    enableARKit: true,
    enableARCore: true,
    modelPath: 'assets/3d_models/agent.gltf',
  },
  
  // 地理位置配置
  location: {
    accuracy: 'high',
    timeout: 10000,
    maximumAge: 60000,
    distanceFilter: 10,
  },
  
  // 推送配置
  push: {
    enableNotifications: true,
    enableSound: true,
    enableVibration: true,
  },
};

export default ApiConfig;
