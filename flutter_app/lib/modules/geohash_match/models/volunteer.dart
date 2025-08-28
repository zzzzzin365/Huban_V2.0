class Volunteer {
  final String id;
  final String name;
  final String phone;
  final double latitude;
  final double longitude;
  final String geohash;
  final List<String> skills;
  final bool isAvailable;
  final double rating;
  final int completedTasks;

  Volunteer({
    required this.id,
    required this.name,
    required this.phone,
    required this.latitude,
    required this.longitude,
    required this.geohash,
    required this.skills,
    this.isAvailable = true,
    this.rating = 0.0,
    this.completedTasks = 0,
  });

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      id: json['id'],
      name: json['name'],
      phone: json['phone'],
      latitude: json['latitude'].toDouble(),
      longitude: json['longitude'].toDouble(),
      geohash: json['geohash'],
      skills: List<String>.from(json['skills']),
      isAvailable: json['isAvailable'] ?? true,
      rating: json['rating']?.toDouble() ?? 0.0,
      completedTasks: json['completedTasks'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'latitude': latitude,
      'longitude': longitude,
      'geohash': geohash,
      'skills': skills,
      'isAvailable': isAvailable,
      'rating': rating,
      'completedTasks': completedTasks,
    };
  }

  Volunteer copyWith({
    String? id,
    String? name,
    String? phone,
    double? latitude,
    double? longitude,
    String? geohash,
    List<String>? skills,
    bool? isAvailable,
    double? rating,
    int? completedTasks,
  }) {
    return Volunteer(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      geohash: geohash ?? this.geohash,
      skills: skills ?? this.skills,
      isAvailable: isAvailable ?? this.isAvailable,
      rating: rating ?? this.rating,
      completedTasks: completedTasks ?? this.completedTasks,
    );
  }
} 
