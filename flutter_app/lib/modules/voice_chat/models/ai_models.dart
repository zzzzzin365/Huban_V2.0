
  final String id;
  final String name;
  final String gender;

  TTSVoice({
    required this.id,
    required this.name,
    required this.gender,
  });

  factory TTSVoice.fromJson(Map<String, dynamic> json) {
    return TTSVoice(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      gender: json['gender'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'gender': gender,
    };
  }
}


class TTSResponse {
  final bool success;
  final String audioUrl;
  final int duration;
  final String timestamp;
  final String? message;

  TTSResponse({
    required this.success,
    required this.audioUrl,
    required this.duration,
    required this.timestamp,
    this.message,
  });

  factory TTSResponse.fromJson(Map<String, dynamic> json) {
    return TTSResponse(
      success: json['success'] ?? false,
      audioUrl: json['audio_url'] ?? '',
      duration: json['duration'] ?? 0,
      timestamp: json['timestamp'] ?? '',
      message: json['message'],
    );
  }
}


class STTResponse {
  final bool success;
  final String text;
  final double confidence;
  final String timestamp;
  final String? message;

  STTResponse({
    required this.success,
    required this.text,
    required this.confidence,
    required this.timestamp,
    this.message,
  });

  factory STTResponse.fromJson(Map<String, dynamic> json) {
    return STTResponse(
      success: json['success'] ?? false,
      text: json['text'] ?? '',
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      timestamp: json['timestamp'] ?? '',
      message: json['message'],
    );
  }
} 
