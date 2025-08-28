import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:speech_to_text/speech_to_text.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/ai_agent.dart';
import '../models/chat_message.dart';
import '../models/community_news.dart';

class AIAgentService {
  static const String baseUrl = 'http:
  static const String openaiApiKey = 'your_openai_api_key';
  
  final SpeechToText _speechToText = SpeechToText();
  bool _speechEnabled = false;
  
  
  
  
  List<CommunityNews> _communityNews = [];
  
  
  Function(String)? onSpeechResult;
  Function(bool)? onSpeechListening;
  Function(String)? onEmergencyDetected;
  
  
    
    if (status != PermissionStatus.granted) {
      return false;
    }
    
    _speechEnabled = await _speechToText.initialize(
      onError: (error) => print('Speech recognition error: $error'),
      onStatus: (status) => print('Speech recognition status: $status'),
    );
    
    return _speechEnabled;
  }
  
  
    if (!_speechEnabled) {
      await initializeSpeech();
    }
    
    await _speechToText.listen(
      onResult: (result) {
        if (result.finalResult) {
          final text = result.recognizedWords;
          onSpeechResult?.call(text);
          
          
          _analyzeSpeechContent(text);
        }
      },
      listenFor: Duration(seconds: 30),
      pauseFor: Duration(seconds: 3),
      partialResults: true,
      localeId: 'zh_CN',
    );
    
    onSpeechListening?.call(true);
  }
  
  
  Future<void> stopListening() async {
    await _speechToText.stop();
    onSpeechListening?.call(false);
  }
  
  
  Future<void> _analyzeSpeechContent(String text) async {
    try {
      
      if (_detectEmergencyKeywords(text)) {
        onEmergencyDetected?.call('检测到疼痛相关词汇，是否需要紧急帮助？');
        return;
      }
      
      
      
      
      _processAIResponse(response);
      
    } catch (e) {
      print('Error analyzing speech content: $e');
    }
  }
  
  
  bool _detectEmergencyKeywords(String text) {
    final emergencyKeywords = [
      '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
      '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
    ];
    
    return emergencyKeywords.any((keyword) => text.contains(keyword));
  }
  
  
  Future<String> _sendToAI(String userMessage) async {
    try {
      
      
      
      final requestBody = {
        'message': userMessage,
        'user_id': _agentState.userId,
        'context': {
          'community_news': newsContext,
          'conversation_history': _agentState.conversationHistory,
          'user_profile': _agentState.userProfile,
        },
        'agent_personality': {
          'name': '小爱',
          'role': '老年人关爱助�?,
          'tone': '温暖、耐心、专�?,
          'specialties': ['健康咨询', '生活帮助', '情感陪伴', '社区资讯']
        }
      };
      
      final response = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_agentState.accessToken}',
        },
        body: jsonEncode(requestBody),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['response'];
      } else {
        throw Exception('AI服务请求失败: ${response.statusCode}');
      }
    } catch (e) {
      print('Error sending message to AI: $e');
      return '抱歉，我现在无法回应，请稍后再试�?;
    }
  }
  
  
    if (_communityNews.isEmpty) return '';
    
    final recentNews = _communityNews.take(3).map((news) => 
      '${news.title}: ${news.content}'
    ).join('; ');
    
    return '最新社区资讯：$recentNews';
  }
  
  
  void _processAIResponse(String response) {
    
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: response,
      sender: 'ai',
      timestamp: DateTime.now(),
      messageType: MessageType.text,
    ));
    
    
  }
  
  
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai/tts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${_agentState.accessToken}',
        },
        body: jsonEncode({
          'text': text,
          'voice': 'xiaomei', 
          'pitch': 1.0,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final audioUrl = data['audio_url'];
        
        
        _playAudio(audioUrl);
      }
    } catch (e) {
      print('Error in text-to-speech: $e');
    }
  }
  
  
  void _playAudio(String audioUrl) {
    
    
  }
  
  
  Future<void> loadCommunityNews() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/community/news'),
        headers: {
          'Authorization': 'Bearer ${_agentState.accessToken}',
        },
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _communityNews = (data['news'] as List)
            .map((item) => CommunityNews.fromJson(item))
            .toList();
      }
    } catch (e) {
      print('Error loading community news: $e');
    }
  }
  
  
    _agentState = newState;
  }
  
  
  
  
  void dispose() {
    _speechToText.cancel();
  }
}


class AIAgentState {
  String userId = '';
  String accessToken = '';
  Map<String, dynamic> userProfile = {};
  List<ChatMessage> conversationHistory = [];
  bool isARMode = false;
  bool isListening = false;
  
  void addMessage(ChatMessage message) {
    conversationHistory.add(message);
    
    
    if (conversationHistory.length > 50) {
      conversationHistory.removeAt(0);
    }
  }
  
  void clearHistory() {
    conversationHistory.clear();
  }
} 
