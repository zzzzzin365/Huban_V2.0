class ApiConfig {
  static const String amapApiKey = 'YOUR_AMAP_API_KEY';
  static const String amapAndroidKey = 'YOUR_ANDROID_AMAP_KEY';
  static const String amapIosKey = 'YOUR_IOS_AMAP_KEY';
  
  static const String amapBaseUrl = 'https:
  
  static const String appName = '志愿者匹配系�?;
  static const String appVersion = '1.0.0';
  
  static const double defaultMaxDistance = 5000.0;
  static const int defaultMaxResults = 10;
  static const int defaultGeohashPrecision = 4;
  
  static const double arArrowScale = 0.5;
  static const double arDistanceIndicatorScale = 0.3;
  static const double arMarkerScale = 0.3;
  
  static const String defaultRouteStrategy = '0';
  static const int defaultRouteRadius = 1000;
  
  static const int requestTimeout = 30000;
  static const int maxRetries = 3;
  
  static const int locationCacheTime = 30000;
  static const int routeCacheTime = 60000;
  
  static const bool enableDebugLogs = true;
  static const bool enableMockData = true;
  
  static const String locationPermissionMessage = '需要位置权限来匹配附近志愿�?;
  static const String cameraPermissionMessage = '需要相机权限来使用AR功能';
  
  static const String networkError = '网络连接失败，请检查网络设�?;
  static const String locationError = '无法获取位置信息，请检查位置权�?;
  static const String arError = 'AR功能初始化失败，请检查设备兼容�?;
  static const String mapError = '地图加载失败，请检查API密钥配置';
  
  
  static const String matchSuccess = '志愿者匹配成�?;
  static const String requestSubmitted = '求助请求已提�?;
  static const String navigationStarted = 'AR导航已开�?;
  
  static bool get isAmapConfigured {
    return amapApiKey != 'YOUR_AMAP_API_KEY' &&
           amapAndroidKey != 'YOUR_ANDROID_AMAP_KEY' &&
           amapIosKey != 'YOUR_IOS_AMAP_KEY';
  }
  
  
    if (!isAmapConfigured) {
      return '警告: 高德地图API密钥未配置，地图功能将无法使�?;
    }
    return '';
  }
  
  static Map<String, dynamic> getEnvironmentConfig() {
    return {
      'appName': appName,
      'appVersion': appVersion,
      'amapConfigured': isAmapConfigured,
      'debugMode': enableDebugLogs,
      'mockDataEnabled': enableMockData,
    };
  }
  
  static Map<String, dynamic> getMatchingConfig() {
    return {
      'maxDistance': defaultMaxDistance,
      'maxResults': defaultMaxResults,
      'geohashPrecision': defaultGeohashPrecision,
    };
  }
  
  static Map<String, dynamic> getARConfig() {
    return {
      'arrowScale': arArrowScale,
      'distanceIndicatorScale': arDistanceIndicatorScale,
      'markerScale': arMarkerScale,
    };
  }
  
  static Map<String, dynamic> getRouteConfig() {
    return {
      'strategy': defaultRouteStrategy,
      'radius': defaultRouteRadius,
      'timeout': requestTimeout,
    };
  }
} 
