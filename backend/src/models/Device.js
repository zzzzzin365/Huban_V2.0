const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
class Device {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'elderly_care',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  async create(deviceData) {
    try {
      const [result] = await this.pool.execute(
        `INSERT INTO devices (
          user_id, device_id, device_type, device_name, 
          platform, app_version, fcm_token, is_active, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          deviceData.user_id,
          deviceData.device_id,
          deviceData.device_type,
          deviceData.device_name,
          deviceData.platform,
          deviceData.app_version,
          deviceData.fcm_token || null
        ]
      );
      return result.insertId;
    } catch (error) {
      logger.error('Create device error:', error);
      throw error;
    }
  }
    try {
      const existingDevice = await this.findByDeviceId(deviceData.device_id);
      if (existingDevice) {
        const [result] = await this.pool.execute(
          `UPDATE devices SET 
            user_id = ?, device_type = ?, device_name = ?, 
            platform = ?, app_version = ?, fcm_token = ?, 
            is_active = 1, updated_at = NOW()
           WHERE device_id = ?`,
          [
            deviceData.user_id,
            deviceData.device_type,
            deviceData.device_name,
            deviceData.platform,
            deviceData.app_version,
            deviceData.fcm_token || null,
            deviceData.device_id
          ]
        );
        return existingDevice.id;
      } else {
      }
    } catch (error) {
      logger.error('Upsert device error:', error);
      throw error;
    }
  }
  async findByDeviceId(deviceId) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM devices WHERE device_id = ?',
        [deviceId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Find device by device_id error:', error);
      throw error;
    }
  }
  async findById(id) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM devices WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('Find device by id error:', error);
      throw error;
    }
  }
  async findByUserId(userId) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM devices WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC',
        [userId]
      );
      return rows;
    } catch (error) {
      logger.error('Find devices by user_id error:', error);
      throw error;
    }
  }
  async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
        if (updateData[key] !== undefined && updateData[key] !== null) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      if (fields.length === 0) {
        return false;
      }
      fields.push('updated_at = NOW()');
      values.push(id);
      const [result] = await this.pool.execute(
        `UPDATE devices SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Update device error:', error);
      throw error;
    }
  }
  async updateFcmToken(deviceId, fcmToken) {
    try {
      const [result] = await this.pool.execute(
        'UPDATE devices SET fcm_token = ?, updated_at = NOW() WHERE device_id = ?',
        [fcmToken, deviceId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Update FCM token error:', error);
      throw error;
    }
  }
  async deactivate(deviceId) {
    try {
      const [result] = await this.pool.execute(
        'UPDATE devices SET is_active = 0, updated_at = NOW() WHERE device_id = ?',
        [deviceId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Deactivate device error:', error);
      throw error;
    }
  }
  async delete(id) {
    try {
      const [result] = await this.pool.execute(
        'DELETE FROM devices WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Delete device error:', error);
      throw error;
    }
  }
  async getFcmTokensByUserId(userId) {
    try {
      const [rows] = await this.pool.execute(
        'SELECT fcm_token FROM devices WHERE user_id = ? AND is_active = 1 AND fcm_token IS NOT NULL',
        [userId]
      );
      return rows.map(row => row.fcm_token);
    } catch (error) {
      logger.error('Get FCM tokens by user_id error:', error);
      throw error;
    }
  }
  async getAllActiveFcmTokens() {
    try {
      const [rows] = await this.pool.execute(
        'SELECT fcm_token FROM devices WHERE is_active = 1 AND fcm_token IS NOT NULL'
      );
      return rows.map(row => row.fcm_token);
    } catch (error) {
      logger.error('Get all active FCM tokens error:', error);
      throw error;
    }
  }
  async getStats() {
    try {
      const [rows] = await this.pool.execute(
        `SELECT 
          COUNT(*) as total_devices,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_devices,
          SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) as mobile_devices,
          SUM(CASE WHEN device_type = 'web' THEN 1 ELSE 0 END) as web_devices,
          SUM(CASE WHEN fcm_token IS NOT NULL THEN 1 ELSE 0 END) as devices_with_fcm,
          SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_registrations
         FROM devices`
      );
      return rows[0];
    } catch (error) {
      logger.error('Get device stats error:', error);
      throw error;
    }
  }
  async cleanupExpiredFcmTokens() {
    try {
      const [result] = await this.pool.execute(
        'UPDATE devices SET fcm_token = NULL, updated_at = NOW() WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      return result.affectedRows;
    } catch (error) {
      logger.error('Cleanup expired FCM tokens error:', error);
      throw error;
    }
  }
  async getList(page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const values = [];
      if (filters.user_id) {
        whereClause += ' AND user_id = ?';
        values.push(filters.user_id);
      }
      if (filters.device_type) {
        whereClause += ' AND device_type = ?';
        values.push(filters.device_type);
      }
      if (filters.is_active !== undefined) {
        whereClause += ' AND is_active = ?';
        values.push(filters.is_active ? 1 : 0);
      }
      if (filters.platform) {
        whereClause += ' AND platform = ?';
        values.push(filters.platform);
      }
      const [countRows] = await this.pool.execute(
        `SELECT COUNT(*) as total FROM devices ${whereClause}`,
        values
      );
      const [deviceRows] = await this.pool.execute(
        `SELECT d.*, u.name as user_name, u.phone as user_phone
         FROM devices d
         LEFT JOIN users u ON d.user_id = u.id
         ${whereClause}
         ORDER BY d.updated_at DESC
         LIMIT ? OFFSET ?`,
        [...values, limit, offset]
      );
      return {
        devices: deviceRows,
        pagination: {
          page,
          limit,
          total: countRows[0].total,
          totalPages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      logger.error('Get device list error:', error);
      throw error;
    }
  }
}
module.exports = Device; 
