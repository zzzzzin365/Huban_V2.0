class CommunityNews {
  final String id;
  final String title;
  final String content;
  final String category;
  final String? imageUrl;
  final DateTime publishTime;
  final DateTime? expireTime;
  final bool isImportant;
  final bool isActive;
  final Map<String, dynamic>? metadata;
  final List<String> tags;
  final String? author;
  final int priority;

  CommunityNews({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    this.imageUrl,
    required this.publishTime,
    this.expireTime,
    this.isImportant = false,
    this.isActive = true,
    this.metadata,
    this.tags = const [],
    this.author,
    this.priority = 0,
  });

  factory CommunityNews.fromJson(Map<String, dynamic> json) {
    return CommunityNews(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      category: json['category'],
      imageUrl: json['image_url'],
      publishTime: DateTime.parse(json['publish_time']),
      expireTime: json['expire_time'] != null 
          ? DateTime.parse(json['expire_time']) 
          : null,
      isImportant: json['is_important'] ?? false,
      isActive: json['is_active'] ?? true,
      metadata: json['metadata'] != null 
          ? Map<String, dynamic>.from(json['metadata']) 
          : null,
      tags: List<String>.from(json['tags'] ?? []),
      author: json['author'],
      priority: json['priority'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'category': category,
      'image_url': imageUrl,
      'publish_time': publishTime.toIso8601String(),
      'expire_time': expireTime?.toIso8601String(),
      'is_important': isImportant,
      'is_active': isActive,
      'metadata': metadata,
      'tags': tags,
      'author': author,
      'priority': priority,
    };
  }

  CommunityNews copyWith({
    String? id,
    String? title,
    String? content,
    String? category,
    String? imageUrl,
    DateTime? publishTime,
    DateTime? expireTime,
    bool? isImportant,
    bool? isActive,
    Map<String, dynamic>? metadata,
    List<String>? tags,
    String? author,
    int? priority,
  }) {
    return CommunityNews(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      category: category ?? this.category,
      imageUrl: imageUrl ?? this.imageUrl,
      publishTime: publishTime ?? this.publishTime,
      expireTime: expireTime ?? this.expireTime,
      isImportant: isImportant ?? this.isImportant,
      isActive: isActive ?? this.isActive,
      metadata: metadata ?? this.metadata,
      tags: tags ?? this.tags,
      author: author ?? this.author,
      priority: priority ?? this.priority,
    );
  }

  
    if (expireTime == null) return false;
    return DateTime.now().isAfter(expireTime!);
  }

  
  bool get isRecent {
    final now = DateTime.now();
    final difference = now.difference(publishTime);
    return difference.inHours < 24;
  }

  
  String get displayTime {
    final now = DateTime.now();
    final difference = now.difference(publishTime);

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

  
    if (content.length <= 50) return content;
    return '${content.substring(0, 50)}...';
  }

  
    return tags.contains(tag);
  }

  
  bool isCategory(String categoryName) {
    return category.toLowerCase() == categoryName.toLowerCase();
  }
}


enum NewsCategory {
  announcement,    
  activity,        
  health,          
  safety,          
  maintenance,     
  entertainment,   
  education,       
  emergency,       
}

extension NewsCategoryExtension on NewsCategory {
  String get displayName {
    switch (this) {
      case NewsCategory.announcement:
        return '公告';
      case NewsCategory.activity:
        return '活动';
      case NewsCategory.health:
        return '健康';
      case NewsCategory.safety:
        return '安全';
      case NewsCategory.maintenance:
        return '维护';
      case NewsCategory.entertainment:
        return '娱乐';
      case NewsCategory.education:
        return '教育';
      case NewsCategory.emergency:
        return '紧�?;
      case NewsCategory.other:
        return '其他';
    }
  }

  String get icon {
    switch (this) {
      case NewsCategory.announcement:
        return '📢';
      case NewsCategory.activity:
        return '🎉';
      case NewsCategory.health:
        return '🏥';
      case NewsCategory.safety:
        return '🛡�?;
      case NewsCategory.maintenance:
        return '🔧';
      case NewsCategory.entertainment:
        return '🎭';
      case NewsCategory.education:
        return '📚';
      case NewsCategory.emergency:
        return '🚨';
      case NewsCategory.other:
        return '📄';
    }
  }
} 
