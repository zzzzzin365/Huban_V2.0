# 乐呼志愿者匹配应用 - React Native版本

## 项目简介

乐呼志愿者匹配应用是一个基于React Native开发的移动应用，旨在连接需要帮助的社区居民与愿意提供服务的志愿者。应用集成了GeoHash地理位置匹配、高德地图、AR功能、语音聊天等先进技术，为用户提供便捷的志愿者服务匹配平台。

## 主要功能

### 🗺️ 志愿者匹配系统
- 基于GeoHash的地理位置匹配
- 智能技能匹配算法
- 实时志愿者状态显示
- 求助请求管理

### 🗣️ 语音聊天功能
- AI助手智能对话
- 语音转文字/文字转语音
- 实时语音录制和播放
- 多语言支持

### 📰 社区新闻
- 分类新闻浏览
- 实时资讯更新
- 社区动态分享
- 互动评论系统

### 🚨 紧急求助
- 一键紧急求助
- 紧急联系人管理
- 快速位置分享
- 医疗信息显示

### 👤 个人中心
- 用户信息管理
- 志愿者证书展示
- 服务记录统计
- 设置和偏好

## 技术架构

### 前端技术栈
- **React Native 0.72.6** - 跨平台移动应用开发框架
- **TypeScript** - 类型安全的JavaScript超集
- **Zustand** - 轻量级状态管理
- **React Navigation** - 导航管理
- **React Native Maps** - 地图组件
- **React Native Vector Icons** - 图标库

### 核心依赖
```json
{
  "react-native-maps": "^1.7.1",
  "react-native-geolocation-service": "^5.3.1",
  "react-native-voice": "^0.3.0",
  "react-native-tts": "^4.1.0",
  "react-native-sound": "^0.11.2",
  "react-native-permissions": "^3.10.1"
}
```

### 项目结构
```
src/
├── components/          # 可复用组件
├── screens/            # 页面组件
├── services/           # 业务服务层
├── stores/             # 状态管理
├── types/              # TypeScript类型定义
├── config/             # 配置文件
└── utils/              # 工具函数
```

## 安装和运行

### 环境要求
- Node.js >= 16
- React Native CLI
- Android Studio / Xcode
- JDK 11+

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd volunteer-matching-app
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **iOS依赖安装**
```bash
cd ios && pod install && cd ..
```

4. **启动Metro服务器**
```bash
npm start
# 或
yarn start
```

5. **运行应用**
```bash
# Android
npm run android
# iOS
npm run ios
```

## 配置说明

### API配置
在 `src/config/apiConfig.ts` 中配置：
- 后端API地址
- 高德地图API密钥
- 其他第三方服务配置

### 权限配置

#### Android权限 (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
```

#### iOS权限 (ios/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要位置权限来匹配附近的志愿者</string>
<key>NSMicrophoneUsageDescription</key>
<string>需要麦克风权限来进行语音聊天</string>
<key>NSCameraUsageDescription</key>
<string>需要相机权限来拍摄照片</string>
```

## 主要特性

### 🌍 地理位置服务
- 实时GPS定位
- GeoHash编码算法
- 距离计算和范围搜索
- 高德地图集成

### 🤖 AI智能助手
- 自然语言处理
- 智能问答系统
- 语音交互支持
- 个性化推荐

### 📱 跨平台支持
- iOS和Android双平台
- 原生性能优化
- 响应式设计
- 离线功能支持

### 🔒 安全与隐私
- 用户数据加密
- 权限管理
- 隐私保护
- 安全认证

## 开发指南

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint规则
- 组件使用函数式组件和Hooks
- 状态管理使用Zustand

### 组件开发
- 组件应该是可复用的
- 使用Props接口定义组件属性
- 实现适当的错误边界
- 添加必要的注释和文档

### 测试
```bash
# 运行测试
npm test

# 代码检查
npm run lint
```

## 部署说明

### 构建生产版本

#### Android
```bash
cd android
./gradlew assembleRelease
```

#### iOS
```bash
cd ios
xcodebuild -workspace VolunteerMatchingApp.xcworkspace -scheme VolunteerMatchingApp -configuration Release archive
```

### 应用商店发布
- 遵循各平台的应用商店规范
- 准备应用截图和描述
- 配置应用签名和证书
- 测试发布流程

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者：[维护者姓名]
- 邮箱：[联系邮箱]
- 项目地址：[项目URL]

## 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基础志愿者匹配功能
- 语音聊天系统
- 社区新闻模块
- 紧急求助功能

---

**注意**: 本项目是从Flutter版本转换而来，保留了所有原有功能，同时优化了性能和用户体验。
