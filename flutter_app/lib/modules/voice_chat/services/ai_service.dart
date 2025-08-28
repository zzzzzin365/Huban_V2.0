import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/ai_models.dart';

class AIService {
  static const String baseUrl = 'http:
  
  
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  
  static Future<STTResponse> speechToText(Uint8List audioData, {String language = 'zh'}) async {
    try {
      final headers = await _getHeaders();
      final base64Audio = base64Encode(audioData);
      
      final response = await http.post(
        Uri.parse('$baseUrl/speech-to-text'),
        headers: headers,
        body: jsonEncode({
          'audio_data': base64Audio,
          'language': language,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return STTResponse.fromJson(data);
      } else {
        throw Exception('语音识别失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('语音识别错误: $e');
    }
  }

  
  static Future<ChatResponse> chat(String message, {Map<String, dynamic>? context}) async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: headers,
        body: jsonEncode({
          'message': message,
          'context': context,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ChatResponse.fromJson(data);
      } else {
        throw Exception('AI对话失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('AI对话错误: $e');
    }
  }

  
  static Future<TTSResponse> textToSpeech(
    String text, {
    String voice = '0',
    int speed = 5,
    int pitch = 5,
    int volume = 5,
  }) async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/text-to-speech'),
        headers: headers,
        body: jsonEncode({
          'text': text,
          'voice': voice,
          'speed': speed,
          'pitch': pitch,
          'volume': volume,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return TTSResponse.fromJson(data);
      } else {
        throw Exception('语音合成失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('语音合成错误: $e');
    }
  }

  
    try {
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/tts/voices'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final voicesList = data['voices'] as List;
        return voicesList.map((voice) => TTSVoice.fromJson(voice)).toList();
      } else {
        throw Exception('获取发音人列表失�? ${response.body}');
      }
    } catch (e) {
      throw Exception('获取发音人列表错�? $e');
    }
  }

  
  static Future<SentimentResponse> analyzeSentiment(String text) async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/sentiment'),
        headers: headers,
        body: jsonEncode({
          'text': text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return SentimentResponse.fromJson(data);
      } else {
        throw Exception('情感分析失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('情感分析错误: $e');
    }
  }

  
    try {
      final headers = await _getHeaders();
      
      final response = await http.post(
        Uri.parse('$baseUrl/emergency'),
        headers: headers,
        body: jsonEncode({
          'text': text,
          'context': context,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return EmergencyResponse.fromJson(data);
      } else {
        throw Exception('紧急检测失�? ${response.body}');
      }
    } catch (e) {
      throw Exception('紧急检测错�? $e');
    }
  }

  
  static Future<List<ChatMessage>> getChatHistory({int limit = 20, int offset = 0}) async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/history?limit=$limit&offset=$offset'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final messagesList = data['messages'] as List;
        return messagesList.map((msg) => ChatMessage.fromJson(msg)).toList();
      } else {
        throw Exception('获取聊天历史失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('获取聊天历史错误: $e');
    }
  }

  
  static Future<void> clearChatHistory() async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.delete(
        Uri.parse('$baseUrl/history'),
        headers: headers,
      );

      if (response.statusCode != 200) {
        throw Exception('清除聊天历史失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('清除聊天历史错误: $e');
    }
  }

  
  static Future<AIConfig> getConfig() async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.get(
        Uri.parse('$baseUrl/config'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return AIConfig.fromJson(data['config']);
      } else {
        throw Exception('获取配置失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('获取配置错误: $e');
    }
  }

  
  static Future<void> updateConfig(AIConfig config) async {
    try {
      final headers = await _getHeaders();
      
      final response = await http.put(
        Uri.parse('$baseUrl/config'),
        headers: headers,
        body: jsonEncode({
          'config': config.toJson(),
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('更新配置失败: ${response.body}');
      }
    } catch (e) {
      throw Exception('更新配置错误: $e');
    }
  }
} 
