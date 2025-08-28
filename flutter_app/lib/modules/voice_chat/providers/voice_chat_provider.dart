import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/ai_agent_service.dart';
import '../models/chat_message.dart';
import '../models/community_news.dart';
import '../models/ai_agent.dart';

class VoiceChatProvider extends ChangeNotifier {
  final AIAgentService _aiAgentService = AIAgentService();
  
  
  bool _isListening = false;
  bool _isARMode = false;
  bool _showEmergencyButton = false;
  String _emergencyMessage = '';
  
  
  AIAgentConfig _agentConfig = AIAgentConfig();
  
  
  List<CommunityNews> _communityNews = [];
  bool _isLoadingNews = false;
  
  
  bool _isLoading = false;
  
  
  String? _currentAudioUrl;
  
  
    _initializeService();
  }
  
  
    try {
      _isLoading = true;
      notifyListeners();
      
      
      
      
      _aiAgentService.onSpeechResult = _onSpeechResult;
      _aiAgentService.onSpeechListening = _onSpeechListening;
      _aiAgentService.onEmergencyDetected = _onEmergencyDetected;
      
      
      await loadCommunityNews();
      
      
      _addWelcomeMessage();
      
    } catch (e) {
      _errorMessage = '初始化失�? $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  
  void _onSpeechResult(String text) {
    if (text.isNotEmpty) {
      
      final userMessage = ChatMessage.user(content: text);
      _addMessage(userMessage);
      
      
    }
  }
  
  
    _isListening = isListening;
    notifyListeners();
  }
  
  
    _emergencyMessage = message;
    _showEmergencyButton = true;
    
    
      content: message,
      emergencyData: {
        'type': 'pain_detected',
        'timestamp': DateTime.now().toIso8601String(),
        'message': message,
      },
    );
    _addMessage(emergencyMessage);
    
    notifyListeners();
  }
  
  
  void _addWelcomeMessage() {
    final welcomeMessage = ChatMessage.ai(
      content: '您好！我是小爱，您的专属关爱助手。我可以陪您聊天、回答健康问题，还能告诉您最新的社区资讯。有什么需要帮助的吗？',
    );
    _addMessage(welcomeMessage);
  }
  
  
  void _addMessage(ChatMessage message) {
    _messages.add(message);
    notifyListeners();
  }
  
  
    try {
      await _aiAgentService.startListening();
    } catch (e) {
      _errorMessage = '启动语音识别失败: $e';
      notifyListeners();
    }
  }
  
  
  Future<void> stopListening() async {
    try {
      await _aiAgentService.stopListening();
    } catch (e) {
      _errorMessage = '停止语音识别失败: $e';
      notifyListeners();
    }
  }
  
  
    if (text.trim().isEmpty) return;
    
    try {
      
      final userMessage = ChatMessage.user(content: text);
      _addMessage(userMessage);
      
      
      
      
      if (_detectEmergencyKeywords(text)) {
        _onEmergencyDetected('检测到疼痛相关词汇，是否需要紧急帮助？');
        return;
      }
      
      
      final response = await _aiAgentService._sendToAI(text);
      
      
      final aiMessage = ChatMessage.ai(content: response);
      _addMessage(aiMessage);
      
    } catch (e) {
      _errorMessage = '发送消息失�? $e';
      notifyListeners();
    }
  }
  
  
  bool _detectEmergencyKeywords(String text) {
    final emergencyKeywords = [
      '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
      '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
    ];
    
    return emergencyKeywords.any((keyword) => text.contains(keyword));
  }
  
  
  void toggleARMode() {
    _isARMode = !_isARMode;
    _aiAgentService.agentState.isARMode = _isARMode;
    notifyListeners();
  }
  
  
    try {
      
      final systemMessage = ChatMessage.system(
        content: '正在为您联系紧急帮�?..',
        metadata: {
          'action': 'emergency_help',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
      _addMessage(systemMessage);
      
      
      
      
      
      _emergencyMessage = '';
      
    } catch (e) {
      _errorMessage = '紧急求助失�? $e';
    } finally {
      notifyListeners();
    }
  }
  
  
  Future<void> loadCommunityNews() async {
    try {
      _isLoadingNews = true;
      notifyListeners();
      
      await _aiAgentService.loadCommunityNews();
      
      
      
      _communityNews = [
        CommunityNews(
          id: '1',
          title: '明天停水通知',
          content: '明天上午9点到下午3点，小区将进行水管维修，请提前储水�?,
          category: 'maintenance',
          publishTime: DateTime.now().subtract(Duration(hours: 2)),
          isImportant: true,
        ),
        CommunityNews(
          id: '2',
          title: '插画课堂活动',
          content: '后天下午2点，社区活动中心将举办插画课堂，欢迎参加�?,
          category: 'activity',
          publishTime: DateTime.now().subtract(Duration(hours: 1)),
        ),
        CommunityNews(
          id: '3',
          title: '健康讲座',
          content: '本周六上�?0点，社区医院将举办老年人健康讲座�?,
          category: 'health',
          publishTime: DateTime.now().subtract(Duration(minutes: 30)),
        ),
      ];
      
    } catch (e) {
      _errorMessage = '加载社区资讯失败: $e';
    } finally {
      _isLoadingNews = false;
      notifyListeners();
    }
  }
  
  
  void clearChat() {
    _messages.clear();
    _aiAgentService.agentState.clearHistory();
    _addWelcomeMessage();
    notifyListeners();
  }
  
  
    _currentAgent = agent;
    notifyListeners();
  }
  
  
  void updateAgentConfig(AIAgentConfig config) {
    _agentConfig = config;
    notifyListeners();
  }
  
  
  void setUserInfo(String userId, String accessToken, Map<String, dynamic> userProfile) {
    _aiAgentService.agentState.userId = userId;
    _aiAgentService.agentState.accessToken = accessToken;
    _aiAgentService.agentState.userProfile = userProfile;
  }
  
  
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
  
  
  void playAudio(String audioUrl) {
    _currentAudioUrl = audioUrl;
    _isPlayingAudio = true;
    notifyListeners();
    
    
    
    Future.delayed(Duration(seconds: 3), () {
      _isPlayingAudio = false;
      notifyListeners();
    });
  }
  
  
  void stopAudio() {
    _isPlayingAudio = false;
    _currentAudioUrl = null;
    notifyListeners();
  }
  
  
  List<ChatMessage> get messages => List.unmodifiable(_messages);
  bool get isListening => _isListening;
  bool get isARMode => _isARMode;
  bool get showEmergencyButton => _showEmergencyButton;
  String get emergencyMessage => _emergencyMessage;
  AIAgent? get currentAgent => _currentAgent;
  AIAgentConfig get agentConfig => _agentConfig;
  List<CommunityNews> get communityNews => List.unmodifiable(_communityNews);
  bool get isLoadingNews => _isLoadingNews;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isPlayingAudio => _isPlayingAudio;
  String? get currentAudioUrl => _currentAudioUrl;
  
  
  
  
  int get unreadCount => _messages.where((msg) => 
    msg.isAIMessage && msg.status == MessageStatus.sent
  ).length;
  
  
  
  
  List<CommunityNews> get recentNews => _communityNews
      .where((news) => news.isRecent && !news.isExpired)
      .toList();
  
  
  List<CommunityNews> get importantNews => _communityNews
      .where((news) => news.isImportant && !news.isExpired)
      .toList();
  
  @override
  void dispose() {
    _aiAgentService.dispose();
    super.dispose();
  }
} 
