const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { JWTService } = require('../config/jwt');

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/,
    },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: /^1[3-9]\d{9}$/,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  realName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    unique: true,
    validate: {
      is: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
    },
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'banned'),
    defaultValue: 'active',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  role: {
    type: DataTypes.ENUM('user', 'volunteer', 'admin', 'super_admin'),
    defaultValue: 'user',
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // 软删除
  indexes: [
    {
      unique: true,
      fields: ['username'],
    },
    {
      unique: true,
      fields: ['email'],
    },
    {
      unique: true,
      fields: ['phone'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['isVerified'],
    },
  ],
  hooks: {
    // 保存前钩子
    beforeSave: async (user, options) => {
      // 如果密码被修改，重新哈希
      if (user.changed('password')) {
        user.password = JWTService.hashPassword(user.password);
      }
    },
    
    // 保存后钩子
    afterSave: async (user, options) => {
      // 可以在这里添加日志记录、缓存更新等逻辑
    },
  },
});

// 实例方法
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password; // 不返回密码
  return values;
};

User.prototype.updateLoginInfo = async function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  await this.save();
};

User.prototype.verifyPassword = function(password) {
  return JWTService.verifyPassword(password, this.password);
};

User.prototype.isActive = function() {
  return this.status === 'active';
};

User.prototype.canVolunteer = function() {
  return this.role === 'volunteer' || this.role === 'admin' || this.role === 'super_admin';
};

// 类方法
User.findByCredentials = async function(identifier, password) {
  let user;
  
  // 支持用户名、邮箱或手机号登录
  if (identifier.includes('@')) {
    user = await this.findOne({ where: { email: identifier } });
  } else if (/^1[3-9]\d{9}$/.test(identifier)) {
    user = await this.findOne({ where: { phone: identifier } });
  } else {
    user = await this.findOne({ where: { username: identifier } });
  }
  
  if (!user || !user.verifyPassword(password)) {
    throw new Error('用户名或密码错误');
  }
  
  if (!user.isActive()) {
    throw new Error('账户已被禁用');
  }
  
  return user;
};

User.findByPhone = async function(phone) {
  return await this.findOne({ where: { phone } });
};

User.findByEmail = async function(email) {
  return await this.findOne({ where: { email } });
};

User.findByUsername = async function(username) {
  return await this.findOne({ where: { username } });
};

User.findActiveVolunteers = async function() {
  return await this.findAll({
    where: {
      status: 'active',
      role: ['volunteer', 'admin', 'super_admin'],
    },
  });
};

// 关联关系
User.associate = function(models) {
  // 一个用户可以有多个志愿者记录
  User.hasMany(models.Volunteer, {
    foreignKey: 'userId',
    as: 'volunteerRecords',
  });
  
  // 一个用户可以有多个求助请求
  User.hasMany(models.HelpRequest, {
    foreignKey: 'requesterId',
    as: 'helpRequests',
  });
  
  // 一个用户可以有多个聊天消息
  User.hasMany(models.ChatMessage, {
    foreignKey: 'senderId',
    as: 'messages',
  });
  
  // 一个用户可以有多个评价
  User.hasMany(models.Rating, {
    foreignKey: 'userId',
    as: 'ratings',
  });
};

module.exports = User; 
