const axios = require('axios');
const logger = require('../utils/logger');
class SmsService {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.apiSecret = process.env.SMS_API_SECRET;
    this.endpoint = process.env.SMS_ENDPOINT || 'https:
    this.signName = process.env.SMS_SIGN_NAME || '老年人关爱平�?;
  }
  async sendVerificationCode(phone, code) {
    try {
      const message = `您的验证码是�?{code}，有效期5分钟。请勿泄露给他人。`;
      const response = await this.sendSms(phone, message, {
        templateCode: 'SMS_VERIFICATION_CODE',
        templateParam: JSON.stringify({ code })
      });
      logger.info(`SMS verification code sent to ${phone}: ${code}`);
      return response;
    } catch (error) {
      logger.error('Send verification code SMS error:', error);
      throw new Error('短信发送失�?);
    }
  }
  async sendNotification(phone, message, templateCode = null, templateParam = null) {
    try {
      const response = await this.sendSms(phone, message, {
        templateCode,
        templateParam
      });
      logger.info(`SMS notification sent to ${phone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send notification SMS error:', error);
      throw new Error('短信发送失�?);
    }
  }
    try {
      const message = `紧急求助：${helpInfo.elderlyName}需要帮助，位置�?{helpInfo.location}，联系电话：${helpInfo.contactPhone}`;
      const response = await this.sendSms(phone, message, {
        templateCode: 'SMS_EMERGENCY_HELP',
        templateParam: JSON.stringify(helpInfo)
      });
      logger.info(`Emergency help SMS sent to ${phone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send emergency help SMS error:', error);
      throw new Error('紧急求助短信发送失�?);
    }
  }
    try {
      const message = `您有新的帮助请求�?{elderlyInfo.name}需要帮助，位置�?{elderlyInfo.location}，请及时联系。`;
      const response = await this.sendSms(volunteerPhone, message, {
        templateCode: 'SMS_VOLUNTEER_MATCH',
        templateParam: JSON.stringify(elderlyInfo)
      });
      logger.info(`Volunteer match SMS sent to ${volunteerPhone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send volunteer match SMS error:', error);
      throw new Error('志愿者匹配短信发送失�?);
    }
  }
  async sendActivityNotification(phone, activityInfo) {
    try {
      const message = `社区活动通知�?{activityInfo.title}，时间：${activityInfo.time}，地点：${activityInfo.location}，欢迎参加！`;
      const response = await this.sendSms(phone, message, {
        templateCode: 'SMS_ACTIVITY_NOTIFICATION',
        templateParam: JSON.stringify(activityInfo)
      });
      logger.info(`Activity notification SMS sent to ${phone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send activity notification SMS error:', error);
      throw new Error('活动通知短信发送失�?);
    }
  }
    try {
      const message = `亲爱�?{userName}，祝您生日快乐！愿您身体健康，生活愉快！`;
      const response = await this.sendSms(phone, message, {
        templateCode: 'SMS_BIRTHDAY_WISH',
        templateParam: JSON.stringify({ userName })
      });
      logger.info(`Birthday wish SMS sent to ${phone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send birthday wish SMS error:', error);
      throw new Error('生日祝福短信发送失�?);
    }
  }
    try {
      const message = `健康提醒�?{reminderInfo.type}，时间：${reminderInfo.time}，请及时处理。`;
      const response = await this.sendSms(phone, message, {
        templateCode: 'SMS_HEALTH_REMINDER',
        templateParam: JSON.stringify(reminderInfo)
      });
      logger.info(`Health reminder SMS sent to ${phone}: ${message}`);
      return response;
    } catch (error) {
      logger.error('Send health reminder SMS error:', error);
      throw new Error('健康提醒短信发送失�?);
    }
  }
    try {
        logger.warn('SMS API credentials not configured, using mock response');
        return this.mockSmsResponse(phone, message);
      }
      const requestData = {
        phone,
        message,
        signName: this.signName,
        ...options
      };
      const response = await axios.post(this.endpoint, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret
        },
        timeout: 10000 
        return {
          success: true,
          messageId: response.data.messageId,
          message: '短信发送成�?
        };
      } else {
        throw new Error(response.data.message || '短信发送失�?);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        logger.error('SMS API timeout');
        throw new Error('短信服务超时');
      }
      if (error.response) {
        logger.error('SMS API error:', error.response.data);
        throw new Error(error.response.data.message || '短信发送失�?);
      }
      logger.error('SMS send error:', error);
      throw new Error('短信发送失�?);
    }
  }
  mockSmsResponse(phone, message) {
    logger.info(`Mock SMS sent to ${phone}: ${message}`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: '短信发送成功（模拟�?
    };
  }
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
    try {
      if (!this.apiKey || !this.apiSecret) {
        return { status: 'DELIVERED', message: '模拟状�? };
      }
      const response = await axios.get(`${this.endpoint}/status/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Get SMS status error:', error);
      throw new Error('获取短信状态失�?);
    }
  }
    try {
      const results = [];
      for (const phone of phoneList) {
        try {
          const result = await this.sendSms(phone, message, options);
          results.push({ phone, success: true, ...result });
        } catch (error) {
          results.push({ phone, success: false, error: error.message });
        }
      }
      return {
        success: true,
        results,
        total: phoneList.length,
        successCount: results.filter(r => r.success).length,
        failCount: results.filter(r => !r.success).length
      };
    } catch (error) {
      logger.error('Send batch SMS error:', error);
      throw new Error('批量短信发送失�?);
    }
  }
  async getBalance() {
    try {
      if (!this.apiKey || !this.apiSecret) {
        return { balance: 1000, unit: '�?, message: '模拟余额' };
      }
      const response = await axios.get(`${this.endpoint}/balance`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Get SMS balance error:', error);
      throw new Error('获取短信余额失败');
    }
  }
}
module.exports = SmsService; 
