# 乐呼志愿者匹配应用 - 后端服务

## 🎯 项目简介

乐呼志愿者匹配应用是一个基于Node.js构建的智能志愿者匹配平台，集成了JWT用户认证、MySQL数据建模、Redis缓存和区块链存证等先进技术。

## ✨ 核心特性

### 🔐 用户认证系统
- **JWT令牌认证**：支持访问令牌和刷新令牌
- **角色权限管理**：用户、志愿者、管理员、超级管理员
- **安全中间件**：认证、授权、限流、CORS等

### 🗄️ 数据存储
- **MySQL数据库**：使用Sequelize ORM进行数据建模
- **Redis缓存**：用户会话、数据缓存、令牌黑名单
- **数据关联**：完整的用户-志愿者-帮助请求关系模型

### ⛓️ 区块链集成
- **多链支持**：以太坊、Polygon、BSC
- **智能合约**：证据存储、验证、查询
- **存证服务**：志愿者认证、帮助记录、评价信息

### 🚀 性能优化
- **连接池管理**：数据库和Redis连接优化
- **缓存策略**：多级缓存、智能过期
- **限流保护**：API请求频率控制

## 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │   Web Client    │    │   Mobile App    │
│     Frontend    │    │    Frontend     │    │    Frontend     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx Proxy   │
                    │   (Optional)    │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Express.js API │
                    │   Backend       │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MySQL DB      │    │   Redis Cache   │    │  Blockchain     │
│   (Sequelize)   │    │   (Session)     │    │  (Ethereum)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 16.0.0
- **MySQL**: >= 8.0
- **Redis**: >= 6.0
- **Docker**: >= 20.0 (可选)

### 1. 克隆项目

```bash
git clone <repository-url>
cd volunteer-matching-backend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制环境配置文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=volunteer_matching

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your-super-secret-jwt-key

# 区块链配置
ETH_RPC_URL=https://sepolia.infura.io/v3/your-project-id
ETH_PRIVATE_KEY=your-private-key
```

### 4. 数据库迁移

```bash
npm run migrate
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🐳 Docker部署

### 使用Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

### 单独构建镜像

```bash
# 构建后端镜像
docker build -t volunteer-matching-backend .

# 运行容器
docker run -p 3000:3000 volunteer-matching-backend
```

## 📁 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.js   # MySQL配置
│   │   ├── redis.js      # Redis配置
│   │   ├── blockchain.js # 区块链配置
│   │   └── jwt.js        # JWT配置
│   ├── models/           # 数据模型
│   │   ├── User.js       # 用户模型
│   │   └── Volunteer.js  # 志愿者模型
│   ├── middleware/       # 中间件
│   │   └── auth.js       # 认证中间件
│   ├── routes/           # 路由定义
│   │   ├── auth.js       # 认证路由
│   │   ├── volunteers.js # 志愿者路由
│   │   └── ...
│   ├── services/         # 业务服务
│   │   └── BlockchainService.js # 区块链服务
│   └── app.js            # 应用入口
├── scripts/              # 脚本文件
│   └── migrate.js        # 数据库迁移
├── docker-compose.yml    # Docker编排
├── Dockerfile            # Docker镜像
├── package.json          # 依赖配置
└── README.md             # 项目文档
```

## 🔌 API接口

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/logout` | 用户登出 |

### 志愿者接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/volunteers` | 获取志愿者列表 |
| GET | `/api/volunteers/nearby` | 获取附近志愿者 |
| POST | `/api/volunteers` | 创建志愿者 |
| PUT | `/api/volunteers/:id` | 更新志愿者信息 |

### 区块链接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/blockchain/evidence` | 存储证据 |
| GET | `/api/blockchain/evidence/:hash` | 验证证据 |
| GET | `/api/blockchain/stats` | 获取统计信息 |

## 🔧 开发指南

### 添加新模型

1. 在 `src/models/` 目录创建模型文件
2. 定义数据结构和关联关系
3. 在 `scripts/migrate.js` 中导入模型
4. 运行迁移脚本

### 添加新路由

1. 在 `src/routes/` 目录创建路由文件
2. 定义路由处理函数
3. 在 `src/app.js` 中注册路由
4. 添加必要的中间件

### 添加新服务

1. 在 `src/services/` 目录创建服务文件
2. 实现业务逻辑
3. 在路由中调用服务
4. 添加错误处理和日志

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 测试环境配置

创建 `.env.test` 文件：

```env
NODE_ENV=test
DB_NAME=volunteer_matching_test
REDIS_DB=1
```

## 📊 监控和日志

### 健康检查

```bash
curl http://localhost:3000/health
```

### 日志配置

- 应用日志：`./logs/app.log`
- 错误日志：`./logs/error.log`
- 访问日志：控制台输出

## 🔒 安全特性

- **Helmet**: 安全头设置
- **CORS**: 跨域资源共享控制
- **Rate Limiting**: API限流保护
- **JWT**: 安全的令牌认证
- **Input Validation**: 输入数据验证
- **SQL Injection Protection**: Sequelize ORM保护

## 🚀 性能优化

- **连接池**: 数据库和Redis连接复用
- **缓存策略**: 多级缓存、智能过期
- **异步处理**: 非阻塞I/O操作
- **负载均衡**: 支持多实例部署

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目维护者：[Your Name]
- 邮箱：[your.email@example.com]
- 项目链接：[https://github.com/username/volunteer-matching-backend](https://github.com/username/volunteer-matching-backend)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**注意**: 在生产环境中部署前，请确保：
1. 修改所有默认密码和密钥
2. 配置适当的防火墙规则
3. 启用HTTPS
4. 定期备份数据库
5. 监控系统性能和安全
