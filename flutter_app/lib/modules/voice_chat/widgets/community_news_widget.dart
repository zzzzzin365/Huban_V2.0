import 'package:flutter/material.dart';
import '../models/community_news.dart';

class CommunityNewsWidget extends StatelessWidget {
  final List<CommunityNews> news;
  final bool isLoading;
  final VoidCallback? onRefresh;

  const CommunityNewsWidget({
    Key? key,
    required this.news,
    required this.isLoading,
    this.onRefresh,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _buildHeader(context),
          Expanded(
            child: _buildNewsList(context),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        children: [
          Icon(Icons.newspaper, color: Colors.blue, size: 24),
          SizedBox(width: 8),
          Text(
            '社区资讯',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.blue[800],
            ),
          ),
          Spacer(),
          if (onRefresh != null)
            IconButton(
              icon: Icon(Icons.refresh, color: Colors.blue),
              onPressed: isLoading ? null : onRefresh,
            ),
        ],
      ),
    );
  }

  Widget _buildNewsList(BuildContext context) {
    if (isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('加载�?..'),
          ],
        ),
      );
    }

    if (news.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.newspaper_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              '暂无社区资讯',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: news.length,
      itemBuilder: (context, index) {
        final newsItem = news[index];
        return _buildNewsCard(context, newsItem);
      },
    );
  }

  Widget _buildNewsCard(BuildContext context, CommunityNews newsItem) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showNewsDetail(context, newsItem),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                
                  children: [
                    Expanded(
                      child: Text(
                        newsItem.title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    if (newsItem.isImportant)
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.priority_high, color: Colors.red, size: 16),
                            SizedBox(width: 4),
                            Text(
                              '重要',
                              style: TextStyle(
                                color: Colors.red,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                
                SizedBox(height: 8),
                
                
                Text(
                  newsItem.shortContent,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.black54,
                    height: 1.4,
                  ),
                ),
                
                SizedBox(height: 12),
                
                
                Row(
                  children: [
                    
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getCategoryColor(newsItem.category).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _getCategoryIcon(newsItem.category),
                            style: TextStyle(fontSize: 14),
                          ),
                          SizedBox(width: 4),
                          Text(
                            _getCategoryName(newsItem.category),
                            style: TextStyle(
                              fontSize: 12,
                              color: _getCategoryColor(newsItem.category),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    Spacer(),
                    
                    
                    Text(
                      newsItem.displayTime,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
                
                
                if (newsItem.tags.isNotEmpty) ...[
                  SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: newsItem.tags.map((tag) => Container(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        tag,
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey[700],
                        ),
                      ),
                    )).toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showNewsDetail(BuildContext context, CommunityNews newsItem) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Text(newsItem.title),
            if (newsItem.isImportant) ...[
              SizedBox(width: 8),
              Icon(Icons.priority_high, color: Colors.red, size: 20),
            ],
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (newsItem.imageUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    newsItem.imageUrl!,
                    width: double.infinity,
                    height: 150,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: double.infinity,
                        height: 150,
                        color: Colors.grey[300],
                        child: Icon(Icons.image_not_supported, color: Colors.grey[600]),
                      );
                    },
                  ),
                ),
                SizedBox(height: 16),
              ],
              Text(
                newsItem.content,
                style: TextStyle(fontSize: 16, height: 1.5),
              ),
              SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.person, size: 16, color: Colors.grey[600]),
                  SizedBox(width: 4),
                  Text(
                    '发布�? ${newsItem.author}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  SizedBox(width: 4),
                  Text(
                    '发布时间: ${newsItem.displayTime}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('关闭'),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'announcement':
        return Colors.blue;
      case 'activity':
        return Colors.green;
      case 'health':
        return Colors.red;
      case 'safety':
        return Colors.orange;
      case 'maintenance':
        return Colors.purple;
      case 'entertainment':
        return Colors.pink;
      case 'education':
        return Colors.indigo;
      case 'emergency':
        return Colors.red[700]!;
      default:
        return Colors.grey;
    }
  }

  String _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'announcement':
        return '📢';
      case 'activity':
        return '🎉';
      case 'health':
        return '🏥';
      case 'safety':
        return '🛡�?;
      case 'maintenance':
        return '🔧';
      case 'entertainment':
        return '🎭';
      case 'education':
        return '📚';
      case 'emergency':
        return '🚨';
      default:
        return '📄';
    }
  }

  String _getCategoryName(String category) {
    switch (category.toLowerCase()) {
      case 'announcement':
        return '公告';
      case 'activity':
        return '活动';
      case 'health':
        return '健康';
      case 'safety':
        return '安全';
      case 'maintenance':
        return '维护';
      case 'entertainment':
        return '娱乐';
      case 'education':
        return '教育';
      case 'emergency':
        return '紧�?;
      default:
        return '其他';
    }
  }
}


class NewsFilterWidget extends StatefulWidget {
  final String? selectedCategory;
  final bool onlyImportant;
  final Function(String?) onCategoryChanged;
  final Function(bool) onImportantChanged;

  const NewsFilterWidget({
    Key? key,
    this.selectedCategory,
    required this.onlyImportant,
    required this.onCategoryChanged,
    required this.onImportantChanged,
  }) : super(key: key);

  @override
  _NewsFilterWidgetState createState() => _NewsFilterWidgetState();
}

class _NewsFilterWidgetState extends State<NewsFilterWidget> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '筛�?,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildFilterChip('全部', null),
              _buildFilterChip('公告', 'announcement'),
              _buildFilterChip('活动', 'activity'),
              _buildFilterChip('健康', 'health'),
              _buildFilterChip('安全', 'safety'),
              _buildFilterChip('维护', 'maintenance'),
            ],
          ),
          SizedBox(height: 12),
          SwitchListTile(
            title: Text('只看重要资讯'),
            value: widget.onlyImportant,
            onChanged: widget.onImportantChanged,
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String? category) {
    final isSelected = widget.selectedCategory == category;
    
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        widget.onCategoryChanged(selected ? category : null);
      },
      selectedColor: Colors.blue[100],
      checkmarkColor: Colors.blue[700],
    );
  }
} 
