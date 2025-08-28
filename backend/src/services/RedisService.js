const redis = require('redis');
const logger = require('../utils/logger');
class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }
  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis server refused connection');
            return new Error('Redis server refused connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis connection attempts exceeded');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });
      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });
      this.client.on('error', (err) => {
        logger.error('Redis client error:', err);
        this.isConnected = false;
      });
      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });
      await this.client.connect();
    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }
  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
    return this.isConnected && this.client;
  }
  async set(key, value, expireSeconds = null) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping set operation');
        return false;
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (expireSeconds) {
        await this.client.setEx(key, expireSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping get operation');
        return null;
      }
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping delete operation');
        return false;
      }
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  }
  async exists(key) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping exists operation');
        return false;
      }
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }
  async expire(key, seconds) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping expire operation');
        return false;
      }
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  }
  async ttl(key) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping ttl operation');
        return -1;
      }
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      return -1;
    }
  }
  async hset(key, field, value) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping hset operation');
        return false;
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      const result = await this.client.hSet(key, field, stringValue);
      return result >= 0;
    } catch (error) {
      logger.error('Redis hset error:', error);
      return false;
    }
  }
  async hget(key, field) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping hget operation');
        return null;
      }
      const value = await this.client.hGet(key, field);
      if (value === null) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (error) {
      logger.error('Redis hget error:', error);
      return null;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping hgetall operation');
        return {};
      }
      const result = await this.client.hGetAll(key);
      const parsedResult = {};
      for (const [field, value] of Object.entries(result)) {
        try {
          parsedResult[field] = JSON.parse(value);
        } catch (parseError) {
          parsedResult[field] = value;
        }
      }
      return parsedResult;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      return {};
    }
  }
  async hdel(key, field) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping hdel operation');
        return false;
      }
      const result = await this.client.hDel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Redis hdel error:', error);
      return false;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping lpush operation');
        return false;
      }
      const stringValues = values.map(value => 
        typeof value === 'string' ? value : JSON.stringify(value)
      );
      const result = await this.client.lPush(key, stringValues);
      return result > 0;
    } catch (error) {
      logger.error('Redis lpush error:', error);
      return false;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping rpop operation');
        return null;
      }
      const value = await this.client.rPop(key);
      if (value === null) {
        return null;
      }
      try {
        return JSON.parse(value);
      } catch (parseError) {
        return value;
      }
    } catch (error) {
      logger.error('Redis rpop error:', error);
      return null;
    }
  }
  async llen(key) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping llen operation');
        return 0;
      }
      return await this.client.lLen(key);
    } catch (error) {
      logger.error('Redis llen error:', error);
      return 0;
    }
  }
  async lrange(key, start, stop) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping lrange operation');
        return [];
      }
      const values = await this.client.lRange(key, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      });
    } catch (error) {
      logger.error('Redis lrange error:', error);
      return [];
    }
  }
  async sadd(key, ...members) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping sadd operation');
        return false;
      }
      const stringMembers = members.map(member => 
        typeof member === 'string' ? member : JSON.stringify(member)
      );
      const result = await this.client.sAdd(key, stringMembers);
      return result > 0;
    } catch (error) {
      logger.error('Redis sadd error:', error);
      return false;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping smembers operation');
        return [];
      }
      const values = await this.client.sMembers(key);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch (parseError) {
          return value;
        }
      });
    } catch (error) {
      logger.error('Redis smembers error:', error);
      return [];
    }
  }
  async zadd(key, score, member) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping zadd operation');
        return false;
      }
      const stringMember = typeof member === 'string' ? member : JSON.stringify(member);
      const result = await this.client.zAdd(key, { score: score, value: stringMember });
      return result > 0;
    } catch (error) {
      logger.error('Redis zadd error:', error);
      return false;
    }
  }
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping zrangebyscore operation');
        return [];
      }
      const options = withScores ? { WITHSCORES: true } : {};
      const result = await this.client.zRangeByScore(key, min, max, options);
      if (withScores) {
        return result.map(item => ({
          value: (() => {
            try {
              return JSON.parse(item.value);
            } catch (parseError) {
              return item.value;
            }
          })(),
          score: item.score
        }));
      } else {
        return result.map(value => {
          try {
            return JSON.parse(value);
          } catch (parseError) {
            return value;
          }
        });
      }
    } catch (error) {
      logger.error('Redis zrangebyscore error:', error);
      return [];
    }
  }
  async keys(pattern) {
    try {
      if (!this.isReady()) {
        logger.warn('Redis not ready, skipping keys operation');
        return [];
      }
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  }
  async setCommunityNews(newsId, newsData, expireHours = 24) {
    const key = `community_news:${newsId}`;
    const expireSeconds = expireHours * 3600;
    return await this.set(key, newsData, expireSeconds);
  }
  async getCommunityNews(newsId) {
    const key = `community_news:${newsId}`;
    return await this.get(key);
  }
    const keys = await this.keys('community_news:*');
    const news = [];
    for (const key of keys) {
      const newsData = await this.get(key);
      if (newsData) {
        news.push(newsData);
      }
    }
    return news;
  }
    const key = `chat_context:${userId}`;
    const expireSeconds = expireMinutes * 60;
    return await this.set(key, context, expireSeconds);
  }
    const key = `chat_context:${userId}`;
    return await this.get(key);
  }
    const key = `user_activity:${userId}`;
    return await this.set(key, timestamp, 86400); 
  }
    const key = `user_activity:${userId}`;
    return await this.get(key);
  }
    const key = `ai_agent_state:${userId}`;
    const expireSeconds = expireMinutes * 60;
    return await this.set(key, state, expireSeconds);
  }
    const key = `ai_agent_state:${userId}`;
    return await this.get(key);
  }
    const key = `volunteer_location:${volunteerId}`;
    const locationData = {
      geoHash,
      location,
      timestamp: Date.now()
    };
    const expireSeconds = expireMinutes * 60;
    return await this.set(key, locationData, expireSeconds);
  }
    const key = `volunteer_location:${volunteerId}`;
    return await this.get(key);
  }
    const pattern = `volunteer_location:*`;
    const keys = await this.keys(pattern);
    const nearbyVolunteers = [];
    for (const key of keys) {
      const locationData = await this.get(key);
      if (locationData && locationData.geoHash.startsWith(geoHashPrefix)) {
        const volunteerId = key.split(':')[1];
        nearbyVolunteers.push({
          volunteerId,
          ...locationData
        });
      }
    }
    return nearbyVolunteers;
  }
    const key = 'emergency_help_queue';
    const requestWithTimestamp = {
      ...helpRequest,
      timestamp: Date.now()
    };
    return await this.lpush(key, requestWithTimestamp);
  }
    const key = 'emergency_help_queue';
    return await this.rpop(key);
  }
    const key = 'emergency_help_queue';
    return await this.llen(key);
  }
    const key = `verification_code:${phone}`;
    return await this.set(key, code, expireSeconds);
  }
  async getVerificationCode(phone) {
    const key = `verification_code:${phone}`;
    return await this.get(key);
  }
  async deleteVerificationCode(phone) {
    const key = `verification_code:${phone}`;
    return await this.delete(key);
  }
  async setRefreshToken(userId, token, expireSeconds = 7 * 24 * 3600) {
    const key = `refresh_token:${userId}`;
    return await this.set(key, token, expireSeconds);
  }
  async getRefreshToken(userId) {
    const key = `refresh_token:${userId}`;
    return await this.get(key);
  }
  async deleteRefreshToken(userId) {
    const key = `refresh_token:${userId}`;
    return await this.delete(key);
  }
  async deleteUserRefreshTokens(userId) {
    const pattern = `refresh_token:${userId}`;
    const keys = await this.keys(pattern);
    for (const key of keys) {
      await this.delete(key);
    }
    return true;
  }
}
module.exports = RedisService; 
