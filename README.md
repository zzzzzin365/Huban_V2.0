一个基于React Native开发的移动应用，旨在连接需要帮助的社区居民与愿意提供服务的志愿者。应用集成了GeoHash地理位置匹配、高德地图、AR功能、语音聊天等先进技术，为用户提供便捷的志愿者服务匹配平台。

## 主要功能

###志愿者匹配系统
- 基于GeoHash的地理位置匹配
- 智能技能匹配算法
- 实时志愿者状态显示
- 求助请求管理

###语音聊天功能
- AR形象的AI Agent智能对话
- 语音转文字/文字转语音
- 实时语音录制和播放

###社区资讯
- 社区实时资讯、通知更新

###紧急求助
- 一键紧急求助
- 快速位置分享
- 就近志愿者显示

###个人中心
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

### 后端技术栈
- **Node.js + Express** - 后端服务框架
- **MySQL + Sequelize** - 数据库和ORM
- **Redis** - 缓存和会话管理
- **JWT** - 身份认证
- **Web3.js** - 区块链集成

### 核心依赖
```json
{
  "react-native-maps": "^1.6.0",
  "react-native-vector-icons": "^10.0.2",
  "zustand": "^4.4.1",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/bottom-tabs": "^6.5.11"
}
```

### 项目结构
```
├── src/                    # React Native前端源码
│   ├── components/         # 可复用组件
│   ├── screens/           # 页面组件
│   ├── services/          # 业务服务层
│   ├── stores/            # 状态管理
│   ├── types/             # TypeScript类型定义
│   └── config/            # 配置文件
├── backend/               # Node.js后端服务
│   ├── src/               # 后端源码
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由定义
│   │   ├── services/      # 业务服务
│   │   └── middleware/    # 中间件
│   └── scripts/           # 数据库脚本
├── package.json           # 前端依赖配置
└── README.md             # 项目说明文档
```
