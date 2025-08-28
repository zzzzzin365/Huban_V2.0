class AIAgent {
  final String id;
  final String name;
  final String avatar;
  final String personality;
  final List<String> specialties;
  final Map<String, dynamic> settings;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  AIAgent({
    required this.id,
    required this.name,
    required this.avatar,
    required this.personality,
    required this.specialties,
    required this.settings,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AIAgent.fromJson(Map<String, dynamic> json) {
    return AIAgent(
      id: json['id'],
      name: json['name'],
      avatar: json['avatar'],
      personality: json['personality'],
      specialties: List<String>.from(json['specialties']),
      settings: Map<String, dynamic>.from(json['settings']),
      isActive: json['is_active'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'personality': personality,
      'specialties': specialties,
      'settings': settings,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  AIAgent copyWith({
    String? id,
    String? name,
    String? avatar,
    String? personality,
    List<String>? specialties,
    Map<String, dynamic>? settings,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AIAgent(
      id: id ?? this.id,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      personality: personality ?? this.personality,
      specialties: specialties ?? this.specialties,
      settings: settings ?? this.settings,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}


  final String voiceType;
  final double speechSpeed;
  final double speechPitch;
  final String language;
  final bool enableAR;
  final bool enableEmergencyDetection;
  final List<String> emergencyKeywords;
  final Map<String, dynamic> personalityTraits;

  AIAgentConfig({
    this.voiceType = 'xiaomei',
    this.speechSpeed = 1.0,
    this.speechPitch = 1.0,
    this.language = 'zh_CN',
    this.enableAR = true,
    this.enableEmergencyDetection = true,
    this.emergencyKeywords = const [
      '�?, '�?, '难受', '不舒�?, '生病', '摔�?, '受伤',
      '头晕', '恶心', '发烧', '血�?, '心脏', '急救', '救命'
    ],
    this.personalityTraits = const {
      'warmth': 0.9,
      'patience': 0.95,
      'professionalism': 0.8,
      'empathy': 0.9,
      'humor': 0.3,
    },
  });

  factory AIAgentConfig.fromJson(Map<String, dynamic> json) {
    return AIAgentConfig(
      voiceType: json['voice_type'] ?? 'xiaomei',
      speechSpeed: json['speech_speed']?.toDouble() ?? 1.0,
      speechPitch: json['speech_pitch']?.toDouble() ?? 1.0,
      language: json['language'] ?? 'zh_CN',
      enableAR: json['enable_ar'] ?? true,
      enableEmergencyDetection: json['enable_emergency_detection'] ?? true,
      emergencyKeywords: List<String>.from(json['emergency_keywords'] ?? []),
      personalityTraits: Map<String, dynamic>.from(json['personality_traits'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'voice_type': voiceType,
      'speech_speed': speechSpeed,
      'speech_pitch': speechPitch,
      'language': language,
      'enable_ar': enableAR,
      'enable_emergency_detection': enableEmergencyDetection,
      'emergency_keywords': emergencyKeywords,
      'personality_traits': personalityTraits,
    };
  }
}


class AIAgentContext {
  final String userId;
  final Map<String, dynamic> userProfile;
  final List<Map<String, dynamic>> conversationHistory;
  final List<Map<String, dynamic>> communityNews;
  final Map<String, dynamic> currentLocation;
  final DateTime sessionStartTime;
  final Map<String, dynamic> sessionData;

  AIAgentContext({
    required this.userId,
    required this.userProfile,
    required this.conversationHistory,
    required this.communityNews,
    required this.currentLocation,
    required this.sessionStartTime,
    required this.sessionData,
  });

  factory AIAgentContext.fromJson(Map<String, dynamic> json) {
    return AIAgentContext(
      userId: json['user_id'],
      userProfile: Map<String, dynamic>.from(json['user_profile']),
      conversationHistory: List<Map<String, dynamic>>.from(json['conversation_history']),
      communityNews: List<Map<String, dynamic>>.from(json['community_news']),
      currentLocation: Map<String, dynamic>.from(json['current_location']),
      sessionStartTime: DateTime.parse(json['session_start_time']),
      sessionData: Map<String, dynamic>.from(json['session_data']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'user_profile': userProfile,
      'conversation_history': conversationHistory,
      'community_news': communityNews,
      'current_location': currentLocation,
      'session_start_time': sessionStartTime.toIso8601String(),
      'session_data': sessionData,
    };
  }

  AIAgentContext copyWith({
    String? userId,
    Map<String, dynamic>? userProfile,
    List<Map<String, dynamic>>? conversationHistory,
    List<Map<String, dynamic>>? communityNews,
    Map<String, dynamic>? currentLocation,
    DateTime? sessionStartTime,
    Map<String, dynamic>? sessionData,
  }) {
    return AIAgentContext(
      userId: userId ?? this.userId,
      userProfile: userProfile ?? this.userProfile,
      conversationHistory: conversationHistory ?? this.conversationHistory,
      communityNews: communityNews ?? this.communityNews,
      currentLocation: currentLocation ?? this.currentLocation,
      sessionStartTime: sessionStartTime ?? this.sessionStartTime,
      sessionData: sessionData ?? this.sessionData,
    );
  }
} 
