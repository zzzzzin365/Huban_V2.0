const { sequelize } = require('../src/config/database');
const { initRedis } = require('../src/config/redis');
const { blockchainService } = require('../src/config/blockchain');

// 导入所有模型
const User = require('../src/models/User');
const Volunteer = require('../src/models/Volunteer');

// 模型关联
const models = {
  User,
  Volunteer,
};

// 建立模型关联
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// 数据库迁移
const migrate = async () => {
  try {
    console.log('🚀 开始数据库迁移...');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 同步所有模型到数据库
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ 数据库表同步完成');
    
    // 初始化Redis
    await initRedis();
    console.log('✅ Redis连接成功');
    
    // 初始化区块链服务
    await blockchainService.init();
    console.log('✅ 区块链服务初始化完成');
    
    console.log('🎉 数据库迁移完成！');
    
    // 显示数据库信息
    const tables = await sequelize.showAllSchemas();
    console.log('📊 数据库表列表:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// 运行迁移
if (require.main === module) {
  migrate();
}

module.exports = { migrate }; 
