const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 志愿者模型
const Volunteer = sequelize.define('Volunteer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  volunteerId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isArray: true,
    },
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50,
    },
  },
  certifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    validate: {
      isArray: true,
    },
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      weekdays: true,
      weekends: false,
      hours: ['09:00-18:00'],
    },
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 5.00,
    validate: {
      min: 0.00,
      max: 5.00,
    },
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalHelps: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  totalHours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  lastActive: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      latitude: null,
      longitude: null,
      geohash: null,
      address: null,
    },
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emergencyContact: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      name: null,
      phone: null,
      relationship: null,
    },
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      maxDistance: 10, // 最大服务距离（公里）
      preferredCategories: [], // 偏好的服务类别
      maxHoursPerDay: 8, // 每天最大服务小时数
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
    defaultValue: 'pending_verification',
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  verifiedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'volunteers',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['volunteerId'],
    },
    {
      fields: ['userId'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['isOnline'],
    },
    {
      fields: ['rating'],
    },
    {
      fields: ['skills'],
      type: 'FULLTEXT',
    },
  ],
  hooks: {
    beforeCreate: async (volunteer, options) => {
      // 生成志愿者ID
      if (!volunteer.volunteerId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        volunteer.volunteerId = `V${timestamp}${random}`;
      }
    },
    
    afterSave: async (volunteer, options) => {
      // 更新用户角色为志愿者
      if (volunteer.status === 'active' && volunteer.changed('status')) {
        const { User } = require('./index');
        await User.update(
          { role: 'volunteer' },
          { where: { id: volunteer.userId } }
        );
      }
    },
  },
});

// 实例方法
Volunteer.prototype.updateRating = async function(newRating) {
  const totalRating = this.rating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.rating = totalRating / this.totalRatings;
  await this.save();
};

Volunteer.prototype.updateLocation = async function(latitude, longitude, address) {
  this.location = {
    latitude,
    longitude,
    geohash: this.generateGeohash(latitude, longitude),
    address,
  };
  await this.save();
};

Volunteer.prototype.generateGeohash = function(latitude, longitude) {
  // 简化的Geohash生成
  const lat = Math.floor((latitude + 90) * 1000000);
  const lon = Math.floor((longitude + 180) * 1000000);
  return `${lat.toString(36)}${lon.toString(36)}`;
};

Volunteer.prototype.isAvailable = function() {
  if (!this.isOnline || this.status !== 'active') {
    return false;
  }
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // 检查工作日/周末可用性
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    if (!this.availability.weekdays) return false;
  } else {
    if (!this.availability.weekends) return false;
  }
  
  // 检查时间段可用性
  const currentTime = `${hour.toString().padStart(2, '0')}:00`;
  return this.availability.hours.some(timeRange => {
    const [start, end] = timeRange.split('-');
    return currentTime >= start && currentTime <= end;
  });
};

Volunteer.prototype.canHelp = function(category, distance) {
  if (!this.isAvailable()) return false;
  
  // 检查技能匹配
  if (!this.skills.includes(category)) return false;
  
  // 检查距离限制
  if (distance > this.preferences.maxDistance) return false;
  
  return true;
};

// 类方法
Volunteer.findBySkills = async function(skills, limit = 50) {
  return await this.findAll({
    where: {
      status: 'active',
      isOnline: true,
      skills: {
        [sequelize.Op.overlap]: skills,
      },
    },
    limit,
    order: [['rating', 'DESC'], ['totalHelps', 'DESC']],
  });
};

Volunteer.findNearby = async function(latitude, longitude, radius = 10, limit = 50) {
  // 这里应该使用空间查询，暂时使用简单的距离计算
  const volunteers = await this.findAll({
    where: {
      status: 'active',
      isOnline: true,
    },
    limit,
    order: [['rating', 'DESC']],
  });
  
  // 过滤距离范围内的志愿者
  return volunteers.filter(volunteer => {
    if (!volunteer.location.latitude || !volunteer.location.longitude) return false;
    
    const distance = this.calculateDistance(
      latitude,
      longitude,
      volunteer.location.latitude,
      volunteer.location.longitude
    );
    
    return distance <= radius;
  });
};

Volunteer.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

Volunteer.getTopVolunteers = async function(limit = 10) {
  return await this.findAll({
    where: {
      status: 'active',
    },
    limit,
    order: [['rating', 'DESC'], ['totalHelps', 'DESC']],
  });
};

// 关联关系
Volunteer.associate = function(models) {
  Volunteer.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  Volunteer.hasMany(models.HelpRequest, {
    foreignKey: 'volunteerId',
    as: 'assignedRequests',
  });
  
  Volunteer.hasMany(models.Rating, {
    foreignKey: 'volunteerId',
    as: 'receivedRatings',
  });
};

module.exports = Volunteer;
