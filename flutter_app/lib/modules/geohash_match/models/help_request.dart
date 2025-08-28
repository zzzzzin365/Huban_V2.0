class HelpRequest {
  final String id;
  final String title;
  final String description;
  final String requesterId;
  final String requesterName;
  final String requesterPhone;
  final double latitude;
  final double longitude;
  final String geohash;
  final List<String> requiredSkills;
  final DateTime createdAt;
  final String status; 
  final String? matchedVolunteerId;
  final int urgency; 
  HelpRequest({
    required this.id,
    required this.title,
    required this.description,
    required this.requesterId,
    required this.requesterName,
    required this.requesterPhone,
    required this.latitude,
    required this.longitude,
    required this.geohash,
    required this.requiredSkills,
    required this.createdAt,
    this.status = 'pending',
    this.matchedVolunteerId,
    this.urgency = 3,
  });

  factory HelpRequest.fromJson(Map<String, dynamic> json) {
    return HelpRequest(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      requesterId: json['requesterId'],
      requesterName: json['requesterName'],
      requesterPhone: json['requesterPhone'],
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
      geohash: json['geohash'],
      requiredSkills: List<String>.from(json['requiredSkills']),
      createdAt: DateTime.parse(json['createdAt']),
      status: json['status'] ?? 'pending',
      matchedVolunteerId: json['matchedVolunteerId'],
      urgency: json['urgency'] ?? 3,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'requesterId': requesterId,
      'requesterName': requesterName,
      'requesterPhone': requesterPhone,
      'latitude': latitude,
      'longitude': longitude,
      'geohash': geohash,
      'requiredSkills': requiredSkills,
      'createdAt': createdAt.toIso8601String(),
      'status': status,
      'matchedVolunteerId': matchedVolunteerId,
      'urgency': urgency,
    };
  }

  HelpRequest copyWith({
    String? id,
    String? title,
    String? description,
    String? requesterId,
    String? requesterName,
    String? requesterPhone,
    double? latitude,
    double? longitude,
    String? geohash,
    List<String>? requiredSkills,
    DateTime? createdAt,
    String? status,
    String? matchedVolunteerId,
    int? urgency,
  }) {
    return HelpRequest(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      requesterId: requesterId ?? this.requesterId,
      requesterName: requesterName ?? this.requesterName,
      requesterPhone: requesterPhone ?? this.requesterPhone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      geohash: geohash ?? this.geohash,
      requiredSkills: requiredSkills ?? this.requiredSkills,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      matchedVolunteerId: matchedVolunteerId ?? this.matchedVolunteerId,
      urgency: urgency ?? this.urgency,
    );
  }
} 
