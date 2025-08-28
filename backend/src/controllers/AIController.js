const OpenAI = require('openai');
const { Configuration, OpenAIApi } = require('openai');
const logger = require('../utils/logger');
const RedisService = require('../services/RedisService');
const CommunityNewsService = require('../services/CommunityNewsService');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const BAIDU_TTS_CONFIG = {
  appId: process.env.BAIDU_TTS_APP_ID,
  apiKey: process.env.BAIDU_TTS_API_KEY,
  secretKey: process.env.BAIDU_TTS_SECRET_KEY,
  baseUrl: 'https:
  voices: [
    { id: '0', name: '度小�?, gender: 'female' },
    { id: '1', name: '度小�?, gender: 'male' },
    { id: '3', name: '度逍遥', gender: 'male' },
    { id: '4', name: '度丫�?, gender: 'female' },
    { id: '5', name: '度小�?, gender: 'female' }
  ]
};
class AIController {
  static async chat(req, res) {
    try {
      const { message, context, agent_personality } = req.body;
      const userId = req.user.id;
      if (!message) {
        return res.status(400).json({
          success: false,
          message: '消息内容不能为空'
        });
      const userConfig = await AIController._getUserConfig(userId);
      const systemPrompt = AIController._buildSystemPrompt(
        agent_personality,
        context,
        userConfig
      );
      const conversationHistory = await AIController._getConversationHistory(userId);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: message }
      ];
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
      const aiResponse = completion.data.choices[0].message.content;
      await AIController._saveConversation(userId, message, aiResponse);
      const sentiment = await AIController._analyzeSentiment(message);
      const emergencyLevel = AIController._detectEmergencyLevel(message);
      res.json({
        success: true,
        response: aiResponse,
        sentiment: sentiment,
        emergency_level: emergencyLevel,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI聊天错误:', error);
      res.status(500).json({
        success: false,
        message: 'AI服务暂时不可用，请稍后再�?
      });
    }
  }
  static async textToSpeech(req, res) {
    try {
      const { text, voice = '0', speed = 5, pitch = 5, volume = 5 } = req.body;
      const userId = req.user.id;
      if (!text) {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }
      const audioUrl = await AIController._generateTTSWithBaidu(text, voice, speed, pitch, volume);
      await AIController._saveTTSRecord(userId, text, audioUrl);
      res.json({
        success: true,
        audio_url: audioUrl,
        duration: Math.ceil(text.length * 0.3), 
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('TTS错误:', error);
      res.status(500).json({
        success: false,
        message: '语音合成失败: ' + error.message
      });
    }
  }
  static async speechToText(req, res) {
    try {
      const { audio_data, language = 'zh' } = req.body;
      const userId = req.user.id;
      if (!audio_data) {
        return res.status(400).json({
          success: false,
          message: '音频数据不能为空'
        });
      }
      const text = await AIController._processSTTWithWhisper(audio_data, language);
      await AIController._saveSTTRecord(userId, text, audio_data);
      res.json({
        success: true,
        text: text,
        confidence: 0.95,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('STT错误:', error);
      res.status(500).json({
        success: false,
        message: '语音识别失败: ' + error.message
      });
    }
  }
  static async analyzeSentiment(req, res) {
    try {
      const { text } = req.body;
      const userId = req.user.id;
      if (!text) {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }
      const sentiment = await AIController._analyzeSentiment(text);
      res.json({
        success: true,
        sentiment: sentiment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('情感分析错误:', error);
      res.status(500).json({
        success: false,
        message: '情感分析失败'
      });
    }
  }
  static async detectEmergency(req, res) {
    try {
      const { text, context } = req.body;
      const userId = req.user.id;
      if (!text) {
        return res.status(400).json({
          success: false,
          message: '文本内容不能为空'
        });
      }
      const emergencyLevel = AIController._detectEmergencyLevel(text);
      const emergencyKeywords = AIController._extractEmergencyKeywords(text);
      if (emergencyLevel > 0.7) {
        await AIController._logEmergency(userId, text, emergencyLevel, emergencyKeywords);
      }
      res.json({
        success: true,
        emergency_level: emergencyLevel,
        emergency_keywords: emergencyKeywords,
        should_alert: emergencyLevel > 0.7,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('紧急检测错�?', error);
      res.status(500).json({
        success: false,
        message: '紧急检测失�?
      });
    }
  }
  static async getConfig(req, res) {
    try {
      const userId = req.user.id;
      const config = await AIController._getUserConfig(userId);
      res.json({
        success: true,
        config: config
      });
    } catch (error) {
      logger.error('获取配置错误:', error);
      res.status(500).json({
        success: false,
        message: '获取配置失败'
      });
    }
  }
  static async updateConfig(req, res) {
    try {
      const userId = req.user.id;
      const { config } = req.body;
      await AIController._updateUserConfig(userId, config);
      res.json({
        success: true,
        message: '配置更新成功'
      });
    } catch (error) {
      logger.error('更新配置错误:', error);
      res.status(500).json({
        success: false,
        message: '更新配置失败'
      });
    }
  }
  static async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await AIController._getUserStatus(userId);
      res.json({
        success: true,
        status: status
      });
    } catch (error) {
      logger.error('获取状态错�?', error);
      res.status(500).json({
        success: false,
        message: '获取状态失�?
      });
    }
  }
  static async updateStatus(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.body;
      await AIController._updateUserStatus(userId, status);
      res.json({
        success: true,
        message: '状态更新成�?
      });
    } catch (error) {
      logger.error('更新状态错�?', error);
      res.status(500).json({
        success: false,
        message: '更新状态失�?
      });
    }
  }
  static async getChatHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      const history = await AIController._getConversationHistory(userId, limit, offset);
      res.json({
        success: true,
        history: history,
        total: history.length
      });
    } catch (error) {
      logger.error('获取对话历史错误:', error);
      res.status(500).json({
        success: false,
        message: '获取对话历史失败'
      });
    }
  }
  static async clearChatHistory(req, res) {
    try {
      const userId = req.user.id;
      await AIController._clearConversationHistory(userId);
      res.json({
        success: true,
        message: '对话历史已清�?
      });
    } catch (error) {
      logger.error('清除对话历史错误:', error);
      res.status(500).json({
        success: false,
        message: '清除对话历史失败'
      });
    }
  }
  static async getPersonality(req, res) {
    try {
      const userId = req.user.id;
      const personality = await AIController._getUserPersonality(userId);
      res.json({
        success: true,
        personality: personality
      });
    } catch (error) {
      logger.error('获取个性化设置错误:', error);
      res.status(500).json({
        success: false,
        message: '获取个性化设置失败'
      });
    }
  }
  static async updatePersonality(req, res) {
    try {
      const userId = req.user.id;
      const { personality } = req.body;
      await AIController._updateUserPersonality(userId, personality);
      res.json({
        success: true,
        message: '个性化设置更新成功'
      });
    } catch (error) {
      logger.error('更新个性化设置错误:', error);
      res.status(500).json({
        success: false,
        message: '更新个性化设置失败'
      });
    }
  }
  static async _processSTTWithWhisper(audioData, language = 'zh') {
    try {
      const audioBuffer = Buffer.from(audioData, 'base64');
      const tempFile = path.join(__dirname, '../../temp', `audio_${Date.now()}.wav`);
      const tempDir = path.dirname(tempFile);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(tempFile, audioBuffer);
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempFile));
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      const response = await axios.post('https:
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        }
      });
      fs.unlinkSync(tempFile);
      return response.data.text;
    } catch (error) {
      logger.error('Whisper API错误:', error);
      throw new Error('语音识别失败: ' + error.message);
    }
  }
  static async _generateTTSWithBaidu(text, voice = '0', speed = 5, pitch = 5, volume = 5) {
    try {
      const accessToken = await AIController._getBaiduAccessToken();
      const params = {
        tex: text,
        tok: accessToken,
        cuid: BAIDU_TTS_CONFIG.appId,
        ctp: 1,
        lan: 'zh',
        spd: speed, 
        pit: pitch, 
        vol: volume, 
        per: voice, 
        aue: 3 
      };
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      const ttsUrl = `${BAIDU_TTS_CONFIG.baseUrl}?${queryString}`;
      const response = await axios.get(ttsUrl, {
        responseType: 'arraybuffer'
      });
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('audio')) {
        throw new Error('TTS API返回非音频数�?);
      }
      const audioFileName = `tts_${Date.now()}.mp3`;
      const audioFilePath = path.join(__dirname, '../../public/audio', audioFileName);
      const audioDir = path.dirname(audioFilePath);
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      fs.writeFileSync(audioFilePath, response.data);
      const baseUrl = process.env.BASE_URL || 'http:
      return `${baseUrl}/audio/${audioFileName}`;
    } catch (error) {
      logger.error('百度TTS API错误:', error);
      throw new Error('语音合成失败: ' + error.message);
    }
  }
  static async _getBaiduAccessToken() {
    try {
      const cacheKey = 'baidu_tts_token';
      const cachedToken = await RedisService.get(cacheKey);
      if (cachedToken) {
        return cachedToken;
      }
      const tokenUrl = `https:
      const response = await axios.post(tokenUrl);
      if (response.data.access_token) {
        const token = response.data.access_token;
        const expiresIn = response.data.expires_in || 2592000; 
        await RedisService.setex(cacheKey, expiresIn - 3600, token);
        return token;
      } else {
        throw new Error('获取百度访问令牌失败');
      }
    } catch (error) {
      logger.error('获取百度访问令牌错误:', error);
      throw new Error('获取访问令牌失败: ' + error.message);
    }
  }
  static async getTTSVoices(req, res) {
    try {
      res.json({
        success: true,
        voices: BAIDU_TTS_CONFIG.voices,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取TTS发音人错�?', error);
      res.status(500).json({
        success: false,
        message: '获取发音人列表失�?
      });
    }
  }
  static _buildSystemPrompt(personality, context, userConfig) {
    const basePrompt = `你是一个专门为老年人设计的AI助手，名�?小爱"。你的特点是�?- 温暖、耐心、专�?- 使用简单易懂的语言
- 主动关心老年人的健康和生�?- 及时提供社区资讯和活动信�?- 在检测到紧急情况时立即提醒
用户信息�?{JSON.stringify(userConfig)}
社区资讯�?{context?.community_news || '暂无最新资�?}
请根据以上信息与用户进行对话。`;
    return basePrompt;
  }
  static async _getUserConfig(userId) {
    try {
      const config = await RedisService.get(`ai_config:${userId}`);
      return config ? JSON.parse(config) : {
        voice_type: 'xiaomei',
        speech_speed: 1.0,
        speech_pitch: 1.0,
        language: 'zh_CN',
        enable_ar: true,
        enable_emergency_detection: true,
        emergency_keywords: [
          '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
          '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
        ]
      };
    } catch (error) {
      logger.error('获取用户配置错误:', error);
      return {};
    }
  }
  static async _updateUserConfig(userId, config) {
    try {
      await RedisService.set(`ai_config:${userId}`, JSON.stringify(config), 86400);
    } catch (error) {
      logger.error('更新用户配置错误:', error);
      throw error;
    }
  }
  static async _getConversationHistory(userId, limit = 10, offset = 0) {
    try {
      const history = await RedisService.lrange(`chat_history:${userId}`, offset, offset + limit - 1);
      return history.map(item => JSON.parse(item));
    } catch (error) {
      logger.error('获取对话历史错误:', error);
      return [];
    }
  }
  static async _saveConversation(userId, userMessage, aiResponse) {
    try {
      const conversation = {
        user_message: userMessage,
        ai_response: aiResponse,
        timestamp: new Date().toISOString()
      };
      await RedisService.lpush(`chat_history:${userId}`, JSON.stringify(conversation));
      await RedisService.ltrim(`chat_history:${userId}`, 0, 99); 
      logger.error('保存对话记录错误:', error);
    }
  }
  static async _clearConversationHistory(userId) {
    try {
      await RedisService.del(`chat_history:${userId}`);
    } catch (error) {
      logger.error('清除对话历史错误:', error);
      throw error;
    }
  }
  static async _analyzeSentiment(text) {
    try {
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `分析以下文本的情感倾向，返回JSON格式：{"sentiment": "positive/negative/neutral", "confidence": 0.95, "emotions": ["joy", "sadness"]}\n\n文本�?{text}`,
        max_tokens: 100,
        temperature: 0.3,
      });
      const result = JSON.parse(response.data.choices[0].text.trim());
      return result;
    } catch (error) {
      logger.error('情感分析错误:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: []
      };
    }
  }
    const emergencyKeywords = [
      '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
      '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
    ];
    const words = text.toLowerCase().split(/[\s,，。！？]/);
    const matchedKeywords = words.filter(word => 
      emergencyKeywords.some(keyword => word.includes(keyword))
    );
    return Math.min(matchedKeywords.length * 0.3, 1.0);
  }
  static _extractEmergencyKeywords(text) {
    const emergencyKeywords = [
      '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
      '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
    ];
    return emergencyKeywords.filter(keyword => 
      text.includes(keyword)
    );
  }
    try {
      const emergency = {
        userId,
        text,
        level,
        keywords,
        timestamp: new Date().toISOString()
      };
      await RedisService.lpush('emergency_logs', JSON.stringify(emergency));
      logger.warn('紧急情况检�?', emergency);
    } catch (error) {
      logger.error('记录紧急情况错�?', error);
    }
  }
  static async _generateTTS(text, voice, speed, pitch) {
    return `https:
  }
  static async _processSTT(audioData, language) {
    return '这是模拟的语音识别结�?;
  }
  static async _saveTTSRecord(userId, text, audioUrl) {
    try {
      const record = {
        userId,
        text,
        audioUrl,
        timestamp: new Date().toISOString()
      };
      await RedisService.lpush(`tts_records:${userId}`, JSON.stringify(record));
    } catch (error) {
      logger.error('保存TTS记录错误:', error);
    }
  }
  static async _saveSTTRecord(userId, text, audioData) {
    try {
      const record = {
        userId,
        text,
        audioData: audioData.substring(0, 100), 
      };
      await RedisService.lpush(`stt_records:${userId}`, JSON.stringify(record));
    } catch (error) {
      logger.error('保存STT记录错误:', error);
    }
  }
    try {
      const status = await RedisService.get(`ai_status:${userId}`);
      return status ? JSON.parse(status) : {
        is_active: true,
        last_activity: new Date().toISOString(),
        session_count: 0
      };
    } catch (error) {
      logger.error('获取用户状态错�?', error);
      return {};
    }
  }
    try {
      await RedisService.set(`ai_status:${userId}`, JSON.stringify(status), 86400);
    } catch (error) {
      logger.error('更新用户状态错�?', error);
      throw error;
    }
  }
  static async _getUserPersonality(userId) {
    try {
      const personality = await RedisService.get(`ai_personality:${userId}`);
      return personality ? JSON.parse(personality) : {
        name: '小爱',
        role: '老年人关爱助�?,
        tone: '温暖、耐心、专�?,
        specialties: ['健康咨询', '生活帮助', '情感陪伴', '社区资讯']
      };
    } catch (error) {
      logger.error('获取用户个性化设置错误:', error);
      return {};
    }
  }
  static async _updateUserPersonality(userId, personality) {
    try {
      await RedisService.set(`ai_personality:${userId}`, JSON.stringify(personality), 86400);
    } catch (error) {
      logger.error('更新用户个性化设置错误:', error);
      throw error;
    }
  }
}
module.exports = AIController; 
