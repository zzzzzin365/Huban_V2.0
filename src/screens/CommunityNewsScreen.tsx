import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import {CommunityNews} from '../types';
import CommunityNewsService from '../services/CommunityNewsService';

const CommunityNewsScreen: React.FC = () => {
  const [news, setNews] = useState<CommunityNews[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const newsData = await CommunityNewsService.getNews();
      setNews(newsData);
    } catch (error) {
      console.error('加载新闻失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  const categories = [
    {id: 'all', name: '全部'},
    {id: 'community', name: '社区动态'},
    {id: 'volunteer', name: '志愿者故事'},
    {id: 'emergency', name: '紧急通知'},
    {id: 'tips', name: '生活贴士'},
  ];

  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory);

  const handleNewsPress = (newsItem: CommunityNews) => {
    // 实现新闻详情查看逻辑
    console.log('查看新闻:', newsItem.title);
  };

  return (
    <View style={styles.container}>
      {/* 分类标签 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.activeCategoryTab,
            ]}
            onPress={() => setSelectedCategory(category.id)}>
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.activeCategoryText,
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 新闻列表 */}
      <ScrollView
        style={styles.newsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {filteredNews.length > 0 ? (
          filteredNews.map(newsItem => (
            <TouchableOpacity
              key={newsItem.id}
              style={styles.newsCard}
              onPress={() => handleNewsPress(newsItem)}>
              {newsItem.imageUrl && (
                <Image source={{uri: newsItem.imageUrl}} style={styles.newsImage} />
              )}
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {newsItem.title}
                </Text>
                <Text style={styles.newsExcerpt} numberOfLines={3}>
                  {newsItem.content}
                </Text>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsAuthor}>{newsItem.author}</Text>
                  <Text style={styles.newsDate}>
                    {new Date(newsItem.publishedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.newsStats}>
                  <Text style={styles.newsStat}>👍 {newsItem.likes}</Text>
                  <Text style={styles.newsStat}>💬 {newsItem.comments}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无相关新闻</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeCategoryTab: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryText: {
    color: 'white',
  },
  newsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  newsExcerpt: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsAuthor: {
    fontSize: 12,
    color: '#999',
  },
  newsDate: {
    fontSize: 12,
    color: '#999',
  },
  newsStats: {
    flexDirection: 'row',
    gap: 16,
  },
  newsStat: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CommunityNewsScreen;
