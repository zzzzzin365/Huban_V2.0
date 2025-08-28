enum MessageType { text, voice, image, emergency, system }

enum MessageStatus { sending, sent, delivered, read, failed }

class ChatMessage {
  final String id;
  final String content;
  final String sender; 
  final DateTime timestamp;
  final MessageType messageType;
  final MessageStatus status;
  final Map<String, dynamic>? metadata;
  final String? audioUrl;
  final String? imageUrl;
  final bool isEmergency;
  final Map<String, dynamic>? emergencyData;

  ChatMessage({
    required this.id,
    required this.content,
    required this.sender,
    required this.timestamp,
    this.messageType = MessageType.text,
    this.status = MessageStatus.sent,
    this.metadata,
    this.audioUrl,
    this.imageUrl,
    this.isEmergency = false,
    this.emergencyData,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      content: json['content'],
      sender: json['sender'],
      timestamp: DateTime.parse(json['timestamp']),
      messageType: MessageType.values.firstWhere(
        (e) => e.toString() == 'MessageType.${json['message_type']}',
        orElse: () => MessageType.text,
      ),
      status: MessageStatus.values.firstWhere(
        (e) => e.toString() == 'MessageStatus.${json['status']}',
        orElse: () => MessageStatus.sent,
      ),
      metadata: json['metadata'] != null 
          ? Map<String, dynamic>.from(json['metadata']) 
          : null,
      audioUrl: json['audio_url'],
      imageUrl: json['image_url'],
      isEmergency: json['is_emergency'] ?? false,
      emergencyData: json['emergency_data'] != null 
          ? Map<String, dynamic>.from(json['emergency_data']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'sender': sender,
      'timestamp': timestamp.toIso8601String(),
      'message_type': messageType.toString().split('.').last,
      'status': status.toString().split('.').last,
      'metadata': metadata,
      'audio_url': audioUrl,
      'image_url': imageUrl,
      'is_emergency': isEmergency,
      'emergency_data': emergencyData,
    };
  }

  ChatMessage copyWith({
    String? id,
    String? content,
    String? sender,
    DateTime? timestamp,
    MessageType? messageType,
    MessageStatus? status,
    Map<String, dynamic>? metadata,
    String? audioUrl,
    String? imageUrl,
    bool? isEmergency,
    Map<String, dynamic>? emergencyData,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      content: content ?? this.content,
      sender: sender ?? this.sender,
      timestamp: timestamp ?? this.timestamp,
      messageType: messageType ?? this.messageType,
      status: status ?? this.status,
      metadata: metadata ?? this.metadata,
      audioUrl: audioUrl ?? this.audioUrl,
      imageUrl: imageUrl ?? this.imageUrl,
      isEmergency: isEmergency ?? this.isEmergency,
      emergencyData: emergencyData ?? this.emergencyData,
    );
  }

  
  factory ChatMessage.user({
    required String content,
    MessageType messageType = MessageType.text,
    String? audioUrl,
    String? imageUrl,
    bool isEmergency = false,
    Map<String, dynamic>? emergencyData,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      sender: 'user',
      timestamp: DateTime.now(),
      messageType: messageType,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
      isEmergency: isEmergency,
      emergencyData: emergencyData,
    );
  }

  
  factory ChatMessage.ai({
    required String content,
    MessageType messageType = MessageType.text,
    String? audioUrl,
    String? imageUrl,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      sender: 'ai',
      timestamp: DateTime.now(),
      messageType: messageType,
      audioUrl: audioUrl,
      imageUrl: imageUrl,
    );
  }

  
  factory ChatMessage.system({
    required String content,
    Map<String, dynamic>? metadata,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      sender: 'system',
      timestamp: DateTime.now(),
      messageType: MessageType.system,
      metadata: metadata,
    );
  }

  
    required String content,
    required Map<String, dynamic> emergencyData,
  }) {
    return ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: content,
      sender: 'system',
      timestamp: DateTime.now(),
      messageType: MessageType.emergency,
      isEmergency: true,
      emergencyData: emergencyData,
    );
  }

  
  bool get isUserMessage => sender == 'user';

  
  bool get isAIMessage => sender == 'ai';

  
  bool get isSystemMessage => sender == 'system';

  
  bool get isVoiceMessage => messageType == MessageType.voice;

  
  bool get isImageMessage => messageType == MessageType.image;

  

  
  String get displayTime {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inDays > 0) {
      return '${difference.inDays}天前';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}小时�?;
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分钟�?;
    } else {
      return '刚刚';
    }
  }

  
    return '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}';
  }
} 
